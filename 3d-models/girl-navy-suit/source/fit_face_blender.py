"""Face-shape fitting helper (Blender side).

stage render: blender -b in.blend --python fit_face_blender.py -- render prefix weights.json
    loads candidate face targets as shape keys (values from weights.json), renders a neutral front ortho view
stage jac:    blender -b in.blend --python fit_face_blender.py -- jac prefix weights.json render_lmk.npy
    maps render landmarks to the surface and writes A0 (2D anchors) and J (2D per-unit-weight deltas per variable)
"""
import bpy, sys, os, glob, json, math, importlib
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
stage, prefix, wfile = argv[0], argv[1], argv[2]
bpy.ops.preferences.addon_enable(module='bl_ext.user_default.mpfb')
mpfb = importlib.import_module('bl_ext.user_default.mpfb')
from bl_ext.user_default.mpfb.services.targetservice import TargetService

CATS = ['head', 'eyes', 'nose', 'mouth', 'cheek', 'chin', 'forehead', 'eyebrows', 'neck']
TD = os.path.join(os.path.dirname(mpfb.__file__), 'data', 'targets')
stems = {}
for c in CATS:
    for p in glob.glob(f'{TD}/{c}/*.target.gz'):
        st = os.path.basename(p)[:-10]
        var = st[2:] if st.startswith(('l-', 'r-')) else st      # tie left/right into one variable
        stems.setdefault(var, []).append((st, p))
VARS = sorted(stems)
W = json.load(open(wfile)) if os.path.exists(wfile) else {}

sc = bpy.context.scene
body = [o for o in sc.objects if o.name.endswith('.body')][0]
for v in VARS:
    for st, p in stems[v]:
        if body.data.shape_keys is None or st not in body.data.shape_keys.key_blocks:
            TargetService.load_target(body, p, weight=0.0, name=st)
        body.data.shape_keys.key_blocks[st].value = W.get(v, 0.0)

RES, ORTHO = 1024, 0.30
eyes = [o for o in sc.objects if 'high-poly' in o.name][0]

def mesh_now():
    mods = [(m, m.show_viewport) for m in body.modifiers]
    for m, _ in mods: m.show_viewport = False
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    me = body.evaluated_get(dg).to_mesh()
    co = np.array([v.co[:] for v in me.vertices]); tris = []
    for p in me.polygons:
        vs = list(p.vertices)
        for i in range(1, len(vs) - 1): tris.append((vs[0], vs[i], vs[i + 1]))
    body.evaluated_get(dg).to_mesh_clear()
    for m, s in mods: m.show_viewport = s
    return co, np.array(tris)

co, tris = mesh_now()
# face frame from the eye objects (rest pose, armature not involved)
gi = {g.name: g.index for g in body.vertex_groups}
def grp_center(name):
    idx = [v.index for v in body.data.vertices if any(g.group == gi[name] and g.weight > 0.5 for g in v.groups)]
    return co[idx].mean(0)
ec = (grp_center('helper-l-eye') + grp_center('helper-r-eye')) / 2
center = np.array([0.0, ec[1], ec[2] - 0.035])

def to_px(p):
    return np.stack([(p[..., 0] - center[0]) / ORTHO * RES + RES / 2, RES / 2 - (p[..., 2] - center[2]) / ORTHO * RES], -1)

