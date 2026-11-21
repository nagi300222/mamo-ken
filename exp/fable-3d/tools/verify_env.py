"""環境の最小検証: キーフレーム作成 → 複数アクション(スロット付き) → IKベイク → GLB書き出し → 再読込チェック。
実行: python3 exp/fable-3d/tools/verify_env.py   結果: exp/fable-3d/validation/env_check.json
"""
import bpy, json, struct, os, sys, math, tempfile
from mathutils import Vector
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'validation')
res = {'bpy_version': bpy.app.version_string, 'python': sys.version.split()[0], 'checks': {}}
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = 60
# armature: root -> a -> b (IK) + ik target
ad = bpy.data.armatures.new('Rig'); arm = bpy.data.objects.new('Rig', ad)
sc.collection.objects.link(arm); bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
def eb(name, h, t, parent=None, deform=True):
    b = ad.edit_bones.new(name); b.head = h; b.tail = t; b.use_deform = deform
    if parent: b.parent = ad.edit_bones[parent]
    return b
eb('root', (0,0,0), (0,0.1,0))
eb('a.L', (0,0,0), (0,-0.05,0.5), 'root')
eb('b.L', (0,-0.05,0.5), (0,0,1.0), 'a.L')
eb('ik.L', (0,0,1.0), (0,0,1.1), 'root', deform=False)
bpy.ops.object.mode_set(mode='POSE')
c = arm.pose.bones['b.L'].constraints.new('IK'); c.target = arm; c.subtarget = 'ik.L'; c.chain_count = 2
# mesh
import bmesh
me = bpy.data.meshes.new('M'); ob = bpy.data.objects.new('M', me); sc.collection.objects.link(ob)
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=0.2)
for v in bm.verts: v.co.z = (v.co.z + 0.1) * 5
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=3, use_grid_fill=True); bm.to_mesh(me); bm.free()
for n in ('a.L', 'b.L'): ob.vertex_groups.new(name=n)
for v in me.vertices:
    w = min(max(v.co.z, 0), 1)
    ob.vertex_groups['a.L'].add([v.index], 1 - w, 'REPLACE'); ob.vertex_groups['b.L'].add([v.index], w, 'REPLACE')
m = ob.modifiers.new('Armature', 'ARMATURE'); m.object = arm; ob.parent = arm
ob.shape_key_add(name='Basis'); sk = ob.shape_key_add(name='puff')
for i, v in enumerate(me.vertices): sk.data[i].co = v.co * 1.2
# two actions, each with object slot + shapekey slot
arm.animation_data_create(); me.shape_keys.animation_data_create()
for name, zz in (('clip_a', 0.7), ('clip_b', 0.5)):
    act = bpy.data.actions.new(name)
    arm.animation_data.action = act
    pb = arm.pose.bones['ik.L']
    for f, z in ((0, 1.0), (10, zz), (20, 1.0)):
        pb.location = (0, z - 1.0, 0) if False else (0, 0, 0); pb.location[1] = z - 1.0
        pb.keyframe_insert('location', frame=f)
    me.shape_keys.animation_data.action = act
    for f, v in ((0, 0), (10, 1), (20, 0)):
        sk.value = v; sk.keyframe_insert('value', frame=f)
    act.use_fake_user = True
    res['checks'].setdefault('slots', {})[name] = [s.identifier for s in act.slots]
    # stash to NLA so every action is exported
    for ad_ in (arm.animation_data, me.shape_keys.animation_data):
        tr = ad_.nla_tracks.new(); tr.name = name
        st = tr.strips.new(name, 0, act); st.name = name
        ad_.action = None
# IK really moves b.L?
arm.animation_data.action = bpy.data.actions['clip_a']
sc.frame_set(0); bpy.context.view_layer.update(); h0 = (arm.pose.bones['b.L'].head).copy()
sc.frame_set(10); bpy.context.view_layer.update(); h1 = (arm.pose.bones['b.L'].head).copy()
res['checks']['ik_moves_bone'] = (h0 - h1).length > 1e-3
arm.animation_data.action = None
glb = os.path.join(tempfile.gettempdir(), 'env_check.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS',
    export_force_sampling=True, export_def_bones=True, export_frame_step=1, export_morph=True, export_morph_animation=True,
    export_optimize_animation_size=False, export_skins=True)
with open(glb, 'rb') as f:
    f.read(12); n, _ = struct.unpack('<I4s', f.read(8)); J = json.loads(f.read(n))
res['checks']['glb_animations'] = [a['name'] for a in J.get('animations', [])]
res['checks']['glb_nodes'] = [n_.get('name') for n_ in J['nodes']]
res['checks']['glb_joints'] = [J['nodes'][j]['name'] for j in J['skins'][0]['joints']]
res['checks']['glb_channel_paths'] = sorted({c['target']['path'] for a in J['animations'] for c in a['channels']})
res['checks']['glb_morph_targets'] = J['meshes'][0].get('extras', {}).get('targetNames')
# render engines: GPU系はヘッドレスでプロセスごと落ちることがあるので別プロセスで試す
import subprocess
for eng in ('BLENDER_EEVEE', 'BLENDER_WORKBENCH', 'CYCLES'):
    code = ("import bpy,math,os,tempfile;bpy.ops.wm.read_factory_settings(use_empty=True);sc=bpy.context.scene;"
            "bpy.ops.mesh.primitive_cube_add();cam=bpy.data.objects.new('C',bpy.data.cameras.new('C'));sc.collection.objects.link(cam);"
            "cam.location=(0,-6,0);cam.rotation_euler=(math.pi/2,0,0);sc.camera=cam;sc.render.engine='%s';"
            "sc.render.resolution_x=sc.render.resolution_y=64;sc.render.filepath=os.path.join(tempfile.gettempdir(),'env_r.png');"
            "bpy.ops.render.render(write_still=True);print('RENDER_OK')") % eng
    try:
        p = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, timeout=180)
        res['checks']['render_' + eng] = True if 'RENDER_OK' in p.stdout else 'FAILED: ' + (p.stderr.strip().splitlines() or ['crash'])[-1][:160]
    except Exception as e:
        res['checks']['render_' + eng] = 'FAILED: ' + str(e)[:160]
os.makedirs(OUT, exist_ok=True)
json.dump(res, open(os.path.join(OUT, 'env_check.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps(res, indent=1))
