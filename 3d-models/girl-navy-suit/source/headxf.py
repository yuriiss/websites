"""Recompute the head->body transform used in single*.py and save its parameters (plus head-frame view mids)."""
import bpy, sys, json, math
import numpy as np
R = '/tmp/claude-0/-home-user-websites/6ced9f81-a79c-592c-bda6-fa760dcc36a5/scratchpad/'
src = open(R + 'recon/single5.py').read()
pre = src.split("def photo(c):")[0]          # imports, args, imp(), extents, head transform (applied)
sys.argv = ['x', '--', R + 'recon/body_mv512.glb', R + 'recon/head_b.glb', '/dev/null']
exec(pre)
# ch: original head coords; nyS etc defined in the executed code
c0 = float(nyS.mean() - ((ch[:, 1] - my_h) * kF).mean())
mids = {}
for name, ang in {'front': 0, 'left': 90, 'back': 180, 'right': 270}.items():
    a = math.radians(ang); u = ch @ np.array([math.cos(a), math.sin(a), 0]); mids[name] = float((u.min() + u.max()) / 2)
json.dump(dict(mx_b=float(mx_b), my_b=float(my_b), zlo_b=float(zlo_b), zhi_b=float(zhi_b), sbF=float(sbF),
               mx_h=float(mx_h), my_h=float(my_h), zlo_h=float(zlo_h), zhi_h=float(zhi_h), shF=float(shF), kF=float(kF), c0=c0,
               mids=mids), open(R + 'recon/headxf.json', 'w'), indent=1)
print('HEADXF', kF, c0)
