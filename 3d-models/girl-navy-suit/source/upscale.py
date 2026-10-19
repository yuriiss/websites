"""Upscale the head crop: Real-ESRGAN x4 for the whole crop, GFPGAN for the face, pasted back."""
import numpy as np, torch, cv2, subprocess, sys
from PIL import Image
from spandrel import ModelLoader

torch.set_num_threads(4)
src = np.asarray(Image.open('head_crop.png').convert('RGB')).astype(np.float32) / 255

def run(model, img):
    t = torch.from_numpy(img).permute(2, 0, 1)[None]
    with torch.no_grad():
        out = model(t)
    if isinstance(out, (tuple, list)):
        out = out[0]
    return out[0].permute(1, 2, 0).clamp(0, 1).numpy()

esr = ModelLoader().load_from_file('/opt/models/RealESRGAN_x4plus.pth').eval()
up = run(esr.model, src)
Image.fromarray((up * 255).astype(np.uint8)).save('head_esr.png')
print('esrgan', up.shape)

subprocess.run([sys.executable, 'lmk.py', 'head_esr.png', '0', '0', str(up.shape[1]), str(up.shape[0]), 'esr_lmk.npy'],
               check=True, stderr=subprocess.DEVNULL)
L = np.load('esr_lmk.npy')
pts = np.array([(L[33] + L[133]) / 2, (L[362] + L[263]) / 2, L[1], L[61], L[291]], np.float32)
tmpl = np.array([[192.98, 239.95], [318.90, 240.19], [256.63, 314.02], [201.26, 371.41], [313.09, 371.15]], np.float32)
M, _ = cv2.estimateAffinePartial2D(pts, tmpl, method=cv2.LMEDS)
face = cv2.warpAffine(up, M, (512, 512), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

gfp = ModelLoader().load_from_file('/opt/models/GFPGANv1.4.pth').eval()
inp = face * 2 - 1  # GFPGAN works in [-1, 1]
t = torch.from_numpy(inp.astype(np.float32)).permute(2, 0, 1)[None]
with torch.no_grad():
    o = gfp.model(t)
o = o[0] if isinstance(o, (tuple, list)) else o
res = ((o[0].permute(1, 2, 0).numpy() + 1) / 2).clip(0, 1)
FIDELITY = float(sys.argv[1]) if len(sys.argv) > 1 else 0.6   # share of restored face kept
res = res * FIDELITY + face * (1 - FIDELITY)
Image.fromarray((res * 255).astype(np.uint8)).save('face_gfp512.png')

# paste back with a feathered elliptical mask
mask = np.zeros((512, 512), np.float32)
cv2.ellipse(mask, (256, 290), (170, 215), 0, 0, 360, 1, -1)
mask = cv2.GaussianBlur(mask, (0, 0), 25)
Mi = cv2.invertAffineTransform(M)
h, w = up.shape[:2]
back = cv2.warpAffine(res, Mi, (w, h), flags=cv2.INTER_CUBIC)
mback = cv2.warpAffine(mask, Mi, (w, h))[..., None]
final = back * mback + up * (1 - mback)
Image.fromarray((final * 255).astype(np.uint8)).save('head_up.png')
print('done', final.shape)
