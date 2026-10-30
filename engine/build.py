#!/usr/bin/env python3
"""Build one reel from a folder:  python3 engine/build.py reels/2026-10-31-net-vs-gross [--stills 2.5,9,17]

The folder holds (committed):
  reel.json    the script, captions, scene timing, sound cues, test-run settings (schema below)
  scene.html   the animation; a pure function of time, see examples/ and engine/lib.js
  caption.txt  the Instagram caption (written separately, linted with tools/ig/ig-caption/caption.py)
and gets (ignored by git): vo.wav, words.json, timeline.json, assets/, frames/, out.mp4, sheet.jpg

reel.json:
{
  "title": "Gross vs Net KPH",
  "voice": "af_heart", "speed": 0.97,
  "lines": [["What the voice says, numbers spelled the way they're spoken", 0.5], ...],   # [text, pause after]
  "phrases": ["Caption words with [accent]", [2, "or with a count"], ...],   # must cover every spoken word (build tells you if not)
  "scenes": [0, 12, 23, 32],                    # word index where each scene starts -> S0, S1, ...
  "marks": {"keys": 20, "diff": 44},            # named word indices -> W.keys etc. in scene.html
  "tail": 0.6,                                  # seconds after the last word
  "run": {"mode": "Mixed", "gap": 300, "slipEvery": 3, "frames": 12} | null,   # real test run to film
  "pointer": [["S0+0.9", "S1+0.6"], ...] | null, # presenter on screen in these windows (random outfit)
  "sfx": [["S1-0.05", "whoosh"], ["keys", "tick"], ["S2+0.25", "ticks", 1.4], ...]
}
Time expressions: a number, a scene ("S2"), a mark ("keys"), or either with +/- seconds ("S2-0.05", "keys+0.5").
"""
import hashlib, json, os, re, shutil, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "engine"))
import sfx  # noqa: E402

FPS = 30


def sh(cmd, **kw):
    print("  $", cmd if isinstance(cmd, str) else " ".join(cmd)[:160]); subprocess.run(cmd, check=True, shell=isinstance(cmd, str), **kw)


def tts(R, d):
    """Voice with Kokoro (open source, runs locally, no credits). Cached on the text."""
    key = hashlib.sha1(json.dumps([R["lines"], R.get("voice"), R.get("speed")]).encode()).hexdigest()
    kf = f"{d}/.vo.key"
    if os.path.exists(f"{d}/vo.wav") and os.path.exists(kf) and open(kf).read() == key:
        print("voice: cached"); return
    from kokoro_onnx import Kokoro
    import soundfile as sf
    k = Kokoro(f"{ROOT}/cache/kokoro-v1.0.onnx", f"{ROOT}/cache/voices-v1.0.bin")
    out = [np.zeros(int(.25 * 24000), np.float32)]
    for text, gap in R["lines"]:
        a, sr = k.create(text, voice=R.get("voice", "af_heart"), speed=R.get("speed", .97), lang="en-us")
        out += [a.astype(np.float32), np.zeros(int(gap * sr), np.float32)]
    sf.write(f"{d}/vo.wav", np.concatenate(out), 24000); open(f"{d}/.vo.key", "w").write(key)
    if os.path.exists(f"{d}/words.json"): os.remove(f"{d}/words.json")
    print("voice: made", round(sum(len(x) for x in out) / 24000, 2), "s")


def transcribe(d):
    if os.path.exists(f"{d}/words.json"): return json.load(open(f"{d}/words.json"))
    sh(["ffmpeg", "-v", "error", "-y", "-i", f"{d}/vo.wav", "-ac", "1", "-ar", "16000", f"{d}/vo16.wav"])
    from faster_whisper import WhisperModel
    w = wave.open(f"{d}/vo16.wav"); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(a, word_timestamps=True)
    words = [(x.word.strip(), round(x.start, 2), round(x.end, 2)) for s in segs for x in s.words]
    json.dump(words, open(f"{d}/words.json", "w")); return words


