import { FPS, ARENA, ROSTER, IDS, normalMove, specialMove, ultimateMove, tailTipAt } from './balance.js';
import { pushDirection, readCommand } from './commands.js';
// 設計の正本はバランスデータ。GLB・Three.js・操作DOMには依存しない。
const KEYS=['left','right','up','down','weak','strong','throw','roar','gyuiin','dash','special1','special2','special3','super'];
const cap=(v,a,b)=>Math.max(a,Math.min(b,v));
const inputOf=(raw={})=>Object.fromEntries(KEYS.map(k=>[k,!!raw[k]]));
const total=m=>m.startup+m.active+m.recovery;
const active=p=>!!p.action&&p.frame>=p.action.startup&&p.frame<p.action.startup+p.action.active;
const facingBack=p=>p.facing===1?'left':'right';
const moveX=(p,dx)=>p.x=cap(p.x+dx,ARENA.minX,ARENA.maxX);
const ROAR=Object.freeze({name:'咆哮',kind:'roar',startup:16,active:7,recovery:27,damage:105,reach:.66,level:'mid',anim:'roar'});
const GYUIIN=Object.freeze({name:'ギュイーン',kind:'clinch',startup:8,active:14,recovery:24,damage:0,reach:.40,travel:.32,level:'grab',anim:'gyuiin'});
export const DRIVE=Object.freeze({max:100,initial:100,roarCost:35,gyuiinCost:60,regenPerFrame:.11,regenDelay:90,clinchFrames:34,resetSpacing:1.35});
const GRAB=Object.freeze({name:'掴み',kind:'throw',startup:6,active:3,recovery:25,damage:78,reach:.31,level:'grab',anim:'grab'});
export const UNIVERSAL_ACTIONS=Object.freeze({roar:ROAR,gyuiin:GYUIIN,grab:GRAB});
function fighter(id,slot){
  const r=ROSTER[id];if(!r)throw Error('unknown fighter '+id);
  return {id,slot,x:slot===0?-.70:.70,y:0,vy:0,facing:slot===0?1:-1,
    hp:r.hp,guard:100,super:0,drive:DRIVE.initial,driveDelay:0,state:'idle',reaction:null,frame:0,stun:0,stop:0,
    action:null,used:false,spawned:false,ko:false,prev:inputOf({}),input:inputOf({}),
    dirHistory:[],dirFacing:null,dashF:0,dashDir:0,roarCooldown:0,gyuiinCooldown:0,guardF:0,
    ability:{charge:0,lastCharge:'',iron:0,armor:3,chase:0,pressure:0,just:0,dark:0,grit:true},
    poison:0,poisonTick:0,attackSerial:0,locomotion:0
  };
}
function aiInput(g,p,op,level){
  const t=g.frame,d=Math.abs(p.x-op.x),face=op.x>p.x?'right':'left',back=op.x>p.x?'left':'right',i={};
  if(p.stun||p.stop)return i;
  if(op.action&&d<.75&&p.y===0&&((t+level*7)%19)<11){
    i[back]=true;if(op.action.level==='low')i.down=true;
    if(op.action.kind==='roar'&&t%5===0&&level>=2)i.roar=true;
    return i;
  }
  if(!p.action&&d>.60){
    i[face]=true;if(t%146===12&&level>1)i.special1=true;
    if(t%180===18&&level>1)i.dash=true;return i;
  }
  if(!p.action){
    if(d<.34&&t%109===12)i.throw=true;
    else if(t%49===9)i.weak=true;
    else if(t%83===24)i.strong=true;
    else if(t%160===38)i.special2=true;
    else if(t%185===42)i.special3=true;
    if(d<.55&&level>=2&&t%311===20)i.gyuiin=true;
    if(d<.75&&level>=2&&t%260===58)i.roar=true;
    if(p.super>=100&&t%235===17)i.super=true;
    if(t%195===82)i.up=true;
  }
  return i;
}
function timer(p){
  for(const k of ['chase','pressure','just','dark'])p.ability[k]=Math.max(0,p.ability[k]-1);
  for(const k of ['roarCooldown','gyuiinCooldown'])p[k]=Math.max(0,p[k]-1);
  p.guard=cap(p.guard+(p.stun? .006:.025),0,100);
  if(p.driveDelay>0)p.driveDelay--;
  else p.drive=cap(p.drive+DRIVE.regenPerFrame,0,DRIVE.max);
}
function tickPoison(p){
  if(p.action?.kind==='clinch'||p.state==='clinch_recoil')return;
  if(p.poison<=0){p.poisonTick=0;return;}
  p.poison--;p.poisonTick++;
  if(p.poisonTick>=30){p.poisonTick=0;p.hp=Math.max(0,p.hp-4);}
}
export class Battle {
  constructor(left='moguzo',right='godan',level=2){
    this.frame=0;this.time=FPS*ARENA.roundSeconds;this.level=cap(Number(level)||2,1,3);
    this.fighters=[fighter(left,0),fighter(right,1)];
    this.projectiles=[];this.events=[];this.pending=[];this.winner=null;this.phase='fight';this.seq=0;this.clinch=null;
    this.tailTipSamples=null;
  }
  again(){
    const n=new Battle(this.fighters[0].id,this.fighters[1].id,this.level);
    n.tailTipSamples=this.tailTipSamples;return n;
  }
  setTailTipPath(path){
    if(!Array.isArray(path)||path.length<2)throw Error('missing tail tip path');
    let last=-Infinity;
    this.tailTipSamples=path.map(r=>{
      if(!Array.isArray(r)||r.length<2||!Number.isFinite(r[0])||!Number.isFinite(r[1])||r[0]<=last)throw Error('bad tail path');
      last=r[0];return [r[0],r[1]];
    });return this;
  }
  _tailAt(frame){
    const a=this.tailTipSamples;if(!a)return tailTipAt(frame);
    if(frame<=a[0][0])return a[0][1];
    for(let i=1;i<a.length;i++)if(frame<=a[i][0]){
      const [f0,x0]=a[i-1],[f1,x1]=a[i];
      return x0+(x1-x0)*(frame-f0)/(f1-f0);
    }return a.at(-1)[1];
  }
  _startGyuiin(p){
    if(p.ko||this.clinch||p.state==='clinch_recoil'||p.gyuiinCooldown>0||p.drive<DRIVE.gyuiinCost||p.y>.09)return false;
    p.drive-=DRIVE.gyuiinCost;p.driveDelay=DRIVE.regenDelay+60;p.gyuiinCooldown=145;
    // 超装甲は攻撃中・被弾中にも起動可能。ただし必要なドライブを消費する。
    p.action={...GYUIIN,id:'gyuiin',serial:++this.seq,started:this.frame};
    p.state='gyuiin';p.frame=0;p.stun=0;p.stop=0;p.dashF=0;p.used=false;p.spawned=false;
    this.events.push({type:'move',slot:p.slot,name:'ギュイーン',action:'gyuiin'});
    // 即時に相手を拘束しない。アーマーで前進し、実際に接触したら成立する。
    return true;
  }
  _clinchPair(p,other){
    if(this.clinch||p.ko||other.ko)return false;
    this.clinch={frame:0,total:DRIVE.clinchFrames,initiator:p.slot};
    const mid=cap((p.x+other.x)*.5,ARENA.minX+.35,ARENA.maxX-.35);
    const side=p.x<other.x||(p.x===other.x&&p.slot<other.slot)?-1:1;
    for(const f of [p,other]){
      const dir=f===p?side:-side;
      f.x=mid+dir*.18;f.y=0;f.vy=0;f.action=null;f.stop=0;f.stun=0;f.dashF=0;
      f.state='clinch';f.frame=0;f.facing=-dir;f.dirHistory=[];
    }
    this.projectiles.length=0;this.pending.length=0;
    this.events.push({type:'gyuiin_start',slot:p.slot,x:mid,y:.35});
    return true;
  }
  _clinchTick(){
    const c=this.clinch;if(!c)return;
    c.frame++;
    for(const p of this.fighters){p.state='clinch';p.frame=c.frame;}
    if(c.frame>=c.total){
      const [a,b]=this.fighters,mid=cap((a.x+b.x)/2,ARENA.minX+DRIVE.resetSpacing/2,ARENA.maxX-DRIVE.resetSpacing/2);
      const dir=a.x<=b.x?1:-1;
      a.x=mid-dir*DRIVE.resetSpacing/2;b.x=mid+dir*DRIVE.resetSpacing/2;
      for(const p of this.fighters){p.state='clinch_recoil';p.frame=0;p.stun=10;p.stop=0;p.facing=p===a?dir:-dir;}
      this.clinch=null;
      this.events.push({type:'gyuiin_break',x:mid,y:.35});
    }
  }
  _begin(p,m,id){
    if(m.kind==='clinch')return this._startGyuiin(p);
    if(p.ko||p.stun||p.stop||(p.y>.06&&['throw','roar','projectile'].includes(m.kind)))return false;
    if(m.isSuper&&p.super<100)return false;
    if(m.kind==='roar'&&(p.roarCooldown>0||p.drive<DRIVE.roarCost))return false;
    // 技から別技へのキャンセルは暗連に限る。
    if(p.action&&!(p.id==='dark_moguzo'&&p.ability.dark>0&&id!==p.action.id&&!m.isSuper))return false;
    if(p.action&&p.action.id===id)return false;
    if(m.isSuper)p.super=0;
    if(m.kind==='roar'){p.roarCooldown=96;p.drive-=DRIVE.roarCost;p.driveDelay=DRIVE.regenDelay;}
    if(p.id==='godan'&&m.armor){if(p.ability.armor<1)return false;p.ability.armor--;}
    if(p.id==='hakuma'&&p.ability.iron&&(id.startsWith('s')||m.isSuper)){
      m={...m,damage:Math.round(m.damage*1.23)};p.ability.iron=0;
    }
    if(p.id==='bullet'&&p.ability.charge>0&&(m.kind==='tail'||m.isSuper)){
      m={...m,damage:Math.round(m.damage*(1+.08*p.ability.charge))};p.ability.charge=0;
    }
    if(p.id==='takimaru'&&(m.kind==='throw'||m.kind==='clinch')&&p.ability.pressure>0){
      m={...m,damage:Math.round(m.damage*1.2)};p.ability.pressure=0;
    }
    if(p.id==='yomikage'&&p.ability.just>0&&m.kind==='counter'){
      m={...m,startup:Math.max(3,m.startup-2),damage:Math.round(m.damage*1.15)};p.ability.just=0;
    }
    p.action={...m,id,serial:++this.seq,started:this.frame};
    p.state=m.kind==='roar'?'roar':m.kind==='clinch'?'gyuiin':'attack';
    p.frame=0;p.used=false;p.spawned=false;p.attackSerial++;
    if(p.id==='dark_moguzo')p.ability.dark=0;
    this.events.push({type:'move',slot:p.slot,name:m.name,action:id});
    return true;
  }
  _input(p,other,raw){
    const n=inputOf(raw),edges={};
    for(const k of KEYS)edges[k]=n[k]&&!p.prev[k];
    p.prev=n;p.input=n;
    if(p.ko)return;
    if(p.stop||p.stun)return;
    if(edges.roar&&p.action&&p.action.kind!=='roar'&&other.action?.kind==='roar'&&p.roarCooldown===0&&p.drive>=DRIVE.roarCost){p.action=null;p.frame=0;}

    // 組み合いと咆哮は技からの割り込み不可。咆哮返しは入力時の先読みで成立する。
    if(p.action){
      if(p.id==='pisuke'&&p.ability.chase>0&&edges.dash){
        p.action=null;p.frame=0;p.ability.chase=0;moveX(p,p.facing*ROSTER[p.id].dash);
        this.events.push({type:'chase',slot:p.slot});
      } else if(p.id==='dark_moguzo'&&p.ability.dark>0&&(edges.weak||edges.strong)){
        const id=edges.weak?'stand_weak':'stand_heavy';this._begin(p,normalMove(p.id,id),id);
      }
      return;
    }
    if(p.dashF>0){moveX(p,p.dashDir*ROSTER[p.id].dash/18);p.dashF--;p.state='dash';p.frame++;return;}
    if(edges.roar){this._begin(p,ROAR,'roar');return;}
    if(edges.throw){this._begin(p,GRAB,'throw');return;}
    // CPUは内部アクションIDで選ぶ。プレイヤーには必殺ボタンを表示しない。
    if(edges.super){this._begin(p,ultimateMove(p.id),'ultimate');return;}
    for(let i=1;i<=3;i++)if(edges['special'+i]){
      this._begin(p,specialMove(p.id,i-1),'s'+i);return;
    }
    if(edges.weak||edges.strong){
      const button=edges.strong?'strong':'weak';
      const cmd=readCommand(p.dirHistory,button,this.frame,p.super>=100);
      if(cmd){
        const m=cmd==='super'?ultimateMove(p.id):specialMove(p.id,{qcf:0,dp:1,qcb:2}[cmd]);
        const id=cmd==='super'?'ultimate':'s'+({qcf:1,dp:2,qcb:3}[cmd]);
        if(this._begin(p,m,id)){this.events.push({type:'command',slot:p.slot,command:cmd});return;}
      }
      const stance=p.y>.02?'air_':n.down?'crouch_':'stand_';
      const id=stance+(button==='strong'?'heavy':'weak');
      this._begin(p,normalMove(p.id,id),id);return;
    }
    if(edges.dash&&p.y===0){
      p.dashDir=n.left?-1:n.right?1:p.facing;p.dashF=17;
      moveX(p,p.dashDir*ROSTER[p.id].dash/18);
      p.state='dash';p.frame=0;p.locomotion++;return;
    }
    if(edges.up&&p.y===0&&!n.down){
      p.vy=ROSTER[p.id].jump;p.y=.006;p.state='jump';p.frame=0;p.locomotion++;return;
    }
    const dir=n.right?1:n.left?-1:0;
    if(dir&&!n.down){
      const rr=ROSTER[p.id],back=dir!==p.facing;
      moveX(p,dir*(p.y>0?Math.max(.025,rr.walk*1.25):back?rr.back:rr.walk));
      p.state=p.y>0?'jump':back?'walk_b':'walk_f';
    }else p.state=p.y>0?'jump':n.down?'crouch':'idle';
  }
  _guarding(t,m){
    if(['throw','clinch'].includes(m.kind)||t.y>.07||t.action||t.stun)return false;
    const back=t.input[facingBack(t)];
    return back&&(m.level==='low'?t.input.down:m.level!=='overhead'||!t.input.down);
  }
  _absorbing(t,m){
    if(!t.action)return null;
    const c=t.action.kind;
    if(c==='roar'&&t.frame>=1&&t.frame<=t.action.startup+t.action.active){
      if(m.kind!=='roar'&&m.kind!=='throw'&&m.kind!=='clinch')return 'roar';
    }
    if(t.id==='godan'&&t.action.armor&&t.frame>=4&&m.kind!=='throw'&&m.kind!=='clinch')return 'godan';
    return null;
  }
  _damage(a,t,m,_distance=0,source='strike',force=false){
    if((t.ko&&!force)||(this.phase!=='fight'&&!force))return;
    if(t.action?.kind==='clinch'){
      // 何を受けてもギュイーンの姿勢に移行。距離外の弾もダメージなし。
      if(t.frame>=4&&Math.abs(a.x-t.x)<.46&&a.y<.10)this._clinchPair(t,a);
      else this.events.push({type:'gyuiin_armor',slot:t.slot,x:t.x,y:t.y+.33});
      return;
    }
    if(m.kind==='roar'&&t.action?.kind==='roar'){
      const later=t.action.started>a.action?.started;
      const same=t.action.started===a.action?.started;
      if(later||same){
        a.action=null;a.stun=same?12:27;a.state='hit';a.reaction='roar_hit';a.frame=0;a.stop=7;
        if(same){t.action=null;t.stun=12;t.state='hit';t.reaction='roar_hit';t.frame=0;t.stop=7;}
        this.events.push({type:same?'roar_clash':'roar_counter',slot:t.slot,x:t.x,y:t.y+.35});
        return;
      }
    }
    const guard=this._guarding(t,m);
    let dmg=m.damage;
    if(a.id==='moguzo'&&a.hp<=ROSTER.moguzo.hp*.30)dmg=Math.round(dmg*1.12);
    if(a.id==='dark_moguzo'&&a.hp<=ROSTER.dark_moguzo.hp*.35)dmg=Math.round(dmg*1.10);
    if(guard){
      t.dashF=0;t.guard=cap(t.guard-Math.max(5,dmg*(m.kind==='roar'?.37:.16)),0,100);
      t.stun=t.guard<=0?26:Math.max(8,Math.round(dmg*(m.kind==='roar'?.17:.08)));
      t.state='block';t.reaction=m.kind==='roar'?'guard_impact':t.input.down?'guard_crouch_hit':'guard_hit';t.frame=0;t.ability.iron=t.id==='hakuma'?1:t.ability.iron;
      if(t.id==='yomikage'&&t.guardF<=7)t.ability.just=42;
      if(a.id==='takimaru')a.ability.pressure=36;
      this.events.push({type:'block',slot:t.slot,x:t.x,y:t.y+.35,damage:0});
    }else{
      const absorb=this._absorbing(t,m);
      if(absorb==='roar'){
        a.stop=Math.max(a.stop,4);
        this.events.push({type:'roar_absorb',slot:t.slot,x:t.x,y:t.y+.38});return;
      }
      if(t.id==='yomikage'&&t.action?.kind==='counter'&&active(t)&&m.kind!=='roar'&&m.kind!=='clinch'){
        a.stun=16;a.hp=Math.max(0,a.hp-88);t.action=null;t.state='idle';
        this.events.push({type:'counter',slot:t.slot,x:t.x,y:t.y+.34});return;
      }
      if(absorb==='godan'){dmg=Math.round(dmg*.55);this.events.push({type:'armor',slot:t.slot});}
      else{
        t.stun=m.kind==='clinch'?36:Math.max(12,Math.round(m.damage*.16));
        t.action=null;t.dashF=0;t.state='hit';t.reaction=m.kind==='roar'?'roar_hit':m.damage>=95?'hurt_heavy':'hurt_light';t.frame=0;
      }
      t.hp=Math.max(0,t.hp-dmg);t.guard=cap(t.guard+2,0,100);t.ability.iron=0;
      if(t.id==='moguzo'&&t.hp===0&&t.ability.grit){t.hp=1;t.ability.grit=false;this.events.push({type:'grit',slot:t.slot});}
      if(a.id==='pisuke'&&/^(stand|crouch)_/.test(m.id||''))a.ability.chase=15;
      if(a.id==='chirka'&&m.poison){t.poison=180;t.poisonTick=0;}
      if(a.id==='takimaru')a.ability.pressure=30;
      if(a.id==='bullet'&&m.id!==a.ability.lastCharge){a.ability.charge=Math.min(3,a.ability.charge+1);a.ability.lastCharge=m.id;}
      if(a.id==='dark_moguzo'&&source==='strike'&&!m.isSuper)a.ability.dark=18;
      this.events.push({type:m.kind==='clinch'?'gyuiin_hit':'hit',slot:t.slot,x:t.x,y:t.y+.32,damage:dmg});
      if(m.kind==='clinch'){a.stop=Math.max(a.stop,15);t.stop=Math.max(t.stop,15);}
      if(m.kind==='roar'){t.stun=Math.max(t.stun,23);t.reaction='roar_hit';this.events.push({type:'roar_hit',slot:a.slot,x:t.x,y:t.y+.35});}
    }
    a.super=cap(a.super+(guard?5:Math.round(dmg*.19)),0,100);
    t.super=cap(t.super+(guard?5:Math.round(dmg*.09)),0,100);
    a.stop=Math.max(a.stop,guard?3:6);
    t.stop=Math.max(t.stop,guard?3:6);
    moveX(t,a.facing*(guard?.05:m.kind==='roar'?.16:.085));
    if(t.hp<=0){t.ko=true;t.state='ko';this.phase='ko';this.winner=a.slot;this.events.push({type:'ko',slot:a.slot});}
  }
  _contact(a,t,m){
    const dist=Math.abs(t.x-a.x);
    if(m.kind==='clinch')return dist<=.83&&Math.abs(a.y-t.y)<1.25;
    if(m.kind==='throw')return a.y<.09&&t.y<.10&&dist<m.reach+.12;
    if(m.kind==='tail'){
      const tip=this._tailAt(a.frame);
      return dist>=m.minReach&&tip>0&&dist<=tip+.16&&Math.abs(t.y-a.y)<.43;
    }
    if(m.kind==='anti')return dist<(m.reach||.4)+.16&&t.y<1.5;
    if(a.y<.12&&t.y>.50)return false;
    if(a.y>.28&&t.y<.1&&a.y>.7)return false;
    return dist<=(m.reach||.5)+.16&&Math.abs(a.y-t.y)<.58;
  }
  _act(p,op){
    const m=p.action;if(!m)return;
    p.frame++;
    if(m.travel&&p.frame<=m.startup+m.active)moveX(p,p.facing*m.travel/(m.startup+m.active));
    if(m.kind==='clinch'){
      if(active(p)&&this._contact(p,op,m))this._clinchPair(p,op);
      else if(p.frame>=total(m)){p.action=null;p.frame=0;p.state='idle';this.events.push({type:'gyuiin_whiff',slot:p.slot});}
      return;
    }
    if(m.kind==='projectile'&&!p.spawned&&p.frame===m.startup){
      p.spawned=true;this.projectiles.push({id:++this.seq,owner:p.slot,x:p.x+p.facing*.30,y:p.y+.30,
        face:p.facing,speed:m.speed||.045,life:m.life||75,damage:m.damage,poison:m.poison||0,
        effect:m.effect||'earth',level:m.level||'mid'});
      this.events.push({type:'projectile',slot:p.slot});
    }
    if(active(p)&&!p.used&&m.kind!=='projectile'&&this._contact(p,op,m)){
      p.used=true;this.pending.push({p,op,m,d:Math.abs(p.x-op.x)});
    }
    if(p.frame>=total(m)){p.action=null;p.frame=0;p.state=p.y>.02?'jump':'idle';}
  }
  _roarErase(p,b){
    if(p.action?.kind!=='roar')return false;
    if(p.frame<1||p.frame>p.action.startup+p.action.active)return false;
    return b.owner!==p.slot && (b.x-p.x)*p.facing>=-.12 && (b.x-p.x)*p.facing<.86 && Math.abs((b.y-.30)-p.y)<.65;
  }
  _projectiles(){
    for(const b of this.projectiles){
      b.x+=b.speed*b.face;b.life--;
      if(b.life<=0||Math.abs(b.x)>ARENA.maxX+.3)continue;
      for(const t of this.fighters)if(this._roarErase(t,b) || (b.owner!==t.slot&&t.action?.kind==='clinch'&&Math.abs(b.x-t.x)<.65&&Math.abs((b.y-.30)-t.y)<.50)){
        b.life=0;this.events.push({type:t.action?.kind==='clinch'?'gyuiin_armor':'roar_erase',slot:t.slot,x:b.x,y:b.y});break;
      }
      if(b.life<=0)continue;
      const t=this.fighters[1-b.owner],a=this.fighters[b.owner];
      if(!t.ko&&Math.abs(b.x-t.x)<.23&&Math.abs(t.y-(b.y-.3))<.50){
        b.life=0;this._damage(a,t,{name:'飛び道具',id:'projectile',kind:'projectile',damage:b.damage,level:b.level,poison:b.poison},Math.abs(b.x-t.x),'projectile');
      }
    }
    for(let i=0;i<this.projectiles.length;i++)for(let j=i+1;j<this.projectiles.length;j++){
      const a=this.projectiles[i],b=this.projectiles[j];
      if(a.life>0&&b.life>0&&a.owner!==b.owner&&Math.abs(a.x-b.x)<.14){
        a.life=0;b.life=0;this.events.push({type:'clash',x:(a.x+b.x)/2,y:.3});
      }
    }
    this.projectiles=this.projectiles.filter(p=>p.life>0);
  }
  _gravity(p){
    if(p.y>0||p.vy>0){
      p.vy-=ARENA.gravity;p.y=Math.max(0,p.y+p.vy);
      if(p.y===0){p.vy=0;if(!p.action&&!p.stun)p.state='idle';}
    }
  }
  tick(raw1={},raw2=null){
    if(this.phase!=='fight')return this;
    this.frame++;this.pending=[];this.events=[];
    if(this.clinch){
      this.fighters[0].prev=inputOf(raw1);this.fighters[1].prev=inputOf(raw2??{});
      this._clinchTick();return this;
    }
    this.time--;
    const [a,b]=this.fighters;
    if(this.time<=0){
      this.phase='ko';const q=a.hp/ROSTER[a.id].hp-b.hp/ROSTER[b.id].hp;
      this.winner=Math.abs(q)<1e-9?-1:q>0?0:1;this.events.push({type:'timeout'});return this;
    }
    for(const p of this.fighters)timer(p);
    if(a.hp<=0||b.hp<=0){this.phase='ko';this.winner=a.hp>0?0:b.hp>0?1:-1;return this;}
    for(const [p,op] of [[a,b],[b,a]])if(!p.action&&!p.stun)p.facing=op.x>=p.x?1:-1;
    const raw=[inputOf(raw1),inputOf(raw2??aiInput(this,b,a,this.level))];
    // 被弾硬直・ヒットストップ中でも、入力フレームから超装甲で接近できる。
    const started=this.fighters.map((p,i)=>raw[i].gyuiin&&!p.prev.gyuiin&&this._startGyuiin(p));
    for(const p of this.fighters)tickPoison(p);
    if(a.hp<=0||b.hp<=0){
      this.phase='ko';this.winner=a.hp>0?0:b.hp>0?1:-1;
      for(const p of this.fighters)if(p.hp<=0){p.ko=true;p.state='ko';}
      return this;
    }
    for(let i=0;i<2;i++){
      const p=this.fighters[i],op=this.fighters[1-i];
      if(p.dirFacing!==p.facing){p.dirHistory=[];p.dirFacing=p.facing;}
      const samples=i===0?raw1.directionSamples:raw2?.directionSamples;
      for(const sample of samples??[])p.dirHistory=pushDirection(p.dirHistory,sample,this.frame,p.facing);
      p.dirHistory=pushDirection(p.dirHistory,raw[i],this.frame,p.facing);
      if(started[i]){p.prev=raw[i];p.input=raw[i];}
      if(p.stop>0){p.stop--;p.input=raw[i];p.prev=raw[i];continue;}
      if(p.stun>0){
        p.stun--;p.input=raw[i];p.prev=raw[i];p.frame++;
        if(!p.stun&&!p.action)p.state=p.y>0?'jump':'idle';
        this._gravity(p);continue;
      }
      if(!started[i])this._input(p,op,raw[i]);
      if(this.clinch)break;
      p.guardF=p.input[facingBack(p)]?p.guardF+1:0;
      this._act(p,op);if(this.clinch)break;this._gravity(p);
    }
    if(this.clinch)return this;
    for(const e of this.pending){
      if(e.m.kind==='roar'&&e.p.action?.kind!=='roar')continue; // 相殺後の残像ヒットを防ぐ
      this._damage(e.p,e.op,e.m,e.d,'strike',true);
    }
    if(a.hp<=0&&b.hp<=0){this.phase='ko';this.winner=-1;}
    if(this.phase==='fight'){
      // 高く跳んだ相手の上を横切るときは横方向の押し合いを解除。
      const sep=b.x-a.x,overlap=2*ARENA.pushRadius-Math.abs(sep);
      if(overlap>0&&Math.abs(a.y-b.y)<.70){
        const d=sep>=0?1:-1;moveX(a,-d*overlap/2);moveX(b,d*overlap/2);
      }
      this._projectiles();
    }
    if(a.hp<=0||b.hp<=0){this.phase='ko';this.winner=a.hp>0?0:b.hp>0?1:-1;}
    return this;
  }
  info(){return {frame:this.frame,time:this.time,phase:this.phase,winner:this.winner,
    players:this.fighters.map(p=>({id:p.id,x:p.x,y:p.y,hp:p.hp,guard:p.guard,super:p.super,drive:p.drive,state:p.state,ability:p.ability,action:p.action?.id})),
    projectiles:this.projectiles.length};}
}
export function simFight(left,right,frames=12000,level=2){
  const g=new Battle(left,right,level);
  for(let i=0;i<frames&&g.phase==='fight';i++){
    const p=g.fighters[0],op=g.fighters[1];
    g.tick(aiInput({...g,frame:g.frame+1},p,op,level));
  }
  return g;
}
