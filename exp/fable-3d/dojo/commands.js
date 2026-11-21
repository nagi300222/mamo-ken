// 8方向入力履歴から共通コマンドを認識。画面操作/キーボード/CPUから独立。
// 選択時点の向きを基準に 2=下 6=前 4=後ろ とする。
const SHORTCUTS = Object.freeze({
  super: [[2,3,6,2,3,6],[2,6,2,6],[2,3,6,2,6],[2,6,2,3,6]],
  dp: [[6,2,3],[6,2,6],[6,3,6],[3,2,3]],
  qcb: [[2,1,4],[2,4]],
  qcf: [[2,3,6],[2,6]]
});
const WINDOWS = Object.freeze({ super: 58, dp: 32, qcb: 32, qcf: 32 });
export const COMMANDS = Object.freeze([
  {id:'qcf',notation:'236',label:'波動拳',slot:0},
  {id:'dp',notation:'623',label:'昇龍拳',slot:1},
  {id:'qcb',notation:'214',label:'竜巻旋風脚',slot:2},
  {id:'super',notation:'236236',label:'真空波動拳',slot:'super'}
]);
export function directionCode(input={},facing=1) {
  const horizontal=(!!input.right?1:0)-(!!input.left?1:0);
  const vertical=(!!input.down?1:0)-(!!input.up?1:0);
  const x=horizontal*(facing===-1?-1:1);
  return 5+x-vertical*3; // bottom row 1,2,3; middle 4,5,6; top 7,8,9
}
export function pushDirection(history,input,frame,facing=1) {
  const dir=directionCode(input,facing);
  const a=history.filter(e=>frame-e.frame<=62);
  const last=a.at(-1);
  if(!last||last.dir!==dir)a.push({dir,frame});
  return a.slice(-24);
}
// 方向離し(5)を挟んでもOK。斜めは任意。短縮受付・最後の方向から10Fの猶予。
function matches(history,pattern,now,maxAge) {
  const a=history.filter(e=>e.dir!==5&&now-e.frame<=maxAge);
  if(a.length<pattern.length || now-a.at(-1).frame>10)return false;
  let index=a.length-1,latest=now;
  for(let k=pattern.length-1;k>=0;k--) {
    let found=false;
    while(index>=0) {
      const e=a[index--];
      if(latest-e.frame>17)return false;
      if(e.dir===pattern[k]){latest=e.frame;found=true;break;}
    }
    if(!found)return false;
  }
  return true;
}
export function readCommand(history,button,frame,superReady=false) {
  if(button!=='weak'&&button!=='strong')return null;
  for(const kind of ['super','dp','qcb','qcf']){
    if(kind==='super'&&(!superReady||button!=='strong'))continue;
    if(SHORTCUTS[kind].some(p=>matches(history,p,frame,WINDOWS[kind])))return kind;
  }
  return null;
}
