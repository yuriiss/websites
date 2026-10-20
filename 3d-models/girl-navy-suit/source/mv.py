import sys, shutil, glob, os, time
from gradio_client import Client, handle_file
out, front, left, back, octree = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])
steps = int(sys.argv[6]) if len(sys.argv) > 6 else 5
c = Client('tencent/Hunyuan3D-2mv', verbose=False)
t = time.time()
r = c.predict(caption=None, image=None, mv_image_front=handle_file(front), mv_image_back=handle_file(back) if back != '-' else None,
              mv_image_left=handle_file(left) if left != '-' else None, mv_image_right=None,
              steps=steps, guidance_scale=5.0, seed=1234, octree_resolution=octree, check_box_rembg=True,
              num_chunks=8000, randomize_seed=False, api_name='/shape_generation')
f = r[0]; p = f.get('value', f) if isinstance(f, dict) else f
if isinstance(p, dict): p = p.get('path')
shutil.copy(p, out); print('OK', out, os.path.getsize(out), r[2], round(time.time() - t), 's')
