import { FPS, ARENA, ROSTER, IDS, normalMove, specialMove, ultimateMove, tailTipAt } from './balance.js';
import { pushDirection, readCommand, specialButtonSlot } from './commands.js';
import { cpuInput } from './cpu.js';
import {fighterStyle,isChainNormal,isChainWeak} from './fighter-style.js';
import {normalReachAt,normalHeightAt,normalVerticalContact} from './normal-contact-runtime-v151.js';
import * as NORMAL_ART from './normal-contact-source.js';
import {feedbackForMove} from './fight-feel.js';
import {ACTIVE_P3_SPECIAL_CONTACT_DELIVERY,validateP3SpecialContactDelivery,withP3SpecialContact,specialSurfaceAt,specialSurfaceContact} from './special-contact-runtime-p3.js';
// 設計の正本はバランスデータ。GLB・Three.js・操作DOMには依存しない。
const KEYS=['left','right','up','down','weak','strong','throw','roar','gyuiin','dash','stepForward','stepBack','special','ultimateButton','special1','special2','special3','super'];
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
    hp:r.hp,guard:r.guardMax,super:0,drive:DRIVE.initial,driveDelay:0,state:'idle',reaction:null,landF:0,frame:0,stun:0,stop:0,
    action:null,used:false,spawned:false,ko:false,prev:inputOf({}),input:inputOf({}),
    dirHistory:[],dirFacing:null,dashF:0,dashDir:0,dashRecovery:0,airVX:0,
    comboContact:null,chainWeakCount:0,comboHits:0,lastComboFrame:-9999,bufferedInput:null,
    roarCooldown:0,gyuiinCooldown:0,guardF:0,
    ability:{charge:0,lastCharge:'',iron:0,armor:1,armorCooldown:0,chase:0,chaseCooldown:0,
      pressure:0,just:0,evadeF:0,dark:0,darkUsed:false,darkCooldown:0,feintCount:0,
      gutsProgress:0,lastGuts:'',gutsReady:false,grit:true},
    poison:0,poisonTick:0,attackSerial:0,locomotion:0
  };
}
// CPUは技を見てから遅れて反応する（cpu.js）。
const aiInput=(g,p,op,level)=>cpuInput(g,p,op,level);
function timer(p){
  for(const k of ['chase','pressure','just','dark','chaseCooldown','armorCooldown','evadeF','darkCooldown'])
    p.ability[k]=Math.max(0,p.ability[k]-1);
  p.ability.armor=p.ability.armorCooldown===0?1:0;
  if(!p.action&&p.ability.dark===0&&p.ability.darkCooldown===0)p.ability.darkUsed=false;
  for(const k of ['roarCooldown','gyuiinCooldown'])p[k]=Math.max(0,p[k]-1);
  p.guard=cap(p.guard+(p.stun? .006:.025),0,ROSTER[p.id].guardMax);
  if(p.landF>0)p.landF--;
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
  constructor(left='moguzo',right='godan',level=2,options={}){
    this.frame=0;this.time=FPS*ARENA.roundSeconds;this.level=cap(Number(level)||2,1,3);
    this.fighters=[fighter(left,0),fighter(right,1)];
    this.projectiles=[];this.events=[];this.pending=[];this.winner=null;this.phase='fight';this.seq=0;this.clinch=null;this.throwSequence=null;
    this.tailTipSamples=null;
    // Optional v16 adapters select authored moves and measured avatar surfaces.
    // With no adapter the original nine-fighter Battle path is unchanged.
    this.moveResolver=options.moveResolver??null;
    this.hurtBoundsResolver=options.hurtBoundsResolver??null;
    this.projectileOrigin=options.projectileOrigin??null;
    this.projectileContact=options.projectileContact??null;
    this.customAgain=options.customAgain??null;
    this.specialContactDelivery=options.specialContactDelivery===undefined?ACTIVE_P3_SPECIAL_CONTACT_DELIVERY:
      options.specialContactDelivery&&validateP3SpecialContactDelivery(options.specialContactDelivery);
    // cpu audit callers copy the visible frame with {...game}; keep these known-
    // move predicates on that read-only view as well as the actual game object.
    this.canReachSpecial=this.canReachSpecial.bind(this);
    this.canReachNormal=this.canReachNormal.bind(this);
  }
  canReachSpecial(p,target,index){
    if(!this.specialContactDelivery)return true; // preserve the accepted old policy until adoption
    const id='s'+(index+1);let move=specialMove(p.id,index);
    if(this.moveResolver){move=this.moveResolver(p,move,id);if(!move)return false;}
    move=withP3SpecialContact(p,move,id,this.specialContactDelivery);
    if(!move)return false;
    if(!move.specialContact)return true; // release / paired throw / counter keep their original choices
    return this._knownMoveReaches(p,target,move);
  }
  canReachNormal(p,target,slot='stand_weak'){
    if(!this.specialContactDelivery)return true;
    let move=normalMove(p.id,slot);if(this.moveResolver){move=this.moveResolver(p,move,slot);if(!move)return false;}
    return this._knownMoveReaches(p,target,move);
  }
  _knownMoveReaches(p,target,move){
    // Only own trajectory/travel and the opponent's currently visible position.
    // This does not read target.input, target.prev, commands or future CPU actions.
    const facing=target.x>=p.x?1:-1,hurt=this.hurtBoundsResolver?.(target)??NORMAL_ART.NORMAL_HURT_BOUNDS;
    const crouching=target.state==='crouch'||target.reaction==='guard_crouch_hit'||target.action?.id?.startsWith('crouch_');
    const visibleTarget={id:target.id,x:target.x,y:target.y,state:crouching?'crouch':target.state,input:{down:crouching}};
    for(let frame=move.startup;frame<move.startup+move.active;frame++){
      const attacker={x:cap(p.x+facing*(move.travel??0)*frame/(move.startup+move.active),ARENA.minX,ARENA.maxX),y:p.y,facing,frame};
      if(move.specialContact){if(specialSurfaceContact(attacker,visibleTarget,move,hurt))return true;}
      else if((target.x-attacker.x)*facing>=0&&Math.abs(target.x-attacker.x)<=normalReachAt(move,frame)+.16&&normalVerticalContact(attacker,visibleTarget,move,hurt))return true;
    }
    return false;
  }
  again(){
    if(this.customAgain)return this.customAgain(this);
    const n=new Battle(this.fighters[0].id,this.fighters[1].id,this.level,{specialContactDelivery:this.specialContactDelivery});
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
      for(const p of this.fighters){p.state='clinch_recoil';p.frame=0;p.stun=26;p.stop=0;p.facing=p===a?dir:-dir;}
      this.clinch=null;
      this.events.push({type:'gyuiin_break',x:mid,y:.35});
    }
  }
  _beginThrow(a,t){
    if(this.throwSequence||this.clinch||a.ko||t.ko)return false;
    const mid=cap((a.x+t.x)*.5,ARENA.minX+.35,ARENA.maxX-.35);
    const dir=a.x<=t.x?1:-1;
    a.x=mid-dir*.18;t.x=mid+dir*.18;
    a.facing=dir;t.facing=-dir;
    for(const p of [a,t]){
      p.y=0;p.vy=0;p.action=null;p.stun=0;p.stop=0;p.dashF=0;p.landF=0;p.frame=0;
    }
    a.state='throw_hit';t.state='thrown';
    this.throwSequence={frame:0,total:48,attacker:a.slot};
    this.events.push({type:'throw_pair',slot:a.slot,x:mid,y:.35});
    return true;
  }
  _throwTick(){
    const c=this.throwSequence;if(!c)return;
    c.frame++;
    const attacker=this.fighters[c.attacker],defender=this.fighters[1-c.attacker];
    attacker.state='throw_hit';attacker.frame=c.frame;
    defender.state='thrown';defender.frame=c.frame;
    if(c.frame>=c.total){
      attacker.state='idle';attacker.frame=0;
      defender.state='wakeup';defender.frame=0;defender.stun=40;defender.stop=0;
      this.throwSequence=null;
      this.events.push({type:'throw_finish',slot:attacker.slot,x:attacker.x,y:.3});
    }
  }
  _begin(p,m,id,allowCancel=false){
    if(this.moveResolver){m=this.moveResolver(p,m,id);if(!m)return false;}
    m=withP3SpecialContact(p,m,id,this.specialContactDelivery);
    if(!m)return false;
    if(m.kind==='clinch')return this._startGyuiin(p);
    if(p.ko||p.stun||p.stop||(p.y>.06&&['throw','roar','projectile'].includes(m.kind)))return false;
    if(m.isSuper&&p.super<100)return false;
    if(m.kind==='roar'&&(p.roarCooldown>0||p.drive<DRIVE.roarCost))return false;
    // 技から別技へのキャンセルは暗連に限る。
    const darkFollow=p.id==='dark_moguzo'&&p.ability.dark>0&&id!==p.action?.id&&!m.isSuper;
    if(p.action&&!allowCancel&&!darkFollow)return false;
    if(p.action&&p.action.id===id&&!allowCancel)return false;
    if(m.isSuper)p.super=0;
    if(m.kind==='roar'){p.roarCooldown=96;p.drive-=DRIVE.roarCost;p.driveDelay=DRIVE.regenDelay;}
    if(p.id==='godan'&&m.armor)m={...m,armor:p.ability.armorCooldown===0?1:0,armorUsed:false};
    if(p.id==='hakuma'&&p.ability.iron&&id.startsWith('s')){
      m={...m,damage:Math.round(m.damage*1.15)};p.ability.iron=0;
    }
    // 溜めたチャージは尾薙ぎ（214）MAX版でだけ解放。奥義へは流用しない。
    if(p.id==='bullet'&&m.chargeRelease&&p.ability.charge===3){
      m={...m,damage:Math.round(m.damage*1.24)};
      p.ability.charge=0;p.ability.lastCharge='';
    }
    // ギュイーンは全キャラ同一。タキマルの圧は投げ間合いと微量の威力へ。
    if(p.id==='takimaru'&&m.kind==='throw'&&p.ability.pressure>0){
      m={...m,reach:m.reach+.07,damage:Math.round(m.damage*1.08)};
      p.ability.pressure=0;
    }
    if(p.id==='yomikage'&&p.ability.just>0&&m.kind==='counter'){
      m={...m,startup:Math.max(3,m.startup-2),damage:Math.round(m.damage*1.22),justBoosted:true};p.ability.just=0;
    }
    // 王道型：種類の違う成功から得た根性を次の必殺1回に回す。
    if(p.id==='moguzo'&&p.ability.gutsReady&&id.startsWith('s')){
      m={...m,damage:Math.round(m.damage*1.07)};
      p.ability.gutsReady=false;p.ability.gutsProgress=0;
    }
    const weakCount=isChainWeak(id)?(allowCancel?p.chainWeakCount+1:1):0;
    p.action={...m,id,serial:++this.seq,started:this.frame};
    p.chainWeakCount=weakCount;
    p.comboContact=null;p.bufferedInput=null;
    p.state=m.kind==='roar'?'roar':m.kind==='clinch'?'gyuiin':'attack';
    p.frame=0;p.used=false;p.spawned=false;p.attackSerial++;
    if(p.id==='dark_moguzo')p.ability.dark=0;
    this.events.push({type:'move',slot:p.slot,name:m.name,action:id});
    return true;
  }
  _bufferHitstopInput(p,n){
    // One attack press survives hitstop. Continuous holding is not a new command.
    if(!p.action||!p.comboContact||!isChainNormal(p.action.id))return;
    for(const key of ['special','special1','special2','special3','weak','strong']){
      if(n[key]&&!p.prev[key]){p.bufferedInput={key,at:this.frame,actionFrame:p.frame,raw:n};break;}
    }
  }
  _input(p,other,raw){
    const n=inputOf(raw),edges={};
    for(const k of KEYS)edges[k]=n[k]&&!p.prev[k];
    const buffered=p.bufferedInput;
    p.bufferedInput=null;
    if(buffered&&p.action&&(buffered.actionFrame===undefined?this.frame-buffered.at:p.frame-buffered.actionFrame)<=9){
      edges[buffered.key]=true;
    }
    p.prev=n;p.input=n;
    if(p.ko)return;
    if(p.stop||p.stun)return;
    const buttonSlot=edges.special?specialButtonSlot(n,p.facing):null;
    const wantsRoar=edges.roar||buttonSlot==='roar';
    if(wantsRoar&&p.action&&p.action.kind!=='roar'&&other.action?.kind==='roar'&&p.roarCooldown===0&&p.drive>=DRIVE.roarCost){p.action=null;p.frame=0;}

    // チルカ：同じ予備動作から中止（後ろ）か一拍遅らせる（下）を選べる。
    if(p.id==='chirka'&&p.action?.feintable&&p.frame>=2&&p.frame<p.action.startup){
      if(edges[facingBack(p)]){
        p.action={name:'フェイント',kind:'feint',startup:1,active:1,recovery:16,
          damage:0,reach:0,id:'feint',anim:'sp_feint_claw',serial:++this.seq};
        p.frame=0;p.ability.feintCount++;p.dirHistory=[];p.state='feint';
        this.events.push({type:'feint',slot:p.slot});
        return;
      }
      if(edges.down&&p.action.delayable&&!p.action.delayed){
        p.action={...p.action,startup:p.action.startup+8,recovery:p.action.recovery+2,delayed:true};
        this.events.push({type:'delay',slot:p.slot});
        return;
      }
    }
    // v15.1: finite windows measured from the actual contact, excluding hitstop.
    const current=p.action,contact=p.comboContact;
    const window=current?.cancelWindow?.[contact];
    const contactAge=p.frame-p.comboContactFrame;
    if(current&&isChainNormal(current.id)&&contact&&window&&
       contactAge>=window[0]&&contactAge<=window[1]){
      const permissions=contact==='hit'?current.cancelOnHit:current.cancelOnBlock;
      const source=buffered?.raw||n;
      const specialSlot=edges.special?specialButtonSlot(source,p.facing):
        (['special1','special2','special3'].find(key=>edges[key])||'').replace('special','s');
      if(/^s[123]$/.test(specialSlot)&&permissions.includes(specialSlot)){
        if(this._begin(p,specialMove(p.id,+specialSlot.slice(1)-1),specialSlot,true)){
          this.events.push({type:'cancel',slot:p.slot,from:current.id,to:specialSlot,contact,contactAge});
          return;
        }
      }
      const target=edges.strong?'heavy':edges.weak?'weak':null;
      if(target&&permissions.includes(target)&&isChainWeak(current.id)&&
          (target!=='weak'||p.chainWeakCount<fighterStyle(p.id).weakChainMax)){
        const id=current.id.split('_')[0]+'_'+target;
        if(this._begin(p,normalMove(p.id,id),id,true)){
          this.events.push({type:'cancel',slot:p.slot,from:current.id,to:id,contact,contactAge});
          return;
        }
      }
    }
    // Original unique chase / dark-chain rules stay independent from shared normal cancels.
    if(p.action){
      if(p.id==='pisuke'&&p.ability.chase>0&&p.ability.chaseCooldown===0&&edges.dash){
        p.action=null;p.frame=0;p.ability.chase=0;p.ability.chaseCooldown=52;
        const dir=n.left?-1:n.right?1:p.facing;
        moveX(p,dir*ROSTER[p.id].dash);
        this.events.push({type:'chase',slot:p.slot});
      } else if(p.id==='dark_moguzo'&&p.ability.dark>0&&!p.ability.darkUsed&&(edges.weak||edges.strong)){
        const cmd=readCommand(p.dirHistory,edges.strong?'strong':'weak',this.frame,false);
        const idx={qcf:0,dp:1,qcb:2}[cmd];
        if(idx!==undefined){
          const nextId='s'+(idx+1);
          if(nextId!==p.action.id){
            const next={...specialMove(p.id,idx)};
            next.damage=Math.round(next.damage*.72);
            if(this._begin(p,next,nextId)){
              p.ability.darkUsed=true;p.ability.dark=0;p.ability.darkCooldown=50;
              this.events.push({type:'dark_chain',slot:p.slot});
            }
          }
        }
      }
      return;
    }
    if(p.dashF>0){
      const feel=fighterStyle(p.id);
      moveX(p,p.dashDir*ROSTER[p.id].dash/(feel.dashFrames+1));
      p.dashF--;p.state='dash';p.frame++;
      if(!p.dashF)p.dashRecovery=feel.dashRecovery;
      return;
    }
    if(p.dashRecovery>0){p.dashRecovery--;return;}
    // v0.7: dedicated super has priority over special; no normal attack fallback if meter is insufficient.
    if(edges.ultimateButton){this._begin(p,ultimateMove(p.id),'ultimate');return;}
    if(wantsRoar){this._begin(p,ROAR,'roar');return;}
    if(buttonSlot){
      const index={s1:0,s2:1,s3:2}[buttonSlot];
      this._begin(p,specialMove(p.id,index),buttonSlot);return;
    }
    if(edges.throw){this._begin(p,GRAB,'throw');return;}
    // CPU/legacy keyboard actions and classic motion-command tests remain supported.
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
    if((edges.dash||edges.stepForward||edges.stepBack)&&p.y===0){
      // 専用ボタンの「前後」は画面左右ではなく、今向いている相手を基準にする。
      // スティックの向きに関係なく、後ステップは相手から離れる。
      p.dashDir=edges.stepBack?-p.facing:edges.stepForward?p.facing:n.left?-1:n.right?1:p.facing;
      p.dashF=fighterStyle(p.id).dashFrames;
      // ヨミカゲ：相手の動作を見切った瞬間に「外へ」ステップできれば返し窓。
      const threat=other.action;
      const safeWindow=threat&&other.frame>=Math.max(0,threat.startup-5)&&
        other.frame<=threat.startup+threat.active&&
        Math.abs(other.x-p.x)<(threat.reach||.47)+.18;
      if(p.id==='yomikage'&&safeWindow&&
         p.dashDir===(other.x>p.x?-1:1)){
        p.ability.just=43;p.ability.evadeF=7;
        this.events.push({type:'just_step',slot:p.slot});
      }
      moveX(p,p.dashDir*ROSTER[p.id].dash/(fighterStyle(p.id).dashFrames+1));
      p.state='dash';p.frame=0;p.locomotion++;return;
    }
    if(edges.up&&p.y===0&&!n.down){
      p.vy=ROSTER[p.id].jump;p.y=.006;p.airVX=0;
      p.state='jump';p.frame=0;p.locomotion++;return;
    }
    const dir=n.right?1:n.left?-1:0;
    const feel=fighterStyle(p.id);
    if(p.y>0){
      const target=dir&&!n.down?dir*feel.airSpeed:0;
      const delta=target-p.airVX;
      p.airVX+=Math.max(-feel.airAccel,Math.min(feel.airAccel,delta));
      if(!dir||n.down)p.airVX*=feel.airFriction;
      moveX(p,p.airVX);p.state='jump';
    }else if(dir&&!n.down){
      const rr=ROSTER[p.id],back=dir!==p.facing;
      moveX(p,dir*(back?rr.back:rr.walk));
      p.state=back?'walk_b':'walk_f';
    }else p.state=n.down?'crouch':'idle';
  }
  _guarding(t,m){
    if(['throw','clinch'].includes(m.kind)||t.y>.07||t.action||(t.stun&&t.state!=='block'))return false;
    const back=t.input[facingBack(t)];
    return back&&(m.level==='low'?t.input.down:!['overhead','air'].includes(m.level)||!t.input.down);
  }
  _absorbing(t,m){
    if(!t.action)return null;
    const c=t.action.kind;
    if(c==='roar'&&t.frame>=1&&t.frame<=t.action.startup+t.action.active){
      if(m.kind!=='roar'&&m.kind!=='throw'&&m.kind!=='clinch')return 'roar';
    }
    if(t.id==='godan'&&t.action.armor&&!t.action.armorUsed&&
      t.frame>=6&&t.frame<t.action.startup+t.action.active&&
      !['throw','clinch','roar'].includes(m.kind))return 'godan';
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
    // 正解ステップの短い回避中は打撃をかわす。投げ/咆哮は対象外。
    if(t.id==='yomikage'&&t.ability.evadeF>0&&
       !['throw','roar','clinch'].includes(m.kind)){
      this.events.push({type:'just_evade',slot:t.slot,x:t.x,y:t.y+.33});
      return;
    }
    const guard=this._guarding(t,m);
    const specialSurface=m.specialContact&&specialSurfaceAt(m,a.frame);
    const point=m.contactPoint??(specialSurface?{
      x:a.x+a.facing*specialSurface.reach,y:a.y+specialSurface.height,space:'authored-special-surface'
    }:m.normalVersion?{
      x:a.x+a.facing*normalReachAt(m,a.frame),y:a.y+normalHeightAt(m,a.frame),space:'authored-strike-surface'
    }:{x:t.x,y:t.y+.32,space:'target-center-fallback'});
    const feedback=feedbackForMove(a,m,guard?'guard':'hit',point);
    let dmg=m.damage;
    const links=!guard&&a.comboHits>0&&t.comboOwner===a.slot&&t.state==='hit'&&t.stun>0;
    if(links)dmg=Math.max(1,Math.round(dmg*Math.max(.60,1-.10*a.comboHits)));
    if(a.id==='moguzo'&&a.hp<=ROSTER.moguzo.hp*.30)dmg=Math.round(dmg*1.06);
    // ダークモグゾーは高火力常時強化ではなく、低耐久と技派生で勝つ。
    if(guard){
      t.dashF=0;t.guard=cap(t.guard-Math.max(5,dmg*(m.kind==='roar'?.37:.16)),0,ROSTER[t.id].guardMax);
      t.stun=t.guard<=0?26:(m.blockstun??Math.max(8,Math.round(dmg*(m.kind==='roar'?.17:.08))));
      t.comboOwner=null;
      t.state='block';t.reaction=m.kind==='roar'?'guard_impact':t.input.down?'guard_crouch_hit':'guard_hit';t.frame=0;
      if(t.id==='hakuma'&&!['roar','throw','clinch'].includes(m.kind))t.ability.iron=1;
      if(t.id==='bullet'&&t.ability.lastCharge!=='guard'){
        t.ability.charge=Math.min(3,t.ability.charge+1);t.ability.lastCharge='guard';
        this.events.push({type:'charge',slot:t.slot,value:t.ability.charge});
      }
      if(a.id==='takimaru'&&['strike','dash','anti','tail'].includes(m.kind))a.ability.pressure=36;
      this.events.push({type:'block',slot:t.slot,attacker:a.slot,x:t.x,y:t.y+.35,damage:0,...(feedback?{feedback}:{})});
    }else{
      const absorb=this._absorbing(t,m);
      if(absorb==='roar'){
        a.stop=Math.max(a.stop,4);
        this.events.push({type:'roar_absorb',slot:t.slot,x:t.x,y:t.y+.38});return;
      }
      if(t.id==='yomikage'&&t.action?.kind==='counter'&&active(t)&&
          !['roar','clinch','throw'].includes(m.kind)){
        const counterMove=t.action;
        const counterDamage=t.action.justBoosted?t.action.damage:Math.round(t.action.damage*.63);
        a.stun=t.action.justBoosted?24:16;a.hp=Math.max(0,a.hp-counterDamage);
        t.action=null;t.state='idle';
        const response=feedbackForMove(t,counterMove,'hit',{x:a.x,y:a.y+.32,space:'counter-response-fallback'});
        if(response)response.stopFrames=0; // keep the existing counter response clock
        this.events.push({type:'counter',slot:t.slot,x:t.x,y:t.y+.34,damage:counterDamage,...(response?{feedback:response}:{})});
        if(a.hp===0){a.ko=true;a.state='ko';this.phase='ko';this.winner=t.slot;}
        return;
      }
      if(absorb==='godan'){
          dmg=Math.round(dmg*.70);
          t.action.armorUsed=true;t.ability.armorCooldown=240;t.ability.armor=0;
          this.events.push({type:'armor',slot:t.slot});
        }
      else{
        t.stun=m.kind==='clinch'?36:(m.hitstun??Math.max(12,Math.round(m.damage*.16)));
        t.comboOwner=a.slot;
        t.action=null;t.dashF=0;t.state='hit';t.reaction=m.kind==='roar'?'roar_hit':m.damage>=95?'hurt_heavy':'hurt_light';t.frame=0;
      }
      t.hp=Math.max(0,t.hp-dmg);t.guard=cap(t.guard+2,0,ROSTER[t.id].guardMax);t.ability.iron=0;
      if(t.id==='moguzo'&&t.hp===0&&t.ability.grit){t.hp=1;t.ability.grit=false;this.events.push({type:'grit',slot:t.slot});}
      if(a.id==='pisuke'&&/^(stand|crouch)_/.test(m.id||'')&&a.ability.chaseCooldown===0)
        a.ability.chase=18;
      if(a.id==='takimaru'&&['strike','dash','anti','tail'].includes(m.kind))a.ability.pressure=34;
      if(a.id==='moguzo'&&!m.isSuper&&!['roar','clinch'].includes(m.kind)){
        const category=m.kind==='throw'?'throw':m.kind==='projectile'?'projectile':
          m.level==='low'?'low':m.kind==='anti'?'anti':m.id?.startsWith('s')?'special':'strike';
        if(category!==a.ability.lastGuts){
          a.ability.lastGuts=category;
          a.ability.gutsProgress=Math.min(2,a.ability.gutsProgress+1);
          if(a.ability.gutsProgress===2)a.ability.gutsReady=true;
        }
      }
      if(a.id==='bullet'&&!m.isSuper&&!['roar','clinch'].includes(m.kind)){
        const category=m.kind==='projectile'?'projectile':m.kind==='throw'?'throw':
          m.kind==='tail'?'tail':m.id?.startsWith('s')?'special':m.level==='low'?'low':'normal';
        if(category!==a.ability.lastCharge){
          a.ability.charge=Math.min(3,a.ability.charge+1);
          a.ability.lastCharge=category;
          this.events.push({type:'charge',slot:a.slot,value:a.ability.charge});
        }
      }
      if(a.id==='dark_moguzo'&&!a.ability.darkUsed&&
         ((/^s[123]$/.test(m.id||'')&&source==='strike')||
          (m.kind==='projectile'&&a.action?.id==='s1'))){
        a.ability.dark=18;
      }
      // Publish combo reads from real contacts only. HP is still modified once above.
      a.comboHits=links?a.comboHits+1:1;a.lastComboFrame=this.frame;
      if(a.comboHits>=2)this.events.push({type:'combo',slot:a.slot,hits:a.comboHits,damage:dmg});
      this.events.push({type:m.kind==='clinch'?'gyuiin_hit':'hit',slot:t.slot,attacker:a.slot,comboHits:a.comboHits,x:t.x,y:t.y+.32,damage:dmg,...(feedback?{feedback}:{})});
      // Presentation-only signal: emitted ONLY after a real unguarded, non-countered super hit.
      // The cinematic consumes this event; Battle's HP, frames, damage and KO logic remain the truth.
      if(m.isSuper && dmg>0)this.events.push({
        type:'ultimate_hit',slot:a.slot,target:t.slot,
        x:t.x,y:t.y+.32,damage:dmg,move:m.name
      });
      if(m.kind==='clinch'){a.stop=Math.max(a.stop,15);t.stop=Math.max(t.stop,15);}
      if(m.kind==='roar'){t.stun=Math.max(t.stun,23);t.reaction='roar_hit';this.events.push({type:'roar_hit',slot:a.slot,x:t.x,y:t.y+.35});}
    }
    // A normal may chain only after a real guarded or landed contact.
    if(a.action?.serial===m.serial && isChainNormal(m.id)){
      a.comboContact=guard?'block':'hit';
      a.comboContactFrame=a.frame;
    }
    a.super=cap(a.super+(guard?5:Math.round(dmg*.19)),0,100);
    t.super=cap(t.super+(guard?5:Math.round(dmg*.09)),0,100);
    if(feedback&&m.kind==='throw')feedback.stopFrames=t.hp>0?0:6;
    const impactStop=feedback?.stopFrames??(guard?3:6);
    a.stop=Math.max(a.stop,impactStop);
    t.stop=Math.max(t.stop,impactStop);
    moveX(t,a.facing*(guard?(m.blockPushback??.05):m.kind==='roar'?.16:(m.knockback??.085)));
    if(!guard&&m.kind==='throw'&&t.hp>0)this._beginThrow(a,t);
    if(t.hp<=0){t.ko=true;t.state='ko';this.phase='ko';this.winner=a.slot;this.events.push({type:'ko',slot:a.slot});}
  }
  _contact(a,t,m){
    const dist=Math.abs(t.x-a.x);
    if(m.normalVersion&&(t.x-a.x)*a.facing<0)return false;
    if(m.kind==='clinch')return dist<=.83&&Math.abs(a.y-t.y)<1.25;
    if(m.kind==='throw')return a.y<.09&&t.y<.10&&dist<m.reach+.12;
    if(m.specialContact)return specialSurfaceContact(a,t,m,this.hurtBoundsResolver?.(t)??NORMAL_ART.NORMAL_HURT_BOUNDS);
    if(m.kind==='tail'){
      const tip=this._tailAt(a.frame);
      return dist>=m.minReach&&tip>0&&dist<=tip+.16&&Math.abs(t.y-a.y)<.43;
    }
    if(m.kind==='anti')return dist<(m.reach||.4)+.16&&t.y<1.5;
    if(m.normalVersion)return dist<=normalReachAt(m,a.frame)+.16&&
      normalVerticalContact(a,t,m,this.hurtBoundsResolver?.(t)??NORMAL_ART.NORMAL_HURT_BOUNDS);
    if(a.y<.12&&t.y>.50)return false;
    if(a.y>.28&&t.y<.1&&a.y>.7)return false;
    return dist<=(m.reach||.5)+.16&&Math.abs(a.y-t.y)<.58;
  }
  _act(p,op){
    const m=p.action;if(!m)return;
    p.frame++;
    if(p.frame===m.startup){
      const feedback=feedbackForMove(p,m,'swing');
      if(feedback)this.events.push({type:'combat_feedback',slot:p.slot,feedback});
    }
    if(m.travel&&p.frame<=m.startup+m.active)moveX(p,p.facing*m.travel/(m.startup+m.active));
    if(m.kind==='clinch'){
      if(active(p)&&this._contact(p,op,m))this._clinchPair(p,op);
      else if(p.frame>=total(m)){p.action=null;p.frame=0;p.state='idle';this.events.push({type:'gyuiin_whiff',slot:p.slot});}
      return;
    }
    if(m.kind==='projectile'&&!p.spawned&&p.frame===m.startup){
      const origin=this.projectileOrigin?.(p,m)??m.projectileSocket??{forward:.30,height:.30};
      p.spawned=true;this.projectiles.push({id:++this.seq,owner:p.slot,x:p.x+p.facing*origin.forward,y:p.y+origin.height,
        face:p.facing,speed:m.speed||.045,life:m.life||75,damage:m.damage,poison:m.poison||0,
        effect:m.effect||'earth',level:m.level||'mid',sourceCharacterId:m.sourceCharacterId??p.id,sourceMoveId:m.sourceMoveId??m.id,
        ...(m.customRef?{customRef:m.customRef}:{} )});
      this.events.push({type:'projectile',slot:p.slot});
    }
    if(active(p)&&!p.used&&!['projectile','feint','counter'].includes(m.kind)&&this._contact(p,op,m)){
      p.used=true;this.pending.push({p,op,m,d:Math.abs(p.x-op.x)});
    }
    if(p.frame===m.startup+m.active&&!p.used&&m.kind!=='projectile'){
      const feedback=feedbackForMove(p,m,'whiff');
      if(feedback)this.events.push({type:'combat_feedback',slot:p.slot,feedback});
    }
    if(p.frame>=total(m)){
      p.action=null;p.frame=0;p.chainWeakCount=0;p.comboContact=null;p.bufferedInput=null;
      p.state=p.y>.02?'jump':'idle';
    }
  }
  _roarErase(p,b){
    if(p.action?.kind!=='roar')return false;
    if(p.frame<1||p.frame>p.action.startup+p.action.active)return false;
    return b.owner!==p.slot && (b.x-p.x)*p.facing>=-.12 && (b.x-p.x)*p.facing<.86 && Math.abs((b.y-.30)-p.y)<.65;
  }
  _projectiles(){
    for(const b of this.projectiles){
      b.x+=b.speed*b.face;b.life--;
      if(b.life<=0||Math.abs(b.x)>ARENA.maxX+.3){
        const owner=this.fighters[b.owner],feedback=feedbackForMove(owner,{id:b.sourceMoveId,kind:'projectile',sourceCharacterId:b.sourceCharacterId},'whiff');
        if(feedback)this.events.push({type:'combat_feedback',slot:b.owner,feedback});
        b.life=0;continue;
      }
      for(const t of this.fighters)if(this._roarErase(t,b) || (b.owner!==t.slot&&t.action?.kind==='clinch'&&Math.abs(b.x-t.x)<.65&&Math.abs((b.y-.30)-t.y)<.50)){
        b.life=0;this.events.push({type:t.action?.kind==='clinch'?'gyuiin_armor':'roar_erase',slot:t.slot,x:b.x,y:b.y});break;
      }
      if(b.life<=0)continue;
      const t=this.fighters[1-b.owner],a=this.fighters[b.owner];
      const verticalContact=this.projectileContact?.(b,t)??Math.abs(t.y-(b.y-.3))<.50;
      if(!t.ko&&Math.abs(b.x-t.x)<.23&&verticalContact){
        b.life=0;this._damage(a,t,{name:'飛び道具',id:'projectile',kind:'projectile',damage:b.damage,level:b.level,poison:b.poison,
          sourceCharacterId:b.sourceCharacterId,sourceMoveId:b.sourceMoveId,contactPoint:{x:b.x,y:b.y,space:'projectile-contact'}},Math.abs(b.x-t.x),'projectile');
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
      if(p.y===0){p.vy=0;p.airVX=0;p.landF=12;if(!p.action&&!p.stun)p.state='idle';}
    }
  }
  tick(raw1={},raw2=null){
    if(this.phase!=='fight')return this;
    this.frame++;this.pending=[];this.events=[];
    if(this.clinch){
      this.fighters[0].prev=inputOf(raw1);this.fighters[1].prev=inputOf(raw2??{});
      this._clinchTick();return this;
    }
    if(this.throwSequence){
      this.fighters[0].prev=inputOf(raw1);this.fighters[1].prev=inputOf(raw2??{});
      this._throwTick();return this;
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
      if(p.stop>0){
        this._bufferHitstopInput(p,raw[i]);
        p.stop--;p.input=raw[i];p.prev=raw[i];continue;
      }
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
    if(this.throwSequence)return this;
    if(this.phase==='fight'){
      // 高く跳んだ相手の上を横切るときは横方向の押し合いを解除。
      const sep=b.x-a.x,overlap=2*ARENA.pushRadius-Math.abs(sep);
      if(overlap>0&&Math.abs(a.y-b.y)<.38){
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
