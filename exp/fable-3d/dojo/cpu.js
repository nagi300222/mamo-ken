// スマホ試遊向けCPU v0.5：人間が視認できる動作だけに遅れて反応する。
// 入力履歴/将来のボタン/相手の未公開コマンドは読まない。決定的な行動でテスト可能。
export const CPU_LEVELS=Object.freeze({
  1:Object.freeze({name:'やさしい',reactionFrames:28,guardChance:.20,attackPeriod:102,throwPeriod:240,approach:.63}),
  2:Object.freeze({name:'ふつう',reactionFrames:17,guardChance:.43,attackPeriod:86,throwPeriod:186,approach:.67}),
  3:Object.freeze({name:'つよい',reactionFrames:10,guardChance:.68,attackPeriod:69,throwPeriod:156,approach:.73})
});
const hash=(s='')=>[...s].reduce((v,c)=>((v*31+c.charCodeAt(0))>>>0),17);
export function cpuInput(g,p,op,level=2){
  const cfg=CPU_LEVELS[level]||CPU_LEVELS[2];
  const t=g.frame,dir=op.x>=p.x?'right':'left';
  const back=dir==='right'?'left':'right';
  const distance=Math.abs(op.x-p.x);
  const i={};
  if(p.ko||p.stun>0||p.stop>0||p.action)return i;
  const seed=hash(p.id);
  // 防御は技の予備動作が反応時間ぶん経過した後のみ。
  // 完全ガードにはならず、レベル別に見逃しを残す。
  const visible=op.action&&op.action.frame>=cfg.reactionFrames&&
    op.action.frame<op.action.startup+op.action.active;
  if(visible&&op.action.kind!=='throw'&&op.action.kind!=='clinch'&&
     distance<Math.max(.83,(op.action.reach||.45)+.27)){
    const chance=((seed+op.action.serial*37)%100)/100;
    if(chance<cfg.guardChance){
      i[back]=true;
      // 技の属性を予備動作から読み取れるときだけ、しゃがみガードへ切り替える。
      if(op.action.level==='low')i.down=true;
      return i;
    }
  }
  // 飛び道具は画面内の実体から反応。攻撃のボタン先読みはしない。
  const threat=g.projectiles?.find(b=>b.owner!==p.slot&&
    (b.x-p.x)*b.face<0&&Math.abs(b.x-p.x)<.48);
  if(threat&&level>=2&&((seed+Math.floor(t/30))%100)<cfg.guardChance*100){
    i[back]=true;return i;
  }
  if(distance>cfg.approach){
    i[dir]=true;
    // 少数の遠距離行動のみ。CPUの波動拳連射を避ける。
    if(level>=2&&t%(cfg.attackPeriod*2)===17)i.special1=true;
    return i;
  }
  const beat=cfg.attackPeriod;
  const phase=seed%Math.max(1,Math.floor(beat/4));
  // 間合いを測る時間を残し、コンボ状況を無視した機械的な連打を抑える。
  if(t%beat===(phase+9)%beat)i.weak=true;
  else if(t%(beat+27)===(phase+37)%(beat+27)){
    i.strong=true;
  }else if(t%(beat+56)===(phase+18)%(beat+56)){
    if(p.id==='godan'||p.id==='hakuma'||p.id==='bullet')i.special3=true;
    else i.special2=true;
  }else if(distance<.36&&t%cfg.throwPeriod===(phase+24)%cfg.throwPeriod)i.throw=true;
  if(!i.weak&&!i.strong&&!i.special2&&!i.special3&&!i.throw){
    // 近くで少し間合いを調整。ずっと前進して攻撃だけするCPUにしない。
    if(distance>.42&&(Math.floor(t/45)%3!==0))i[dir]=true;
    else if(distance<.27&&Math.floor(t/62)%4===0)i[back]=true;
  }
  if(level>=3&&distance<.62&&t%430===(phase+11)%430)i.roar=true;
  // 奥義を乱射しない。初心者向けCPUは自動発動しない。
  if(level>=3&&p.super>=100&&t%400===(phase+31)%400)i.super=true;
  return i;
}
