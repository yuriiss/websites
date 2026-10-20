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
F0, F1 = float(os.environ.get('F0', '0.35')), float(os.environ.get('F1', '0.7'))
fr = json.load(open(FR)); bbox = json.load(open(os.path.join(VD, 'bbox.json')))
SCALE = bbox['front']['W'] / 1024.0
ob = bpy.data.objects['Body']; me = ob.data
co = np.array([v.co[:] for v in me.vertices]); no = np.array([v.normal[:] for v in me.vertices])
bm = bmesh.new(); bm.from_mesh(me); bvh = BVHTree.FromBMesh(bm); bm.free()
zlo, zhi = fr['zlo'], fr['zhi']
views = {'front': 0, 'left': 90, 'back': 180, 'right': 270}
li = np.array([l.vertex_index for l in me.loops])
import scipy.sparse as sp
from PIL import Image as PILImage
PILImage.MAX_IMAGE_PIXELS = None
ne = len(me.edges); ev = np.zeros(ne * 2, np.int64); me.edges.foreach_get('vertices', ev); ev = ev.reshape(-1, 2)
nv = len(co)
Adj = sp.coo_matrix((np.ones(2 * ne), (np.r_[ev[:, 0], ev[:, 1]], np.r_[ev[:, 1], ev[:, 0]])), shape=(nv, nv)).tocsr()
Adj = Adj + sp.identity(nv, format='csr')
deg = np.asarray(Adj.sum(1)).ravel(); Avg = sp.diags(1.0 / deg) @ Adj
def smooth(x, k):
    for _ in range(k): x = Avg @ x
    return x
SMOOTH_VIS = int(os.environ.get('SMOOTH_VIS', '4'))
TOL = float(os.environ.get('TOL', '0.012'))
acc_c = np.zeros((nv, 3)); acc_w = np.zeros(nv)
def sample(img, px, py):
    H, W = img.shape[:2]
    x = np.clip(px, 0, W - 1.001); y = np.clip(py, 0, H - 1.001); x0 = x.astype(int); y0 = y.astype(int); fx = (x - x0)[:, None]; fy = (y - y0)[:, None]
    return ((img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx) * (1 - fy) + (img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx) * fy)
from scipy import ndimage as ndi
G = '/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/gen/'
def photo_mask(name):
    m = np.asarray(PILImage.open(G + ('mask_left.png' if name in ('left', 'right') else f'mask_{name}.png')).convert('L')) > 128
    return m[:, ::-1] if name == 'right' else m
def refine(name, px, py):
    X, Y = px / SCALE, py / SCALE
    m = photo_mask(name); H_, W_ = m.shape
    head = Y < 300
    M = np.zeros_like(m)
    xi = np.clip(X[head].astype(int), 0, W_ - 1); yi = np.clip(Y[head].astype(int), 0, H_ - 1); M[yi, xi] = True
    M = ndi.binary_fill_holes(ndi.binary_closing(M, iterations=3))
    pm = m.copy(); pm[300:] = False
    edge_p = pm ^ ndi.binary_erosion(pm); dt = ndi.distance_transform_edt(~edge_p)
    ey, ex = np.where(M ^ ndi.binary_erosion(M)); keep = ey < 292; ey, ex = ey[keep], ex[keep]
    c = np.array([ex.mean(), ey.mean()])
    best = (1e9, 1.0, 0, 0)
    for sc_ in np.arange(0.92, 1.081, 0.01):
        qx = c[0] + (ex - c[0]) * sc_; qy = c[1] + (ey - c[1]) * sc_
        for tx in range(-24, 25):
            for ty in range(-24, 25):
                xx = np.clip((qx + tx).astype(int), 0, W_ - 1); yy = np.clip((qy + ty).astype(int), 0, H_ - 1)
                d = dt[yy, xx].mean()
                if d < best[0]: best = (d, sc_, tx, ty)
    d0 = dt[np.clip(ey, 0, H_ - 1), np.clip(ex, 0, W_ - 1)].mean()
    print('REFINE', name, 'chamfer %.2f -> %.2f' % (d0, best[0]), 'scale %.2f shift %d,%d' % best[1:], flush=True)
    _, sc_, tx, ty = best
    t = np.clip((330 - Y) / 50, 0, 1)            # full correction on the head, fading out by the chest
    Xn = X + ((c[0] + (X - c[0]) * sc_ + tx) - X) * t; Yn = Y + ((c[1] + (Y - c[1]) * sc_ + ty) - Y) * t
    return Xn * SCALE, Yn * SCALE
