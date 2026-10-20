import bpy, sys, math
from mathutils import Vector
argv=sys.argv[sys.argv.index('--')+1:]; prefix=argv[0]; samples=int(argv[1]) if len(argv)>1 else 32
sc=bpy.context.scene
body=[o for o in sc.objects if o.name.endswith('.body')][0]
dg=bpy.context.evaluated_depsgraph_get()
pts=[o.matrix_world@Vector(c) for o in sc.objects if o.type=='MESH' and o.visible_get() for c in o.bound_box]
top=max(p.z for p in pts); bot=min(p.z for p in pts)
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=samples; sc.cycles.use_denoising=True
sc.view_settings.view_transform='AgX'
w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True
bg=w.node_tree.nodes['Background']; bg.inputs[0].default_value=(0.55,0.55,0.57,1); bg.inputs[1].default_value=0.6
def light(name,loc,energy,size):
    l=bpy.data.objects.new(name,bpy.data.lights.new(name,'AREA')); sc.collection.objects.link(l)
    l.data.energy=energy; l.data.size=size; l.location=loc
    d=Vector((0,0,top-0.3))-Vector(loc); l.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
light('key',(1.2,-2.5,2.3),260,2.0); light('fill',(-2,-2,1.5),110,3); light('rim',(0,2.5,2.5),200,2)
sc.view_settings.look='AgX - Medium High Contrast'; sc.view_settings.exposure=float(__import__('os').environ.get('EXPO','-1.3'))
cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera=cam
def shot(name,target,dist,lens,res,ang=0):
    a=math.radians(ang); cam.location=Vector((target.x+dist*math.sin(a),target.y-dist*math.cos(a),target.z))
    cam.rotation_euler=(math.pi/2,0,a); cam.data.lens=lens
    sc.render.resolution_x,sc.render.resolution_y=res; sc.render.filepath=f'{prefix}_{name}.png'
    bpy.ops.render.render(write_still=True)
eyeo=[o for o in sc.objects if 'high-poly' in o.name]
if eyeo:
    dg2=bpy.context.evaluated_depsgraph_get(); ev=eyeo[0].evaluated_get(dg2); mm=ev.to_mesh()
    ez=sum((eyeo[0].matrix_world@v.co).z for v in mm.vertices)/len(mm.vertices); ev.to_mesh_clear()
    face=Vector((0,0,ez-0.035))
else:
    face=Vector((0,0,top-0.13))
for a in (argv[2].split(',') if len(argv)>2 else ['face','body']):
    if a=='face': shot('face',face,0.9,85,(640,800))
    if a=='closeup': shot('closeup',face,0.9,135,(800,800))
    if a=='chest': shot('chest',Vector((0,0,top-0.35)),1.6,85,(700,700))
    if a=='feet': shot('feet',Vector((0,0,0.13)),1.4,85,(700,500),70)
    if a=='face3q': shot('face3q',face,0.9,85,(640,800),35)
    if a=='body': shot('body',Vector((0,0,(top+bot)/2)),4.2,50,(640,1100))
    if a=='side': shot('side',Vector((0,0,(top+bot)/2)),4.2,50,(640,1100),90)
    if a=='back': shot('back',Vector((0,0,(top+bot)/2)),4.2,50,(640,1100),180)
