"""Build the MPFB character. Usage: blender -b --python human.py -- params.json out.blend"""
import bpy, sys, json, math, importlib
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
P = json.load(open(argv[0]))
OUT = argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.preferences.addon_enable(module='bl_ext.user_default.mpfb')
mpfb = importlib.import_module('bl_ext.user_default.mpfb')
from bl_ext.user_default.mpfb.services.humanservice import HumanService

import glob, os
TD = os.path.join(os.path.dirname(mpfb.__file__), 'data', 'targets')
STEMS = {os.path.basename(p)[:-10] for p in glob.glob(TD + '/**/*.target.gz', recursive=True)}
targets = []
for k, v in P["targets"].items():
    if '|' in k:
        pre, rest = k.split('|', 1)
        neg = pre.rsplit('-', 1)[1]; base = pre.rsplit('-', 1)[0]
        stem = base + '-' + (neg if v < 0 else rest); v = abs(v)
    else:
        stem = k
    names = [stem] if stem in STEMS else [x for x in ('l-' + stem, 'r-' + stem) if x in STEMS]
    if not names:
        print('MISSING TARGET', k)
    targets += [{"target": n, "value": v} for n in names]
info = {
    "name": "Girl",
    "phenotype": P["phenotype"],
    "targets": targets,
    "rig": "default",
    "eyes": "high-poly/high-poly.mhclo",
    "eyebrows": P.get("eyebrows", "eyebrow001/eyebrow001.mhclo"),
    "eyelashes": "eyelashes01/eyelashes01.mhclo",
    "teeth": "teeth_base/teeth_base.mhclo",
    "tongue": "tongue01/tongue01.mhclo",
    "hair": P.get("hair", "long01/long01.mhclo"),
    "clothes": P.get("clothes", []),
    "skin_mhmat": P["skin"],
    "skin_material_type": P.get("skin_type", "ENHANCED_SSS"),
    "eyes_material_type": "PROCEDURAL_EYES",
    "eyes_material_settings": P.get("eyes_settings", {}),
    "clothes_material_type": "MAKESKIN",
}
settings = HumanService.get_default_deserialization_settings()
settings["subdiv_levels"] = 1
settings["scale"] = 0.1
body = HumanService.deserialize_from_dict(info, settings)
def tint(obj, rgb):
    for slot in obj.material_slots:
        m = slot.material
        if not m or not m.use_nodes: continue
        nt = m.node_tree
        for n in list(nt.nodes):
            if n.type == 'BSDF_PRINCIPLED' and n.inputs['Base Color'].links:
                src = n.inputs['Base Color'].links[0].from_socket
                mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
                mx.inputs['Factor'].default_value = 1.0; mx.inputs[7].default_value = rgb
                nt.links.new(src, mx.inputs[6]); nt.links.new(mx.outputs[2], n.inputs['Base Color'])
for o in bpy.data.objects:
    for key, rgb in P.get("tints", {}).items():
        if key in o.name.lower():
            tint(o, rgb)
for o in bpy.data.objects:
    if 'eyebrow' in o.name:
        nt = o.material_slots[0].material.node_tree
        bs = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'][0]
        if bs.inputs['Alpha'].links:
            src = bs.inputs['Alpha'].links[0].from_socket
            pw = nt.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = P.get('brow_alpha_pow', 0.55)
            nt.links.new(src, pw.inputs[0]); nt.links.new(pw.outputs[0], bs.inputs['Alpha'])
import bmesh
for key, rules in P.get('clothes_cut', {}).items():
    for o in [o for o in bpy.data.objects if key in o.name and o.type == 'MESH']:
        bm = bmesh.new(); bm.from_mesh(o.data); uvl = bm.loops.layers.uv.active
        kill = []
        for f in bm.faces:
            u = sum(l[uvl].uv.x for l in f.loops) / len(f.loops); v = sum(l[uvl].uv.y for l in f.loops) / len(f.loops)
            for u0, v0, u1, v1, mode in rules:
                inside = u0 <= u <= u1 and v0 <= v <= v1
                if (mode == 'inside') == inside:
                    kill.append(f); break
        bmesh.ops.delete(bm, geom=kill, context='FACES')
        bm.to_mesh(o.data); bm.free(); print('CUT', o.name, len(kill))
