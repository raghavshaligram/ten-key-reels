# soft lo-fi bed: Rhodes-ish chords, muted kick/snare/hat, vinyl hiss; 80 BPM; seeded
import numpy as np, soundfile as sf, json
SR=48000; DUR=json.load(open('timeline.json'))['end']; N=int(SR*DUR); r=np.random.default_rng(3); out=np.zeros(N)
def T(d): return np.arange(int(SR*d))/SR
def add(t0,x,g=1):
    i=int(t0*SR); j=min(N,i+len(x))
    if i<N: out[i:j]+=x[:j-i]*g
def rhodes(f,d): t=T(d); x=sum(np.sin(2*np.pi*f*k*t)*a*np.exp(-t*(1.5+k)) for k,a in [(1,1),(2,.35),(3,.12)]); return x*(1+.15*np.sin(2*np.pi*5*t))*np.minimum(1,t/.01)
def kick(): t=T(.3); return np.sin(2*np.pi*np.cumsum(45+70*np.exp(-t*25))/SR)*np.exp(-t*10)
def snare(): t=T(.2); n=r.standard_normal(len(t)); n=np.convolve(n,np.ones(6)/6,'same'); return n*np.exp(-t*20)*.5
def hat(): t=T(.05); n=np.diff(r.standard_normal(len(t)),prepend=0); return n*np.exp(-t*80)*.15
b=60/80; bar=4*b
CH=[[220.0,261.6,329.6,392.0],[174.6,220.0,261.6,329.6],[196.0,246.9,293.7,349.2],[164.8,207.7,246.9,329.6]]  # Am7 Fmaj7 G7 E7
for k in range(int(DUR/bar)+1):
    t0=k*bar; c=CH[k%4]
    for i,f in enumerate(c): add(t0+i*.012,rhodes(f,bar*1.1),.16)
    add(t0+2*b+.25,rhodes(c[-1]*2,b),.06)
    for q in range(4):
        tq=t0+q*b
        if q in(0,2): add(tq,kick(),.5)
        if q in(1,3): add(tq+.01,snare(),.35)
        add(tq,hat(),1); add(tq+b*.62,hat(),.7)   # swung 8ths
hiss=np.convolve(r.standard_normal(N),np.ones(30)/30,'same')*.012; out+=hiss
for t0 in r.uniform(0,DUR,int(DUR*3)): add(t0,np.exp(-T(.004)*900)*r.choice([-1,1])*.05)  # vinyl crackle
# keep it soft at the end card swell
out*=np.minimum(1,np.arange(N)/(SR*1.0)); out[-int(SR*1.2):]*=np.linspace(1,0,int(SR*1.2))
out/=np.abs(out).max()*1.05
sf.write('bed.wav',np.stack([out,out],1),SR); print('bed ok',round(DUR,2))