# face outline from the photo landmarks: inside it only the front photo is used
OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149,
        150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
Lm = np.load('/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/mh/up_lmk.npy')
poly = np.c_[384 + Lm[OVAL, 0] / 4, 16 + Lm[OVAL, 1] / 4]; pc_ = poly.mean(0); poly = pc_ + (poly - pc_) * float(os.environ.get('OVAL_K', '1.06'))
def in_poly(P, Q):
    x, y = P[:, 0], P[:, 1]; r = np.zeros(len(P), bool)
    for i in range(len(Q)):
        x1, y1 = Q[i]; x2, y2 = Q[(i + 1) % len(Q)]
        r ^= ((y1 > y) != (y2 > y)) & (x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-12) + x1)
    return r
HX = json.load(open('/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/recon/headxf.json'))
hvb = json.load(open('/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/recon/headviews/bbox.json'))
bfo = json.load(open('/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/gen/bbox.json'))['front']
HEAD_END = float(os.environ.get('HEAD_END', '320'))
CLS = {'front': np.asarray(PILImage.open(os.path.join(os.path.dirname(OUT), 'cls_front_band.png'))),
       'left': np.asarray(PILImage.open(os.path.join(os.path.dirname(OUT), 'cls_left_band.png'))),
       'back': np.asarray(PILImage.open(os.path.join(os.path.dirname(OUT), 'cls_back_up.png')))}
