# score (cool-jazz sketch: vibraphone chords, pizzicato walking bass, brushes) + foley + the voice, mixed
import sys, numpy as np, soundfile as sf
sys.path.insert(0, '/home/claude/ten-key-reels/engine'); import sfx
SR = 48000; DUR = 28.6; N = int(DUR * SR); t = np.arange(N) / SR
BPM = 120; BEAT = 60 / BPM
def env(n, a=.005, d=.6):
    x = np.arange(n) / SR; return np.minimum(1, x / a) * np.exp(-x / d)
def put(buf, at, sig, g=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[:j - i] * g
mus = np.zeros(N)
f = lambda m: 440 * 2 ** ((m - 69) / 12)
# chord per section (vibraphone: sine + 4x partial, tremolo)
CH = [(0, [65, 69, 72, 76]), (2.6, [62, 65, 69, 72]), (5.05, [67, 71, 74, 77]), (7.65, [60, 64, 67, 71]), (11.9, [65, 69, 72, 75]),
      (16.8, [62, 66, 69, 72]), (19.65, [67, 71, 74, 77]), (22.0, [60, 64, 67, 71, 74])]
for k, (t0, notes) in enumerate(CH):
    t1 = CH[k + 1][0] if k + 1 < len(CH) else DUR
    b = t0
    while b < t1 - .05:
        n = int(min(2 * BEAT, t1 - b) * SR); x = np.arange(n) / SR
        for m in notes:
            fr = f(m); s = (np.sin(2 * np.pi * fr * x) + .18 * np.sin(2 * np.pi * fr * 4 * x) * np.exp(-x * 8)) * env(n, .004, .9) * (1 + .25 * np.sin(2 * np.pi * 5.5 * x))
            put(mus, b, s, .05)
        b += 2 * BEAT
    # walking pizz bass
    root = notes[0] - 24; walk = [0, 4, 7, 9, 12, 9, 7, 4]; b = t0; i = 0
    while b < t1 - .05:
        n = int(.5 * SR); x = np.arange(n) / SR; fr = f(root + walk[i % 8])
        s = (np.sin(2 * np.pi * fr * x) + .3 * np.sin(2 * np.pi * 2 * fr * x)) * env(n, .003, .22)
        put(mus, b, s, .22); b += BEAT; i += 1
# brushes: swish on every beat, accent 2 and 4
rng = np.random.default_rng(7); b = 0; i = 0
while b < DUR:
    n = int(.18 * SR); nz = rng.standard_normal(n); nz = np.convolve(nz, np.ones(6) / 6, 'same'); s = nz * env(n, .02, .07)
    put(mus, b, s, .035 if i % 2 == 0 else .06); b += BEAT; i += 1
# silence before the approve press: everything out for the beat before it
mask = np.ones(N); a, z = int(15.15 * SR), int(15.6 * SR); mask[a:z] = 0
ramp = int(.06 * SR); mask[a - ramp:a] = np.linspace(1, 0, ramp); mus *= mask
mus[int(26.3 * SR):] *= np.linspace(1, 0, N - int(26.3 * SR))
# voice + ducking
vo, vsr = sf.read('../bang/vo.wav')
if vo.ndim > 1: vo = vo.mean(1)
from math import gcd
vo = np.interp(np.arange(int(len(vo) * SR / vsr)) / SR, np.arange(len(vo)) / vsr, vo)
voice = np.zeros(N); voice[:min(N, len(vo))] = vo[:N]
envv = np.convolve(np.abs(voice), np.ones(4800) / 4800, 'same'); duck = 1 - .6 * np.clip(envv / (envv.max() * .25 + 1e-9), 0, 1)
mus *= duck
# foley
ev = [(1.15 + i * .13, 'pop', '700') for i in range(6)] + [(.25, 'whoosh', '.4'), (.85, 'whoosh', '.3')]
ev += [(T - .25, 'whoosh', '.5') for T in (2.6, 5.05, 7.65, 11.9, 16.8, 19.65)] + [(T - .5, 'pop', '300') for T in (5.05, 7.65, 11.9, 16.8, 19.65)]
ev += [(3.5, 'click', None), (4.1, 'click', None), (4.62, 'pop-small', None), (5.4, 'pop-small', None), (6.95, 'pop', '160'), (8.55, 'pop', '900'), (9.0, 'whoosh', '.3'),
       (12.15, 'pop', '800'), (13.05, 'pop-small', None), (13.6, 'whoosh', '.6'), (15.6, 'click', None), (15.62, 'pop', '200'), (15.65, 'win', None),
       (17.3, 'whoosh', '.4'), (17.7, 'pop-small', None), (18.6, 'pop', '160'), (20.9, 'click', None), (20.95, 'whoosh', '.6'), (21.05, 'pop-small', None),
       (22.0, 'whoosh', '.5')] + [(22.4 + i * .12, 'pop-small', None) for i in range(6)] + [(24.9, 'pop', '400'), (25.4, 'pop-small', None)]
fx = sfx.render(ev, DUR, .5)
if fx.ndim > 1: fx = fx.mean(1)
fx = np.pad(fx, (0, max(0, N - len(fx))))[:N]
mix = voice * 1.0 + mus * 1.0 + fx * .55
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= max(1e-9, np.abs(mix).max()) / .89
sf.write('mix.wav', mix.astype(np.float32), SR)
print('ok', round(len(mix) / SR, 2))
