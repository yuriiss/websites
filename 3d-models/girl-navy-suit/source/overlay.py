import numpy as np, sys
from PIL import Image
def load(maskpath, lmk, model, size=None):
    im=Image.open(maskpath).convert('L')
    if size: im=im.resize(size)
    a=np.asarray(im); m=(a<128) if model else (a>128)
    rows=np.where(m.any(1))[0]; bot=rows[-1]; L=np.load(lmk); eye=(L[33,1]+L[263,1])/2; cx=(L[33,0]+L[263,0])/2
    return m, eye, bot, cx
pre=sys.argv[1]; view=sys.argv[2] if len(sys.argv)>2 else 'F'
pm,pe,pb,pcx=load('../gen/mask_front.png','meas_photo.npy',False)
mm,me,mb,mcx=load(pre+'_silF.png','meas_model.npy',True,Image.open(pre+'_texF.png').size)
H=900; s_p=H/(pb-pe); s_m=H/(mb-me)
out=np.full((H+300,700,3),255,np.uint8)
def paste(m,eye,cx,s,col):
    ys,xs=np.where(m)
    Y=((ys-eye)*s+200).astype(int); X=((xs-cx)*s+350).astype(int)
    ok=(Y>=0)&(Y<H+300)&(X>=0)&(X<700)
    out[Y[ok],X[ok]]=np.minimum(out[Y[ok],X[ok]],col)
paste(pm,pe,pcx,s_p,np.array([255,120,120],np.uint8))
paste(mm,me,mcx,s_m,np.array([120,120,255],np.uint8))
Image.fromarray(out).save(pre+'_overlay.png')
