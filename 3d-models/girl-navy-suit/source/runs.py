import numpy as np, sys
from PIL import Image
def info(maskpath, lmk, model, size=None):
    im=Image.open(maskpath).convert('L')
    if size: im=im.resize(size)
    a=np.asarray(im); m=(a<128) if model else (a>128)
    rows=np.where(m.any(1))[0]; bot=rows[-1]
    L=np.load(lmk); eye=(L[33,1]+L[263,1])/2; H=bot-eye
    out={}
    for f in [0.12,0.16,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95]:
        row=m[int(eye+f*H)]; d=np.diff(np.r_[0,row.astype(int),0]); s=np.where(d==1)[0]; e=np.where(d==-1)[0]
        out[f]=[round((b-a)/H*100,2) for a,b in zip(s,e) if (b-a)/H>0.004]
    return out
P=info('../gen/mask_front.png','meas_photo.npy',False)
pre=sys.argv[1]
M=info(pre+'_silF.png','meas_model.npy',True,Image.open(pre+'_texF.png').size)
for f in P: print(f'{f:4}: photo {P[f]}   model {M[f]}')
