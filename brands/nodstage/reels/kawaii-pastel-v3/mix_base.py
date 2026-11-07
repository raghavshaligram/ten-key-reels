# Score + foley for "One Client" (Sci-Fi Sitcom Toon). Synthesized, seeded, deterministic.
import json, numpy as np, soundfile as sf
from scipy.signal import resample_poly, lfilter
SR = 48000; DUR = 78.3; N = int(SR * DUR); rng = np.random.default_rng(11)
EV = json.load(open('events.json')); TL = json.load(open('tl.json'))
def T(d): return np.arange(int(SR * d)) / SR
def add(buf, t0, x, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N and j > i: buf[i:j] += x[:j - i] * g
mus = np.zeros(N); fx = np.zeros(N)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
# ---------------- instruments ----------------
def theremin(notes, dur_each, t0):          # sine + 2nd/3rd harmonic, portamento, vibrato fading in
    n = int(SR * dur_each * len(notes)); t = np.arange(n) / SR
    f = np.repeat([mtof(m) for m in notes], int(SR * dur_each))[:n]
    k = int(SR * .07); f = np.convolve(np.pad(f, (k, 0), 'edge'), np.ones(k) / k, 'valid')[:n]
    ph_on = (t % dur_each); vib = 1 + .012 * np.sin(2 * np.pi * 5.5 * t) * np.clip((ph_on - .15) / .2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + .25 * np.sin(2 * ph) + .12 * np.sin(3 * ph)
    env = np.minimum(1, t / .05) * np.minimum(1, (t[-1] - t) / .2)
    return x * env * .3
def bass(m, d): t = T(d); f = mtof(m); x = np.sign(np.sin(2 * np.pi * f * t)) * .4 + np.sin(2 * np.pi * f * t) * .6; return lfilter([.08], [1, -.92], x) * np.exp(-t * 3) * 3
def sq(m, d): t = T(d); return np.sign(np.sin(2 * np.pi * mtof(m) * t)) * np.exp(-t * 14) * .12
def kick(): t = T(.3); f = 50 + 100 * np.exp(-t * 28); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)
def snare(): t = T(.18); n = rng.standard_normal(len(t)); n = lfilter([1, -1], [1], n) * .5; return (n * .7 + np.sin(2 * np.pi * 200 * t) * .3) * np.exp(-t * 20)
def hat(): t = T(.05); n = lfilter([1, -1], [1], rng.standard_normal(len(t))); return n * np.exp(-t * 80) * .2
def pluck(m, d=.6):   # Karplus-Strong nylon
    f = mtof(m); L = int(SR / f); buf = rng.uniform(-1, 1, L); out = np.zeros(int(SR * d))
    for i in range(len(out)): out[i] = buf[i % L]; buf[i % L] = .5 * (buf[i % L] + buf[(i + 1) % L]) * .996
    return out * .35
def vib(m, d=1.2): t = T(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 6)) * np.exp(-t * 2.2) * (1 + .3 * np.sin(2 * np.pi * 6 * t)) * .22
def tuba(m, d): t = T(d); f = mtof(m); x = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.4 for k in range(1, 6)); return x * np.minimum(1, t / .03) * np.exp(-t * 2.5) * .5
def trem(m, d): t = T(d); x = sum(np.sign(np.sin(2 * np.pi * mtof(m + o) * t)) for o in (0, 7, 12)) / 3; return lfilter([.2], [1, -.8], x) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 14 * t))) * np.minimum(1, t / d) * .3

