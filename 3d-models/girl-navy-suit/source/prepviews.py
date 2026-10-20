"""usage: prepviews.py outdir front.png left.png back.png"""
import sys, os, json, numpy as np
from PIL import Image
from scipy import ndimage as nd
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
res = {}
for name, path in zip(['front', 'left', 'back'], sys.argv[2:5]):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    mx = a.max(2); sat = mx - a.min(2)
    lab, _ = nd.label((sat < 16) & (mx > 135))
    border = set(np.unique(np.concatenate([lab[0], lab[:, 0], lab[:, -1]]))) - {0}   # not bottom: subject is cut there
    fg = ~np.isin(lab, list(border))
    fg = nd.binary_opening(fg, iterations=2)
    l2, k = nd.label(fg); fg = l2 == (np.argmax(nd.sum(fg, l2, range(1, k + 1))) + 1)
    fg = nd.binary_fill_holes(fg)
    ys, xs = np.where(fg)
    res[name] = dict(x0=int(xs.min()), x1=int(xs.max()), y0=int(ys.min()), y1=int(ys.max()), W=a.shape[1], H=a.shape[0])
    idx = nd.distance_transform_edt(~nd.binary_erosion(fg, iterations=3), return_distances=False, return_indices=True)
    Image.fromarray(a[idx[0], idx[1]].astype(np.uint8)).save(f'{out}/tex_{name}.png')
    Image.fromarray((fg * 255).astype(np.uint8)).save(f'{out}/mask_{name}.png')
Image.open(f'{out}/tex_left.png').transpose(Image.FLIP_LEFT_RIGHT).save(f'{out}/tex_right.png')
l = res['left']; res['right'] = dict(l, x0=l['W'] - 1 - l['x1'], x1=l['W'] - 1 - l['x0'])
json.dump(res, open(f'{out}/bbox.json', 'w'), indent=1); print(res)
