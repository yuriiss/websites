"""Project her real hair from the photos onto the hair mesh texture.
usage: blender -b in.blend --python hair_project.py -- out_texture.png
Views: front/back/left photos (+ mirrored left for the right side), aligned by silhouette top & floor.
"""
import bpy, sys, os, math, json
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

OUT = sys.argv[sys.argv.index('--') + 1]
G = '/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/gen/'
sc = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()
hair = [o for o in sc.objects if 'girl_hair' in o.name][0]

def world_mesh(o):
    ev = o.evaluated_get(dg); me = ev.to_mesh()
    co = np.array([o.matrix_world @ v.co for v in me.vertices]); polys = [tuple(p.vertices) for p in me.polygons]
    ev.to_mesh_clear(); return co, polys

# scene geometry for visibility + model extents
all_co, all_tris = [], []; off = 0; top = 0
for o in sc.objects:
    if o.type != 'MESH' or o.hide_render: continue
    c, ps = world_mesh(o); top = max(top, c[:, 2].max())
    for p in ps:
        for i in range(1, len(p) - 1): all_tris.append((p[0] + off, p[i] + off, p[i + 1] + off))
    all_co.append(c); off += len(c)
all_co = np.concatenate(all_co)
bvh = BVHTree.FromPolygons([Vector(c) for c in all_co], all_tris)

# hair mesh in world space, without subdivision so indices match the base mesh
mods = [(m, m.show_viewport) for m in hair.modifiers if m.type != 'ARMATURE']
for m, _ in mods: m.show_viewport = False
dg.update()
hco, _ = world_mesh(hair)
ev = hair.evaluated_get(dg); me_e = ev.to_mesh()
hno = np.array([(hair.matrix_world.to_3x3() @ v.normal).normalized() for v in me_e.vertices]); ev.to_mesh_clear()
for m, s in mods: m.show_viewport = s
me = hair.data
assert len(me.vertices) == len(hco)

bbox = json.load(open(G + 'bbox.json'))   # photo silhouette boxes (top = hair top, bottom = floor)
views = {'front': 0, 'left': 90, 'back': 180, 'right': 270}
li = np.array([l.vertex_index for l in me.loops])
for name, ang in views.items():
    a = math.radians(ang)
    right = np.array([math.cos(a), math.sin(a), 0]); tocam = np.array([math.sin(a), -math.cos(a), 0])
    b = bbox[name]
    s = (b['y1'] - b['y0']) / top                       # px per metre (floor at z=0 .. model top)
    u = all_co @ right
    zmask = all_co[:, 2] > 0.75 * top                     # centre on the upper body (head/shoulders)
    ucen = (u[zmask].min() + u[zmask].max()) / 2
    # photo centre of the same band
    m = np.asarray(__import__('PIL.Image', fromlist=['Image']).open(G + f'mask_{"left" if name == "right" else name}.png').convert('L')) > 128
    if name == 'right': m = m[:, ::-1]
    y_band = int(b['y1'] - 0.75 * (b['y1'] - b['y0'])); rows = m[b['y0']:y_band]
    cols = np.where(rows.any(0))[0]; pcen = (cols.min() + cols.max()) / 2
    hu = hco @ right
    px = pcen + (hu - ucen) * s
    py = b['y1'] - hco[:, 2] * s
    uvl = me.uv_layers.get('h_' + name) or me.uv_layers.new(name='h_' + name)
    uvl.data.foreach_set('uv', np.c_[px[li] / b['W'], 1 - py[li] / b['H']].ravel())
    vis = np.zeros(len(hco))
    for i, (c, n) in enumerate(zip(hco, hno)):
        f = abs(n @ tocam)                                  # hair cards are two-sided
        if f < 0.15: continue
        hit = bvh.ray_cast(Vector(c + tocam * 0.004), Vector(tocam), 10.0)
        if hit[0] is None: vis[i] = f
    attr = me.color_attributes.get('v_' + name) or me.color_attributes.new('v_' + name, 'FLOAT_COLOR', 'POINT')
    for i, w in enumerate(vis): attr.data[i].color = (w, w, w, 1)
    print('VIEW', name, int((vis > 0).sum()), 'visible of', len(vis))

