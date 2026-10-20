import bpy, sys
import numpy as np
from scipy import ndimage as ndi
out = sys.argv[sys.argv.index('--') + 1]
for name in ('Head', 'Body'):
    ob = bpy.data.objects[name]
    img = [n.image for n in ob.material_slots[0].material.node_tree.nodes if n.type == 'TEX_IMAGE'][0]
    W, H = img.size; a = np.array(img.pixels[:], np.float32).reshape(H, W, 4)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bad = (g > r + 0.02) & (g > b + 0.02)
    bad = ndi.binary_dilation(bad, iterations=2)
    good = ~bad
    idx = ndi.distance_transform_edt(bad, return_distances=False, return_indices=True)
    for c in range(3):
        ch = a[..., c]; ch[bad] = ch[idx[0][bad], idx[1][bad]]
        sm = ndi.gaussian_filter(ch, 1.5); ch[bad] = sm[bad]
    img.pixels.foreach_set(a.ravel()); img.pack()
    print('DESPECK', name, int(bad.sum()))
bpy.ops.wm.save_as_mainfile(filepath=out)
