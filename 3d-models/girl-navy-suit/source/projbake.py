"""Texture an image-to-3D mesh by projecting the photos it was made from.

usage: blender -b --python projbake.py -- in.glb viewsdir out.blend [max_faces] [front_boost] [tex_size]
viewsdir holds tex_{front,left,back,right}.png (background already filled) and bbox.json
(foreground box per view). The mesh stays in its own (Hunyuan-normalised) coordinates.
"""
import bpy, bmesh, sys, os, math, json
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, VD, OUT = argv[0], argv[1], argv[2]
MAXF = int(argv[3]) if len(argv) > 3 else 400000
FRONT_BOOST = float(argv[4]) if len(argv) > 4 else 1.0
TEX = int(argv[5]) if len(argv) > 5 else 4096
POW = 8.0

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
ob = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
for o in list(bpy.context.scene.objects):
    if o is not ob: bpy.data.objects.remove(o)
ob.parent = None
bpy.context.view_layer.objects.active = ob; ob.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
ob.name = ob.data.name = 'Mesh'
if len(ob.data.polygons) > MAXF:
    d = ob.modifiers.new('dec', 'DECIMATE'); d.ratio = MAXF / len(ob.data.polygons)
    bpy.ops.object.modifier_apply(modifier='dec')
for p in ob.data.polygons: p.use_smooth = True
me = ob.data
print('FACES', len(me.polygons))

bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002)
bpy.ops.object.mode_set(mode='OBJECT')
me.uv_layers[0].name = 'UVMap'

co = np.array([v.co[:] for v in me.vertices]); no = np.array([v.normal[:] for v in me.vertices])
bm = bmesh.new(); bm.from_mesh(me); bvh = BVHTree.FromBMesh(bm); bm.free()
zlo, zhi = co[:, 2].min(), co[:, 2].max()
bbox = json.load(open(os.path.join(VD, 'bbox.json')))
views = {'front': 0, 'left': 90, 'back': 180, 'right': 270}
li = np.array([l.vertex_index for l in me.loops])
for name, ang in views.items():
    a = math.radians(ang)
    right = np.array([math.cos(a), math.sin(a), 0]); tocam = np.array([math.sin(a), -math.cos(a), 0])
    u = co @ right
    b = bbox[name]
    s = (b['y1'] - b['y0']) / (zhi - zlo)
    pcx = (b['x0'] + b['x1']) / 2; mcx = (u.min() + u.max()) / 2
    px = pcx + (u - mcx) * s
    py = b['y1'] - (co[:, 2] - zlo) * s
    uvl = me.uv_layers.new(name='p_' + name)
    uvl.data.foreach_set('uv', np.c_[px[li] / b['W'], 1 - py[li] / b['H']].ravel().astype(np.float32))
    facing = no @ tocam
    vis = np.zeros(len(co), np.float32)
    tc = Vector(tocam)
    for i in np.where(facing > 0.02)[0]:
        if bvh.ray_cast(Vector(co[i] + no[i] * 0.002 + tocam * 0.001), tc, 10.0)[0] is None:
            vis[i] = 1.0
    w = vis * np.clip(facing, 0, 1) ** POW * (FRONT_BOOST if name == 'front' else 1.0)
    w = w + vis * 1e-4
    attr = me.color_attributes.new('w_' + name, 'FLOAT_COLOR', 'POINT')
    attr.data.foreach_set('color', np.repeat(w, 4).astype(np.float32))
    print('VIEW', name, int(vis.sum()))

mat = bpy.data.materials.new('bake'); mat.use_nodes = True
nt = mat.node_tree; N = nt.nodes; L = nt.links; N.clear()
out = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission'); L.new(em.outputs[0], out.inputs[0])
sumc = sumw = None
for name in views:
    uvn = N.new('ShaderNodeUVMap'); uvn.uv_map = 'p_' + name
    t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(VD, f'tex_{name}.png')); t.extension = 'EXTEND'
    t.interpolation = 'Cubic'
    L.new(uvn.outputs[0], t.inputs[0])
    vc = N.new('ShaderNodeVertexColor'); vc.layer_name = 'w_' + name
    sc_ = N.new('ShaderNodeVectorMath'); sc_.operation = 'SCALE'
    L.new(t.outputs[0], sc_.inputs[0]); L.new(vc.outputs['Color'], sc_.inputs['Scale'])
    wv = vc.outputs['Color']
    if sumc is None: sumc, sumw = sc_.outputs[0], wv
    else:
        a1 = N.new('ShaderNodeVectorMath'); a1.operation = 'ADD'; L.new(sumc, a1.inputs[0]); L.new(sc_.outputs[0], a1.inputs[1]); sumc = a1.outputs[0]
        a2 = N.new('ShaderNodeMath'); a2.operation = 'ADD'; L.new(sumw, a2.inputs[0]); L.new(wv, a2.inputs[1]); sumw = a2.outputs[0]
mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = 1e-6; L.new(sumw, mx.inputs[0])
dv = N.new('ShaderNodeMath'); dv.operation = 'DIVIDE'; dv.inputs[0].default_value = 1.0; L.new(mx.outputs[0], dv.inputs[1])
fin = N.new('ShaderNodeVectorMath'); fin.operation = 'SCALE'; L.new(sumc, fin.inputs[0]); L.new(dv.outputs[0], fin.inputs['Scale'])
L.new(fin.outputs[0], em.inputs[0])
img = bpy.data.images.new('albedo', TEX, TEX)
tg = N.new('ShaderNodeTexImage'); tg.image = img; um = N.new('ShaderNodeUVMap'); um.uv_map = 'UVMap'
L.new(um.outputs[0], tg.inputs[0]); N.active = tg
me.materials.clear(); me.materials.append(mat); me.uv_layers.active = me.uv_layers['UVMap']
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 1
sc.render.bake.margin = 16
bpy.ops.object.bake(type='EMIT')

for name in views:
    me.uv_layers.remove(me.uv_layers['p_' + name]); me.color_attributes.remove(me.color_attributes['w_' + name])
fm = bpy.data.materials.new('Albedo'); fm.use_nodes = True
bs = fm.node_tree.nodes['Principled BSDF']; bs.inputs['Roughness'].default_value = 0.7
ti = fm.node_tree.nodes.new('ShaderNodeTexImage'); ti.image = img
fm.node_tree.links.new(ti.outputs[0], bs.inputs['Base Color'])
me.materials.clear(); me.materials.append(fm); bpy.data.materials.remove(mat)
img.pack()
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('DONE', OUT)
