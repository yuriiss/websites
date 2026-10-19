"""Project the (upscaled) photo face onto the MPFB body texture.

stage render: blender -b human.blend --python project_face.py -- render out_prefix
stage bake:   blender -b human.blend --python project_face.py -- bake out_prefix render_lmk.npy photo_lmk.npy photo.png
"""
import bpy, sys, json, math
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
stage, prefix = argv[0], argv[1]
sc = bpy.context.scene
body = [o for o in sc.objects if o.name.endswith('.body')][0]
RES = 1024
ORTHO = 0.30

def eval_coords():
    """World coords + normals of body verts with shape keys and pose, without subdivision."""
    mods = [(m, m.show_viewport) for m in body.modifiers if m.type != 'ARMATURE']
    for m, _ in mods: m.show_viewport = False
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    me = ev.to_mesh()
    co = np.array([body.matrix_world @ v.co for v in me.vertices])
    no = np.array([(body.matrix_world.to_3x3() @ v.normal).normalized() for v in me.vertices])
    ev.to_mesh_clear()
    for m, s in mods: m.show_viewport = s
    return co, no

co, no = eval_coords()
# face centre: midpoint between eyes (eye objects)
eyes = [o for o in sc.objects if 'high-poly' in o.name][0]
ec = sum((eyes.matrix_world @ Vector(c) for c in eyes.bound_box), Vector()) / 8
center = Vector((0, ec.y, ec.z - 0.035))

def to_px(p):
    """ortho front camera looking +Y: x right, z up."""
    x = (p[..., 0] - center.x) / ORTHO * RES + RES / 2
    y = RES / 2 - (p[..., 2] - center.z) / ORTHO * RES
    return np.stack([x, y], -1)

if stage == 'render':
    for o in sc.objects:
        if o.type == 'MESH' and any(k in o.name for k in ('long01', 'hair', 'eyebrow')):
            o.hide_render = True
    cam = bpy.data.objects.new('pcam', bpy.data.cameras.new('pcam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = ORTHO
    cam.location = (center.x, center.y - 1.0, center.z); cam.rotation_euler = (math.pi / 2, 0, 0)
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
    sc.render.resolution_x = sc.render.resolution_y = RES
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.8, 0.8, 0.8, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    sc.render.filepath = prefix + '_front.png'
    bpy.ops.render.render(write_still=True)
    print('RENDERED')

if stage == 'bake':
    from scipy.spatial import Delaunay
    from PIL import Image
    R = np.load(argv[2]); Pp = np.load(argv[3]); photo_path = argv[4]
    pimg = Image.open(photo_path); PW, PH = pimg.size
    tri = Delaunay(R)
    px = to_px(co)
    s = tri.find_simplex(px)
    # outside the hull: use the nearest landmark triangle (extrapolated affine)
    cent = R[tri.simplices].mean(1)
    out = s < 0
    if out.any():
        d = ((px[out, None, :] - cent[None]) ** 2).sum(-1)
        s[out] = d.argmin(1)
    T = tri.transform[s]
    b2 = np.einsum('nij,nj->ni', T[:, :2], px - T[:, 2])
    bary = np.c_[b2, 1 - b2.sum(1)]
    photo_xy = np.einsum('ni,nij->nj', bary, Pp[tri.simplices[s]])
    # weights: front facing, inside face hull, fade with distance outside
    from scipy.spatial import cKDTree
    hull_pts = R[np.unique(tri.convex_hull)]
    inside = tri.find_simplex(px) >= 0
    # stretch space vertically above the face centre so the fade reaches further up (forehead, brows)
    cy = R[:, 1].mean()
    def squash(p):
        q = p.copy(); up = q[:, 1] < cy
        q[up, 1] = cy + (q[up, 1] - cy) * 0.35
        return q
    hp = squash(R); tri2 = Delaunay(hp)
    pq = squash(px)
    inside = tri2.find_simplex(pq) >= 0
    dist_out = np.where(inside, 0, cKDTree(hp[np.unique(tri2.convex_hull)]).query(pq)[0])
    facing = np.clip(-no[:, 1], 0, 1)
    w = np.clip(1 - dist_out / 18.0, 0, 1) * np.clip((facing - 0.25) / 0.5, 0, 1)
    # only the face/head: above the chin line
    chin_z = co[:, 2][(px[:, 0] > R[:, 0].min()) & (px[:, 0] < R[:, 0].max())]
    w[co[:, 2] < center.z - 0.16] = 0
    me = body.data
    # uv layer with photo coordinates, colour attribute with weight
    uvl = me.uv_layers.get('photo') or me.uv_layers.new(name='photo')
    main_uv = [l for l in me.uv_layers if l.name != 'photo'][0].name
    li = np.array([l.vertex_index for l in me.loops])
    puv = np.c_[photo_xy[li, 0] / PW, 1 - photo_xy[li, 1] / PH]
    uvl.data.foreach_set('uv', puv.ravel())
    attr = me.color_attributes.get('pw') or me.color_attributes.new('pw', 'FLOAT_COLOR', 'POINT')
    attr.data.foreach_set('color', np.repeat(w, 4).astype(np.float32))
    for i in range(len(me.vertices)):
        attr.data[i].color = (w[i], w[i], w[i], 1)
    # bake material
    mat = bpy.data.materials.new('pbake'); mat.use_nodes = True
    nt = mat.node_tree; N = nt.nodes; Ln = nt.links; N.clear()
    outn = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission')
    uvn = N.new('ShaderNodeUVMap'); uvn.uv_map = 'photo'
    tex = N.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(photo_path); tex.extension = 'EXTEND'
    vc = N.new('ShaderNodeVertexColor'); vc.layer_name = 'pw'
    mtex = N.new('ShaderNodeTexImage'); mtex.image = bpy.data.images.load(argv[5]); mtex.extension = 'EXTEND'
    mtex.image.colorspace_settings.name = 'Non-Color'
    Ln.new(uvn.outputs[0], mtex.inputs[0])
    Ln.new(uvn.outputs[0], tex.inputs[0]); Ln.new(em.outputs[0], outn.inputs[0])
    tgt = N.new('ShaderNodeTexImage'); uvt = N.new('ShaderNodeUVMap'); uvt.uv_map = main_uv
    Ln.new(uvt.outputs[0], tgt.inputs[0])
    old = [s.material for s in body.material_slots]
    for i in range(len(body.material_slots)): body.material_slots[i].material = mat
    for m in body.modifiers:
        if m.type == 'SUBSURF': m.show_render = False
    me.uv_layers.active = me.uv_layers[main_uv]
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 1; sc.render.bake.margin = 8
    bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
    for name, link in (('color', tex.outputs[0]), ('weight', vc.outputs[0]), ('smask', mtex.outputs[0])):
        img = bpy.data.images.new('b_' + name, 2048, 2048, float_buffer=True); tgt.image = img; N.active = tgt
        Ln.new(link, em.inputs[0])
        bpy.ops.object.bake(type='EMIT')
        a = np.array(img.pixels[:]).reshape(2048, 2048, 4)[::-1, :, :3]
        np.save(f'{prefix}_bake_{name}.npy', a.astype(np.float32))
    print('BAKED', float(w.max()), int((w > 0.5).sum()))
