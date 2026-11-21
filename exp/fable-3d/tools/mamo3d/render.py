"""Cycles での確認用レンダリング（この環境は EEVEE/Workbench が使えない）。"""
import bpy, math, os
from mathutils import Vector

VIEWS = {'front': (0, -1, 0.10), 'side': (-1, 0, 0.10), 'three_quarter': (-0.62, -0.78, 0.22), 'back': (0, 1, 0.10),
         'side_l': (1, 0, 0.10), 'top34': (-0.5, -0.7, 0.9), 'back34': (0.62, 0.78, 0.25)}

def setup(scene, res=(560, 640), samples=24):
    scene.render.engine = 'CYCLES'; scene.cycles.samples = samples; scene.cycles.device = 'CPU'
    try: scene.cycles.use_denoising = True
    except Exception: pass
    scene.render.resolution_x, scene.render.resolution_y = res; scene.render.film_transparent = False
    scene.cycles.max_bounces = 3; scene.view_settings.view_transform = 'Standard'
    w = scene.world or bpy.data.worlds.new('W'); scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background'); bg.inputs[0].default_value = (0.42, 0.45, 0.50, 1); bg.inputs[1].default_value = 0.55
    for n in ('KeyL', 'FillL', 'RimL'):
        if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n])
    def sun(name, d, e, col=(1, 1, 1)):
        L = bpy.data.lights.new(name, 'SUN'); L.energy = e; L.angle = 0.25; L.color = col
        o = bpy.data.objects.new(name, L); scene.collection.objects.link(o)
        o.rotation_euler = Vector(d).to_track_quat('Z', 'Y').to_euler(); return o
    sun('KeyL', (-0.5, -0.8, 0.9), 2.4); sun('FillL', (0.8, -0.4, 0.3), 0.6, (0.85, 0.9, 1)); sun('RimL', (0.3, 0.9, 0.6), 1.0)
    if 'Floor' not in bpy.data.objects:
        me = bpy.data.meshes.new('Floor'); me.from_pydata([(-3, -3, 0), (3, -3, 0), (3, 3, 0), (-3, 3, 0)], [], [(0, 1, 2, 3)])
        fo = bpy.data.objects.new('Floor', me); scene.collection.objects.link(fo)
        m = bpy.data.materials.new('FloorMat'); m.diffuse_color = (0.33, 0.35, 0.38, 1); me.materials.append(m)
        m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.33, 0.35, 0.38, 1)
    if 'RCam' not in bpy.data.objects:
        cam = bpy.data.objects.new('RCam', bpy.data.cameras.new('RCam')); scene.collection.objects.link(cam)
    scene.camera = bpy.data.objects['RCam']

def shot(scene, path, view='front', center=(0, 0, 0.31), span=0.80, lens=85):
    cam = scene.camera; d = Vector(VIEWS[view] if isinstance(view, str) else view).normalized()
    c = Vector(center); cam.data.type = 'ORTHO'
    cam.data.ortho_scale = span * max(1.0, scene.render.resolution_x / scene.render.resolution_y)
    cam.location = c + d * 5.0; cam.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    scene.render.filepath = path; bpy.ops.render.render(write_still=True)

def sheet(paths, out, cols=None):
    from PIL import Image
    ims = [Image.open(p).convert('RGB') for p in paths]; cols = cols or len(ims); rows = (len(ims) + cols - 1) // cols
    w, h = ims[0].size; S = Image.new('RGB', (w * cols, h * rows), (30, 30, 30))
    for i, im in enumerate(ims): S.paste(im, ((i % cols) * w, (i // cols) * h))
    S.save(out)