BPM = 120; b = .5
def groove(a, z, root, style):
    i = 0; t = a
    while t < z - 1e-6:
        beat = i % 4
        if style in ('main', 'home2'):
            if beat in (0, 2): add(mus, t, kick(), .8)
            if beat in (1, 3): add(mus, t, snare(), .4)
            add(mus, t, hat(), .6); add(mus, t + b / 2, hat(), .4)
            add(mus, t, bass(root + [0, 0, 3, 5][(i // 4) % 4], b * .9), .5)
            for k in range(4): add(mus, t + k * b / 4, sq(root + 24 + [0, 3, 7, 10][(k + i) % 4], .12), .6)
        elif style == 'surf':   # lead world: surf-ish pluck + driving bass
            if beat in (0, 2): add(mus, t, kick(), .7)
            add(mus, t, hat(), .5); add(mus, t, bass(root + [0, 7][beat % 2], b * .9), .5)
            add(mus, t, pluck(root + 24 + [0, 4, 7, 12][beat], .5), .7)
        elif style == 'bossa':  # the client portal: elevator bossa
            for k, (o, m) in enumerate([(0, 0), (.75, 4), (1.5, 7), (2.25, 11)]):
                if beat == 0: add(mus, t + o * b, pluck(root + 12 + m, .7), .6)
            if beat in (0, 2): add(mus, t, bass(root + (7 if beat == 2 else 0), b * .9), .45)
            add(mus, t + b * .5, hat(), .3)
        elif style == 'swing':  # tasks: brushed swing with vibes
            add(mus, t, bass(root + [0, 4, 7, 9][beat], b * .9), .45)
            add(mus, t + b * .66, hat(), .4)
            if beat == 0: add(mus, t, vib(root + 24 + [0, 4, 7][(i // 4) % 3]), .8)
        elif style == 'panic':  # change order: tuba + tremolo strings
            if beat in (0, 2): add(mus, t, tuba(root - 12 + [0, 1][(i // 2) % 2], b * .9), .6)
            if beat == 0: add(mus, t, trem(root + 12, b * 4), .5)
        i += 1; t += b
SEC = [(0, 13.54, 50, 'main'), (15.44, 23.85, 50, 'main'), (25.0, 35.82, 52, 'surf'), (35.85, 44.33, 55, 'bossa'), (44.35, 51.68, 53, 'swing'), (51.7, 55.38, 50, 'panic'), (55.38, 60.72, 50, 'swing'), (60.74, 68.46, 50, 'home2')]
for a, z, r, st in SEC: groove(a, z, r, st)
# theremin main theme over the home sections (D minor chromatic descent of our own)
mel = [74, 72, 70, 69, 70, 67, 69, 65]
for t0 in (0.0, 4.0, 15.44, 19.44, 60.74, 64.74): add(mus, t0, theremin(mel, .5, t0), .8)
add(mus, 23.85, theremin([74, 78, 81, 86], .25, 0), .9)
# the outro: warm pads on the end card
t = T(7.1); pad = sum(np.sin(2 * np.pi * mtof(m) * t) for m in (62, 65, 69, 74)) / 4 * np.minimum(1, t / .6) * np.minimum(1, (7.1 - t) / 1.5)
add(mus, 71.2, pad, .35); add(mus, 71.2, theremin([74, 72, 69, 67, 69, 74], .9, 0), .6)
# hard silences: kill music (and tails) in the dead-air beats
for a, d in [(13.54, 15.44 - 13.54), (68.46, 71.2 - 68.46), (23.6, .25)]:
    mus[int(a * SR):int((a + d) * SR)] = 0
# ---------------- foley ----------------
def pop_(f=600): t = T(.1); return np.sin(2 * np.pi * (f + f * 2 * np.exp(-t * 50)) * t) * np.exp(-t * 35) * .6
def whoosh(d=.5):
    t = T(d); n = rng.standard_normal(len(t)); y = lfilter([.04], [1, -.96], n); return y * np.sin(np.pi * t / d) ** 2 * 5
def portal_open(): t = T(1.0); sub = np.sin(2 * np.pi * np.cumsum(60 - 20 * t) / SR) * np.exp(-t * 3); sw = whoosh(1.0) * .6; rise = np.sin(2 * np.pi * np.cumsum(200 + 900 * t) / SR) * .15 * np.exp(-t * 2); return sub + sw + rise
def hum(d): t = T(d); return (np.sin(2 * np.pi * 110 * t) + .5 * np.sin(2 * np.pi * 165 * t)) * .05 * (1 + .3 * np.sin(2 * np.pi * 3 * t))
def boing(): t = T(.4); return np.sin(2 * np.pi * np.cumsum(300 + 150 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4)) / SR) * np.exp(-t * 6) * .4
def stamp(): t = T(.4); f = 90 + 120 * np.exp(-t * 30); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9); x[:1200] += rng.standard_normal(1200) * np.exp(-np.arange(1200) / 200) * .6; return x
def blip(f=1200): t = T(.08); return np.sin(2 * np.pi * f * t) * np.exp(-t * 40) * .3
def steps(d): x = np.zeros(int(SR * d));
for _ in range(0): pass
def steps(d):
    x = np.zeros(int(SR * d)); k = 0
    while k * .2 < d: tt = T(.06); s = np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 60) * .4; i = int(k * .2 * SR); x[i:i + len(s)] += s[:len(x) - i]; k += 1
    return x
def scribble(d): t = T(d); return rng.standard_normal(len(t)) * .12 * (.5 + .5 * np.sin(2 * np.pi * 13 * t)) ** 2
def rattle(d): t = T(d); return rng.standard_normal(len(t)) * .15 * (np.sin(2 * np.pi * 22 * t) > .3) + np.sin(2 * np.pi * 1600 * t) * .05 * (np.sin(2 * np.pi * 20 * t) > 0)
def alarm(d): t = T(d); return np.sign(np.sin(2 * np.pi * (700 + 200 * (np.sin(2 * np.pi * 2 * t) > 0)) * t)) * .05
def clatter(d):
    x = np.zeros(int(SR * d))
    for k in range(9): s = stamp()[:int(SR * .15)] * .5 + 0 * rng.standard_normal(1)[0] + rng.standard_normal(int(SR * .15)) * np.exp(-np.arange(int(SR * .15)) / 900) * .4; i = int((k * .07 + rng.uniform(0, .04)) * SR); x[i:i + len(s)] += s[:len(x) - i]
    return x
def zip_(d): t = T(d); return np.sin(2 * np.pi * np.cumsum(400 + 1600 * t / d) / SR) * .1
def mx(*xs):
    n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)
def poof(): return mx(whoosh(.35) * .8, pop_(400))
for e in EV:
    t0, ty, v = e['t'], e['type'], e.get('v', 1)
    if ty == 'pop': add(fx, t0, pop_(e.get('f', 600)), .6 * v)
    elif ty == 'whoosh': add(fx, t0, whoosh(.5), .5 * v)
    elif ty == 'portalOpen': add(fx, t0, portal_open(), .7 * v)
    elif ty == 'portalClose': add(fx, t0, mx(whoosh(.3) * .6, pop_(300) * .5), v)
    elif ty == 'portalHum': add(fx, t0, hum(e['d']), v)
    elif ty == 'boing': add(fx, t0, boing(), v)
    elif ty == 'stamp' or ty == 'slam': add(fx, t0, stamp(), .9 * v)
    elif ty == 'blip': add(fx, t0, blip(), v)
    elif ty == 'steps': add(fx, t0, steps(e['d']), v)
    elif ty == 'paper': add(fx, t0, whoosh(.2) * .5, v)
    elif ty == 'scribble': add(fx, t0, scribble(e['d']), v)
    elif ty == 'rattle': add(fx, t0, rattle(e['d']), .7 * v)
    elif ty == 'shake': add(fx, t0, rattle(e['d']) * .6, v)
    elif ty == 'alarm': add(fx, t0, alarm(e['d']), v)
    elif ty == 'rumble': add(fx, t0, tuba(38, e['d']) * .8, v)
    elif ty == 'zip': add(fx, t0, zip_(e['d']), v)
    elif ty == 'swirlDraw': add(fx, t0, zip_(e['d']) * .8, v)
    elif ty == 'poof': add(fx, t0, poof(), v)
    elif ty == 'clatter': add(fx, t0, clatter(e['d']), .8 * v)
# room tone in the silences (fluorescent hum + clock tick)
for a, d in [(13.54, 1.9), (68.46, 2.74)]:
    t = T(d); rt = np.sin(2 * np.pi * 120 * t) * .008 + rng.standard_normal(len(t)) * .002
    for k in range(int(d)): i = int(k * SR); rt[i:i + 300] += np.sin(2 * np.pi * 3000 * np.arange(300) / SR) * np.exp(-np.arange(300) / 40) * .05
    add(fx, a, rt)
# ---------------- voice + ducking ----------------
vo, vsr = sf.read('../journey3d/vo.wav')
if vo.ndim > 1: vo = vo.mean(1)
vo = resample_poly(vo, SR, vsr); vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
e = np.abs(vo); k = int(SR * .2); e = np.convolve(e, np.ones(k) / k, 'same'); talk = np.clip(e / (np.percentile(e[e > 0], 90) * .35), 0, 1)
duck = 10 ** (-7 * talk / 20)
mix = vo * 1.0 + mus * .42 * duck + fx * .6
mix[-int(SR * 1.5):] *= np.linspace(1, 0, int(SR * 1.5))
mix = np.tanh(mix / np.abs(mix).max() * 1.4) * .9
sf.write('mix.wav', np.stack([mix, mix], 1), SR)
print('ok', round(len(mix) / SR, 2))
