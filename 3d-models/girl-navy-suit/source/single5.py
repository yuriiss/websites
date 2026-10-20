"""One watertight figure: body mesh with its head region refined onto the high-res head reconstruction.
usage: blender -b --python single.py -- body.glb head.glb out.blend
Writes frame.json (photo registration of the final mesh) next to out.blend.
"""
import bpy, bmesh, sys, os, json
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
BODY, HEAD, OUT = argv
R = '/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/'
bb = json.load(open(R + 'gen/bbox.json')); hb = json.load(open(R + 'recon/headviews/bbox.json'))
CROP_X, CROP_Y, UP = 384, 16, 4.0
Y_FULL, Y_FADE = float(os.environ.get('Y_FULL', '250')), float(os.environ.get('Y_FADE', '292'))

bpy.ops.wm.read_factory_settings(use_empty=True)
def imp(path, name, maxf):
    bpy.ops.import_scene.gltf(filepath=path)
    ob = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name not in ('Body', 'Head')][0]
    for o in list(bpy.context.scene.objects):
        if o.type != 'MESH': bpy.data.objects.remove(o)
    ob.parent = None; bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True); ob.select_set(False)
    ob.name = ob.data.name = name
    if len(ob.data.polygons) > maxf:
        bpy.context.view_layer.objects.active = ob
        d = ob.modifiers.new('d', 'DECIMATE'); d.ratio = maxf / len(ob.data.polygons); bpy.ops.object.modifier_apply(modifier='d')
    return ob
body = imp(BODY, 'Body', 400000)
head = imp(HEAD, 'Head', 900000)

def ext(ob):
    c = np.array([v.co[:] for v in ob.data.vertices])
    return c, c[:, 2].min(), c[:, 2].max(), (c[:, 0].min() + c[:, 0].max()) / 2, (c[:, 1].min() + c[:, 1].max()) / 2
cb, zlo_b, zhi_b, mx_b, my_b = ext(body)
ch, zlo_h, zhi_h, mx_h, my_h = ext(head)
bf, bl, hf, hl = bb['front'], bb['left'], hb['front'], hb['left']
sbF = (bf['y1'] - bf['y0']) / (zhi_b - zlo_b); sbL = (bl['y1'] - bl['y0']) / (zhi_b - zlo_b)
shF = (hf['y1'] - hf['y0']) / (zhi_h - zlo_h); shL = (hl['y1'] - hl['y0']) / (zhi_h - zlo_h)
kF = shF / (UP * sbF)

# head -> photo px -> body frame
X = CROP_X + ((hf['x0'] + hf['x1']) / 2 + (ch[:, 0] - mx_h) * shF) / UP
Y = CROP_Y + (hf['y1'] - (ch[:, 2] - zlo_h) * shF) / UP
XL = CROP_X + ((hl['x0'] + hl['x1']) / 2 + (ch[:, 1] - my_h) * shL) / UP
nx = mx_b + (X - (bf['x0'] + bf['x1']) / 2) / sbF
nz = zlo_b + (bf['y1'] - Y) / sbF
nyS = my_b + (XL - (bl['x0'] + bl['x1']) / 2) / sbL
ny = (ch[:, 1] - my_h) * kF + (nyS.mean() - ((ch[:, 1] - my_h) * kF).mean())
head.data.vertices.foreach_set('co', np.c_[nx, ny, nz].ravel().astype(np.float32)); head.data.update()

def photo(c): return np.c_[(bf['x0'] + bf['x1']) / 2 + (c[:, 0] - mx_b) * sbF, bf['y1'] - (c[:, 2] - zlo_b) * sbF]
XL0, XL1 = CROP_X + 10, CROP_X + 256 - 10

XL0, XL1 = CROP_X + 6, CROP_X + 256 - 6
BODY_IN, HEAD_IN = float(os.environ.get('BODY_IN', '0.03')), float(os.environ.get('HEAD_IN', '0.015'))
def sink(ob, wfun, depth):
    c = np.array([v.co[:] for v in ob.data.vertices]); w = wfun(photo(c))
    w = w * w * (3 - 2 * w)
    g = ob.vertex_groups.new(name='sink')
    for i in np.where(w > 0)[0]: g.add([int(i)], float(w[i]), 'REPLACE')
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    d = ob.modifiers.new('disp', 'DISPLACE'); d.direction = 'NORMAL'; d.strength = -depth; d.mid_level = 0.0
    d.vertex_group = 'sink'
    bpy.ops.object.modifier_apply(modifier='disp'); ob.select_set(False)
