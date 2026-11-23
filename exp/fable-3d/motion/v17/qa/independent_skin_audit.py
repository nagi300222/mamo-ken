"""Independent read-only glTF CPU skin audit. Does not import Blender/generator.
The output is mathematical skin evaluation, not WebGL or iPhone certification.
python independent_skin_audit.py --out /tmp/p3-independent-skin.json
"""
from pathlib import Path
import argparse,json,struct,re
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
V17=ROOT/'motion/v17'
DIMS={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
TYPES={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
def glb(path):
 b=path.read_bytes();assert b[:4]==b'glTF' and struct.unpack_from('<I',b,4)[0]==2
 size=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+size]);return d,b[28+size:]
def acc(g,i):
 d,bin=g;a=d['accessors'][i];dim=DIMS[a['type']];dtype=np.dtype(TYPES[a['componentType']])
 if 'bufferView'in a:
  v=d['bufferViews'][a['bufferView']];offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',dim*dtype.itemsize)
  x=np.ndarray((a['count'],dim),dtype=dtype,buffer=bin,offset=offset,strides=(stride,dtype.itemsize)).astype(float)
 else:x=np.zeros((a['count'],dim))
 if 'sparse'in a:
  sparse=a['sparse'];idx=sparse['indices'];values=sparse['values'];iv=d['bufferViews'][idx['bufferView']];vv=d['bufferViews'][values['bufferView']]
  indices=np.frombuffer(bin,dtype=TYPES[idx['componentType']],count=sparse['count'],offset=iv.get('byteOffset',0)+idx.get('byteOffset',0))
  points=np.frombuffer(bin,dtype=dtype,count=sparse['count']*dim,offset=vv.get('byteOffset',0)+values.get('byteOffset',0)).reshape(-1,dim)
  x[indices]=points
 if a.get('normalized') and a['componentType']!=5126:x/=np.iinfo(dtype).max
 return x

def compose(t,q,s):
 x,y,z,w=q;m=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),t[0]],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),t[1]],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y),t[2]],[0,0,0,1.]])
 m[:3,:3]*=np.array(s);return m

def slerp(a,b,u):
 d=float(a@b)
 if d<0:b=-b;d=-d
 if d>.9995:q=a+(b-a)*u;return q/np.linalg.norm(q)
 theta=np.arccos(np.clip(d,-1,1));return (np.sin((1-u)*theta)*a+np.sin(u*theta)*b)/np.sin(theta)

def part(name):
 n=re.sub('[^a-z0-9]','',name.lower());side='L'if n.endswith('l')else'R'if n.endswith('r')else''
 if re.search('paw|hand|wrist|elbow|shoulder|clav|forearm|upperarm|arm',n):return'arm'+side
 if re.search('foot|shin|thigh|knee|ankle|leg|toe',n):return'leg'+side
 if'tail'in n:return'tail'
 if re.search('head|jaw|ear|neck|snout|nose|beak',n):return'head'
 return'body'

