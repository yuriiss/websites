import numpy as np, sys, os
from PIL import Image
prefix = sys.argv[1]
S = '/opt/mpfb/data/skins/'
src = [f for f in os.listdir(S + 'toigo_light_skin_female_bronze') if f.endswith('.png')][0]
base = np.asarray(Image.open(S + 'toigo_light_skin_female_bronze/' + src).convert('RGB')).astype(float) / 255
col = np.load(f'{prefix}_bake_color.npy'); w = np.load(f'{prefix}_bake_weight.npy')[..., 0]
col = np.where(col <= 0.0031308, col * 12.92, 1.055 * np.clip(col, 0, None) ** (1 / 2.4) - 0.055).clip(0, 1)
sm = np.load(f'{prefix}_bake_smask.npy')[..., 0]
w = np.clip(w * 1.7, 0, 1) * np.clip(sm, 0, 1)
w = np.clip(w, 0, 1); w = w * w * (3 - 2 * w)
ring = (w > 0.35) & (w < 0.9)
ratio = np.clip(col[ring].mean(0) / base[ring].mean(0), 0.5, 1.5)
print('ratio', ratio)
# match in linear space so shadows stay natural
from scipy.ndimage import gaussian_filter
# local colour match: low-frequency ratio photo/base near the face, global ratio elsewhere
sig = 45
wb = gaussian_filter(w, sig) + 1e-4
loc = np.stack([gaussian_filter(col[..., k] * w, sig) / wb / np.maximum(gaussian_filter(base[..., k] * w, sig) / wb, 1e-3) for k in range(3)], -1)
cov = np.clip(gaussian_filter(w, sig) * 4, 0, 1)[..., None]
rmap = np.clip(loc, 0.5, 1.6) * cov + ratio * (1 - cov)
matched = (base ** 2.2 * rmap ** 2.2) ** (1 / 2.2)
out = matched * (1 - w[..., None]) + col * w[..., None]
# lips_fix: pull the lips toward a soft nude-pink
lm = np.asarray(Image.open('mk_lips.png')).astype(float)[..., None] / 255 * 0.55
grey = out.mean(-1, keepdims=True)
soft = grey + (out - grey) * 0.6
soft = soft * np.array([1.02, 0.97, 0.99]) + 0.03
out = out * (1 - lm) + soft * lm
Image.fromarray((out.clip(0, 1) * 255).astype(np.uint8)).save(S + 'girl_skin/girl_skin_diffuse.png')
Image.fromarray((out.clip(0, 1) * 255).astype(np.uint8)).crop((1300, 300, 2048, 1450)).resize((374, 575)).save(f'{prefix}_skin_face.png')
