export const SAVE_KEYS=Object.freeze(['mamoken.story.v16.1','mamoken.survival.best.v1']);
const PREFIX='mamoken.native.backup.v1.';
export function validSaveValue(key,value){
 if(typeof value!=='string'||value.length>100000)return false;
 if(key==='mamoken.survival.best.v1')return /^\d+$/.test(value)&&Number.isSafeInteger(Number(value));
 if(key==='mamoken.story.v16.1'){
  try{const data=JSON.parse(value);return data.version===1&&data.avatar&&typeof data.avatar==='object'&&data.progress?.version===1;}catch{return false;}
 }
 return false;
}
// Keep the existing synchronous game storage API. Native Preferences is an
// additional durable copy: never replace an existing local record on startup.
export function createSaveMirror({storage,preferences,onWarning=()=>{}}){
 let queue=Promise.resolve(),ready=false;const last=new Map(),restorers=[];
 const enqueue=task=>{queue=queue.then(task).catch(error=>onWarning('ネイティブ保存の複製に失敗: '+error.message));return queue;};
 function remember(key,value){
  key=String(key);if(!SAVE_KEYS.includes(key))return queue;
  if(value!==null){value=String(value);if(!validSaveValue(key,value))return queue;}
  if(last.get(key)===value)return queue;last.set(key,value);
  return enqueue(async()=>{
   try{if(value===null)await preferences.remove({key:PREFIX+key});else await preferences.set({key:PREFIX+key,value});}
   catch(error){if(last.get(key)===value)last.delete(key);throw error;}
  });
 }
 async function restore(){
  for(const key of SAVE_KEYS){
   try{
    const local=storage.getItem(key);
    if(local!==null){if(validSaveValue(key,local))remember(key,local);continue;}
    const {value}=await preferences.get({key:PREFIX+key});
    if(value!==null&&validSaveValue(key,value)){storage.setItem(key,value);last.set(key,value);}
   }catch(error){onWarning('保存の復元に失敗: '+error.message);}
  }
  ready=true;
 }
 function install(){
  const prototype=Object.getPrototypeOf(storage);
  for(const name of ['setItem','removeItem','clear']){
   const descriptor=Object.getOwnPropertyDescriptor(prototype,name),original=prototype[name];
   if(typeof original!=='function')continue;
   const replacement=function(...args){
    const result=original.apply(this,args);
    if(this===storage&&ready){
     if(name==='setItem')remember(args[0],args[1]);
     else if(name==='removeItem')remember(args[0],null);
     else for(const key of SAVE_KEYS)remember(key,null);
    }
    return result;
   };
   try{
    Object.defineProperty(prototype,name,{...descriptor,value:replacement});
    restorers.push(()=>{if(prototype[name]===replacement){if(descriptor)Object.defineProperty(prototype,name,descriptor);else delete prototype[name];}});
   }catch(error){onWarning('保存通知は定期複製へ切替: '+error.message);}
  }
 }
 async function flush(){
  if(ready)for(const key of SAVE_KEYS){try{remember(key,storage.getItem(key));}catch(error){onWarning(error.message);}}
  await queue;
 }
 return {restore,install,flush,dispose(){for(const restore of restorers.reverse())restore();},get ready(){return ready;}};
}
