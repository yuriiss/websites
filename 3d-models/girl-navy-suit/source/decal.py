"""Bake a front-projected RGBA decal into a garment's base-colour texture.
usage: blender -b file.blend --python decal.py -- objkey decal.png cx cz width base_tex.png out_tex.png
"""
import bpy, sys
import numpy as np
argv = sys.argv[sys.argv.index('--') + 1:]
key, decal, cx, cz, wd, base_tex, out_tex = argv[0], argv[1], *map(float, argv[2:5]), argv[5], argv[6]
o = [o for o in bpy.data.objects if key in o.name and o.type == 'MESH'][0]
dimg = bpy.data.images.load(decal)
ht = wd * dimg.size[1] / dimg.size[0]
mods = [(m, m.show_viewport) for m in o.modifiers if m.type != 'ARMATURE']
for m, _ in mods: m.show_viewport = False
dg = bpy.context.evaluated_depsgraph_get()
ev = o.evaluated_get(dg).to_mesh()
co = np.array([o.matrix_world @ v.co for v in ev.vertices])
no = np.array([(o.matrix_world.to_3x3() @ v.normal) for v in ev.vertices])
o.evaluated_get(dg).to_mesh_clear()
for m, s in mods: m.show_viewport = s
me = o.data
assert len(me.vertices) == len(co)
li = np.array([l.vertex_index for l in me.loops])
du = (co[li, 0] - cx) / wd + 0.5
dv = (co[li, 2] - cz) / ht + 0.5
front = (-no[li, 1] > 0.4) & (co[li, 1] < 0)
du[~front] = -5
uvl = me.uv_layers.new(name='decal')
uvl.data.foreach_set('uv', np.c_[du, dv].ravel())
main = me.uv_layers[0].name
base = bpy.data.images.load(base_tex)
W, H = base.size
mat = bpy.data.materials.new('dbake'); mat.use_nodes = True
nt = mat.node_tree; N = nt.nodes; L = nt.links; N.clear()
out = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission')
u0 = N.new('ShaderNodeUVMap'); u0.uv_map = main
t0 = N.new('ShaderNodeTexImage'); t0.image = base
u1 = N.new('ShaderNodeUVMap'); u1.uv_map = 'decal'
t1 = N.new('ShaderNodeTexImage'); t1.image = dimg; t1.extension = 'CLIP'
mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
L.new(u0.outputs[0], t0.inputs[0]); L.new(u1.outputs[0], t1.inputs[0])
L.new(t1.outputs['Alpha'], mix.inputs['Factor']); L.new(t0.outputs[0], mix.inputs[6]); L.new(t1.outputs[0], mix.inputs[7])
L.new(mix.outputs[2], em.inputs[0]); L.new(em.outputs[0], out.inputs[0])
tgt = N.new('ShaderNodeTexImage'); tgt.image = bpy.data.images.new('dout', W, H, float_buffer=True)
ut = N.new('ShaderNodeUVMap'); ut.uv_map = main; L.new(ut.outputs[0], tgt.inputs[0]); N.active = tgt
for s in o.material_slots: s.material = mat
me.uv_layers.active = me.uv_layers[main]
for m in o.modifiers:
    if m.type == 'SUBSURF': m.show_render = False
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 1; sc.render.bake.margin = 4
bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
bpy.ops.object.bake(type='EMIT')
a = np.array(tgt.image.pixels[:]).reshape(H, W, 4)[::-1, :, :3].copy()
L.new(t1.outputs['Alpha'], em.inputs[0])
tgt.image = bpy.data.images.new('dmask', W, H, float_buffer=True)
bpy.ops.object.bake(type='EMIT')
msk = np.array(tgt.image.pixels[:]).reshape(H, W, 4)[::-1, :, 0].copy()
a = np.where(a <= 0.0031308, a * 12.92, 1.055 * np.clip(a, 0, None) ** (1 / 2.4) - 0.055)
# only replace texels the decal touched; keep the original elsewhere (bake margin artefacts)
orig = np.array(base.pixels[:]).reshape(H, W, 4)[::-1, :, :3]
orig_s = orig if base.colorspace_settings.name == 'Non-Color' else orig
from PIL import Image
o8 = np.asarray(Image.open(base_tex).convert('RGB')).astype(float) / 255
diff = msk > 0.01
res = a * msk[..., None] + o8 * (1 - msk[..., None])
Image.fromarray((res.clip(0, 1) * 255).astype(np.uint8)).save(out_tex)
print('DECAL OK', int(diff.sum()))
