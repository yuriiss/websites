"""Finalise the character: save a packed .blend with a render-ready scene, then export a rigged .glb.
usage: blender -b final.blend --python export.py -- out_dir basename
"""
import bpy, sys, os, math
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, NAME = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
rig = [o for o in sc.objects if o.type == 'ARMATURE'][0]
rig.name = 'Girl_rig'; rig.data.name = 'Girl_rig'
TEXDIR = os.path.join(OUT, 'textures'); os.makedirs(TEXDIR, exist_ok=True)

# ---------------- scene for the .blend
for o in list(sc.objects):
    if o.type in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o)
w = bpy.data.worlds.new('Studio'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.55, 0.57, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
def light(name, loc, energy, size):
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'AREA')); sc.collection.objects.link(l)
    l.data.energy = energy; l.data.size = size; l.location = loc
    l.rotation_euler = (Vector((0, 0, 1.3)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
light('Key', (1.2, -2.5, 2.3), 260, 2.0); light('Fill', (-2, -2, 1.5), 110, 3); light('Rim', (0, 2.5, 2.5), 200, 2)
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -4.2, 0.88); cam.rotation_euler = (math.pi / 2, 0, 0); cam.data.lens = 50
sc.render.engine = 'CYCLES'; sc.cycles.samples = 128; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 1080, 1620
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = -1.3
floor_me = bpy.data.meshes.new('Floor'); floor_me.from_pydata([(-3, -3, 0), (3, -3, 0), (3, 3, 0), (-3, 3, 0)], [], [(0, 1, 2, 3)])
floor = bpy.data.objects.new('Floor', floor_me); sc.collection.objects.link(floor)
fm = bpy.data.materials.new('Floor'); fm.use_nodes = True
fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.5, 0.5, 0.52, 1)
floor_me.materials.append(fm); floor.is_shadow_catcher = True
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, NAME + '.blend'), compress=True)
print('SAVED BLEND')
bpy.data.objects.remove(floor)

# ---------------- simplify materials for glTF
def img_np(img):
    a = np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], img.channels)
    if img.channels == 3: a = np.dstack([a, np.ones(a.shape[:2], np.float32)])
    return a

def save_img(name, a):
    im = bpy.data.images.new(name, a.shape[1], a.shape[0], alpha=True)
    im.pixels.foreach_set(a.ravel()); im.filepath_raw = os.path.join(TEXDIR, name + '.png'); im.file_format = 'PNG'
    im.save(); im.pack(); return im

def upstream_image(sock, seen=None):
    """first image texture node feeding a socket (follows mix/math chains)."""
    seen = seen or set()
    for l in sock.links:
        n = l.from_node
        if n in seen: continue
        seen.add(n)
        if n.type == 'TEX_IMAGE': return n, l.from_socket.name
        for s in n.inputs:
            r = upstream_image(s, seen)
            if r: return r
    return None

def tint_of(sock):
    for l in sock.links:
        n = l.from_node
        if n.type == 'MIX' and n.blend_type == 'MULTIPLY':
            return tuple(n.inputs[7].default_value)[:3]
    return None

def pow_of(sock):
    for l in sock.links:
        n = l.from_node
        if n.type == 'MATH' and n.operation == 'POWER': return n.inputs[1].default_value
    return None

