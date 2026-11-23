// P4 profile copy is a qualitative navigation aid, not measured win-rate data.
const PROFILES={
 'モグゾー':['基本の連係と安定した踏み込み','遠くからの差し合い'],
 'ピスケ':['速い移動と蹴りの連係','体力とガードの粘り'],
 'ゴダン':['装甲と重い一撃','速い切り返しと空振り後'],
 'ハクマ':['守りと張り手の押し出し','素早い接近と追いかけ'],
 'チルカ':['身軽さとフェイント','一発の威力と耐久'],
 'タキマル':['接近からの投げ','離れた相手の追走'],
 'ヨミカゲ':['見切りからの反撃','攻撃を押しつける連打'],
 'バレット':['長い尾と木の実の牽制','密着と長い技の空振り'],
 'ダークモグゾー':['速い攻めと暗連の派生','体力と反撃への耐久']
};
const chosen=document.getElementById('chosen-name'),roster=document.getElementById('roster');
if(chosen&&roster){
 const panel=document.createElement('div');panel.className='p4-profile';panel.setAttribute('aria-live','polite');panel.setAttribute('aria-label','選択キャラクターの得意と苦手');
 const strength=document.createElement('span'),weakness=document.createElement('span');strength.dataset.strength='';weakness.dataset.weakness='';
 const sLabel=document.createElement('b'),wLabel=document.createElement('b');sLabel.textContent='得意';wLabel.textContent='苦手';
 const sText=document.createTextNode(''),wText=document.createTextNode('');strength.append(sLabel,sText);weakness.append(wLabel,wText);panel.append(strength,weakness);roster.after(panel);
 const update=()=>{for(const button of roster.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.classList.contains('chosen')));const [s,w]=PROFILES[chosen.textContent]??['自分の間合いを知る','相手の得意な間合い'];sText.textContent=s;wText.textContent=w;};
 new MutationObserver(update).observe(chosen,{childList:true,subtree:true,characterData:true});new MutationObserver(update).observe(roster,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});update();
}