CLS['right'] = CLS['left'][:, ::-1]
CONF = np.zeros(nv, bool)
WF = np.zeros(nv); RAW = {}; PXY = {}
for name, ang in views.items():
    a = math.radians(ang)
    right = np.array([math.cos(a), math.sin(a), 0]); tocam = np.array([math.sin(a), -math.cos(a), 0])
    b = bbox[name]; s = (b['y1'] - b['y0']) / (zhi - zlo)
    u = co @ right
    px = (b['x0'] + b['x1']) / 2 + (u - fr['mid'][name]) * s
    py = b['y1'] - (co[:, 2] - zlo) * s
    if name != 'front':
        # head region: project through the head reconstruction's own frame (it was built from these exact crops)
        Xf = (bfo['x0'] + bfo['x1']) / 2 + (co[:, 0] - HX['mx_b']) * HX['sbF']; Yf = bfo['y1'] - (co[:, 2] - HX['zlo_b']) * HX['sbF']
        chx = HX['mx_h'] + ((Xf - 384) * 4 - (hvb['front']['x0'] + hvb['front']['x1']) / 2) / HX['shF']
        chz = HX['zlo_h'] + (hvb['front']['y1'] - (Yf - 16) * 4) / HX['shF']
        chy = HX['my_h'] + (co[:, 1] - HX['c0']) / HX['kF']
        hb_ = hvb[name]; sv = (hb_['y1'] - hb_['y0']) / (HX['zhi_h'] - HX['zlo_h'])
        uh = np.c_[chx, chy] @ right[:2]
        pxh = 1536 + (hb_['x0'] + hb_['x1']) / 2 + (uh - HX['mids'][name]) * sv
        pyh = 64 + hb_['y1'] - (chz - HX['zlo_h']) * sv
        tH = np.clip((HEAD_END - Yf) / 30.0, 0, 1)[:, None]
        px = (tH[:, 0] * pxh + (1 - tH[:, 0]) * px); py = (tH[:, 0] * pyh + (1 - tH[:, 0]) * py)
    uvl = me.uv_layers.new(name='p_' + name)
    uvl.data.foreach_set('uv', np.c_[px[li] / b['W'], 1 - py[li] / b['H']].ravel().astype(np.float32))
    facing = smooth(no @ tocam, 2)
    vis = np.zeros(nv, np.float32); tc = Vector(tocam)
    for i in np.where(facing > 0.02)[0]:
        hit = bvh.ray_cast(Vector(co[i] + no[i] * 0.002 + tocam * 0.001), tc, 10.0)
        if hit[0] is None or hit[3] < TOL: vis[i] = 1.0
    # no flicker: visibility smoothed over the surface, and only kept where most neighbours agree
    vs = np.clip((smooth(vis.astype(float), SMOOTH_VIS) - 0.35) / 0.5, 0, 1)
    if name == 'front':
        t = np.clip((facing - F0) / (F1 - F0), 0, 1); WF = vs * t * t * (3 - 2 * t)
        FACE = in_poly(np.c_[px / SCALE, py / SCALE], poly) & (facing > float(os.environ.get('FACE_MIN', '0.5'))) & (co @ np.array([0, -1, 0]) > (co @ np.array([0, -1, 0]))[in_poly(np.c_[px / SCALE, py / SCALE], poly)].mean() - 0.06)
        FACE = smooth(FACE.astype(float), 3) > 0.5
        WF = np.where(FACE, np.maximum(vs, 0.999 * (vis > 0)), WF)
        w = WF
        clsF = CLS['front'][np.clip((py - 64).astype(int), 0, 1279), np.clip((px - 1536).astype(int), 0, 1023)]
        okF = (px - 1536 >= 0) & (px - 1536 < 1024) & (py - 64 >= 0) & (py - 64 < 1280)
        visF = vis > 0; FACF = facing.copy()
    else:
        w = vs * np.clip(facing, 0, 1) ** POW * (1 - WF) * (~FACE)
        cm = CLS[name]
        clsS = cm[np.clip((py - 64).astype(int), 0, 1279), np.clip((px - 1536).astype(int), 0, 1023)]
        okS = (px - 1536 >= 0) & (px - 1536 < 1024) & (py - 64 >= 0) & (py - 64 < 1280)
        Yo = py / SCALE
        hs = lambda c: np.isin(c, (1, 2, 3))
        cF = np.where(clsF == 9, 9, clsF)     # border band: real side photo decides; mirrored side: front decides
        conf = visF & okF & okS & (Yo < HEAD_END - 30) & hs(cF) & hs(clsS) & ((cF == 1) != (clsS == 1))
        conf = conf & (FACF >= float(os.environ.get('FG', '0.28')))
        conf = smooth(conf.astype(float), 2) > 0.3
        if name == 'right':
            # mirrored photo is only valid where the right surface mirrors the left one (same distance from the midplane)
            Lm_ = np.load('/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/mh/up_lmk.npy')
            cxm = HX['mx_b'] + ((384 + Lm_[168, 0] / 4) - (bfo['x0'] + bfo['x1']) / 2) / HX['sbF']
            TOLX = float(os.environ.get('TOLX', '0.008'))
            bad = np.zeros(nv, bool)
            for i in np.where((w > 1e-4) & (Yo < HEAD_END))[0]:
                hit = bvh.ray_cast(Vector((cxm + 1.0, co[i, 1], co[i, 2])), Vector((-1, 0, 0)), 3.0)
                if hit[0] is None or abs((cxm - co[i, 0]) - (hit[0].x - cxm)) > TOLX: bad[i] = True
            bad = bad & np.isin(clsS, (2, 3))
            bad = smooth(bad.astype(float), 3) > 0.3
            w = np.where(bad, 0.0, w)
            print('  right: depth-inconsistent', int(bad.sum()), flush=True)
        w = np.where(conf, 0.0, w); CONF |= conf
        print('  conflicts', name, int(conf.sum()), flush=True)
    RAW[name] = w; PXY[name] = (px, py)
    print('VIEW', name, int(vis.sum()), flush=True)