def merged(words):
    """Whisper splits '10' ',000', 'ten' '-key', 'site' '.com'; join those back into one spoken word."""
    m = []
    for w, s, e in words:
        if m and re.match(r"^[,.\-]\S", w): m[-1][0] += w; m[-1][2] = e
        else: m.append([w, s, e])
    return m


def phrases(R):
    """A phrase is "caption text" (covers as many spoken words as it has) or [n, "caption text"] when they differ,
    e.g. [6, "at [10keytypingtest.com]"] would be wrong: Whisper hears that as 2 words, so plain text works."""
    return [(p[0], p[1]) if isinstance(p, list) else (len(p.split()), p) for p in R["phrases"]]


def amplitude(d, end):
    """Voice loudness per video frame (0..1), for lip sync."""
    import soundfile as sf
    a, sr = sf.read(f"{d}/vo.wav"); a = a if a.ndim == 1 else a.mean(1); hop = sr // FPS
    v = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(a) else 0 for i in range(int(end * FPS) + 2)])
    v = v / (np.percentile(v[v > 0], 95) if (v > 0).any() else 1)
    v = np.convolve(v, [.25, .5, .25], "same"); return [round(float(min(1, x)), 2) for x in v]


def timeline(R, d, m):
    total = sum(n for n, _ in phrases(R))
    if total != len(m):
        print("\nCAPTION COUNT MISMATCH: phrases cover", total, "words, the voice has", len(m))
        print(" ".join(f"{i}:{w}" for i, (w, _, _) in enumerate(m))); sys.exit(2)
    caps, k = [], 0
    for n, text in phrases(R): caps.append({"t": m[k][1], "text": text}); k += n
    S = [m[i][1] for i in R["scenes"]]; W = {name: m[i][1] for name, i in R.get("marks", {}).items()}
    end = round(m[-1][2] + R.get("tail", .6), 2)
    tl = {"caps": caps, "scenes": S, "words": W, "end": end,
          "wt": [[w, s, e] for w, s, e in m], "amp": amplitude(d, end)}
    if os.path.exists(f"{d}/assets/result.json"): tl["result"] = json.load(open(f"{d}/assets/result.json"))
    def at(expr):
        try: return float(expr)
        except (TypeError, ValueError): pass
        mm = re.match(r"^(S\d+|[A-Za-z_][A-Za-z_0-9]*)?\s*([+-]\s*[\d.]+)?$", str(expr).strip())
        base = mm.group(1); off = float(mm.group(2).replace(" ", "")) if mm.group(2) else 0.0
        b = S[int(base[1:])] if base and base.startswith("S") and base[1:].isdigit() else (W[base] if base else 0.0)
        return round(b + off, 3)
    tl["pointer"] = [[at(a), at(b)] for a, b in (R.get("pointer") or [])]
    json.dump(tl, open(f"{d}/timeline.json", "w"), indent=1)
    return tl, at


def record(R, d):
    if not R.get("run"): return
    if os.path.exists(f"{d}/assets/result.json"): print("run: cached", json.load(open(f"{d}/assets/result.json"))); return
    sh(["node", f"{ROOT}/engine/record.cjs", f"{d}/assets", json.dumps(R["run"])])


def pointer(R, d):
    if not R.get("pointer"): return "none"
    lib = f"{ROOT}/library/pointer"; clips = json.load(open(f"{lib}/library.json"))["clips"]
    hist_f = f"{lib}/history.json"; hist = json.load(open(hist_f)) if os.path.exists(hist_f) else []
    pick = R.get("outfit")
    if not pick:
        import random
        pool = [c for c in clips if c not in hist[-4:]] or clips; pick = random.choice(pool)
        json.dump((hist + [pick])[-30:], open(hist_f, "w")); R["outfit"] = pick
        json.dump(R, open(f"{d}/reel.json", "w"), indent=1)   # remember the pick so rebuilds match
    out = f"{d}/assets/pres"; shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    sh(["ffmpeg", "-v", "error", "-c:v", "libvpx-vp9", "-i", f"{lib}/{pick}-alpha.webm", "-pix_fmt", "rgba", f"{out}/p%03d.png"])
    print("pointer outfit:", pick); return "pres"


