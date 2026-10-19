"""Detect 478 face landmarks. usage: lmk.py image.png x0 y0 x1 y1 out.npy  (crop box in pixels)"""
import sys, numpy as np, mediapipe as mp
from PIL import Image
from mediapipe.tasks.python import vision, BaseOptions
img, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
im = Image.open(img).convert('RGB').crop((x0, y0, x1, y1))
s = 768 / max(im.size); im2 = im.resize((round(im.size[0]*s), round(im.size[1]*s)), Image.LANCZOS)
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path='face_landmarker.task'), num_faces=1))
r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(im2)))
assert r.face_landmarks, 'no face'
p = np.array([[l.x*im2.size[0]/s + x0, l.y*im2.size[1]/s + y0] for l in r.face_landmarks[0]])
np.save(out, p); print('landmarks', p.shape, p.min(0), p.max(0))
