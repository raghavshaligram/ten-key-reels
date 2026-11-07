# score + foley for "The Client File" (halftone dossier) — synthesized, seeded, deterministic
import numpy as np, soundfile as sf, json
SR=48000; DUR=28.6; N=int(SR*DUR); rng=np.random.default_rng(7)
def T(d): return np.arange(int(SR*d))/SR
def env(n,a=.005,r=.2):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/r)
def add(buf,t0,x,g=1.0):
    i=int(t0*SR); j=min(N,i+len(x));
    if i<N and j>i: buf[i:j]+=x[:j-i]*g
mus=np.zeros(N); sfx=np.zeros(N)
def kick(): t=T(.35); f=50+90*np.exp(-t*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def snare(): t=T(.22); return (rng.standard_normal(len(t))*.6+np.sin(2*np.pi*190*t)*.4)*np.exp(-t*18)
def hat(): t=T(.06); x=rng.standard_normal(len(t)); x=np.diff(x,prepend=0); return x*np.exp(-t*70)*.35
def pluck(f,d=.5): t=T(d); return (np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*3.99*t)*np.exp(-t*20))*np.exp(-t*6)
def bass(f,d=.24): t=T(d); x=np.sign(np.sin(2*np.pi*f*t))*.5+np.sin(2*np.pi*f*t)*.5; return x*env(len(t),.004,.12)*.5
def pizz(f): t=T(.25); return np.sin(2*np.pi*f*t)*np.exp(-t*22)
def bell(f,d=1.4): t=T(d); return (np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2.76*t)+.2*np.sin(2*np.pi*f*5.4*t))*np.exp(-t*2.5)
def pad(fs,d): t=T(d); x=sum(2/np.pi*np.arcsin(np.sin(2*np.pi*f*t)) for f in fs)/len(fs); return x*np.minimum(1,t/.3)*np.minimum(1,(d-t)/.3)*.25
BPM=120; b=60/BPM; bar=4*b
chords=[(261.6,329.6,392.0),(220.0,261.6,329.6),(174.6,220.0,261.6),(196.0,246.9,293.7)]  # C Am F G
roots=[65.4,55.0,43.65,49.0]
mel=[0,2,4,7,4,2,4,9]   # scale steps
scale=[523.3,587.3,659.3,698.5,784.0,880.0,987.8,1046.5,1174.7,1318.5]
def section(t):
    if t<2.5: return 'intro'
    if t<11.8: return 'groove'
    if t<15.3: return 'sneak'
    if t<15.82: return 'silence'
    if t<25.0: return 'groove2'
    return 'outro'
