"""Joint face fit: frontal landmarks + side profile.
usage: solve_face2.py prefix weights_in.json weights_out.json [lambda] [profile_weight]"""
import sys, json, os, re, numpy as np
from scipy.optimize import lsq_linear
pre, win, wout = sys.argv[1:4]
lam = float(sys.argv[4]) if len(sys.argv) > 4 else 1.5e-4
pw = float(sys.argv[5]) if len(sys.argv) > 5 else 1.5

d = np.load(pre + '_jac.npz'); A0, J, ok, V = d['A0'][d['ok']], d['J'][d['ok']], d['ok'], list(d['vars'])
CR, CRJ, EY, EYJ = float(d['crown']), d['crownJ'], float(d['eye']), d['eyeJ']
okidx = np.where(d['ok'])[0]; i152 = int(np.where(okidx == 152)[0][0])
CROWN_RATIO = float(os.environ.get('CROWN_RATIO', '1.10'))
Pf = np.load('up_lmk.npy')[ok]
dp = np.load(pre + '_prof.npz'); Q0, JQ, eye = dp['P0'], dp['J'], dp['eye']
assert list(dp['vars']) == V
W0 = json.load(open(win)) if os.path.exists(win) else {}
w0 = np.array([W0.get(v, 0.0) for v in V])

# order midline vertices along the profile (angle around a point behind the face)
c = np.array([eye[1] + 0.09, eye[2] - 0.03])
ang = np.arctan2(Q0[:, 1] - c[1], -(Q0[:, 0] - c[0]))
order = np.argsort(-ang); Q0, JQ = Q0[order], JQ[order]

prof = np.load('side_profile.npy')
nose_r = int(np.argmin(np.where(prof > 0, prof, 9999)))
rows = np.arange(nose_r - 290, nose_r + 360, 3)
rows = rows[prof[rows] > 0]
S = np.stack([prof[rows].astype(float), rows.astype(float)], 1)   # photo (x right=back, y down)
chin_r = nose_r + 150 + int(np.argmin(prof[nose_r + 150:nose_r + 260]))

def model_f(w): return A0 + np.einsum('nkj,j->nk', J, w - w0)
def model_p(w): return Q0 + np.einsum('nkj,j->nk', JQ, w - w0)

def sim_fit(src, dst):
    ms, md = src.mean(0), dst.mean(0); s0, d0 = src - ms, dst - md
    U, Sg, Vt = np.linalg.svd(d0.T @ s0); R = U @ Vt
    sc = Sg.sum() / (s0 ** 2).sum()
    return lambda p: (sc * (R @ (p - ms).T)).T + md

def side_map(w, init=None):
    """map photo profile pts into model (y, z); start from nose/chin match then ICP."""
    Q = model_p(w)
    qn = Q[np.argmin(Q[:, 0])]
    zc_mask = (Q[:, 1] < qn[1] - 0.03) & (Q[:, 1] > qn[1] - 0.075)
    qc = Q[zc_mask][np.argmin(Q[zc_mask][:, 0])]
    sn = np.array([prof[nose_r], nose_r], float); scn = np.array([prof[chin_r], chin_r], float)
    s = (qn[1] - qc[1]) / (scn[1] - sn[1])
    f = lambda p: np.stack([qn[0] + (p[:, 0] - sn[0]) * s, qn[1] - (p[:, 1] - sn[1]) * s], 1)
    T = f(S)
    for _ in range(15):
        dd = ((T[:, None, :] - Q[None]) ** 2).sum(-1); nn = dd.argmin(1)
        g = sim_fit(T, Q[nn]); T = g(T)
    return T

def seg_resid(T, w):
    """linearised point-to-polyline residual rows: n.(t - p(w))"""
    Q = model_p(w); rows_M, rows_b = [], []
    for t in T:
        best = None
        for i in range(len(Q) - 1):
            a, b = Q[i], Q[i + 1]; ab = b - a; L2 = ab @ ab
            if L2 < 1e-12: continue
            u = np.clip((t - a) @ ab / L2, 0, 1); p = a + u * ab; dist = ((t - p) ** 2).sum()
            if best is None or dist < best[0]: best = (dist, i, u, ab)
        _, i, u, ab = best
        n = np.array([-ab[1], ab[0]]) / np.linalg.norm(ab)
        Jp = (1 - u) * JQ[i] + u * JQ[i + 1]
        p = (1 - u) * Q[i] + u * Q[i + 1]
        rows_M.append(n @ Jp); rows_b.append(n @ (t - p) + n @ Jp @ w)
    return np.array(rows_M), np.array(rows_b)

hi = np.ones(len(V))
for j, v in enumerate(V):
    if re.match(r'^(nose|mouth|head|eyebrows|chin|forehead|neck)-trans-(in|out)$', v) or v.startswith(('head-trans', 'head-angle')):
        hi[j] = 1e-9
w = w0.copy()
for it in range(6):
    Tf = sim_fit(Pf, model_f(w))(Pf)
    Ts = side_map(w)
    Mp, bp = seg_resid(Ts, w)
    ef = np.sqrt(((Tf - model_f(w)) ** 2).sum(1).mean()) * 1000
    es = np.sqrt(((Mp @ w - bp) ** 2).mean()) * 1000
    print(f'it {it}: frontal rms {ef:.2f} mm, profile rms {es:.2f} mm')
    Mf = J.reshape(-1, len(V)); bf = (Tf - A0).reshape(-1) + Mf @ w0
    # crown height above the eyes = CROWN_RATIO * (eye - chin)   [model z; A0 stores -z]
    # crown(w) - eye(w) - r*(eye(w) - chin(w)) = 0, chin z = -A0[i152,1] - J[i152,1] (w-w0)
    rc = CRJ - EYJ - CROWN_RATIO * (EYJ + J[i152, 1])
    bc = -(CR - EY - CROWN_RATIO * (EY + A0[i152, 1])) + rc @ w0
    cw = 8.0
    print(f'   crown/eye-chin ratio now: {(CR + CRJ @ (w - w0) - EY - EYJ @ (w - w0)) / (EY + EYJ @ (w - w0) + A0[i152,1] + J[i152,1] @ (w - w0)):.2f}')
    M = np.vstack([Mf, pw * Mp, cw * rc[None], np.sqrt(lam) * np.eye(len(V))])
    b = np.concatenate([bf, pw * bp, [cw * bc], np.zeros(len(V))])
    w = lsq_linear(M, b, bounds=(np.zeros(len(V)), hi)).x
np.save(pre + '_side_T.npy', side_map(w))
out = {v: round(float(x), 4) for v, x in zip(V, w) if x > 0.005}
json.dump(out, open(wout, 'w'), indent=1)
for k, v in sorted(out.items(), key=lambda kv: -kv[1])[:30]: print(f'  {k:40s} {v:.3f}')