eye_tex = '/opt/mpfb/data/eyes/materials/brown_eye.png'
for ob in [o for o in sc.objects if o.type == 'MESH']:
    for slot in ob.material_slots:
        m = slot.material
        if not m or not m.use_nodes: continue
        nt = m.node_tree
        bs = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        new = bpy.data.materials.new(m.name + '_gltf'); new.use_nodes = True
        nb = new.node_tree.nodes['Principled BSDF']; N = new.node_tree.nodes; L = new.node_tree.links
        if bs is None:  # procedural eyes
            t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(eye_tex); t.image.pack()
            L.new(t.outputs['Color'], nb.inputs['Base Color']); nb.inputs['Roughness'].default_value = 0.15
            slot.material = new; continue
        nb.inputs['Roughness'].default_value = bs.inputs['Roughness'].default_value
        nb.inputs['Metallic'].default_value = bs.inputs['Metallic'].default_value
        bc = upstream_image(bs.inputs['Base Color'])
        if bc:
            tex = bc[0]; tint = tint_of(bs.inputs['Base Color']); apow = pow_of(bs.inputs['Alpha'])
            uses_alpha = bool(bs.inputs['Alpha'].links)
            if tint or apow:
                a = img_np(tex.image)
                if tint: a[..., :3] *= np.array(tint, np.float32) ** 1.0
                if apow: a[..., 3] = a[..., 3] ** apow
                im = save_img(ob.name.replace('.', '_') + '_basecolor', a)
            else:
                im = tex.image
                im.pack() if not im.packed_file else None
            t = N.new('ShaderNodeTexImage'); t.image = im
            L.new(t.outputs['Color'], nb.inputs['Base Color'])
            if uses_alpha and any(k in ob.name for k in ('hair', 'eyelash', 'eyebrow')):
                # alpha cut-out (glTF MASK): Round(alpha) is what the exporter recognises
                rnd = N.new('ShaderNodeMath'); rnd.operation = 'ROUND'
                L.new(t.outputs['Alpha'], rnd.inputs[0]); L.new(rnd.outputs[0], nb.inputs['Alpha'])
                new.blend_method = 'CLIP'
        else:
            nb.inputs['Base Color'].default_value = bs.inputs['Base Color'].default_value
        nm = next((n for n in nt.nodes if n.type == 'NORMAL_MAP'), None)
        if nm and nm.inputs['Color'].links:
            src = nm.inputs['Color'].links[0].from_node
            if src.type == 'TEX_IMAGE':
                t2 = N.new('ShaderNodeTexImage'); t2.image = src.image; t2.image.colorspace_settings.name = 'Non-Color'
                n2 = N.new('ShaderNodeNormalMap'); n2.inputs['Strength'].default_value = nm.inputs['Strength'].default_value
                L.new(t2.outputs['Color'], n2.inputs['Color']); L.new(n2.outputs['Normal'], nb.inputs['Normal'])
        slot.material = new

# ---------------- bake shape keys + modifiers, apply the pose as rest pose
bpy.ops.object.select_all(action='DESELECT')
meshes = [o for o in sc.objects if o.type == 'MESH']
for ob in meshes:
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    if ob.data.shape_keys:
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.delete_loose(); bpy.ops.object.mode_set(mode='OBJECT')
    for md in list(ob.modifiers):
        if md.type == 'SUBSURF': md.levels = md.render_levels
        if md.type != 'ARMATURE':
            bpy.ops.object.modifier_apply(modifier=md.name)
    arm = next(md for md in ob.modifiers if md.type == 'ARMATURE')
    bpy.ops.object.modifier_apply(modifier=arm.name)
    ob.select_set(False)
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')
for ob in meshes:
    md = ob.modifiers.new('Armature', 'ARMATURE'); md.object = rig
# remove empty helper vertex groups that are not bones (keeps the file lean)
bones = {b.name for b in rig.data.bones}
for ob in meshes:
    for g in list(ob.vertex_groups):
        if g.name not in bones: ob.vertex_groups.remove(g)

for im in bpy.data.images:
    if im.size[0] > 2048:
        im.scale(2048, 2048 * im.size[1] // im.size[0]); im.pack()
bpy.ops.object.select_all(action='DESELECT')
for o in meshes + [rig]: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, NAME + '.glb'), export_format='GLB', use_selection=True,
                          export_skins=True, export_morph=False, export_apply=False, export_animations=False,
                          export_image_format='AUTO', export_yup=True)
print('SAVED GLB', sum(len(o.data.polygons) for o in meshes), 'faces')