if stage == 'render':
    for o in sc.objects:
        if o.type == 'MESH' and o is not body and not any(k in o.name for k in ('high-poly', 'eyelash')):
            o.hide_render = True
    # neutral skin so detection follows the geometry, not a painted face
    m = body.material_slots[0].material
    for n in m.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image:
            n.image = bpy.data.images.load('/opt/mpfb/data/skins/toigo_light_skin_female_bronze_with_makeup/young_lightskinned_female_diffuse6.png')
    for m in body.modifiers:
        if m.type == 'ARMATURE': m.show_render = False
    cam = bpy.data.objects.new('pcam', bpy.data.cameras.new('pcam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = ORTHO
    cam.location = (center[0], center[1] - 1.0, center[2]); cam.rotation_euler = (math.pi / 2, 0, 0)
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.device = 'CPU'
    sc.render.resolution_x = sc.render.resolution_y = RES
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.85, 0.85, 0.85, 1)
    sc.render.filepath = prefix + '_front.png'
    bpy.ops.render.render(write_still=True)
    print('RENDERED')

if stage == 'jac':
    Rl = np.load(argv[3])
    bvh = BVHTree.FromPolygons([Vector(c) for c in co], [tuple(t) for t in tris])
    anchors = []
    for x, y in Rl:
        wx = center[0] + (x - RES / 2) / RES * ORTHO
        wz = center[2] - (y - RES / 2) / RES * ORTHO
        loc, nrm, ti, d = bvh.ray_cast(Vector((wx, center[1] - 1.0, wz)), Vector((0, 1, 0)))
        if loc is None:
            anchors.append(None); continue
        a, b, c = co[tris[ti]]
        v0, v1, v2 = b - a, c - a, np.array(loc) - a
        d00, d01, d11, d20, d21 = v0 @ v0, v0 @ v1, v1 @ v1, v2 @ v0, v2 @ v1
        den = d00 * d11 - d01 * d01
        bb = (d11 * d20 - d01 * d21) / den; cc = (d00 * d21 - d01 * d20) / den
        anchors.append((tris[ti], np.array([1 - bb - cc, bb, cc])))
    ok = np.array([a is not None for a in anchors])
    A0 = np.zeros((len(anchors), 2)); J = np.zeros((len(anchors), 2, len(VARS)))
    kb = body.data.shape_keys.key_blocks
    basis = np.array([v.co[:] for v in kb[0].data])
    deltas = {}
    for v in VARS:
        d = np.zeros_like(basis)
        for st, _ in stems[v]:
            d += np.array([x.co[:] for x in kb[st].data]) - basis
        deltas[v] = d
    for i, a in enumerate(anchors):
        if a is None: continue
        t, bw = a
        p = (co[t] * bw[:, None]).sum(0)
        A0[i] = [p[0], -p[2]]
        for j, v in enumerate(VARS):
            dp = (deltas[v][t] * bw[:, None]).sum(0)
            J[i, :, j] = [dp[0], -dp[2]]
    bidx = [v.index for v in body.data.vertices if any(g.group == gi['body'] and g.weight > 0.5 for g in v.groups)]
    crown = bidx[int(np.argmax(co[bidx, 2]))]
    eidx = [v.index for v in body.data.vertices if any(g.group in (gi['helper-l-eye'], gi['helper-r-eye']) and g.weight > 0.5 for g in v.groups)]
    crownJ = np.array([deltas[v][crown, 2] for v in VARS]); eyeJ = np.array([deltas[v][eidx, 2].mean() for v in VARS])
    np.savez(prefix + '_jac.npz', A0=A0, J=J, ok=ok, vars=np.array(VARS), crown=co[crown, 2], crownJ=crownJ, eye=co[eidx, 2].mean(), eyeJ=eyeJ)
    print('JAC', ok.sum(), len(VARS))

if stage == 'prof':
    kb = body.data.shape_keys.key_blocks
    basis = np.array([v.co[:] for v in kb[0].data])
    body_idx = [v.index for v in body.data.vertices if any(g.group == gi['body'] and g.weight > 0.5 for g in v.groups)]
    mid = [i for i in body_idx if abs(co[i, 0]) < 0.0015 and co[i, 1] < ec[1] + 0.02 and co[i, 2] > ec[2] - 0.20 and co[i, 2] < ec[2] + 0.09]
    Jp = np.zeros((len(mid), 2, len(VARS)))
    for j, v in enumerate(VARS):
        d = np.zeros_like(basis)
        for st, _ in stems[v]:
            d += np.array([x.co[:] for x in kb[st].data]) - basis
        Jp[:, 0, j] = d[mid, 1]; Jp[:, 1, j] = d[mid, 2]
    np.savez(prefix + '_prof.npz', P0=co[mid][:, [1, 2]], J=Jp, vars=np.array(VARS), eye=ec)
    print('PROF', len(mid))
