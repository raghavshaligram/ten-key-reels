"""Green-screen key by 'greenness' (G minus the larger of R and B): black, skin and hair stay opaque."""
import subprocess, sys, numpy as np
src, dst = sys.argv[1], sys.argv[2]; W, H = 720, 1280
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", "fps=30", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28", "-auto-alt-ref", "0", dst], stdin=subprocess.PIPE)
lo, hi = 25.0, 70.0           # greenness below lo = fully opaque, above hi = fully transparent
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.float32)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    gn = g - np.maximum(r, b)
    a = np.clip(1 - (gn - lo) / (hi - lo), 0, 1)
    # despill: pull green down to the other channels where it leads
    g2 = np.where(gn > 0, np.maximum(r, b) + np.minimum(gn, 8), g)
    out = np.dstack([r, g2, b, a * 255]).clip(0, 255).astype(np.uint8)
    enc.stdin.write(out.tobytes())
enc.stdin.close(); enc.wait(); dec.wait()