rig = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
hs = P.get('hair_stretch')
if hs:
    zs0, k0 = hs
    h = [o for o in bpy.data.objects if 'girl_hair' in o.name][0]
    for v in h.data.vertices:
        if v.co.z < zs0:
            f_ = min(1.0, max(0.0, (v.co.y + 0.08) / 0.07)); f_ = f_ * f_ * (3 - 2 * f_)
            kk = 1.0 + (k0 - 1.0) * (0.25 + 0.75 * f_)
            v.co.z = zs0 - (zs0 - v.co.z) * kk
sl = P.get('skirt_slit')
if sl:
    dz, half = sl
    o = [o for o in bpy.data.objects if 'girl_skirt' in o.name][0]
    bm = bmesh.new(); bm.from_mesh(o.data)
    zmin = min(v.co.z for v in bm.verts); zt = zmin + dz
    print('SKIRT zmin', zmin)
    kill = [f for f in bm.faces if (lambda c: c.y > 0 and c.z < zt and abs(c.x) < half * (zt - c.z) / (zt - zmin) + 0.002)(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(o.data); bm.free(); print('SLIT', len(kill))
hf = P.get('hair_flatten')
if hf:
    from mathutils.kdtree import KDTree
    zfrom, maxoff = hf
    h = [o for o in bpy.data.objects if 'girl_hair' in o.name][0]
    bmv = body.data.vertices
    gi_ = {g.name: g.index for g in body.vertex_groups}
    kd = KDTree(len(bmv))
    for v in bmv:
        if v.co.z > zfrom - 0.05 and any(g.group == gi_['body'] and g.weight > 0.5 for g in v.groups): kd.insert(v.co, v.index)
    kd.balance()
    for v in h.data.vertices:
        if v.co.z > zfrom:
            co_, idx, dist = kd.find(v.co)
            if dist > maxoff:
                t = min(1.0, (v.co.z - zfrom) / 0.04)
                target = co_ + (v.co - co_).normalized() * maxoff
                v.co = v.co.lerp(target, t)
hw = P.get('hair_wave')
if hw:
    zs, amp, freq, flare = hw
    h = [o for o in bpy.data.objects if 'girl_hair' in o.name][0]
    cy = sum(v.co.y for v in h.data.vertices) / len(h.data.vertices)
    zmin = min(v.co.z for v in h.data.vertices)
    for v in h.data.vertices:
        if v.co.z < zs:
            t = min(1.0, (zs - v.co.z) / (zs - zmin))
            r = Vector((v.co.x, v.co.y - cy, 0))
            if r.length < 1e-6: continue
            r.normalize()
            ph = 3.0 * math.atan2(v.co.y - cy, v.co.x)
            off = amp * (t ** 0.7) * math.sin(freq * (zs - v.co.z) + ph) + flare * t * t
            v.co += r * off
# lengthen skirt: stretch everything below the hip downward
sk = P.get('skirt_stretch')
if sk:
    o = [o for o in bpy.data.objects if 'girl_skirt' in o.name][0]
    ztop, k, taper = sk
    zs = [v.co.z for v in o.data.vertices]; zmin = min(zs)
    for v in o.data.vertices:
        if v.co.z < ztop:
            t = (ztop - v.co.z) / (ztop - zmin)
            v.co.z = ztop - (ztop - v.co.z) * k
            v.co.x *= (1 - taper * t); v.co.y = v.co.y * (1 - taper * 0.6 * t)
    side_min = min(v.co.z for v in o.data.vertices if abs(v.co.x) > 0.07)
    for v in o.data.vertices:
        if v.co.z < side_min: v.co.z = side_min
# V-neck: remove shirt faces in a V and unmask the skin there
vn = P.get('vneck')
if vn:
    zv, slope, zmaxv = vn
    def in_v(co):
        return co.z > zv and abs(co.x) < (co.z - zv) * slope and co.y < 0.02 and co.z < zmaxv
    o = [o for o in bpy.data.objects if 'girl_blazer' in o.name][0]
    img = [n.image for n in o.material_slots[0].material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and 'NRM' not in n.image.name and 'SPEC' not in n.image.name][0]
    W, H = img.size; px = img.pixels[:]
    bm = bmesh.new(); bm.from_mesh(o.data); uvl = bm.loops.layers.uv.active
    kill = []
    for f in bm.faces:
        u = sum(l[uvl].uv.x for l in f.loops) / len(f.loops); v = sum(l[uvl].uv.y for l in f.loops) / len(f.loops)
        i = (min(H - 1, int(v * H)) * W + min(W - 1, int(u * W))) * 4
        bright = (px[i] + px[i + 1] + px[i + 2]) / 3 > 0.5
        c = f.calc_center_median()
        if (bright and in_v(c) and c.z > zv + P.get('vneck_shirt_offset', 0.0)) or (c.z > zv and abs(c.x) < (c.z - zv) * slope * P.get('vneck_inner', 0.0) and c.y < 0.02 and c.z < zmaxv):
            kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(o.data); bm.free(); print('VNECK', len(kill))
    g = body.vertex_groups.get('Delete.girl_blazer')
    def chest(co):
        return co.z > zv - 0.02 and co.z < zmaxv and abs(co.x) < (co.z - zv + 0.02) * slope * 1.5 + 0.032 and co.y < 0.0
    g.remove([v.index for v in body.data.vertices if in_v(body.matrix_world @ v.co) or chest(body.matrix_world @ v.co)])
for gname, zmax in P.get('unmask', {}).items():
    g = body.vertex_groups.get(gname)
    if g:
        if zmax >= 0:
            idx = [v.index for v in body.data.vertices if (body.matrix_world @ v.co).z < zmax]
        else:
            idx = [v.index for v in body.data.vertices if (body.matrix_world @ v.co).z > -zmax]
        g.remove(idx); print('UNMASK', gname, len(idx))
for bn, rot in P.get('pose', {}).items():
    pb = rig.pose.bones[bn]; pb.rotation_mode = 'XYZ'
    pb.rotation_euler = [math.radians(r) for r in rot]
from mathutils import Matrix
bpy.context.view_layer.update()
for bn, (axis, ang) in P.get('pose_world', {}).items():
    pb = rig.pose.bones[bn]
    Mw = (rig.matrix_world @ pb.matrix).to_3x3().normalized()   # current pose orientation (parents applied)
    Rw = Matrix.Rotation(math.radians(ang), 3, axis)
    Mb = rig.data.bones[bn].matrix_local.to_3x3()
    # delta in bone local space so that the bone rotates by Rw in world space
    local = Mw.inverted() @ Rw @ Mw
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = (pb.rotation_quaternion.to_matrix() @ local).to_quaternion() if pb.rotation_mode == 'QUATERNION' else local.to_quaternion()
    bpy.context.view_layer.update()
lg = P.get('lift_to_ground')
if lg is not None:
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg); m = ev.to_mesh()
    mz = min((body.matrix_world @ v.co).z for v in m.vertices); ev.to_mesh_clear()
    rig.location.z += lg - mz; print('LIFT', lg - mz)
    bpy.context.view_layer.update()
    if P.get('sandals'):
        exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shoes.py')).read())
        build_sandals(body, rig, rig.location.z)
print('BODY', body.name, body.dimensions[:])
json.dump([o.name for o in bpy.data.objects], sys.stdout); print()
bpy.ops.wm.save_as_mainfile(filepath=OUT)