RAW['front'] = np.maximum(RAW['front'], CONF * visF * 0.6)
REG = int(os.environ.get('REGION_SMOOTH', '12')); SHARP = float(os.environ.get('SHARP', '4'))
Ws = {n: smooth(RAW[n], REG) for n in views}
tot = sum(Ws.values()) + 1e-9
for n in views:
    p = (Ws[n] / tot) ** SHARP * (RAW[n] > 0) + 1e-6 * (RAW[n] > 0)   # coherent regions, only where the view really sees
    Ws[n] = p
lab = np.argmax(np.stack([Ws[n] for n in views], 1), 1)
np.save(os.path.join(os.path.dirname(OUT), 'view_label.npy'), lab)
for name in views:
    w = Ws[name]
    attr = me.color_attributes.new('w_' + name, 'FLOAT_COLOR', 'POINT')
    attr.data.foreach_set('color', np.repeat(w, 4).astype(np.float32))
    img = np.asarray(PILImage.open(os.path.join(VD, f'tex_{name}.png')).convert('RGB')).astype(np.float32) / 255
    px, py = PXY[name]
    acc_c += sample(img, px, py) * w[:, None]; acc_w += w
    del img
# fill colour for surfaces no photo sees well: diffuse seen colours across the mesh
seen = acc_w > 1e-3
col = np.zeros((nv, 3)); col[seen] = acc_c[seen] / acc_w[seen][:, None]
known = seen.astype(float)
for it in range(400):
    num = Avg @ (col * known[:, None]); den = Avg @ known
    upd = (~seen) & (den > 1e-6)
    col[upd] = num[upd] / den[upd][:, None]
    known = np.where(seen, 1.0, np.where(den > 1e-6, 1.0, 0.0))
print('unseen verts', int((~seen).sum()), 'still empty', int((known == 0).sum()), flush=True)
lin = np.where(col <= 0.04045, col / 12.92, ((col + 0.055) / 1.055) ** 2.4)   # attribute is linear
fa = me.color_attributes.new('fillc', 'FLOAT_COLOR', 'POINT')
fa.data.foreach_set('color', np.c_[lin, np.ones(nv)].ravel().astype(np.float32))
FW = 1e-4

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
    bpy.ops.object.mode_set(mode='OBJECT')
    tmp = part.copy(); tmp.data = part.data.copy(); bpy.context.scene.collection.objects.link(tmp)
    bpy.ops.object.select_all(action='DESELECT'); tmp.select_set(True); bpy.context.view_layer.objects.active = tmp
    smd = tmp.modifiers.new('s', 'SMOOTH'); smd.factor = 1.0; smd.iterations = int(os.environ.get('UVSMOOTH', '60'))
    bpy.ops.object.modifier_apply(modifier='s')
    tmp.data.uv_layers.active = tmp.data.uv_layers['UVMap']
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(float(os.environ.get('UVANGLE', '70'))), island_margin=0.003)
    bpy.ops.object.mode_set(mode='OBJECT')
    buf = np.zeros(len(tmp.data.loops) * 2, np.float32); tmp.data.uv_layers['UVMap'].data.foreach_get('uv', buf)
    part.data.uv_layers['UVMap'].data.foreach_set('uv', buf)
    bpy.data.meshes.remove(tmp.data)
    bpy.ops.object.select_all(action='DESELECT'); part.select_set(True); bpy.context.view_layer.objects.active = part
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
    fc = N.new('ShaderNodeVertexColor'); fc.layer_name = 'fillc'
    fcs = N.new('ShaderNodeVectorMath'); fcs.operation = 'SCALE'; fcs.inputs['Scale'].default_value = FW; L.new(fc.outputs['Color'], fcs.inputs[0])
    a3 = N.new('ShaderNodeVectorMath'); a3.operation = 'ADD'; L.new(sumc, a3.inputs[0]); L.new(fcs.outputs[0], a3.inputs[1]); sumc = a3.outputs[0]
    a4 = N.new('ShaderNodeMath'); a4.operation = 'ADD'; a4.inputs[1].default_value = FW; L.new(sumw, a4.inputs[0]); sumw = a4.outputs[0]
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
    part.data.color_attributes.remove(part.data.color_attributes['fillc'])
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
