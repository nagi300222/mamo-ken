#!/usr/bin/env python3
"""Non-destructive modular export from original GLBs and the original SDF generator.
No remesh, decimation, UV, skin, original animation, or original asset is changed.
The additional primitive groups and semantic attributes make appearance editable.
"""
from pathlib import Path
import json, struct, sys, hashlib, copy
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools'))
from mamo3d import characters
OUT=Path(__file__).resolve().parents[1]/'assets'
SLOTS=['body','head','ears','hands','feet','tail','accessory']
DT={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def unpack(path):
 raw=path.read_bytes(); n=struct.unpack_from('<I',raw,12)[0]
 j=json.loads(raw[20:20+n]); pos=20+n; m=struct.unpack_from('<I',raw,pos)[0]
 return j,bytearray(raw[pos+8:pos+8+m]),raw

def array(j,b,idx):
 a=j['accessors'][idx];dt=np.dtype(DT[a['componentType']]);nc=NC[a['type']]
 if 'bufferView' in a:
  v=j['bufferViews'][a['bufferView']]
  result=np.ndarray((a['count'],nc),dt,buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dt.itemsize*nc),dt.itemsize)).copy()
 else:result=np.zeros((a['count'],nc),dt)
 if 'sparse' in a:
  s=a['sparse'];ii=s['indices'];iv=j['bufferViews'][ii['bufferView']];vv=s['values'];view=j['bufferViews'][vv['bufferView']]
  indices=np.frombuffer(b,dtype=DT[ii['componentType']],count=s['count'],offset=iv.get('byteOffset',0)+ii.get('byteOffset',0)).copy()
  values=np.frombuffer(b,dtype=dt,count=s['count']*nc,offset=view.get('byteOffset',0)+vv.get('byteOffset',0)).reshape(-1,nc).copy()
  result[indices]=values
 return result

