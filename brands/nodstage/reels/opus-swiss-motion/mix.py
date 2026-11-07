# score + foley + voice, all synthesized in numpy, 120 BPM motorik in A dorian
import json, numpy as np, soundfile as sf
SR=48000; DUR=28.6; N=int(DUR*SR); rng=np.random.default_rng(7)
t_=lambda d: np.arange(int(d*SR))/SR
def env(n,a=.002,r=.1):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/r)
def add(buf,x,at,g=1.0):
    i=int(at*SR); j=min(len(buf),i+len(x));
    if i<len(buf) and j>i: buf[i:j]+=x[:j-i]*g
def kick():  t=t_(.35); f=50+90*np.exp(-t*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def snare(): t=t_(.22); return (rng.standard_normal(len(t))*.6+np.sin(2*np.pi*190*t)*.4)*np.exp(-t*18)
def hat():   t=t_(.05); x=rng.standard_normal(len(t)); x=np.diff(np.concatenate([[0],x])); return x*np.exp(-t*80)*.5
def bass(f,d=.24): t=t_(d); x=np.sign(np.sin(2*np.pi*f*t))*.5+np.sin(2*np.pi*f*t)*.5; return x*env(len(t),.004,.12)*.5
def pluck(f,d=.3): t=t_(d); return (np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*4*f*t))*np.exp(-t*9)*.35
music=np.zeros(N); drums=np.zeros(N)
A=110.0; prog=[A,A,A*2**(10/12)/2,A*2**(7/12)/2]  # A A G E roots (dorian colour)
beat=.5; nb=int(26.75/beat)
for i in range(nb):
    tb=i*beat; bar=i//4; root=prog[bar%4]
    exc=11.75<=tb<14.0
    if tb>=2.5 and not exc:
        if i%4 in (0,2): add(drums,kick(),tb,.9)
        if i%4==2: add(drums,kick(),tb+.25,.6)
        if i%4 in (1,3): add(drums,snare(),tb,.45)
    if not exc:
        add(drums,hat(),tb,.35); add(drums,hat(),tb+.25,.25)
        if tb>=2.5:
            add(music,bass(root),tb,.55); add(music,bass(root*(2 if i%2 else 1)),tb+.25,.45)
    if tb>=7.5 and not exc and tb<26.5:   # marimba-like ostinato from the feedback stage on
        sc=[0,3,5,7,10,12]; n=sc[(i*3)%6]; add(music,pluck(A*2*2**(n/12)),tb,.6); add(music,pluck(A*2*2**(sc[(i*5+2)%6]/12)),tb+.25,.4)
# the exception sings: a sine glide following the request
g=t_(1.85); f=440*2**(np.linspace(0,7,len(g))/12); x=np.sin(2*np.pi*np.cumsum(f)/SR)*.18*np.minimum(1,g/.05)*np.minimum(1,(g[-1]-g)/.1)
add(music,x,11.75)
mus=music+drums
# foley
fol=np.zeros(N)
def noiseburst(d,decay,lp=None):
    t=t_(d); x=rng.standard_normal(len(t))*np.exp(-t*decay)
    if lp: k=int(lp); x=np.convolve(x,np.ones(k)/k,'same')
    return x
for e in json.load(open('events.json')):
    tt,ty,v=e['t'],e['type'],e['v']
    if ty=='clack': add(fol,noiseburst(.03,160,3)*.5,tt,v*.5)
    elif ty=='tss': d=.25; tt2=t_(d); x=np.diff(np.concatenate([[0],rng.standard_normal(len(tt2))]))*np.sin(np.pi*tt2/d)*.4; add(fol,x,tt-.05,v)
    elif ty=='thunk': add(fol,np.sin(2*np.pi*(90+60*np.exp(-t_(.2)*25))*t_(.2))*np.exp(-t_(.2)*14),tt,v*.8)
    elif ty=='slide': d=.32; tt2=t_(d); x=noiseburst(d,0,6)*np.sin(np.pi*tt2/d)**2*.35; add(fol,x,tt-.2,v)
    elif ty=='click': add(fol,noiseburst(.015,300,2)*.8,tt,v)
    elif ty=='block': add(fol,np.sin(2*np.pi*660*t_(.12))*np.exp(-t_(.12)*30)*.5,tt,v)
    elif ty=='stamp': add(fol,np.sin(2*np.pi*(70+80*np.exp(-t_(.35)*20))*t_(.35))*np.exp(-t_(.35)*8),tt,v); add(fol,noiseburst(.05,90,4)*.4,tt,v)
    elif ty=='glide2': d=.5; tt2=t_(d); f=600*2**(np.linspace(0,12,len(tt2))/12); add(fol,np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*tt2/d)*.15,tt,v)
# voice + ducking
vo,sr=sf.read('vo.wav'); 
if vo.ndim>1: vo=vo.mean(1)
vo=np.interp(np.arange(int(len(vo)*SR/sr))/SR, np.arange(len(vo))/sr, vo); voice=np.zeros(N); voice[:min(N,len(vo))]=vo[:N]
e=np.abs(voice); k=int(.08*SR); e=np.convolve(e,np.ones(k)/k,'same'); e=e/ (e.max()+1e-9)
duck=10**(-10*np.clip(e*4,0,1)/20)
out=voice*1.0+mus*.32*duck+fol*.55
out=np.tanh(out*1.1)/1.1
# rough loudness to about -14 LUFS (RMS proxy), peak under -1 dBFS
rms=np.sqrt(np.mean(out[int(.3*SR):int(26.6*SR)]**2)); out*=10**((-16.5-20*np.log10(rms))/20); out=np.clip(out,-.89,.89)
sf.write('mix.wav',np.stack([out,out],1),SR); print('ok', round(20*np.log10(np.abs(out).max()),2))