# bake: weighted photo colour, keep original alpha/strand detail
orig_mat = hair.material_slots[0].material
otex = [n for n in orig_mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and 'normal' not in n.image.name.lower()][0].image
W, H = otex.size
mat = bpy.data.materials.new('hbake'); mat.use_nodes = True
nt = mat.node_tree; N = nt.nodes; L = nt.links; N.clear()
out = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission'); L.new(em.outputs[0], out.inputs[0])
sumc = sumw = None
for name in views:
    src = 'left' if name == 'right' else name
    img = bpy.data.images.load(G + f'{src}.png', check_existing=True)
    uvn = N.new('ShaderNodeUVMap'); uvn.uv_map = 'h_' + name
    if name == 'right':
        mapn = N.new('ShaderNodeMapping'); mapn.inputs['Scale'].default_value = (-1, 1, 1); mapn.inputs['Location'].default_value = (1, 0, 0)
        L.new(uvn.outputs[0], mapn.inputs[0]); uvo = mapn.outputs[0]
    else:
        uvo = uvn.outputs[0]
    t = N.new('ShaderNodeTexImage'); t.image = img; t.extension = 'EXTEND'; L.new(uvo, t.inputs[0])
    vc = N.new('ShaderNodeVertexColor'); vc.layer_name = 'v_' + name
    pw0 = N.new('ShaderNodeMath'); pw0.operation = 'POWER'; pw0.inputs[1].default_value = 3.0
    L.new(vc.outputs['Color'], pw0.inputs[0])
    hm = N.new('ShaderNodeTexImage'); hm.image = bpy.data.images.load(G + f'hairmaskE_{src}.png', check_existing=True)
    hm.image.colorspace_settings.name = 'Non-Color'; hm.extension = 'EXTEND'; L.new(uvo, hm.inputs[0])
    pw = N.new('ShaderNodeMath'); pw.operation = 'MULTIPLY'
    L.new(pw0.outputs[0], pw.inputs[0]); L.new(hm.outputs['Color'], pw.inputs[1])
    sc_ = N.new('ShaderNodeVectorMath'); sc_.operation = 'SCALE'; L.new(t.outputs[0], sc_.inputs[0]); L.new(pw.outputs[0], sc_.inputs['Scale'])
    if sumc is None: sumc, sumw = sc_.outputs[0], pw.outputs[0]
    else:
        a1 = N.new('ShaderNodeVectorMath'); a1.operation = 'ADD'; L.new(sumc, a1.inputs[0]); L.new(sc_.outputs[0], a1.inputs[1]); sumc = a1.outputs[0]
        a2 = N.new('ShaderNodeMath'); a2.operation = 'ADD'; L.new(sumw, a2.inputs[0]); L.new(pw.outputs[0], a2.inputs[1]); sumw = a2.outputs[0]
mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = 1e-4; L.new(sumw, mx.inputs[0])
dv = N.new('ShaderNodeMath'); dv.operation = 'DIVIDE'; dv.inputs[0].default_value = 1.0; L.new(mx.outputs[0], dv.inputs[1])
fin = N.new('ShaderNodeVectorMath'); fin.operation = 'SCALE'; L.new(sumc, fin.inputs[0]); L.new(dv.outputs[0], fin.inputs['Scale'])
L.new(fin.outputs[0], em.inputs[0])
tgt = N.new('ShaderNodeTexImage'); tgt.image = bpy.data.images.new('hout', W, H, float_buffer=True)
uvm = N.new('ShaderNodeUVMap'); uvm.uv_map = me.uv_layers[0].name; L.new(uvm.outputs[0], tgt.inputs[0]); N.active = tgt
hair.material_slots[0].material = mat
me.uv_layers.active = me.uv_layers[0]
for m in hair.modifiers:
    if m.type == 'SUBSURF': m.show_render = False
sc.render.engine = 'CYCLES'; sc.cycles.samples = 1; sc.render.bake.margin = 6
bpy.ops.object.select_all(action='DESELECT'); hair.select_set(True); bpy.context.view_layer.objects.active = hair
bpy.ops.object.bake(type='EMIT')
col = np.array(tgt.image.pixels[:]).reshape(H, W, 4)[::-1, :, :3].copy()
L.new(sumw, em.inputs[0]); tgt.image = bpy.data.images.new('hw', W, H, float_buffer=True)
bpy.ops.object.bake(type='EMIT')
wgt = np.array(tgt.image.pixels[:]).reshape(H, W, 4)[::-1, :, 0].copy()
np.save(OUT + '.col.npy', col.astype(np.float32)); np.save(OUT + '.w.npy', wgt.astype(np.float32))
print('HAIR BAKED', W, H, float((wgt > 0.05).mean()))
