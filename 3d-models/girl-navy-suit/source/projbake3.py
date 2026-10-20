"""Texture the fused figure from the photo composites. Splits it into Head / Body objects (own 4K textures).
usage: blender -b single2.blend --python projbake3.py -- viewsdir frame.json out.blend [split_Y]
"""
import bpy, bmesh, sys, os, math, json
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
VD, FR, OUT = argv[0], argv[1], argv[2]
SPLIT_Y = float(argv[3]) if len(argv) > 3 else 345.0   # original-photo row
POW, TEX = float(os.environ.get('POW', '8')), 4096
F0, F1 = float(os.environ.get('F0', '0.12')), float(os.environ.get('F1', '0.45'))
fr = json.load(open(FR)); bbox = json.load(open(os.path.join(VD, 'bbox.json')))
SCALE = bbox['front']['W'] / 1024.0
ob = bpy.data.objects['Body']; me = ob.data
co = np.array([v.co[:] for v in me.vertices]); no = np.array([v.normal[:] for v in me.vertices])
bm = bmesh.new(); bm.from_mesh(me); bvh = BVHTree.FromBMesh(bm); bm.free()
zlo, zhi = fr['zlo'], fr['zhi']
views = {'front': 0, 'left': 90, 'back': 180, 'right': 270}
li = np.array([l.vertex_index for l in me.loops])
for name, ang in views.items():
    a = math.radians(ang)
    right = np.array([math.cos(a), math.sin(a), 0]); tocam = np.array([math.sin(a), -math.cos(a), 0])
    b = bbox[name]; s = (b['y1'] - b['y0']) / (zhi - zlo)
    u = co @ right
    px = (b['x0'] + b['x1']) / 2 + (u - fr['mid'][name]) * s
    py = b['y1'] - (co[:, 2] - zlo) * s
    uvl = me.uv_layers.new(name='p_' + name)
    uvl.data.foreach_set('uv', np.c_[px[li] / b['W'], 1 - py[li] / b['H']].ravel().astype(np.float32))
    facing = no @ tocam
    vis = np.zeros(len(co), np.float32); tc = Vector(tocam)
    for i in np.where(facing > 0.02)[0]:
        if bvh.ray_cast(Vector(co[i] + no[i] * 0.002 + tocam * 0.001), tc, 10.0)[0] is None: vis[i] = 1.0
    if name == 'front':
        t = np.clip((facing - F0) / (F1 - F0), 0, 1); WF = vis * t * t * (3 - 2 * t)
        w = WF + vis * 1e-4
    else:
        w = vis * np.clip(facing, 0, 1) ** POW * (1 - WF) + vis * 1e-4
    attr = me.color_attributes.new('w_' + name, 'FLOAT_COLOR', 'POINT')
    attr.data.foreach_set('color', np.repeat(w, 4).astype(np.float32))
    print('VIEW', name, int(vis.sum()), flush=True)

# split by photo row (front registration)
bf = bbox['front']; sF = (bf['y1'] - bf['y0']) / (zhi - zlo)
rowY = (bf['y1'] - (co[:, 2] - zlo) * sF) / SCALE
bpy.context.view_layer.objects.active = ob; ob.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
for p in me.polygons:
    p.select = bool(rowY[list(p.vertices)].mean() < SPLIT_Y)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
head = [o for o in parts if o is not ob][0]; head.name = head.data.name = 'Head'; ob.name = ob.data.name = 'Body'

imgs = {n: bpy.data.images.load(os.path.join(VD, f'tex_{n}.png')) for n in views}
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 1; sc.render.bake.margin = 16
for part in (head, ob):
    bpy.ops.object.select_all(action='DESELECT'); part.select_set(True); bpy.context.view_layer.objects.active = part
    uv = part.data.uv_layers.new(name='UVMap'); part.data.uv_layers.active = uv
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.002)
    bpy.ops.object.mode_set(mode='OBJECT')
    mat = bpy.data.materials.new('bake_' + part.name); mat.use_nodes = True
    nt = mat.node_tree; N = nt.nodes; L = nt.links; N.clear()
    out = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission'); L.new(em.outputs[0], out.inputs[0])
    sumc = sumw = None
    for name in views:
        uvn = N.new('ShaderNodeUVMap'); uvn.uv_map = 'p_' + name
        t = N.new('ShaderNodeTexImage'); t.image = imgs[name]; t.extension = 'EXTEND'
        L.new(uvn.outputs[0], t.inputs[0])
        vc = N.new('ShaderNodeVertexColor'); vc.layer_name = 'w_' + name
        m = N.new('ShaderNodeVectorMath'); m.operation = 'SCALE'; L.new(t.outputs[0], m.inputs[0]); L.new(vc.outputs['Color'], m.inputs['Scale'])
        if sumc is None: sumc, sumw = m.outputs[0], vc.outputs['Color']
        else:
            a1 = N.new('ShaderNodeVectorMath'); a1.operation = 'ADD'; L.new(sumc, a1.inputs[0]); L.new(m.outputs[0], a1.inputs[1]); sumc = a1.outputs[0]
            a2 = N.new('ShaderNodeMath'); a2.operation = 'ADD'; L.new(sumw, a2.inputs[0]); L.new(vc.outputs['Color'], a2.inputs[1]); sumw = a2.outputs[0]
    mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = 1e-6; L.new(sumw, mx.inputs[0])
    dv = N.new('ShaderNodeMath'); dv.operation = 'DIVIDE'; dv.inputs[0].default_value = 1.0; L.new(mx.outputs[0], dv.inputs[1])
    fin = N.new('ShaderNodeVectorMath'); fin.operation = 'SCALE'; L.new(sumc, fin.inputs[0]); L.new(dv.outputs[0], fin.inputs['Scale'])
    L.new(fin.outputs[0], em.inputs[0])
    img = bpy.data.images.new(part.name + '_albedo', TEX, TEX)
    tg = N.new('ShaderNodeTexImage'); tg.image = img; um = N.new('ShaderNodeUVMap'); um.uv_map = 'UVMap'
    L.new(um.outputs[0], tg.inputs[0]); N.active = tg
    part.data.materials.clear(); part.data.materials.append(mat)
    bpy.ops.object.bake(type='EMIT')
    for name in views:
        part.data.uv_layers.remove(part.data.uv_layers['p_' + name]); part.data.color_attributes.remove(part.data.color_attributes['w_' + name])
    fm = bpy.data.materials.new(part.name); fm.use_nodes = True
    bs = fm.node_tree.nodes['Principled BSDF']; bs.inputs['Roughness'].default_value = 0.65
    ti = fm.node_tree.nodes.new('ShaderNodeTexImage'); ti.image = img
    fm.node_tree.links.new(ti.outputs[0], bs.inputs['Base Color'])
    part.data.materials.clear(); part.data.materials.append(fm); bpy.data.materials.remove(mat)
    img.pack()
    print('BAKED', part.name, len(part.data.polygons), flush=True)
for im in list(imgs.values()): bpy.data.images.remove(im)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('DONE', OUT)
