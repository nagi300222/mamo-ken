import assert from 'node:assert/strict';

// Observe a real tab transition, then wait for its finite animation to finish.
// No screenshot fast-forward, fixed sleep, or runtime CSS override is applied.
export async function inspectEditorConfirmation(page){
 const before=await page.evaluate(()=>{
  const panel=document.getElementById('p4-editor-panel-3');
  return {opacity:getComputedStyle(panel).opacity,animations:panel.getAnimations().map(animation=>({state:animation.playState,currentTime:animation.currentTime,progress:animation.effect.getComputedTiming().progress}))};
 });
 await page.evaluate(async()=>{
  const panel=document.getElementById('p4-editor-panel-3');
  await Promise.all(panel.getAnimations({subtree:true}).filter(animation=>animation.effect?.getTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));
 });
 await page.waitForFunction(()=>Number(getComputedStyle(document.getElementById('p4-editor-panel-3')).opacity)>=.999);
 const settled=await page.evaluate(async()=>{
  const panel=document.getElementById('p4-editor-panel-3'),summary=panel.querySelector('.p4-save-summary'),editor=document.getElementById('editor');
  const opacity=node=>{let value=1;for(let current=node;current;current=current.parentElement)value*=Number(getComputedStyle(current).opacity);return value;};
  const image=getComputedStyle(summary).backgroundImage,url=image.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
  if(!url)throw Error('confirmation paper image is missing');
  const response=await fetch(url);if(!response.ok)throw Error('confirmation paper HTTP '+response.status);
  const svg=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
  const paperFills=[...new Set([...svg.querySelectorAll('[fill]')].map(node=>node.getAttribute('fill')).filter(fill=>/^#[0-9a-f]{6}$/i.test(fill)))];
  const panelColors=getComputedStyle(editor).backgroundImage.match(/rgba?\([^)]+\)/g)??[];
  return {opacity:getComputedStyle(panel).opacity,effectiveOpacity:opacity(panel),ariaBusy:!!panel.closest('[aria-busy="true"]'),inert:!!panel.closest('[inert]'),paperImage:image,paperFills,panelColors,
   text:[...panel.querySelectorAll('.p4-save-title,.p4-save-copy,.p4-save-summary dt,.p4-save-summary dd')].map(node=>({kind:node.matches('dt,dd')?'paper':'panel',element:node.className||node.tagName,text:node.textContent,color:getComputedStyle(node).color,effectiveOpacity:opacity(node),fontSize:getComputedStyle(node).fontSize}))};
 });
 const rgb=value=>{
  if(value.startsWith('#'))return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
  const values=value.match(/[\d.]+/g)?.map(Number);assert.ok(values?.length>=3,'unparsed computed color '+value);return values;
 };
 const luminance=color=>{const c=color.slice(0,3).map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
 const contrast=(first,second)=>{const a=luminance(first),b=luminance(second);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
 const backgrounds={paper:settled.paperFills.map(rgb),panel:settled.panelColors.flatMap(color=>{const c=rgb(color),alpha=c[3]??1;return [0,255].map(under=>c.slice(0,3).map(channel=>channel*alpha+under*(1-alpha)));})};
 assert.ok(backgrounds.paper.length>=2&&backgrounds.panel.length>=2,'actual paper/gradient colors were not observed');
 assert.equal(settled.ariaBusy,false);assert.equal(settled.inert,false);assert.ok(settled.effectiveOpacity>=.999,'confirmation remains faded after animation');
 for(const row of settled.text){
  row.minimumContrast=Math.min(...backgrounds[row.kind].map(background=>contrast(rgb(row.color),background)));
  assert.ok(row.effectiveOpacity>=.999,'text remains faded: '+row.element);assert.ok(row.minimumContrast>=4.5,'settled confirmation contrast below4.5: '+JSON.stringify(row));
 }
 return {before,settled,method:'Computed text colors against actual SVG paper fills and conservatively composited panel-gradient endpoints; no pixel/hardware claim'};
}