class Skin:
 def __init__(self,id,pack="normals"):
  self.id=id;self.g=glb(ROOT/f'chars/{id}/{id}.glb');d,_=self.g;self.nodes=d['nodes'];self.by={n.get('name'):i for i,n in enumerate(self.nodes)};self.parent={c:i for i,n in enumerate(self.nodes)for c in n.get('children',[])}
  self.prims=[]
  for i,n in enumerate(self.nodes):
   if'skin'not in n:continue
   skin=d['skins'][n['skin']];joints=skin['joints'];names=[self.nodes[j].get('name','')for j in joints];inv=acc(self.g,skin['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1)
   for p in d['meshes'][n['mesh']]['primitives']:
    a=p['attributes'];positions=acc(self.g,a['POSITION']);indices=acc(self.g,a['JOINTS_0']).astype(int);weights=acc(self.g,a['WEIGHTS_0']);dominant=indices[np.arange(len(indices)),np.argmax(weights,axis=1)];groups=np.array([part(names[j])for j in dominant]);foot=np.array([bool(re.search('foot|toe',names[j].lower()))for j in dominant]);morph=[acc(self.g,t['POSITION']) if 'POSITION'in t else np.zeros_like(positions)for t in p.get('targets',[])]
    self.prims.append(dict(pos=positions,indices=indices,weights=weights,groups=groups,foot=foot,morph=morph,joints=joints,inv=inv))
  self.pack=glb(V17/f'{id}_{pack}_v17.glb');pdoc,_=self.pack;self.clips={}
  for clip in pdoc['animations']:
   channels=[]
   for c in clip['channels']:
    sampler=clip['samplers'][c['sampler']];times=acc(self.pack,sampler['input']).ravel();values=acc(self.pack,sampler['output']);path=c['target']['path'];name=pdoc['nodes'][c['target']['node']].get('name')
    if path=='weights':values=values.reshape(len(times),-1)
    channels.append((name,path,times,values,sampler.get('interpolation','LINEAR')))
   self.clips[clip['name']]=channels
 def pose(self,name,time):
  pose=[dict(t=np.array(n.get('translation',[0,0,0]),float),q=np.array(n.get('rotation',[0,0,0,1]),float),s=np.array(n.get('scale',[1,1,1]),float))for n in self.nodes];morph=None
  for node,path,times,values,interp in self.clips[name]:
   assert interp in ['LINEAR','STEP'],interp
   i=min(len(times)-2,max(0,int(np.searchsorted(times,time,side='right')-1))) if len(times)>1 else 0;j=min(i+1,len(times)-1);u=0 if interp=='STEP'or times[j]==times[i]else np.clip((time-times[i])/(times[j]-times[i]),0,1)
   value=slerp(values[i],values[j],u)if path=='rotation'else values[i]+(values[j]-values[i])*u
   if path=='weights':morph=value
   elif node in self.by:pose[self.by[node]][{'translation':'t','rotation':'q','scale':'s'}[path]]=value
  world=[None]*len(pose)
  def matrix(i):
   if world[i]is None:
    n=self.nodes[i];local=np.array(n['matrix']).reshape(4,4).T if 'matrix'in n else compose(pose[i]['t'],pose[i]['q'],pose[i]['s'])
    world[i]=matrix(self.parent[i])@local if i in self.parent else local
   return world[i]
  for i in range(len(pose)):matrix(i)
  return world,morph
 def skin(self,name,time,only_foot=False):
  world,morph=self.pose(name,time);out=[]
  for p in self.prims:
   mask=p['foot']if only_foot else np.ones(len(p['pos']),bool);pos=p['pos'][mask].copy();weights=p['weights'][mask];indices=p['indices'][mask]
   if not len(pos):continue
   if morph is not None:
    for w,target in zip(morph,p['morph']):pos+=w*target[mask]
   bind=np.column_stack([pos,np.ones(len(pos))]);transforms=np.array([world[j]@p['inv'][k]for k,j in enumerate(p['joints'])]);points=np.zeros((len(pos),4))
   for k in range(4):points+=weights[:,k,None]*np.einsum('nij,nj->ni',transforms[indices[:,k]],bind)
   out.append((points[:,:3],p['groups'][mask]))
  return out

def audit():
 metadata=json.loads((V17/'normals_v17.json').read_text());contacts=json.loads((V17/'normal_contacts_v17.json').read_text());report=[]
 for id,moves in metadata['characters'].items():
  model=Skin(id)
  for slot,m in moves.items():
   reference=contacts[id][slot];row=dict(id=id,slot=slot,clip=m['clip'],attackLimb=m['attack_limb'],attackPart=reference['attackPart'],clock=dict(frames=m['frames'],contactFrame=m['contact_frame']),surface=[])
   for phase in [0,.5,1]:
    t=(reference['contact']+(reference['contactEnd']-reference['contact'])*phase)*m['duration_sec'];data=model.skin(m['clip'],t);surfaces=[];groups={}
    for p,g in data:
     for group in set(g):
      candidates=p[g==group];v=candidates[np.argmax(candidates[:,2])]
      if group not in groups or v[2]>groups[group][2]:groups[group]=v
    actual=groups[reference['attackPart']];front=max(groups,key=lambda x:groups[x][2]);expected=reference['activeReach'][int(phase*2)]
    row['surface'].append(dict(phase=phase,reach=round(float(actual[2]),5),height=round(float(actual[1]),5),expectedReach=expected['reach'],expectedHeight=expected['height'],frontPart=front,frontGap=round(float(groups[front][2]-actual[2]),5),reachError=round(float(actual[2]-expected['reach']),5),heightError=round(float(actual[1]-expected['height']),5)))
   if not slot.startswith('air_'):
    initial=min(float(p[:,1].min())for p,g in model.skin(m['clip'],0,True));minimum=initial;maximumGroundMin=initial;at=0
    for f in range(m['frames']+1):
     value=min(float(p[:,1].min())for p,g in model.skin(m['clip'],f/60,True))
     if value<minimum:minimum=value;at=f
     maximumGroundMin=max(maximumGroundMin,value)
    row['footSurface']=dict(initialMin=round(initial,5),absoluteMin=round(minimum,5),relativeSink=round(minimum-initial,5),maxBothFeetAbove=round(maximumGroundMin,5),minimumAtFrame=at)
   report.append(row)
  print(id,'CPU skin audited',flush=True)
 return dict(source='independent-glTF-CPU-linear-blend-skin',revision='7f79ea252d6f5c08de892bd11c0e85845a91af14',claims=dict(webgl=False,iphone=False,generatorExecuted=False),normals=report)
def audit_specials():
 metadata=json.loads((V17/'specials_v17.json').read_text());contacts=json.loads((V17/'special_contacts_v17.json').read_text());out=[]
 for id,slot in [('godan','s3'),('chirka','s3'),('dark_moguzo','s1')]:
  model=Skin(id,'specials');m=metadata['characters'][id][slot];reference=contacts[id][slot];points=[]
  for phase in [0,.5,1]:
   seconds=m['contactSeconds']+(m['contact_end']*m['duration_sec']-m['contactSeconds'])*phase;groups={}
   for positions,labels in model.skin(m['clip'],seconds):
    for group in set(labels):
     p=positions[labels==group];v=p[np.argmax(p[:,2])]
     if group not in groups or v[2]>groups[group][2]:groups[group]=v
   part=reference['attackPart'];v=groups[part];expected=reference['activeReach'][int(phase*2)];leading=max(groups,key=lambda k:groups[k][2]);points.append(dict(phase=phase,seconds=seconds,attackPart=part,reach=round(float(v[2]),5),height=round(float(v[1]),5),expected=expected,leading=leading,groups={g:{'reach':round(float(v[2]),5),'height':round(float(v[1]),5)}for g,v in groups.items()}))
  initial=min(float(p[:,1].min())for p,g in model.skin(m['clip'],0,True));floor=min(min(float(p[:,1].min())for p,g in model.skin(m['clip'],f/60,True))for f in range(m['frames']+1))
  out.append(dict(id=id,slot=slot,clip=m['clip'],kind=m['kind'],origin=m['origin'],attackLimb=m['attack_limb'],surface=points,footSurface=dict(initialMin=round(initial,5),absoluteMin=round(floor,5),relativeSink=round(floor-initial,5))))
 return out
if __name__=='__main__':
 args=argparse.ArgumentParser();args.add_argument('--out',default='/tmp/mamoken-p3-skin.json');opt=args.parse_args();result=audit();result['redesignedSpecials']=audit_specials();Path(opt.out).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');rows=result['normals'];print('rows',len(rows),'maxReachError',max(abs(p['reachError'])for r in rows for p in r['surface']),'maxHeightError',max(abs(p['heightError'])for r in rows for p in r['surface']));print('footWarnings',[(r['id'],r['slot'],r['footSurface'])for r in rows if r.get('footSurface',{}).get('relativeSink',0)<-.012]);print('saved',opt.out)