# body: head region (inside the crop columns, above the neck) sinks into the high-res head
# body: shrink its own head towards the skull centre so it lies fully inside the high-res head
hcz = np.array([v.co[:] for v in head.data.vertices]); hp_ = photo(hcz)
skull = hcz[(hp_[:, 1] < Y_FULL - 60)].mean(0)
cb_ = np.array([v.co[:] for v in body.data.vertices]); pb_ = photo(cb_)
wb = np.clip((Y_FADE - pb_[:, 1]) / (Y_FADE - Y_FULL), 0, 1) * np.clip(np.minimum(pb_[:, 0] - XL0, XL1 - pb_[:, 0]) / 16.0, 0, 1)
wb = wb * wb * (3 - 2 * wb)
SHRINK = float(os.environ.get('SHRINK', '0.55'))
# above the chin: shrink towards the skull centre; below it: only radially towards the neck axis (no upward pull)
YCHIN = float(os.environ.get('YCHIN', '236'))
k = 1 - (1 - SHRINK) * wb
newb = cb_.copy()
newb[:, 0] = skull[0] + (cb_[:, 0] - skull[0]) * k
newb[:, 1] = skull[1] + (cb_[:, 1] - skull[1]) * k
above = pb_[:, 1] < YCHIN
newb[above, 2] = skull[2] + (cb_[above, 2] - skull[2]) * k[above]
body.data.vertices.foreach_set('co', newb.ravel().astype(np.float32)); body.data.update()
print('skull centre', skull)
# head: everything below the neck and near the crop walls sinks into the body
sink(head, lambda p: np.maximum(np.clip((p[:, 1] - Y_FULL) / (Y_FADE - Y_FULL), 0, 1), np.clip(1 - np.minimum(p[:, 0] - XL0, XL1 - p[:, 0]) / 16.0, 0, 1)), HEAD_IN)
# fuse into one watertight surface
bpy.ops.object.select_all(action='DESELECT'); head.select_set(True); body.select_set(True)
bpy.context.view_layer.objects.active = body; bpy.ops.object.join()
VOX = float(os.environ.get('VOX', '0.0015'))
body.data.remesh_voxel_size = VOX; body.data.use_remesh_preserve_volume = False
bpy.ops.object.voxel_remesh()
print('remeshed faces', len(body.data.polygons))
cr = np.array([v.co[:] for v in body.data.vertices]); pr = photo(cr)
nb = (pr[:, 1] > Y_FULL - 4) & (pr[:, 1] < Y_FADE + 6) & (pr[:, 0] > XL0) & (pr[:, 0] < XL1)
gb = body.vertex_groups.new(name='neck')
for i in np.where(nb)[0]: gb.add([int(i)], 1.0, 'REPLACE')
bpy.context.view_layer.objects.active = body; body.select_set(True)
sm = body.modifiers.new('sm', 'LAPLACIANSMOOTH'); sm.iterations = int(os.environ.get('SMIT', '20')); sm.lambda_factor = 1.0; sm.lambda_border = 0.0
sm.use_volume_preserve = True; sm.use_normalized = True; sm.vertex_group = 'neck'
bpy.ops.object.modifier_apply(modifier='sm')
TARGET = int(os.environ.get('TARGET', '1200000'))
if len(body.data.polygons) > TARGET:
    d = body.modifiers.new('d', 'DECIMATE'); d.ratio = TARGET / len(body.data.polygons); bpy.ops.object.modifier_apply(modifier='d')
for p in body.data.polygons: p.use_smooth = True

# registration of the final mesh to the photos (unchanged body frame), for texturing
json.dump({'zlo': float(zlo_b), 'zhi': float(zhi_b), 'mid': {'front': float(mx_b), 'back': float(-mx_b), 'left': float(my_b), 'right': float(-my_b)}},
          open(os.path.join(os.path.dirname(OUT), 'frame.json'), 'w'))
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('SAVED', OUT, len(body.data.vertices))
