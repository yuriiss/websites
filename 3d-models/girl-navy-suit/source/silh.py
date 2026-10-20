"""Flat silhouette renders (front & side), framed from the floor to the head top. usage: -- prefix"""
import bpy, sys, math
from mathutils import Vector
pre = sys.argv[sys.argv.index('--') + 1]
sc = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()
top = 0.0
for o in sc.objects:
    if o.type == 'MESH' and not o.hide_render:
        ev = o.evaluated_get(dg); m = ev.to_mesh()
        top = max(top, max((o.matrix_world @ v.co).z for v in m.vertices)); ev.to_mesh_clear()
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'FLAT'; sc.display.shading.color_type = 'SINGLE'; sc.display.shading.single_color = (0, 0, 0)
sc.display.shading.show_object_outline = False
w = bpy.data.worlds.new('W'); sc.world = w; w.color = (1, 1, 1)
sc.view_settings.view_transform = 'Standard'
cam = bpy.data.objects.new('scam', bpy.data.cameras.new('scam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = top * 1.1
sc.render.resolution_x, sc.render.resolution_y = 700, 1000
for name, ang in (('F', 0), ('S', 90)):
    a = math.radians(ang); cam.location = (5 * math.sin(a), -5 * math.cos(a), top / 2); cam.rotation_euler = (math.pi / 2, 0, a)
    sc.render.filepath = f'{pre}_sil{name}.png'; bpy.ops.render.render(write_still=True)
print('TOP', top)
# textured front ortho for landmark detection
sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'TEXTURE'
sc.render.resolution_x, sc.render.resolution_y = 1400, 2000
cam.location = (0, -5, top / 2); cam.rotation_euler = (math.pi / 2, 0, 0)
sc.render.filepath = f'{pre}_texF.png'; bpy.ops.render.render(write_still=True)
