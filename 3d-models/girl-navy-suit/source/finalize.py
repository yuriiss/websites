import bpy, sys, os, math
import numpy as np
from mathutils import Vector
OUTDIR = sys.argv[sys.argv.index('--') + 1]; os.makedirs(OUTDIR, exist_ok=True)
sc = bpy.context.scene
head, body = bpy.data.objects['Head'], bpy.data.objects['Body']
for ob, n in ((head, 380000), (body, 520000)):
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    if len(ob.data.polygons) > n:
        d = ob.modifiers.new('d', 'DECIMATE'); d.ratio = n / len(ob.data.polygons); bpy.ops.object.modifier_apply(modifier='d')
    for p in ob.data.polygons: p.use_smooth = True
    bs = ob.material_slots[0].material.node_tree.nodes['Principled BSDF']
    bs.inputs['Roughness'].default_value = 0.85; bs.inputs['Specular IOR Level'].default_value = 0.2
# real-world: 1.76 m tall including heels, feet on the floor, centred, facing -Y
c = np.concatenate([np.array([v.co[:] for v in o.data.vertices]) for o in (head, body)])
S = 1.76 / (c[:, 2].max() - c[:, 2].min()); off = Vector(((c[:, 0].min() + c[:, 0].max()) / 2, (c[:, 1].min() + c[:, 1].max()) / 2, c[:, 2].min()))
for o in (head, body):
    for v in o.data.vertices: v.co = (v.co - off) * S
    o.data.update()
head.name = 'Girl_Head'; body.name = 'Girl_Body'
w = bpy.data.worlds.new('Studio'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.8, 0.8, 0.82, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.9
def area(name, loc, e, size):
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'AREA')); l.data.energy = e; l.data.size = size; sc.collection.objects.link(l)
    l.location = loc; l.rotation_euler = (Vector((0, 0, 1.2)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area('Key', (1.5, -3.0, 2.4), 250, 3.0); area('Fill', (-2.5, -2.0, 1.6), 100, 3.0)
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -6.0, 0.9); cam.rotation_euler = (math.pi / 2, 0, 0); cam.data.lens = 60
sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 1080, 1620; sc.view_settings.view_transform = 'Standard'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTDIR, 'girl_navy_suit.blend'), compress=True)
bpy.ops.object.select_all(action='DESELECT'); head.select_set(True); body.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUTDIR, 'girl_navy_suit.glb'), export_format='GLB', use_selection=True,
                          export_image_format='JPEG', export_jpeg_quality=92, export_yup=True)
print('FINAL', len(head.data.polygons), len(body.data.polygons))
