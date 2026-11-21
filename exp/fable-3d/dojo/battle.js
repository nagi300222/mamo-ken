import { FPS, ARENA, ROSTER, IDS, normalMove, specialMove, ultimateMove, tailTipAt } from './balance.js';
// ロジックは Three.js / DOM / GLB に依存しない。論理60Hzの対戦用暫定エンジン。
const KEYS=['left','right','up','down','weak','strong','special1','special2','special3','super','throw','dash'];
const cap=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const own=(a,k)=>Object.prototype.hasOwnProperty.call(a,k);
const inputOf=(raw={})=>Object.fromEntries(KEYS.map(k=>[k,!!raw[k]]));
const frameLen=m=>m.startup+m.active+m.recovery;
function createFighter(id,slot) {
  if(!ROSTER[id]) throw Error('Unknown fighter: '+id);
  const r=ROSTER[id];
  return {id,slot,x:slot===0?-.72:.72,y:0,vy:0,facing:slot===0?1:-1,
    hp:r.hp,guard:100,super:0,ability:{charge:0,lastCharge:'',iron:0,armor:3,chase:0,pressure:0,just:0,dark:0,grit:true},
    state:'idle',frame:0,stun:0,stop:0,action:null,used:false,spawned:false,
    poison:0,poisonTick:0,prev:inputOf({}), input:inputOf({}), strikes:0,ko:false,
    impact:0, guardF:0, attackSerial:0, locomotion:0, lastHit:'', dashF:0, dashDir:0
  };
}
const active=(p)=>p.action && p.frame>=p.action.startup && p.frame<p.action.startup+p.action.active;
const isAttack=(p)=>p.action!==null;
const facingAway=(p,key)=>p.facing===1?key.left:key.right;
const advanceX=(p,dx)=>p.x=cap(p.x+dx,ARENA.minX,ARENA.maxX);
function aiInput(g,p,op,level) {
  const d=Math.abs(p.x-op.x), t=g.frame, out={};
  const w=(op.x>p.x?'right':'left'),back=(op.x>p.x?'left':'right');
  const busy=p.action||p.stun||p.stop;
  if(op.action && d<.86 && p.y===0 && (t+level*5)%17<12) {
    out[back]=true; if(op.action.level==='low')out.down=true; return out;
  }
  if(p.y===0 && !busy && d>.64) {
    out[w]=true;
    if((t%170)===15 && level>=2) out.special2=true;
    if((t%135)===13 && level===3) out.dash=true;
    return out;
  }
  if(p.y===0 && !busy) {
    if(d>.4 && t%100===17) out.special1=true;
    else if(d<.35 && t%83===18) out.throw=true;
    else if(t%44===8)out.weak=true;
    else if(t%71===28)out.strong=true;
    else if(t%143===22)out.special3=true;
    else if(p.super>=100 && t%220===5)out.super=true;
    if(t%180===80)out.up=true;
  }
  return out;
}
function resetTimers(p) {
  if(p.ability.chase>0)p.ability.chase--;
  if(p.ability.pressure>0)p.ability.pressure--;
  if(p.ability.just>0)p.ability.just--;
  if(p.ability.dark>0)p.ability.dark--;
  if(p.poison>0) {
    p.poison--;
    p.poisonTick++;
    if(p.poisonTick>=30){p.poisonTick=0;p.hp=Math.max(0,p.hp-4);}
  } else p.poisonTick=0;
}
export class Battle {
  constructor(left='moguzo',right='godan',level=2) {
    this.frame=0;this.time=FPS*ARENA.roundSeconds;this.level=cap(Number(level)||2,1,3);
    this.fighters=[createFighter(left,0),createFighter(right,1)];
    this.projectiles=[];this.events=[];this.winner=null;this.phase='fight';this.seq=0;
    this.tailTipSamples=null;
  }
  again(){const next=new Battle(this.fighters[0].id,this.fighters[1].id,this.level);next.tailTipSamples=this.tailTipSamples;return next;}
  setTailTipPath(path){
    if(!Array.isArray(path)||path.length<2)throw Error('missing tail tip path');
    let prior=-Infinity;
    this.tailTipSamples=path.map(row=>{
      if(!Array.isArray(row)||row.length<2||!Number.isFinite(row[0])||!Number.isFinite(row[1])||row[0]<=prior)throw Error('invalid tail path');
      prior=row[0];return [row[0],row[1]];
    });
    return this;
  }
  _tailAt(frame){
    const a=this.tailTipSamples;
    if(!a)return tailTipAt(frame);
    if(frame<=a[0][0])return a[0][1];
    for(let i=1;i<a.length;i++)if(frame<=a[i][0]){
      const [f0,x0]=a[i-1],[f1,x1]=a[i];return x0+(x1-x0)*(frame-f0)/(f1-f0);
    }
    return a[a.length-1][1];
  }
  _begin(p,m,id) {
    if(p.stun||p.stop||p.ko||p.y>0&&m.kind==='throw')return false;
    if(m.isSuper && p.super<100) return false;
    if(p.action && !(p.id==='dark_moguzo'&&p.ability.dark>0&&!m.isSuper&&id!==p.action.id)) return false;
    if(p.action && id===p.action.id) return false;
    if(m.isSuper)p.super=0;
    if(p.id==='godan'&&m.armor){
      if(p.ability.armor<=0)return false;
      p.ability.armor--;
    }
    if(p.id==='hakuma'&&p.ability.iron && (id.startsWith('s')||m.isSuper)) {
      m={...m,damage:Math.round(m.damage*1.23)};p.ability.iron=0;
    }
    if(p.id==='bullet'&&p.ability.charge>0&&(m.kind==='tail'||m.isSuper)){
      m={...m,damage:Math.round(m.damage*(1+.08*p.ability.charge))};
      p.ability.charge=0;
    }
    if(p.id==='takimaru'&&m.kind==='throw'&&p.ability.pressure>0) {
      m={...m,damage:Math.round(m.damage*1.2)};p.ability.pressure=0;
    }
    if(p.id==='yomikage'&&p.ability.just>0 && m.kind==='counter') {
      m={...m,startup:Math.max(3,m.startup-2),damage:Math.round(m.damage*1.15)};p.ability.just=0;
    }
    p.action={...m,id,serial:++this.seq};p.state='attack';p.frame=0;p.used=false;p.spawned=false;p.strikes=0;
    p.ability.dark=0;p.attackSerial++;
    this.events.push({type:'move',slot:p.slot,name:m.name});
    return true;
  }
  _input(p,other,raw) {
    const n=inputOf(raw), edges={};
    for(const k of KEYS)edges[k]=n[k]&&!p.prev[k];
    p.prev=n;p.input=n;
    // 斜めを含む移動と操作入力のエッジを分ける。
    if(p.stop||p.ko)return;
    if(p.stun>0)return;
    if(p.action){
      if(p.id==='pisuke'&&p.ability.chase>0&&edges.dash){
        p.action=null;p.frame=0;p.ability.chase=0;
        advanceX(p,p.facing*ROSTER[p.id].dash);
        this.events.push({type:'chase',slot:p.slot});
      } else if(p.id==='dark_moguzo'&&p.ability.dark>0&&(edges.weak||edges.strong)) {
        const id=edges.weak?'stand_weak':'stand_heavy';
        this._begin(p,normalMove(p.id,id),id);
      }
      return;
    }
    if(p.dashF>0){advanceX(p,p.dashDir*ROSTER[p.id].dash/18);p.dashF--;p.state='dash';p.frame++;return;}
    if(edges.super){this._begin(p,ultimateMove(p.id),'ultimate');return;}
    for(let i=1;i<=3;i++)if(edges['special'+i]){this._begin(p,specialMove(p.id,i-1),'s'+i);return;}
    if(edges.throw){this._begin(p,{name:'投げ',kind:'throw',startup:6,active:3,recovery:24,damage:76,reach:.32,level:'grab',anim:'sp_bear_grab'},'throw');return;}
    if(edges.weak||edges.strong){
      const s=p.y>.02?'air_':n.down?'crouch_':'stand_';
      const id=s+(edges.strong?'heavy':'weak');
      this._begin(p,normalMove(p.id,id),id);return;
    }
    if(edges.dash && p.y===0){
      const dir=n.left?-1:n.right?1:p.facing;
      p.dashDir=dir;p.dashF=17;advanceX(p,dir*ROSTER[p.id].dash/18);
      p.state='dash';p.frame=0;p.locomotion++;return;
    }
    if(edges.up && p.y===0 && !n.down){
      p.vy=ROSTER[p.id].jump;p.y=.005;p.state='jump';p.frame=0;p.locomotion++;return;
    }
    const toward=n.right?1:n.left?-1:0;
    if(toward!==0&&!n.down){
      const r=ROSTER[p.id],backward=toward!==p.facing;
      advanceX(p,toward*(backward?r.back:r.walk));
      p.state=backward?'walk_b':'walk_f';
    } else p.state=n.down&&p.y===0?'crouch':p.y>0?'jump':'idle';
  }
  _guarding(target,attacker,level,isGrab=false) {
    if(isGrab || target.y>.07 || target.action || target.stun>0)return false;
    const back=facingAway(target,target.input);
    return back && (level==='low'?target.input.down:level!=='overhead'||!target.input.down);
  }
  _damage(attacker,target,m,distance,source='strike',force=false) {
    if(target.ko||(this.phase!=='fight'&&!force))return;
    const guard=this._guarding(target,attacker,m.level||'mid',m.kind==='throw');
    let dmg=m.damage;
    if(attacker.id==='moguzo'&&attacker.hp<=ROSTER.moguzo.hp*.3)dmg=Math.round(dmg*1.12);
    if(attacker.id==='yomikage'&&attacker.ability.just>0)dmg=Math.round(dmg*1.08);
    if(attacker.id==='dark_moguzo'&&attacker.hp<ROSTER.dark_moguzo.hp*.35)dmg=Math.round(dmg*1.1);
    if(guard){
      target.dashF=0;
      target.guard=cap(target.guard-Math.max(5,dmg*.16),0,100);
      target.stun=target.guard<=0?20:Math.max(7,Math.round(m.damage*.08));
      target.state='block';target.frame=0;
      target.ability.iron=target.id==='hakuma'?1:target.ability.iron;
      if(target.id==='yomikage'&&target.guardF<=7)target.ability.just=42;
      if(attacker.id==='takimaru')attacker.ability.pressure=36;
      this.events.push({type:'block',slot:target.slot,x:target.x,y:target.y+.33,damage:0});
    } else {
      target.dashF=0;
      if(target.id==='yomikage'&&target.action?.kind==='counter'&&active(target)){
        attacker.stun=15;attacker.hp=Math.max(0,attacker.hp-88);target.action=null;target.state='idle';
        this.events.push({type:'counter',slot:target.slot,x:target.x,y:target.y+.34});return;
      }
      if(target.id==='godan'&&target.action?.armor && target.frame>=4 && target.ability.armor>=0 && m.kind!=='throw'){
        dmg=Math.round(dmg*.55);this.events.push({type:'armor',slot:target.slot});
      }else{
        target.stun=Math.max(12,Math.round(m.damage*.16));target.action=null;target.state='hit';target.frame=0;
      }
      target.hp=Math.max(0,target.hp-dmg);target.guard=cap(target.guard+2,0,100);
      target.ability.iron=0;
      if(target.id==='moguzo'&&target.hp===0&&target.ability.grit){
        target.hp=1;target.ability.grit=false;this.events.push({type:'grit',slot:target.slot});
      }
      if(attacker.id==='pisuke'&&m.id?.includes('stand_')||attacker.id==='pisuke'&&m.id?.includes('crouch_'))attacker.ability.chase=15;
      if(attacker.id==='chirka' && m.poison) {target.poison=180;target.poisonTick=0;}
      if(attacker.id==='takimaru')attacker.ability.pressure=30;
      if(attacker.id==='bullet' && (m.id!==attacker.ability.lastCharge)) {
        attacker.ability.charge=Math.min(3,attacker.ability.charge+1);attacker.ability.lastCharge=m.id;
      }
      if(attacker.id==='dark_moguzo'&&source==='strike'&&!m.isSuper)attacker.ability.dark=18;
      this.events.push({type:'hit',slot:target.slot,x:target.x,y:target.y+.32,damage:dmg});
    }
    attacker.super=cap(attacker.super+(guard?5:Math.round(dmg*.19)),0,100);
    target.super=cap(target.super+(guard?5:Math.round(dmg*.09)),0,100);
    attacker.stop=Math.max(attacker.stop,guard?3:6);
    target.stop=Math.max(target.stop,guard?3:6);
    advanceX(target,attacker.facing*(guard?.038:.082));
    if(target.hp<=0){target.ko=true;target.state='ko';this.phase='ko';this.winner=attacker.slot;this.events.push({type:'ko',slot:attacker.slot});}
  }
  _contact(attacker,target,m) {
    const dist=Math.abs(target.x-attacker.x);
    if(target.y>.55&&m.kind!=='anti'&&attacker.y<.1)return false;
    if(m.kind==='throw')return target.y<.07&&attacker.y<.07&&dist<=m.reach+.12;
    if(m.kind==='tail') {
      const tip=this._tailAt(attacker.frame);
      return dist>=m.minReach && tip>=0 && dist<=tip+.16 && Math.abs(target.y-attacker.y)<.42;
    }
    const reach=m.reach||.5;
    if(m.kind==='anti')return dist<reach+.16 && target.y<=.75;
    if(attacker.y>.03&&target.y<.1&&attacker.y>.55)return false;
    return dist<=reach+.16 && Math.abs(attacker.y-target.y)<.40;
  }
  _act(p,other) {
    if(!p.action)return;
    const m=p.action;p.frame++;
    if(m.travel && p.frame<=m.startup+m.active)
      advanceX(p,p.facing*m.travel/(m.startup+m.active));
    if(m.kind==='projectile' && !p.spawned && p.frame===m.startup) {
      p.spawned=true;
      this.projectiles.push({id:++this.seq,owner:p.slot,x:p.x+p.facing*.30,y:p.y+.30,
        face:p.facing, speed:m.speed||.045, life:m.life||75,
        damage:m.damage,poison:m.poison||0,effect:m.effect||'earth',level:m.level||'mid'});
      this.events.push({type:'projectile',slot:p.slot});
    }
    if(active(p)&&!p.used&&m.kind!=='projectile'){
      if(this._contact(p,other,m)) {
        p.used=true;
        this.pending.push({p,other,m,dist:Math.abs(p.x-other.x)});
      }
    }
    if(p.frame>=frameLen(m)) {
      p.action=null;p.frame=0;
      if(p.stun===0)p.state=p.y>.01?'jump':'idle';
    }
  }
  _projectiles() {
    for(const b of this.projectiles) {
      b.x+=b.speed*b.face;b.life--;
      if(b.life<=0||Math.abs(b.x)>ARENA.maxX+.3)continue;
      const target=this.fighters[1-b.owner],owner=this.fighters[b.owner];
      if(!target.ko&&Math.abs(b.x-target.x)<.22 && Math.abs(target.y-(b.y-.3))<.47){
        b.life=0;this._damage(owner,target,{kind:'projectile',id:'projectile',name:'弾',damage:b.damage,level:b.level,poison:b.poison},Math.abs(b.x-target.x),'projectile');
      }
    }
    for(let i=0;i<this.projectiles.length;i++)for(let j=i+1;j<this.projectiles.length;j++) {
      const a=this.projectiles[i],b=this.projectiles[j];
      if(a.life>0&&b.life>0&&a.owner!==b.owner&&Math.abs(a.x-b.x)<.15) {
        a.life=0;b.life=0;this.events.push({type:'clash',x:(a.x+b.x)/2,y:.3});
      }
    }
    this.projectiles=this.projectiles.filter(p=>p.life>0);
  }
  _gravity(p) {
    if(p.y>0||p.vy>0){
      p.vy-=ARENA.gravity;p.y=Math.max(0,p.y+p.vy);
      if(p.y===0){p.vy=0;if(!p.action&&p.stun===0)p.state='idle';}
    }
  }
  tick(raw1={},raw2=null) {
    if(this.phase!=='fight')return this;
    this.frame++;this.time--;this.events=[];this.pending=[];
    const [a,b]=this.fighters;
    if(this.time<=0){
      this.phase='ko';this.winner=a.hp/ROSTER[a.id].hp===b.hp/ROSTER[b.id].hp?-1:
        a.hp/ROSTER[a.id].hp>b.hp/ROSTER[b.id].hp?0:1;this.events.push({type:'timeout'});return this;
    }
    for(const p of this.fighters){resetTimers(p);p.guard=cap(p.guard+(p.stun===0?.023:.005),0,100);}
    if(a.hp<=0||b.hp<=0){this.phase='ko';this.winner=a.hp>0?0:1;return this;}
    // 攻撃中・やられ中は向きを固定。待機・移動中だけ向きを更新。
    for(let i=0;i<2;i++){const p=this.fighters[i],op=this.fighters[1-i];if(!p.action&&!p.stun)p.facing=op.x>=p.x?1:-1;}
    const inputs=[inputOf(raw1),inputOf(raw2??aiInput(this,b,a,this.level))];
    for(let i=0;i<2;i++){
      const p=this.fighters[i],op=this.fighters[1-i];
      if(p.stop>0){p.stop--;p.prev=inputs[i];p.input=inputs[i];continue;}
      if(p.stun>0){p.stun--;p.prev=inputs[i];p.input=inputs[i];if(!p.stun&&!p.action)p.state=p.y>0?'jump':'idle';p.frame++;continue;}
      this._input(p,op,inputs[i]);
      if(p.input[facingAway(p,p.input)?(p.facing===1?'left':'right'):'__none'])p.guardF++;else p.guardF=0;
      this._act(p,op);
      this._gravity(p);
      if(this.phase!=='fight')break;
    }
    // 同一フレームの攻撃を先に収集してから両者へ適用。行動更新順による先行KOを防ぐ。
    for(const hit of this.pending)this._damage(hit.p,hit.other,hit.m,hit.dist,'strike',true);
    if(this.fighters[0].hp<=0&&this.fighters[1].hp<=0){this.phase='ko';this.winner=-1;}
    if(this.phase==='fight') {
      const dist=b.x-a.x, overlap=2*ARENA.pushRadius-Math.abs(dist);
      if(overlap>0){const dir=dist>=0?1:-1;advanceX(a,-dir*overlap/2);advanceX(b,dir*overlap/2);}
      this._projectiles();
    }
    if(a.hp<=0||b.hp<=0){this.phase='ko';this.winner=a.hp>0?0:b.hp>0?1:-1;}
    return this;
  }
  info(){return {frame:this.frame,time:this.time,phase:this.phase,winner:this.winner,
    players:this.fighters.map(p=>({id:p.id,hp:p.hp,guard:p.guard,super:p.super,state:p.state,x:p.x,y:p.y,ability:p.ability})),
    projectiles:this.projectiles.length};}
}
export function simFight(left,right,frames=12000,level=2){
  const g=new Battle(left,right,level);
  for(let i=0;i<frames&&g.phase==='fight';i++){const p=g.fighters[0],op=g.fighters[1];g.tick(aiInput({...g,frame:g.frame+1},p,op,level));}
  return g;
}