def append(j,b,data,kind='SCALAR',component=5125):
 while len(b)%4:b.append(0)
 raw=np.asarray(data,dtype=DT[component]).tobytes(); vi=len(j['bufferViews']); off=len(b);b.extend(raw)
 j['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(raw)})
 ai=len(j['accessors']); j['accessors'].append({'bufferView':vi,'componentType':component,'count':len(data),'type':kind})
 return ai

def classify(spec,p,faces,material):
 # glTF Y-up -> source generator Blender Z-up coordinates.
 pos=p[:,[0,2,1]]*np.array([1,-1,1])
 prims=[pr for pr in spec.prims if pr.op=='add']
 distances=np.stack([pr.eval(pos) for pr in prims],axis=1)
 groups=np.array([pr.group for pr in prims]); group=groups[np.argmin(distances,axis=1)]
 part=np.zeros(len(p),np.uint8);region=np.zeros(len(p),np.float32)
 for i,g in enumerate(group):
  if g in ['head','cheek','muzzle','chin','nose','brow']:part[i]=1
  elif g=='ear':part[i]=2
  elif g.startswith(('arm','fist','fingers','fclaws')):part[i]=3
  elif g.startswith(('leg','foot','toes','tclaws')):part[i]=4
  elif g=='tail':part[i]=5
  if g in ['muzzle','chin']:region[i]=2
  elif g.startswith(('fist','fingers')):region[i]=3
  elif g.startswith(('foot','toes')):region[i]=4
  elif g=='ear':region[i]=5
  elif g=='tail':region[i]=6
  elif g=='nose' or 'claws' in g:region[i]=8
 # Belly mask follows original procedural generator's anterior ellipse.
 P=spec.P; zt=P.neck_c[2]+P.neck_r[2]*.2; zb=P.belly_c[2]-P.belly_r[2]*.95;zc=(zt+zb)/2
 ellipse=np.sqrt((pos[:,0]/(P.belly_r[0]*P.belly_w))**2+((pos[:,2]-zc)/((zt-zb)/2))**2)
 belly=(part==0)&(ellipse<.87)&(pos[:,1]<P.belly_c[1]-.045)
 region[belly]=1
 if material and material.endswith('_eye'):region[:]=9;part[:]=1
 else:
  # Original body + eyes + cloth were one mesh. Find disconnected pieces, welding
  # only exact position duplicates introduced by UV seams (not neighboring skin).
  _,inv=np.unique(np.round(p,6),axis=0,return_inverse=True)
  parent=np.arange(inv.max()+1)
  def find(a):
   while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
   return a
  for f in inv[faces]:
   a=find(f[0]);b=find(f[1]);c=find(f[2]);parent[b]=a;parent[c]=a
  roots=np.array([find(x) for x in inv]); unique,counts=np.unique(roots,return_counts=True);main=unique[np.argmax(counts)]
  for root in unique:
   if root==main:continue
   ix=np.flatnonzero(roots==root);cen=pos[ix].mean(axis=0)
   # White eye catchlights are immutable and move with the head.
   near_eye=any(np.linalg.norm(cen-np.asarray(ec))<P.eye_r*1.7 for ec in P.eyes)
   if near_eye and len(ix)<220:part[ix]=1;region[ix]=9
   else:part[ix]=6;region[ix]=7
 return part,region

def export(cid):
 src=ROOT/'chars'/cid/(cid+'.glb');j,b,raw=unpack(src);spec=characters.build(cid)
 summary={};new_materials={}
 for mesh in j['meshes']:
  result=[]
  for primitive in mesh['primitives']:
   p=array(j,b,primitive['attributes']['POSITION']);idx=array(j,b,primitive['indices']).ravel().reshape(-1,3)
   mn=j['materials'][primitive.get('material',0)].get('name','')
   part,region=classify(spec,p,idx,mn)
   ri=append(j,b,region,component=5126);pi=append(j,b,part,component=5121)
   # A triangle belongs to the most common vertex part; deterministic tie follows
   # its first vertex. The complete triangle set is preserved exactly once.
   fp=part[idx]; labels=np.array([np.bincount(row,minlength=7).argmax() for row in fp])
   for pn,name in enumerate(SLOTS):
    selected=idx[labels==pn]
    if not len(selected):continue
    pr=copy.deepcopy(primitive);pr['attributes']['_AVATAR_REGION']=ri;pr['attributes']['_AVATAR_PART']=pi
    # Compact each module's vertex data so seven draw groups do not retain
    # seven complete bodies in CPU/GPU memory.
    used,remap=np.unique(selected.ravel(),return_inverse=True)
    for semantic,ai in list(pr['attributes'].items()):
     old=j['accessors'][ai];pr['attributes'][semantic]=append(j,b,array(j,b,ai)[used],old['type'],old['componentType'])
     if old.get('normalized'):j['accessors'][pr['attributes'][semantic]]['normalized']=True
     if semantic=='POSITION':
      vv=array(j,b,pr['attributes'][semantic]);j['accessors'][pr['attributes'][semantic]].update({'min':vv.min(axis=0).tolist(),'max':vv.max(axis=0).tolist()})
    for target in pr.get('targets',[]):
     for semantic,ai in list(target.items()):
      old=j['accessors'][ai];vv=array(j,b,ai)[used];target[semantic]=append(j,b,vv,old['type'],old['componentType'])
      if semantic=='POSITION':j['accessors'][target[semantic]].update({'min':vv.min(axis=0).tolist(),'max':vv.max(axis=0).tolist()})
    pr['indices']=append(j,b,remap)
    key=(primitive.get('material',0),name)
    if key not in new_materials:
     mat=copy.deepcopy(j['materials'][primitive.get('material',0)]);mat['name']='avatar_part_'+name
     mat['extras']={'avatarPart':name,'sourceBase':cid};new_materials[key]=len(j['materials']);j['materials'].append(mat)
    pr['material']=new_materials[key];result.append(pr);summary[name]=summary.get(name,0)+len(selected)
  mesh['primitives']=result
  mesh.setdefault('extras',{}).update({'avatarSource':cid,'avatarVersion':16})
 j['buffers'][0]['byteLength']=len(b)
 payload=json.dumps(j,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4);b.extend(b'\0'*((-len(b))%4))
 final=struct.pack('<III',0x46546c67,2,12+8+len(payload)+8+len(b))+struct.pack('<I4s',len(payload),b'JSON')+payload+struct.pack('<I4s',len(b),b'BIN\0')+b
 path=OUT/(cid+'_parts.glb');path.write_bytes(final)
 def rgb(c):return '#'+''.join(f'{round(v*255):02x}' for v in c)
 C=spec.P.colors
 params={k:getattr(spec.P,k) for k in ['H','head_c','head_r','ear_off','ear_r','fist','foot_len','foot_w','foot_h','tail_base','tail_len','tail_r','tail_n','ankle_z','arm_r']}
 params['wrists']={s:spec.J['wrist.'+s].tolist() for s in 'LR'}
 params['ankles']={s:spec.J['ankle.'+s].tolist() for s in 'LR'}
 params['hands']={s:spec.J['hand_R.'+s].tolist() for s in 'LR'}
 return {'id':cid,'file':path.name,'bytes':len(final),'sha256':hashlib.sha256(final).hexdigest(),'sourceSHA256':hashlib.sha256(raw).hexdigest(),'parts':summary,'parameters':params,'palette':{key:rgb(C.get(src,C['fur'])) for key,src in [('fur','fur'),('belly','belly'),('muzzle','muzzle'),('paw','paw'),('foot','foot'),('ear','ear_in'),('tail','tail'),('accent','cloth')]},'animations':[a['name'] for a in j.get('animations',[])]}
OUT.mkdir(exist_ok=True)
roster=list(characters.ROSTER)
manifest={'schemaVersion':1,'version':'v16-parts-1','generator':'mamo3d/characters.py + original GLB semantic partition','bases':{}}
for cid in roster:
 manifest['bases'][cid]=export(cid); print(cid,manifest['bases'][cid]['parts'],flush=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1)+'\n')