k=0
for i in range(int(DUR/(b/2))):
    t=i*b/2; s=section(t); beat=i//2; bi=int(t//bar)%4
    if s=='silence': continue
    if s in('intro','groove','groove2'):
        if i%2==0: add(mus,t,kick(),.9 if s!='intro' else .6)
        if s!='intro' and beat%2==1 and i%2==0: add(mus,t,snare(),.45)
        if s!='intro': add(mus,t,hat(),.5)
        if s!='intro': add(mus,t,bass(roots[bi]*(2 if i%4==2 else 1)),.7)
        if s!='intro' and i%2==0 and beat%4!=3: add(mus,t,pluck(scale[mel[(beat)%8]]),.28)
        if i%8==0: add(mus,t,pad(chords[bi],bar),.6)
    if s=='intro' and i%2==0: add(mus,t,pluck(scale[[0,4,7,4,9][(i//2)%5]]),.35)
    if s=='sneak':
        if i%2==0: add(mus,t,pizz([130.8,155.6,174.6,196.0][(i//2)%4]),.5)
        if i%4==2: t2=T(.05); add(mus,t,rng.standard_normal(len(t2))*np.exp(-t2*90)*.6)   # snap
        if i%2==1: add(mus,t,bass(roots[1],.18),.4)
    if s=='outro':
        if i%2==0 and t<27: add(mus,t,bell(scale[[7,4,2,0,4,7,9,7][(i//2)%8]]*0.5),.25)
        if i==int(25.0/(b/2)): add(mus,t,pad(chords[0],3.4),.9)
# build into the approval: snare roll + rising sweep, then silence, then the stamp alone
for j in range(16): add(mus,14.5+j*.05,snare(),.12+.02*j)
t=T(.8); add(mus,14.5,np.sin(2*np.pi*np.cumsum(300+900*t/.8)/SR)*.12*t/.8)
# --- foley
def stamp(big=False):
    t=T(.5); f=90+140*np.exp(-t*25); x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*8)
    c=rng.standard_normal(int(SR*.03))*np.exp(-np.arange(int(SR*.03))/SR*120)*.8; x[:len(c)]+=c
    if big: n=rng.standard_normal(len(t))*np.exp(-t*6)*.25; x+=n
    return x
def whoosh(d=.4):
    t=T(d); n=rng.standard_normal(len(t)); y=np.zeros_like(n); a=0
    for i in range(len(n)): a=a*.97+n[i]*.03; y[i]=a
    return y*np.sin(np.pi*t/d)*6
def popf(f=900): t=T(.08); return np.sin(2*np.pi*(f+f*2*np.exp(-t*60))*t)*np.exp(-t*40)*.5
def paper(d=.25): t=T(d); n=rng.standard_normal(len(t)); n=np.diff(n,prepend=0); return n*np.sin(np.pi*t/d)*.18
def scribble(d): 
    t=T(d); n=rng.standard_normal(len(t))*.25; return n*(.5+.5*np.sin(2*np.pi*14*t))**2*np.minimum(1,(d-t)/.05)
def shutter(): t=T(.12); n=rng.standard_normal(len(t)); return n*(np.exp(-t*80)+np.exp(-np.maximum(0,t-.06)*80)*(t>.06))*.5
STAMPS=[(4.42,0),(7.0,0),(13.45,0),(15.85,1),(18.92,1),(21.12,0),(24.15,1)]
for t0,bg in STAMPS: add(sfx,t0-.005,stamp(bg),1.0 if bg else .8)
for w in [2.5,5.05,7.65,11.8,16.75,19.65,21.95,25.0]: add(sfx,w-.3,whoosh(.45),.5)
for t0 in [2.75,5.3,7.85,12.1,17.0,19.85]: add(sfx,t0,paper(.3),1.0)
for i in range(3): add(sfx,.12+i*.12,popf(700+i*80),.5)
for i in range(7): add(sfx,.55+i*.07,popf(800+i*40),.35)
add(sfx,3.0,scribble(.35),.5); add(sfx,3.55,scribble(.3),.5); add(sfx,6.15,scribble(.7),.45)
add(sfx,7.85,shutter(),.8); add(sfx,15.85,shutter(),.6)
add(sfx,8.55,popf(1000),.6); add(sfx,9.6,popf(1000),.6); add(sfx,8.85,popf(600),.5)
add(sfx,13.9,whoosh(.3),.6); add(sfx,17.45,whoosh(.25),.4); add(sfx,21.45,whoosh(.5),.6)
for i in range(6): add(sfx,22.05+i*.17,popf(600+i*60),.35)
add(sfx,25.8,bell(1046.5,1.6),.35); add(sfx,25.95,bell(1318.5,1.6),.25); add(sfx,26.1,bell(1568,1.8),.2)
# --- voice + ducking
vo,vsr=sf.read('vo.wav'); 
if vo.ndim>1: vo=vo.mean(1)
from scipy.signal import resample_poly
vo=resample_poly(vo,2,1); vo=np.pad(vo,(0,max(0,N-len(vo))))[:N]
e=np.abs(vo); k=int(SR*.15); e=np.convolve(e,np.ones(k)/k,'same'); duck=1-0.6*np.clip(e/ (e.max()*.25),0,1)
mix=vo*1.0+mus*.33*duck+sfx*.55
mix[-int(SR*1.2):]*=np.linspace(1,0,int(SR*1.2))
mix=np.tanh(mix/np.abs(mix).max()*1.6)*.9
sf.write('mix.wav',np.stack([mix,mix],1),SR)
print('ok')
