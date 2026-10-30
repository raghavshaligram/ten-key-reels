// Shared helpers for code-built reels. Every frame is a pure function of time t (seconds).
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const spring = (x) => { x = clamp(x); return 1 - Math.exp(-6 * x) * Math.cos(9 * x); };
function set(id, o) { const e = $(id); const s = o.s ?? 1, x = o.x ?? 0, y = o.y ?? 0, r = o.r ?? 0, rx = o.rx ?? 0;
  e.style.opacity = o.o ?? 1; e.style.transform = `perspective(1600px) translate(${x}px,${y}px) rotate(${r}deg) rotateX(${rx}deg) scale(${s})`; }
function pop(id, t, t0, ex = {}) { const p = spring((t - t0) / .55), a = easeOut((t - t0) / .25);
  set(id, { o: t < t0 ? 0 : a, s: (t < t0 ? .6 : .6 + .4 * p) * (ex.s ?? 1), x: ex.x, y: (ex.y ?? 0) + (1 - a) * 40, r: ex.r }); }
function slam(id, t, t0, ex = {}) { const a = clamp((t - t0) / .18), s = t < t0 ? 0 : (a < 1 ? 1.6 - .6 * easeOut(a) : 1 + .04 * Math.exp(-(t - t0 - .18) * 10) * Math.sin((t - t0) * 40));
  set(id, { o: t < t0 ? 0 : easeOut(a * 2), s: s * (ex.s ?? 1), x: ex.x, y: ex.y, r: ex.r }); }
function out(id, t, t1) { if (t <= t1) return; const a = easeInOut((t - t1) / .35); const e = $(id);
  e.style.opacity = (+e.style.opacity || 0) * (1 - a); e.style.transform += ` translateY(${-30 * a}px) scale(${1 - .08 * a})`; }
const hide = (id) => { $(id).style.opacity = 0; };
const inWin = (t, a, b) => t >= a && t < b;
function count(id, t, t0, dur, to, fmt = (v) => v.toLocaleString("en-US")) { $(id).textContent = fmt(t < t0 ? 0 : Math.round(to * easeOut((t - t0) / dur))); }
// real captured frames
function frameBook(run, base = "assets/") { const imgs = run.frames.map((f) => { const i = new Image(); i.src = base + f.f; return i; });
  return { imgs, at(sec) { let b = 0; for (let i = 0; i < run.frames.length; i++) if (run.frames[i].t <= sec) b = i; return imgs[b]; } }; }
function drawCrop(id, im, fx, fy, fw, fh, bg) { const c = $(id), g = c.getContext("2d"), W = im.naturalWidth, H = im.naturalHeight;
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  const sw = W * fw, sh = H * fh, k = Math.min(c.width / sw, c.height / sh), dw = sw * k, dh = sh * k;
  g.drawImage(im, W * fx, H * fy, sw, sh, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh); }
// captions: [word] gets the accent class; digits get the number class
function caption(t, caps, end, accent = "pill", num = "pill y") {
  let cur = null; for (const c of caps) if (t >= c.t - 0.02) cur = c;
  const el = $("cap"); if (!cur || t > end - 0.6) { el.style.opacity = 0; return; }
  const html = cur.text.replace(/\[(.+?)\]/g, (_, w) => `<span class="${/\d/.test(w) && !w.includes(".com") ? num : accent}">${w}</span>`);
  if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
  const fit = Math.min(1, 960 / Math.max(1, el.scrollWidth));
  const a = easeOut((t - cur.t) / 0.16); el.style.opacity = a;
  el.style.transform = `translateX(-50%) translateY(${(1 - a) * 18}px) scale(${(0.96 + 0.04 * a) * fit})`;
}

// The presenter: a keyed clip of a woman pointing up, popping up from the bottom-right during TL.pointer windows.
// Needs <canvas class="el" id="pres" width="720" height="1280" style="left:600px;top:1100px;width:480px;height:853px"></canvas>
// Returns true while she is on screen, so the scene can move the caption left (see moveCaption).
function presenterFrames(TL) { const n = TL.presFrames || 0; return Array.from({ length: n }, (_, i) => { const im = new Image(); im.src = `assets/pres/p${String(i + 1).padStart(3, "0")}.png`; return im; }); }
function presenter(t, TL, frames) {
  hide("pres"); if (!frames.length) return false; let on = null;
  for (const [a, b] of TL.pointer || []) if (t >= a && t < b + .35) on = [a, b];
  if (!on) return false;
  const [a, b] = on, lt = t - a, inA = spring(lt / .6), outA = easeInOut((t - b) / .35), last = frames.length - 1;
  const y = (1 - inA) * 760 + (t > b ? outA * 900 : 0);
  const fi = 30 + Math.floor(lt * 34), pp = fi <= last ? fi : (() => { const k = (fi - last) % 80; return k < 40 ? last - k : last - 40 + (k - 40); })();
  const c = $("pres"), g = c.getContext("2d"), im = frames[Math.max(0, Math.min(last, pp))];
  g.clearRect(0, 0, c.width, c.height); if (im && im.naturalWidth) g.drawImage(im, 0, 0);
  c.style.opacity = 1; c.style.transform = `translateY(${y}px)`; return true;
}
// While she is on screen the caption wraps into the left 540px so it never sits on her.
function moveCaption(on, top = 1290) { const el = $("cap");   // top: the caption's usual y
  if (on) { el.style.setProperty("left", "320px", "important"); el.style.top = top + "px"; el.style.whiteSpace = "normal"; el.style.width = "540px"; el.style.textAlign = "center"; }
  else { el.style.removeProperty("left"); el.style.top = top + "px"; el.style.whiteSpace = ""; el.style.width = ""; } }
