"""Sound effects made in code, so there is nothing to license. Each kit is a set of short sounds;
reel.json lists events as [time, sound] where time is a timeline expression (see build.py)."""
import numpy as np

SR = 48000
_rng = np.random.default_rng(7)


def _t(d): return np.arange(int(d * SR)) / SR


def pop(f=800, d=.09, g=.5):
    t = _t(d); return np.sin(2 * np.pi * f * t * (1 + 2.5 * np.exp(-t * 60))) * np.exp(-t * 38) * g


def tick(g=.25):
    t = _t(.025); return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 220) * g


def whoosh(d=.45, g=.35):
    n = int(d * SR); x = np.convolve(_rng.normal(0, 1, n), np.ones(40) / 40, "same")
    return x * np.sin(np.pi * np.linspace(0, 1, n)) ** 2 * g


def beep(f=880, d=.08, g=.35):
    t = _t(d); x = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sin(2 * np.pi * f * t) * .5; return x * np.exp(-t * 18) * g


def click():
    t = _t(.018); return _rng.normal(0, 1, t.size) * np.exp(-t * 400) * .18


def scribble(d=.55):
    n = int(d * SR); x = _rng.normal(0, 1, n); x = np.diff(np.concatenate([[0], np.convolve(x, np.ones(6) / 6, "same")]))
    env = (.55 + .45 * np.sin(2 * np.pi * 7 * np.arange(n) / SR)) * np.sin(np.pi * np.linspace(0, 1, n)) ** .5; return x * env * .5


def tape(d=.22):
    n = int(d * SR); x = _rng.normal(0, 1, n) * np.exp(-np.linspace(0, 6, n)); return np.convolve(x, np.ones(3) / 3, "same") * .35


def arpeggio():
    out = np.zeros(int(.5 * SR))
    for k, f in enumerate([523, 659, 784, 1047]):
        b = beep(f, .14, .3); i = int(k * .09 * SR); out[i:i + b.size] += b[: out.size - i]
    return out


SOUNDS = {
    "pop": lambda a: pop(float(a or 800)), "pop-small": lambda a: pop(float(a or 1100), .06), "tick": lambda a: tick(),
    "whoosh": lambda a: whoosh(float(a or .45)), "beep": lambda a: beep(float(a or 880)), "click": lambda a: click(),
    "scribble": lambda a: scribble(float(a or .55)), "tape": lambda a: tape(), "win": lambda a: arpeggio(),
    "buzz": lambda a: beep(180, .25, .35),
}


def render(events, duration, gain=.6):
    """events: [(seconds, sound, arg)]; 'ticks' takes arg 'dur' and spreads 12 easing ticks across it."""
    out = np.zeros(int(duration * SR))

    def add(t, x, g=1.0):
        i = int(t * SR); n = min(len(x), len(out) - i)
        if i >= 0 and n > 0: out[i:i + n] += x[:n] * g
    for t, name, arg in events:
        if name == "ticks":
            d = float(arg or 1.0)
            for k in range(12): add(t + d * (1 - (1 - k / 12) ** (1 / 3)) * .98, tick(), .6)
        elif name == "clicks":   # typing clicks for arg seconds
            tt, end = t, t + float(arg or 2)
            while tt < end: add(tt, click()); tt += .28 + _rng.random() * .12
        else:
            add(t, SOUNDS[name](arg))
    return (out * gain).astype(np.float32)