def pres_frames(d):
    p = f"{d}/assets/pres"; return len([f for f in os.listdir(p) if f.endswith(".png")]) if os.path.isdir(p) else 0


def page(d, tl, mode):
    run = open(f"{d}/assets/run.json").read() if os.path.exists(f"{d}/assets/run.json") else '{"frames":[]}'
    html = open(f"{d}/scene.html").read().replace("__TIMELINE__", json.dumps(tl)).replace("__RUN__", run).replace("__MODE__", mode)
    open(f"{d}/build.html", "w").write(html)


def stills(d, ts):
    sh(f'cd "{d}" && HTML=build.html node "{ROOT}/engine/render.cjs" stills . ' + " ".join(str(t) for t in ts))
    from PIL import Image
    ims = [Image.open(f"{d}/still_{t}.jpg") for t in ts]
    for im in ims: im.thumbnail((300, 534))
    c = Image.new("RGB", (310 * len(ims), 534), "black")
    for i, im in enumerate(ims): c.paste(im, (i * 310, 0))
    c.save(f"{d}/sheet.jpg", quality=86)
    for t in ts: os.remove(f"{d}/still_{t}.jpg")
    print("contact sheet:", f"{d}/sheet.jpg")


def render(R, d, tl, at):
    dur = tl["end"]
    shutil.rmtree(f"{d}/frames", ignore_errors=True)
    sh(f'cd "{d}" && HTML=build.html node "{ROOT}/engine/render.cjs" video frames {dur}')
    sh(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", f"{d}/frames/f%05d.jpg", "-c:v", "libx264", "-preset", "slow",
        "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", f"{d}/video.tmp.mp4"])
    import soundfile as sf
    ev = [(at(e[0]), e[1], e[2] if len(e) > 2 else None) for e in R.get("sfx", [])]
    sf.write(f"{d}/sfx.wav", sfx.render(ev, dur), sfx.SR)
    sh(["ffmpeg", "-v", "error", "-y", "-i", f"{d}/vo.wav", "-i", f"{d}/sfx.wav", "-filter_complex",
        f"[0:a]aresample=48000,apad=whole_dur={dur}[v];[1:a]volume=0.85[s];[v][s]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]",
        "-map", "[a]", "-c:a", "pcm_s16le", f"{d}/mix.wav"])
    sh(["ffmpeg", "-v", "error", "-y", "-i", f"{d}/video.tmp.mp4", "-i", f"{d}/mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", f"{d}/out.tmp.mp4"])
    os.replace(f"{d}/out.tmp.mp4", f"{d}/out.mp4"); os.remove(f"{d}/video.tmp.mp4"); shutil.rmtree(f"{d}/frames", ignore_errors=True)
    print("video:", f"{d}/out.mp4", round(dur, 2), "s")


def main():
    d = os.path.abspath(sys.argv[1]); R = json.load(open(f"{d}/reel.json"))
    only_stills = "--stills" in sys.argv
    tts(R, d); words = transcribe(d)
    print("voice check, read it against the script:\n   ", " ".join(w for w, _, _ in words))
    m = merged(words); record(R, d); tl, at = timeline(R, d, m)
    mode = pointer(R, d); tl["presFrames"] = pres_frames(d) if mode == "pres" else 0
    json.dump(tl, open(f"{d}/timeline.json", "w"), indent=1); page(d, tl, mode)
    if only_stills:
        ts = sys.argv[sys.argv.index("--stills") + 1].split(","); stills(d, ts); return
    render(R, d, tl, at)
    stills(d, [round(s + 1.2, 2) for s in tl["scenes"]][:7])


if __name__ == "__main__":
    main()
