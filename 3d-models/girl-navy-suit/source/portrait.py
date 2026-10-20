"""Photo-matched portrait: far telephoto camera, soft frontal light. usage: -- out.png [exposure] [lens]"""
import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
out = argv[0]; expo = float(argv[1]) if len(argv) > 1 else 0.0; lens = float(argv[2]) if len(argv) > 2 else 600
sc = bpy.context.scene
for o in list(sc.objects):
    if o.type in ('LIGHT', 'CAMERA'): bpy.data.objects.remove(o)
for o in sc.objects:
    if o.name == 'Floor': o.hide_render = True
eye = [o for o in sc.objects if 'high-poly' in o.name][0]
dg = bpy.context.evaluated_depsgraph_get(); ev = eye.evaluated_get(dg); m = ev.to_mesh()
pts = [eye.matrix_world @ v.co for v in m.vertices]; ev.to_mesh_clear()
ez = sum(p.z for p in pts) / len(pts); ey = min(p.y for p in pts)
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.78, 0.78, 0.79, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
def area(loc, energy, size):
    l = bpy.data.objects.new('L', bpy.data.lights.new('L', 'AREA')); sc.collection.objects.link(l)
    l.data.energy = energy; l.data.size = size; l.location = loc
    l.rotation_euler = (Vector((0, ey, ez)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area((0.4, -2.5, ez + 0.6), 260, 3.0)
area((-1.5, -2.0, ez), 90, 3.0)
cam = bpy.data.objects.new('C', bpy.data.cameras.new('C')); sc.collection.objects.link(cam); sc.camera = cam
d = 8.0; cam.location = (0, ey - d, ez - 0.035); cam.rotation_euler = (math.pi / 2, 0, 0); cam.data.lens = lens
cam.data.clip_end = 100
sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = expo
sc.render.resolution_x, sc.render.resolution_y = 640, 800
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
