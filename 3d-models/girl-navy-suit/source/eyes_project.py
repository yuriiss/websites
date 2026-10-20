"""Paint her real eyes (from the photo) onto the eyeball meshes and save the blend.
usage: blender -b in.blend --python eyes_project.py -- render_lmk.npy photo_lmk.npy photo.png out.blend
render_lmk come from project_face.py's 'render' stage of this same blend (same ortho frame).
"""
import bpy, sys, os, math
import numpy as np
from mathutils import Vector
from scipy.spatial import Delaunay

argv = sys.argv[sys.argv.index('--') + 1:]
R = np.load(argv[0]); Pp = np.load(argv[1]); photo = argv[2]; out = argv[3]
sc = bpy.context.scene
RES, ORTHO = 1024, 0.30
eyes = [o for o in sc.objects if 'high-poly' in o.name][0]
dg = bpy.context.evaluated_depsgraph_get()
ev = eyes.evaluated_get(dg)
mods = [(m, m.show_viewport) for m in eyes.modifiers if m.type != 'ARMATURE']
for m, _ in mods: m.show_viewport = False
dg.update(); ev = eyes.evaluated_get(dg); me_e = ev.to_mesh()
co = np.array([eyes.matrix_world @ v.co for v in me_e.vertices])
no = np.array([(eyes.matrix_world.to_3x3() @ v.normal).normalized() for v in me_e.vertices])
ev.to_mesh_clear()
for m, s in mods: m.show_viewport = s
# same frame as project_face.py: centre between the eyes, 3.5 cm down
ec = (co.min(0) + co.max(0)) / 2
center = np.array([0.0, ec[1], ec[2] - 0.035])
px = np.stack([(co[:, 0] - center[0]) / ORTHO * RES + RES / 2, RES / 2 - (co[:, 2] - center[2]) / ORTHO * RES], -1)
# piecewise-affine warp using only eye-region landmarks (eyes, irises, lids, brows) for precision
EYE = sorted(set([33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
                  263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466,
                  468, 469, 470, 471, 472, 473, 474, 475, 476, 477,
                  130, 25, 110, 24, 23, 22, 26, 112, 243, 190, 56, 28, 27, 29, 30, 247,
                  359, 255, 339, 254, 253, 252, 256, 341, 463, 414, 286, 258, 257, 259, 260, 467,
                  6, 168, 197, 70, 63, 105, 66, 107, 336, 296, 334, 293, 300]))
tri = Delaunay(R[EYE])
s = tri.find_simplex(px)
cent = R[EYE][tri.simplices].mean(1)
bad = s < 0
if bad.any():
    s[bad] = ((px[bad, None] - cent[None]) ** 2).sum(-1).argmin(1)
T = tri.transform[s]
b2 = np.einsum('nij,nj->ni', T[:, :2], px - T[:, 2]); bary = np.c_[b2, 1 - b2.sum(1)]
pxy = np.einsum('ni,nij->nj', bary, Pp[EYE][tri.simplices[s]])
from PIL import Image
PW, PH = Image.open(photo).size
me = eyes.data
main = me.uv_layers[0].name
uvl = me.uv_layers.get('photo') or me.uv_layers.new(name='photo')
li = np.array([l.vertex_index for l in me.loops])
uvl.data.foreach_set('uv', np.c_[pxy[li, 0] / PW, 1 - pxy[li, 1] / PH].ravel())
# bake photo colour into the eye's own UV texture
mat = bpy.data.materials.new('ebake'); mat.use_nodes = True
nt = mat.node_tree; N = nt.nodes; L = nt.links; N.clear()
o_ = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission'); L.new(em.outputs[0], o_.inputs[0])
u = N.new('ShaderNodeUVMap'); u.uv_map = 'photo'
t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(photo); t.extension = 'EXTEND'
L.new(u.outputs[0], t.inputs[0]); L.new(t.outputs[0], em.inputs[0])
img = bpy.data.images.new('Girl_eyes_photo', 1024, 1024)
tg = N.new('ShaderNodeTexImage'); tg.image = img; um = N.new('ShaderNodeUVMap'); um.uv_map = main
L.new(um.outputs[0], tg.inputs[0]); N.active = tg
eyes.material_slots[0].material = mat
me.uv_layers.active = me.uv_layers[main]
for m in eyes.modifiers:
    if m.type == 'SUBSURF': m.show_render = False
sc.render.engine = 'CYCLES'; sc.cycles.samples = 1; sc.render.bake.margin = 8
bpy.ops.object.select_all(action='DESELECT'); eyes.select_set(True); bpy.context.view_layer.objects.active = eyes
bpy.ops.object.bake(type='EMIT')
for m in eyes.modifiers:
    if m.type == 'SUBSURF': m.show_render = True
img.pack()
# final eye material: photo albedo + wet glossy cornea
fm = bpy.data.materials.new('Girl_eyes'); fm.use_nodes = True
bs = fm.node_tree.nodes['Principled BSDF']
tx = fm.node_tree.nodes.new('ShaderNodeTexImage'); tx.image = img
fm.node_tree.links.new(tx.outputs[0], bs.inputs['Base Color'])
bs.inputs['Roughness'].default_value = 0.08; bs.inputs['Coat Weight'].default_value = 0.6
eyes.material_slots[0].material = fm
me.uv_layers.remove(me.uv_layers['photo'])
bpy.data.materials.remove(mat)
bpy.ops.wm.save_as_mainfile(filepath=out)
print('EYES OK')
