// "One Client" — Nodstage two-hander in the Sci-Fi Sitcom Toon style (Lemo-Opuscar by Lemomo, MIT / CC BY 4.0).
// Engine: toon.js from the style's demo (screen-space boil, constant line width). Cast, worlds and story are original.
import { clamp, lerp, seg, ss, eo, ei, eio, back, spring, hash, TAU } from './lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, screenRect, noodle, reset, quad, getM } from './toon.js';

init(document.getElementById('c'));
const TL = await (await fetch('tl.json')).json();
const PROOF = new Image(); PROOF.src = 'proof.png'; const LOGO = new Image(); LOGO.src = 'logo.png';
await Promise.all([PROOF, LOGO].map(i => i.decode().catch(() => { })));
const DUR = 78.3;
const q = t => Math.floor(t * 12 + 1e-6) / 12;              // characters on twos
const WT = TL.wt, LINES = TL.lines;
const wAt = (i) => WT[i][1];                                  // word start by index

// ———————————————— lip sync from the shared voice ————————————————
function talk(who, t) {
  const tq = q(t);
  for (const L of LINES) if (L.who === who && tq >= L.t0 - .03 && tq < L.t1 + .08) {
    const a = TL.amp[Math.floor(tq * 30)] || 0; return { o: clamp(a * 1.05), talking: true };
  }
  return { o: 0, talking: false };
}

// ———————————————— face parts (from the style's chars.js) ————————————————
const PAL = { white: '#ffffff', mouthIn: '#4a1a2a', tongue: '#e8637a' };
function eye(cx, cy, rx, ry, { lid = 0, look = [0, 0], pupil = 4.5, skin = '#a86d4a', closed = false, lw = 6, jitter = 0 } = {}) {
  if (closed) { stroke(arc(cx, cy + ry * .15, rx * .8, ry * .45, Math.PI * 1.1, Math.PI * 1.9, 14), lw); return; }
  shape(ell(cx, cy, rx, ry, 36), {
    fill: PAL.white, lw, shade: () => {
      dot(cx + look[0] * rx * .55 + jitter, cy + look[1] * ry * .5, pupil);
      if (lid > 0) { const yl = cy - ry + lid * 2 * ry;
        fillOnly([[cx - rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, yl], [cx - rx * 1.3, yl + ry * .08]], skin, { boil: .5 });
        stroke([[cx - rx * 1.2, yl + ry * .08], [cx + rx * 1.2, yl]], lw); }
    }
  });
}
function mouth(cx, cy, mw, { o = 0, w = 1, sm = 0, lw = 6, teeth = true } = {}) {
  const hw = mw * w / 2, k = mw * .22, lc = [cx - hw, cy - sm * k], rc = [cx + hw, cy - sm * k];
  if (o < .07) { stroke(quad(lc, [cx, cy + sm * k * 1.2], rc, 12), lw); return; }
  const h = o * mw * .62;
  const P = [...quad(lc, [cx, cy - h * .25 + sm * k * .4], rc, 12), ...quad(rc, [cx, cy + h + sm * k * .6], lc, 14)];
  shape(P, { fill: PAL.mouthIn, lw, shade: () => { if (teeth && o > .22) fillOnly(rect(cx - hw * 1.2, cy - h, hw * 2.4, h * .32 + 6), PAL.white, { boil: .3 }); fillOnly(ell(cx + hw * .15, cy + h * .95, hw * .6, h * .45, 20), PAL.tongue, { boil: .3 }); } });
}
function hand(x, y, ang, r = 21, col = '#a86d4a', { fist = false, lw = 6, point = false } = {}) {
  push(); translate(x, y); rotate(ang);
  const pts = fist ? spline([[-r * .6, -r * .8], [r * .7, -r * .9], [r * 1.1, -r * .1], [r * .8, r * .8], [-r * .5, r * .9], [-r * .9, 0]])
    : point ? spline([[-r * .6, -r * .8], [r * .6, -r * .8], [r * 2.1, -r * .55], [r * 2.15, -r * .1], [r * .9, -r * .05], [r * .8, r * .8], [-r * .5, r * .9], [-r * .9, 0]])
      : spline([[-r * .5, -r * .85], [r * .5, -r * 1.05], [r * 1.35, -r * .75], [r * 1.05, -r * .3], [r * 1.5, -r * .1], [r * 1.1, r * .3], [r * 1.35, r * .7], [r * .6, r * .95], [-r * .6, r * .8], [-r * .95, 0]]);
  shape(pts, { fill: col, lw }); pop();
}
const sweat = (x, y, s = 1) => shape(spline([[x, y - 16 * s], [x + 9 * s, y + 4 * s], [x, y + 12 * s], [x - 9 * s, y + 4 * s]]), { fill: '#bfe9ff', lw: 5 });

// image in world coordinates (screenshots on props)
function img(im, x, y, w, h) { const m = getM(); g.save(); g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); g.drawImage(im, x, y, w, h); g.restore(); }

// ———————————————— the cast ————————————————
// DEV, the agency owner: sticky-note sweater + a headset he never takes off (his one absurd costume idea)
const OC = { skin: '#a86d4a', skinS: '#8a5538', hair: '#2a1c22', sw: '#f2b134', swS: '#d4911c', pants: '#35587a', shoe: '#f4f1ea', set: '#5c6170' };
function owner(P) {
  const ner = P.nerv || 0, t = P.t || 0, jit = ner ? (hash(Math.floor(t * 12) * 3.3) - .5) * 8 * ner : 0;
  push(); translate(P.x + jit, P.y + (P.bob || 0)); scale((P.s ?? 1) * (P.face ?? 1), (P.s ?? 1) * (P.sq ?? 1));
  for (const sx of [-1, 1]) {
    const hip = [sx * 30, -250], ank = [sx * 36, -38];
    shape(noodle(hip, ank, sx * -4, 46, 40), { fill: OC.pants, lw: 7, shade: () => fillOnly(rect(sx > 0 ? 0 : -200, -260, 200, 240), sx > 0 ? '#294660' : OC.pants, { boil: .3 }) });
    shape(spline([[ank[0] - 34, ank[1] + 36], [ank[0] - 30, ank[1] + 2], [ank[0] + 14, ank[1] - 2], [ank[0] + 54, ank[1] + 18], [ank[0] + 50, ank[1] + 38]]), { fill: OC.shoe, lw: 7, shade: () => fillOnly(rect(ank[0] - 50, ank[1] + 26, 120, 20), '#e86a5a', { boil: .3 }) });
  }
  push(); rotate(P.lean || 0);
  const shL = [-80, -468], shR = [80, -468];
  const armL = P.armL || { h: [-20, 190], bend: -18 }, armR = P.armR || { h: [20, 190], bend: 18 };
  const drawArm = (sh, a) => { const hp = [sh[0] + a.h[0], sh[1] + a.h[1]];
    shape(noodle(sh, hp, a.bend ?? 0, 40, 32), { fill: OC.sw, lw: 7 });
    hand(hp[0], hp[1], Math.atan2(hp[1] - sh[1], hp[0] - sh[0]), 22, OC.skin, { fist: a.fist, point: a.point }); };
  drawArm(shL, armL);
  const body = spline([[0, -506], [72, -488], [100, -390], [94, -262], [0, -238], [-94, -262], [-100, -390], [-72, -488]]);
  shape(body, { fill: OC.sw, lw: 7, shade: () => {
    fillOnly(spline([[40, -520], [110, -480], [120, -360], [104, -240], [60, -240], [76, -380]]), OC.swS, { boil: .4 });
    const notes = [[-52, -430, '#ff7aa8', -.25], [18, -404, '#7fd8ff', .18], [-30, -330, '#fff07a', .12], [52, -318, '#ff7aa8', -.1], [-64, -282, '#7fd8ff', .3], [8, -462, '#fff07a', -.16], [44, -446, '#fff07a', .2], [-6, -280, '#ff7aa8', .05]];
    for (const [x, y, c, r] of notes) { push(); translate(x, y); rotate(r); fillOnly(rect(-19, -19, 38, 38), c, { boil: .4 }); stroke([[-11, -6], [11, -8]], 3); stroke([[-11, 4], [6, 3]], 3); pop(); }
  } });
  shape(rr(-44, -530, 88, 46, 18), { fill: OC.swS, lw: 6 });      // turtleneck
  // head
  push(); translate(0, -612); rotate(P.headTilt || 0);
  shape(spline([[-128, -20], [-136, -96], [-92, -160], [-20, -184], [56, -176], [118, -128], [140, -50], [128, 20], [90, 10], [-90, 10]]), { fill: OC.hair, lw: 7, shade: () => { for (const [x, y] of [[-70, -120], [10, -150], [80, -110]]) fillOnly(ell(x, y, 22, 14, 14), '#46303a', { boil: .4 }); } });
  for (const sx of [-1, 1]) shape(ell(sx * 86, 18, 16, 24, 16), { fill: OC.skin, lw: 6 });
  shape(ell(0, 14, 86, 96, 50), { fill: OC.skin, lw: 7, shade: () => fillOnly(ell(60, 40, 52, 92, 30), OC.skinS, { boil: .3 }) });
  const look = P.look || [0, 0], lid = P.blink ? 1 : (P.lid ?? .1);
  const jj = ner ? (hash(Math.floor(t * 24) * 1.7) - .5) * 3 * ner : 0;
  if (P.closed) { stroke(arc(-30, 0, 24, 14, Math.PI * 1.1, Math.PI * 1.9, 12), 6); stroke(arc(32, 0, 24, 14, Math.PI * 1.1, Math.PI * 1.9, 12), 6); }
  else { eye(-30, -2, 34, 40, { lid, look, skin: OC.skin, pupil: P.pupil ?? 4.5, jitter: jj }); eye(34, -2, 34, 40, { lid, look, skin: OC.skin, pupil: P.pupil ?? 4.5, jitter: jj }); }
  const br = P.brow ?? .5;                                       // worried: inner ends up
  stroke([[-62, -52 + br * 4], [-14, -58 - br * 14]], 8); stroke([[66, -52 + br * 4], [18, -58 - br * 14]], 8);
  shape(spline([[4, 18], [18, 40], [8, 50], [-6, 46]]), { fill: OC.skin, lw: 5 });
  const m = P.mouth || {};
  mouth(2, 70, 72, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? -.2, lw: 6 });
  // headset
  stroke(arc(0, 0, 132, 150, Math.PI * 1.08, Math.PI * 1.92, 24), 9, { line: OC.set });
  shape(ell(-118, 14, 20, 30, 16), { fill: OC.set, lw: 6 });
  stroke(spline([[-112, 36], [-92, 74], [-52, 86], [-36, 80]], false), 6);
  dot(-34, 80, 9, '#e8392b');
  pop();
  drawArm(shR, armR);
  pop();
  if (P.sweat != null) { const u = P.sweat % 1; sweat(-110, -700 + u * 40, 1.1); sweat(120, -680 + ((u + .5) % 1) * 40, .9); }
  pop();
}

// NOD, the Nodstage pin: deadpan, heavy lids, floating mitts, a tiny bow tie
const NC = { body: '#d0176f', bodyS: '#a10e55', hi: '#ff7ab8', face: '#fff1f6', tie: '#3b1f66' };
function nod(P) {
  const t = P.t || 0, bob = Math.sin(t * 2.2) * 8;
  push(); translate(P.x, P.y); scale(P.s ?? 1, P.s ?? 1);
  fillOnly(ell(0, 0, 86 - bob, 16, 30), 'rgba(27,20,34,.22)', { boil: .3 });
  push(); translate(0, bob + (P.dy || 0)); rotate(P.tilt || 0); scale(1 / (P.sq ?? 1), P.sq ?? 1);
  const pin = [...arc(0, -400, 128, 128, Math.PI * .80, Math.PI * 2.20, 40), [0, -170]];
  shape(pin, { fill: NC.body, lw: 7, shade: () => { fillOnly(ell(110, -390, 110, 210, 30), NC.bodyS, { boil: .4 }); fillOnly(ell(-74, -478, 28, 14, 14), NC.hi, { boil: .3 }); } });
  shape(ell(0, -404, 88, 86, 44), { fill: NC.face, lw: 6 });
  const look = P.look || [0, 0];
  if (P.closed) { stroke(arc(-30, -412, 24, 12, Math.PI * 1.1, Math.PI * 1.9, 12), 6); stroke(arc(30, -412, 24, 12, Math.PI * 1.1, Math.PI * 1.9, 12), 6); }
  else { const lid = P.blink ? 1 : (P.lid ?? .5);
    eye(-30, -414, 30, 34, { lid, look, skin: NC.face, pupil: 4 }); eye(30, -414, 30, 34, { lid, look, skin: NC.face, pupil: 4 }); }
  stroke(arc(-30, -380, 18, 6, Math.PI * .2, Math.PI * .8, 8), 3.5); stroke(arc(30, -380, 18, 6, Math.PI * .2, Math.PI * .8, 8), 3.5);
  const m = P.mouth || {};
  mouth(0, -350, 44, { o: (m.o || 0) * .8, sm: m.sm ?? -.05, lw: 5, teeth: false });
  shape([[0, -298], [-38, -318], [-38, -278]], { fill: NC.tie, lw: 5 }); shape([[0, -298], [38, -318], [38, -278]], { fill: NC.tie, lw: 5 }); shape(ell(0, -298, 10, 10, 12), { fill: NC.tie, lw: 5 });
  pop();
  const hs = P.hands || [[-170, -300], [170, -300]];
  hs.forEach(([hx, hy], i) => { const w = Math.sin(t * 2.4 + i) * 6; hand(hx, hy + bob + w, i ? (P.handA?.[1] ?? -.3) : (P.handA?.[0] ?? Math.PI + .3), 26, NC.body, { fist: P.fist?.[i], point: P.point?.[i] }); });
  pop();
}

// BEAN, the client: a coffee bean from Fernhill Coffee Co. with a sprout. Non-verbal. Slightly drippy.
function bean(P) {
  const t = P.t || 0, hop = P.hop ? Math.abs(Math.sin(t * 9)) * 18 : 0;
  push(); translate(P.x, P.y - hop); scale((P.s ?? 1) * (P.face ?? 1), (P.s ?? 1) * (P.sq ?? 1));
  fillOnly(ell(0, hop, 66, 12, 24), 'rgba(27,20,34,.2)', { boil: .3 });
  for (const sx of [-1, 1]) { shape(noodle([sx * 22, -40], [sx * 30 + (P.walk ? Math.sin(t * 12 + sx) * 10 : 0), -4], 0, 16, 14), { fill: '#5a3320', lw: 6 }); shape(ell(sx * 34, -2, 18, 9, 12), { fill: '#5a3320', lw: 5 }); }
  shape(ell(0, -130, 76, 98, 40), { fill: '#7a4a2b', lw: 7, shade: () => { fillOnly(ell(40, -120, 50, 100, 24), '#62391f', { boil: .3 }); fillOnly(ell(-34, -190, 14, 22, 12), 'rgba(255,255,255,.4)', { boil: .2 }); } });
  stroke(spline([[-6, -226], [12, -170], [-10, -110], [8, -40]], false), 6, { line: '#3e2212' });
  shape(spline([[30, -40], [42, -36], [40, -10], [34, 6], [28, -10]]), { fill: '#7a4a2b', lw: 5 });   // a drip
  shape(spline([[0, -226], [-2, -262], [-30, -282], [-50, -266], [-24, -254], [-4, -248]]), { fill: '#4f9a5a', lw: 6 });   // sprout
  const look = P.look || [0, 0];
  eye(-24, -150, 24, 28, { look, skin: '#7a4a2b', pupil: 3.6, lid: P.blink ? 1 : (P.lid || 0), closed: P.closed });
  eye(24, -150, 24, 28, { look, skin: '#7a4a2b', pupil: 3.6, lid: P.blink ? 1 : (P.lid || 0), closed: P.closed });
  mouth(0, -100, 28, { o: P.o || 0, sm: P.sm ?? .7, lw: 5, teeth: false });
  if (P.armUp) { shape(noodle([-60, -130], [-96, -200], -10, 14, 11), { fill: '#7a4a2b', lw: 6 }); shape(noodle([60, -130], [96, -200], 10, 14, 11), { fill: '#7a4a2b', lw: 6 }); }
  pop();
}

// ———————————————— the travel device: the Nodstage portal (the only thing that glows) ————————————————
function portal(cx, cy, r, t, { open = 1, sx = .74, spin = 1 } = {}) {
  if (open <= .001) return;
  const R = r * open;
  push(); translate(cx, cy); scale(sx, 1);
  fillOnly(ell(0, 0, R * 1.55, R * 1.45, 48), 'rgba(255,90,170,.16)', { boil: .6 });
  fillOnly(ell(0, 0, R * 1.28, R * 1.22, 48), 'rgba(255,90,170,.2)', { boil: .6 });
  const rim = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, k = 1 + .08 * Math.sin(i * 1.7 + t * 3) + .05 * Math.sin(a * 5 + t * 6); rim.push([Math.cos(a) * R * k, Math.sin(a) * R * k]); }
  shape(spline(rim), { fill: '#ff3fa4', lw: 8, shade: () => {
    fillOnly(ell(0, 0, R * .9, R * .9, 40), '#ff8cc8', { boil: .3 });
    for (let k = 0; k < 5; k++) { const a1 = [], a2 = [];
      for (let j = 0; j <= 22; j++) { const u = j / 22, rr_ = R * (1 - u) * .95, a = k / 5 * TAU + u * 3.6 + t * 2.6 * spin; a1.push([Math.cos(a) * rr_, Math.sin(a) * rr_]); const b = a + .55 * (1 - u * .7); a2.push([Math.cos(b) * rr_, Math.sin(b) * rr_]); }
      fillOnly([...a1, ...a2.reverse()], k % 2 ? '#ffd0e8' : '#e0158a', { boil: .4 }); }
    fillOnly(ell(0, 0, R * .3, R * .3, 24), '#ffe6f3', { boil: .5 }); fillOnly(ell(0, 0, R * .14, R * .14, 16), '#ffffff', { boil: .5 });
  } });
  for (let i = 0; i < 12; i++) { const a = hash(i) * TAU + t * (1.5 + hash(i + 4) * 2), d = R * (1.05 + .25 * ((t * .8 + hash(i + 9)) % 1)); dot(Math.cos(a) * d, Math.sin(a) * d, 5 + hash(i + 2) * 4, i % 3 ? '#ffb3da' : '#ffffff'); }
  pop();
}

// ———————————————— props ————————————————
const F = (s, w = 800) => `${w} ${s}px "Baloo 2"`;
function label(str, x, y, { fill = '#fff07a', size = 30, rot = 0 } = {}) {
  push(); translate(x, y); rotate(rot); g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(size); const w = g.measureText(str).width + 26;
  shape(rr(-w / 2, -size * .75, w, size * 1.5, 6), { fill, lw: 5 }); text(str, 0, 2, { font: F(size), fill: INK }); pop();
}
const popS = (t, t0, d = .3) => t < t0 ? 0 : back(seg(t, t0, t0 + d), 2.2);
function mailbox(x, y, s, t) { push(); translate(x, y); scale(s);
  shape(rect(-10, -10, 20, 150), { fill: '#7a6a8a', lw: 6 });
  shape([...arc(0, -70, 90, 70, Math.PI, TAU, 18), [90, 0], [-90, 0]], { fill: '#3b6fd6', lw: 7, shade: () => fillOnly(rect(30, -150, 80, 160), '#2a52a8', { boil: .3 }) });
  shape(rect(70, -120, 14, 60), { fill: '#e8392b', lw: 5 }); shape(rect(70, -120, 40, 22), { fill: '#e8392b', lw: 5 });
  for (let i = 0; i < 4; i++) { push(); translate(-70 + i * 12, -20 - i * 8 + Math.sin(t * 8 + i) * 4); rotate(-.5 + i * .2); shape(rect(-30, -20, 60, 40), { fill: '#f4f1ea', lw: 5 }); stroke([[-30, -20], [0, 2], [30, -20]], 4); pop(); }
  pop(); }
function cabinet(x, y, s, t) { push(); translate(x, y); scale(s);
  shape(rr(-80, -200, 160, 260, 8), { fill: '#9aa3b5', lw: 7, shade: () => fillOnly(rect(30, -210, 70, 280), '#7c8598', { boil: .3 }) });
  for (let i = 0; i < 3; i++) { shape(rr(-64, -186 + i * 82, 128, 68, 6), { fill: '#b4bccc', lw: 5 }); shape(rr(-20, -160 + i * 82, 40, 12, 4), { fill: '#5c6170', lw: 4 }); }
  for (let i = 0; i < 5; i++) { push(); translate(-50 + i * 24, -196); rotate(-.3 + i * .15 + Math.sin(t * 5 + i) * .05); shape(rect(-14, -50, 28, 52), { fill: i % 2 ? '#fff07a' : '#f4f1ea', lw: 4 }); pop(); }
  pop(); }
function typewriter(x, y, s, t) { push(); translate(x, y); scale(s);
  shape(rect(-60, -200, 120, 110), { fill: '#f4f1ea', lw: 6, shade: () => { for (let i = 0; i < 4; i++) fillOnly(rect(-44, -184 + i * 20, 70 - i * 8, 6), '#7a6a8a', { boil: .3 }); } });
  shape(spline([[-110, -90], [110, -90], [120, -20], [-120, -20]]), { fill: '#2f2a3a', lw: 7 });
  shape(rr(-100, -26, 200, 40, 10), { fill: '#3e3850', lw: 6 });
  for (let i = 0; i < 6; i++) dot(-70 + i * 28, -50 + (Math.floor(t * 12 + i) % 3 === 0 ? 4 : 0), 9, '#e9e4f5');
  pop(); }
function phone(x, y, s, t, ring = 0) { push(); translate(x + (ring ? Math.sin(t * 60) * 4 : 0), y); scale(s);
  shape(spline([[-100, 0], [-80, -90], [80, -90], [100, 0]]), { fill: '#e8392b', lw: 7, shade: () => fillOnly(rect(30, -100, 80, 110), '#c42a20', { boil: .3 }) });
  shape(ell(0, -50, 40, 30, 24), { fill: '#f4f1ea', lw: 5 }); dot(0, -50, 8);
  shape(spline([[-110, -110], [-90, -140], [90, -140], [110, -110], [80, -96], [60, -118], [-60, -118], [-80, -96]]), { fill: '#e8392b', lw: 6 });
  for (let i = 0; i < 3; i++) { const u = (t * 1.2 + i / 3) % 1; push(); translate(-80 + i * 80, -190 - u * 60); scale(.6 + u * .4); shape(spline([[-40, -26], [40, -26], [40, 18], [0, 18], [-14, 34], [-12, 18], [-40, 18]]), { fill: '#fff', lw: 5, alpha: 1 - u }); text('!!', 0, -4, { font: F(28), fill: '#e8392b' }); pop(); }
  pop(); }
function register(x, y, s, t) { push(); translate(x, y); scale(s);
  shape(spline([[-110, 0], [-90, -150], [90, -150], [110, 0]]), { fill: '#e7d3a6', lw: 7, shade: () => fillOnly(rect(40, -160, 80, 170), '#cdb37a', { boil: .3 }) });
  shape(rect(-70, -210, 140, 60), { fill: '#3e3850', lw: 6 }); text('$$$', 0, -180, { font: '400 44px VT323', fill: '#ffd36e' });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) dot(-54 + c * 36, -110 + r * 34, 11, '#f4f1ea');
  shape(rect(-120, 0, 240, 40), { fill: '#cdb37a', lw: 6 });
  stroke(spline([[90, -150], [120, -200], [100, -250], [130, -300]], false), 18, { line: '#ffffff' });
  pop(); }
const DEV = [  // the five places, at their spots on the wall shelves
  { f: mailbox, x: 200, y: 600, label: 'EMAIL', w: 12 },
  { f: cabinet, x: 520, y: 600, label: 'PROJECTS', w: 15 },
  { f: typewriter, x: 830, y: 600, label: 'PROPOSALS', w: 18 },
  { f: phone, x: 330, y: 930, label: 'FEEDBACK', w: 20 },
  { f: register, x: 740, y: 930, label: 'INVOICES', w: 25 }];

function cardProp(x, y, w, h, title, lines, { fill = '#fffaf0', head = '#3b1f66', rot = 0, s = 1 } = {}) {
  push(); translate(x, y); rotate(rot); scale(s);
  shape(rr(-w / 2, -h / 2, w, h, 16), { fill, lw: 7, shade: () => fillOnly(rect(-w / 2 - 10, -h / 2 - 10, w + 20, 70), head, { boil: .3 }) });
  text(title, 0, -h / 2 + 34, { font: F(32), fill: '#fff' });
  lines.forEach((l, i) => text(l, -w / 2 + 26, -h / 2 + 100 + i * 46, { font: F(30), fill: INK, align: 'left' }));
  pop();
}
function stamp(str, x, y, s, rot, col = '#2bb673') { if (s <= 0) return; push(); translate(x, y); rotate(rot); scale(s); g.setTransform(1, 0, 0, 1, 0, 0); g.font = '400 64px Bungee'; const w = g.measureText(str).width + 50;
  shape(rr(-w / 2, -50, w, 100, 16), { fill: 'rgba(255,255,255,.85)', lw: 8, line: col }); text(str, 0, 6, { font: '400 64px Bungee', fill: col }); pop(); }

// ———————————————— worlds (one palette each) ————————————————
function bands(cols, y0, y1) { const n = cols.length; for (let i = 0; i < n; i++) fillOnly(rect(-600, lerp(y0, y1, i / n), 2400, (y1 - y0) / n + 2), cols[i], { boil: 0 }); }
const FLOOR = 1330;
function home(t, { devices = 1, board = 0, appear = null, shake = 0 } = {}) {        // dusty lavender studio
  fillOnly(rect(-600, -400, 2400, FLOOR + 400), '#b8acd9', { boil: 0 });
  for (let x = -300; x < 1500; x += 220) stroke([[x, -400], [x, FLOOR]], 4, { line: '#a497c9' });
  shape(rect(-600, FLOOR - 20, 2400, 900), { fill: '#6d6488', lw: 6 });
  for (let k = 0; k < 4; k++) stroke([[-600, FLOOR + 40 + k * 70 + k * k * 14], [1800, FLOOR + 40 + k * 70 + k * k * 14]], 4, { line: '#5b5276' });
  if (devices) { for (const y of [604, 934]) shape(rect(40, y, 1000, 30), { fill: '#8a6a4a', lw: 6 });
    DEV.forEach((d, i) => { const s = appear ? popS(t, appear[i]) : 1; if (s <= 0) return; push(); translate(d.x, d.y); if (shake) translate(Math.sin(t * 40 + i * 2) * shake, Math.cos(t * 37 + i) * shake * .6); scale(s * .9); d.f(0, 0, 1, t, shake ? 1 : 0); label(d.label, 0, 50, { size: 28, rot: (i % 2 ? .05 : -.04) }); pop(); }); }
  if (board) connectedBoard(t, board);
}
const CHIPS = [['Projects', 168], ['Tasks', 169], ['Team', 170], ['Calendar', 171], ['Communication', 172], ['Invoices', 173], ['Payments', 175]];
function connectedBoard(t) {
  shape(rr(70, 330, 940, 640, 24), { fill: '#2b2240', lw: 8 });
  text('▶ NODSTAGE · ONE WORKSPACE', 110, 380, { font: '400 46px VT323', fill: '#ffb3da', align: 'left' });
  const pos = CHIPS.map((c, i) => [i < 4 ? 250 + (i % 2) * 300 : 250 + ((i - 4) % 2) * 300 + (i === 6 ? 150 : 0), 470 + Math.floor(i / 2) * 120]);
  const hub = [540, 900];
  const lk = seg(t, wAt(178) - .1, wAt(178) + .5);
  if (lk > 0) pos.forEach((p, i) => { const e = [lerp(hub[0], p[0], eo(lk)), lerp(hub[1], p[1], eo(lk))]; stroke([hub, e], 6, { line: '#ffd36e' }); });
  CHIPS.forEach(([n, wi], i) => { const s = popS(t, wAt(wi) - .05, .25); if (s <= 0) return; push(); translate(pos[i][0], pos[i][1]); scale(s); g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(38); const w = g.measureText(n).width + 50;
    shape(rr(-w / 2, -36, w, 72, 36), { fill: ['#ff7aa8', '#7fd8ff', '#fff07a', '#9fe3c8', '#ffb062', '#c9b6ff', '#ff7aa8'][i], lw: 6 }); text(n, 0, 2, { font: F(38), fill: INK }); pop(); });
  if (lk > 0) { push(); translate(hub[0], hub[1]); scale(eo(lk)); shape(ell(0, 0, 46, 46, 24), { fill: '#d0176f', lw: 6 }); stroke([[-22, 0], [22, 0]], 5, { line: '#fff' }); stroke([[0, -22], [0, 22]], 5, { line: '#fff' }); pop(); }
}
function leadWorld(t) {          // teal sky bands, orange ground
  bands(['#2b8f8a', '#3fb6b0', '#6fd0c4', '#9fe3d6'], -400, FLOOR - 20);
  shape(rect(-600, FLOOR - 20, 2400, 900), { fill: '#f08a3c', lw: 6 });
  fillOnly(rect(-600, FLOOR + 60, 2400, 40), '#d6702a', { boil: 0 });
  for (const [x, y, r] of [[150, 300, 50], [880, 420, 34]]) shape(ell(x, y, r * 2, r, 20), { fill: '#e8fbf6', lw: 6 });
}
function portalWorld(t) {         // ultraviolet + gold
  bands(['#2e1866', '#3d2186', '#4f2ca6', '#6440c4'], -400, FLOOR - 20);
  for (let i = 0; i < 14; i++) { const x = hash(i) * 1080, y = 260 + hash(i + 5) * 600, r = 6 + 6 * Math.sin(t * 4 + i); shape([[x, y - r], [x + r * .3, y - r * .3], [x + r, y], [x + r * .3, y + r * .3], [x, y + r], [x - r * .3, y + r * .3], [x - r, y], [x - r * .3, y - r * .3]], { fill: '#f2c14e', lw: 4 }); }
  shape(rect(-600, FLOOR - 20, 2400, 900), { fill: '#f2c14e', lw: 6 });
  fillOnly(rect(-600, FLOOR + 60, 2400, 40), '#d9a531', { boil: 0 });
}
function tasksWorld(t) {          // coral + mint
  bands(['#ff6f5e', '#ff8a6f', '#ffa483', '#ffbf9b'], -400, FLOOR - 20);
  shape(rect(-600, FLOOR - 20, 2400, 900), { fill: '#7fd6b5', lw: 6 });
  fillOnly(rect(-600, FLOOR + 60, 2400, 40), '#5fbf9c', { boil: 0 });
}
function coWorld(t, alarm = 1) {   // alarm red + cream
  const fl = alarm * (Math.floor(t * 4) % 2 ? 1 : .85);
  bands(['#a91f2c', '#c42a37', '#d9434b', '#e8636a'].map(c => c), -400, FLOOR - 20);
  if (fl < 1) screenRect('rgba(0,0,0,0)');
  shape(rect(-600, FLOOR - 20, 2400, 900), { fill: '#f6e6c8', lw: 6 });
  fillOnly(rect(-600, FLOOR + 60, 2400, 40), '#e2cda4', { boil: 0 });
  for (let i = 0; i < 3; i++) { const x = 160 + i * 380; shape(ell(x, 260, 46, 46, 24), { fill: Math.floor(t * 4 + i) % 2 ? '#ffd36e' : '#f6e6c8', lw: 6 }); }
}
// the client's branded portal: a wooden arch with their sign — the joke is that it does NOT glow
function clientPortal(x, y, w, h, t, { proof = 0, pins = 0, ok = 0 } = {}) {
  push(); translate(x, y);
  const arch = [...arc(0, -h / 2 + w / 2, w / 2 + 40, w / 2 + 40, Math.PI, TAU, 30), [w / 2 + 40, h / 2], [-w / 2 - 40, h / 2]];
  shape(arch, { fill: '#9c6a3c', lw: 8, shade: () => fillOnly(rect(w / 2 - 30, -h, 120, 2 * h), '#7d532c', { boil: .3 }) });
  const inner = [...arc(0, -h / 2 + w / 2, w / 2, w / 2, Math.PI, TAU, 30), [w / 2, h / 2], [-w / 2, h / 2]];
  shape(inner, { fill: '#f4ecdd', lw: 6 });
  if (proof > 0) { g.save(); g.globalAlpha = clamp(proof); img(PROOF, -w / 2 + 14, -h / 2 + 150, w - 28, (w - 28) * 792 / 944); g.restore(); }
  for (let i = 0; i < 2; i++) { const s = clamp(pins * 2 - i); if (s <= 0) continue; const [px, py] = [[-90, -h / 2 + 260], [-170, -h / 2 + 470]][i];
    push(); translate(px, py); scale(back(s, 2)); shape(ell(0, 0, 30, 30, 20), { fill: '#d0176f', lw: 6 }); text(String(i + 1), 0, 2, { font: F(32), fill: '#fff' }); pop(); }
  push(); translate(0, -h / 2 - w / 2 + 130); shape(rr(-250, -44, 500, 88, 14), { fill: '#3e2a1a', lw: 7 }); text('FERNHILL COFFEE CO.', 0, 4, { font: '400 40px Bungee', fill: '#f2c14e' }); pop();
  text('CLIENT PORTAL', 0, -h / 2 - w / 2 + 186, { font: '400 36px VT323', fill: '#f2c14e' });
  pop();
  if (ok > 0) stamp('APPROVED', x + 40, y + 120, back(clamp(ok), 2.2), -.14);
}
function kanban(x, y, t, { cards = [], strings = 0 } = {}) {
  push(); translate(x, y);
  shape(rr(-250, -260, 500, 560, 18), { fill: '#fffaf0', lw: 7 });
  ['TO DO', 'DOING', 'DONE'].forEach((c, i) => { text(c, -165 + i * 165, -222, { font: F(28), fill: '#3b1f66' }); if (i) stroke([[-250 + i * 166, -250], [-250 + i * 166, 290]], 4, { line: '#d8cfe8' }); });
  cards.forEach(c => { push(); translate(c.x, c.y); rotate(c.r || 0); shape(rr(-66, -40, 132, 80, 8), { fill: c.col, lw: 5 }); text(c.txt, 0, 2, { font: F(24), fill: INK }); pop(); });
  pop();
}
function hugeButton(x, y, s, t) {   // the extra request: a subscribe button the size of a fridge, on a hand truck
  if (s <= 0) return; push(); translate(x, y); scale(s);
  shape(rect(-20, -40, 40, 40), { fill: '#5c6170', lw: 6 }); shape(rect(-180, -20, 360, 24), { fill: '#5c6170', lw: 6 });
  for (const wx of [-150, 150]) shape(ell(wx, 10, 34, 34, 20), { fill: '#2f2a3a', lw: 6 });
  shape(rr(-200, -440, 400, 400, 40), { fill: '#3b1f66', lw: 8, shade: () => fillOnly(rect(80, -450, 140, 420), '#2b1650', { boil: .3 }) });
  shape(rr(-160, -300, 320, 120, 60), { fill: '#d0176f', lw: 7 }); text('SUBSCRIBE', 0, -238, { font: '400 46px Bungee', fill: '#fff' });
  text('+1 EXTRA', 0, -380, { font: '400 52px VT323', fill: '#ffd36e' });
  pop();
}
function changeOrder(x, y, u, t, { signed = 0, stampS = 0 } = {}) {
  if (u <= 0) return; push(); translate(x, y); scale(1, eo(u));
  shape(rr(-260, -230, 520, 460, 14), { fill: '#fffaf0', lw: 7, shade: () => fillOnly(rect(-280, -250, 560, 90), '#d0176f', { boil: .3 }) });
  text('CHANGE ORDER · CO-03', 0, -190, { font: F(38), fill: '#fff' });
  ['Subscribe button', 'under each bag', 'Requested by Hannah'].forEach((l, i) => text(l, -224, -110 + i * 54, { font: F(i < 2 ? 40 : 30), fill: i < 2 ? INK : '#6b5fa0', align: 'left' }));
  stroke([[-224, 120], [100, 120]], 5);
  if (signed > 0) { const n = Math.floor(signed * 12); const pts = []; for (let i = 0; i <= n; i++) pts.push([-210 + i * 24, 96 + Math.sin(i * 2.1) * 22]); if (pts.length > 1) stroke(spline(pts, false, 4), 6, { line: '#3b6fd6' }); }
  text('client signature', -224, 160, { font: F(26), fill: '#6b5fa0', align: 'left' });
  pop();
  stamp('DOCUMENTED', x + 70, y + 170, stampS, -.12, '#3b1f66');
}

// ———————————————— camera ————————————————
function cam(cx, cy, z, shake = 0, t = 0) { reset(); translate(W / 2, H / 2); if (shake) { const f = Math.floor(t * 24); translate((hash(f) - .5) * shake * 2, (hash(f + 77) - .5) * shake * 2); } scale(z); translate(-cx, -cy); }
const camL = (t, t0, t1, a, b, e = eio) => { const u = e(seg(t, t0, t1)); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; };
const landSq = (t, tl) => { const u = t - tl; if (u < 0 || u > .5) return 1; return 1 - .22 * Math.exp(-u * 9) * Math.cos(u * 30); };
const flyIn = (t, t0, t1, from, to, h = 200) => { const u = clamp((t - t0) / (t1 - t0)); return [lerp(from[0], to[0], u), lerp(from[1], to[1], u) - Math.sin(u * Math.PI) * h, u]; };
const blinkO = t => { const k = Math.floor(t * 12) % 41; return k === 0 || k === 1; };
const blinkN = t => { const k = Math.floor(t * 12 + 17) % 53; return k === 0 || k === 1; };

// default poses
const OX = 320, NX = 740, NY = FLOOR;
function O(t, o = {}) { const m = talk('OWNER', t), tq = q(t);
  return { x: OX, y: FLOOR, s: 1, face: 1, t, nerv: .25, look: [.4, -.1], blink: blinkO(t), lid: .05, brow: .6, mouth: { o: m.o * 1.1, sm: -.15 }, armL: { h: [-30, 190], bend: -20 }, armR: { h: [40, 180], bend: 20 }, sq: 1 + .01 * Math.sin(tq * 2.6), headTilt: m.talking ? (m.o - .3) * .08 : Math.sin(tq * 1.6) * .03, ...o }; }
function N(t, o = {}) { const m = talk('NOD', t);
  return { x: NX, y: NY, s: 1, t: q(t), look: [-.5, 0], lid: .5, blink: blinkN(t), mouth: { o: m.o, sm: -.05 }, tilt: m.talking ? (m.o - .3) * .05 : 0, ...o }; }
const armsUp = { armL: { h: [-80, -160], bend: -30 }, armR: { h: [90, -170], bend: 30 } };
const armsWide = { armL: { h: [-170, 40], bend: -40 }, armR: { h: [170, 40], bend: 40 } };
const holdHead = { armL: { h: [30, -170], bend: -60, fist: true }, armR: { h: [-30, -170], bend: 60, fist: true } };
const pointUp = { armR: { h: [110, -200], bend: 20, point: true } };

// ———————————————— shots ————————————————
const T = { nodIn: 9.95, portal: 23.85, title: 24.05, wipe1: 24.95, wipe2: 35.82, wipe3: 44.33, wipe4: 51.68, wipe5: 60.72, drop: 70.35, end: 71.2 };
const WIPES = [[T.wipe1, .32], [T.wipe2, .3], [T.wipe3, .3], [T.wipe4, .3], [T.wipe5, .3], [T.end, .32]];
const devAppear = [wAt(12), wAt(15), wAt(18), wAt(20), wAt(25)];
const SH = [];
const shot = (a, b, f) => SH.push([a, b, f]);

shot(0, 1.84, t => { cam(400, 880, 1.2); home(t);
  owner(O(t, { ...armsUp, mouth: { o: talk('OWNER', t).o, sm: .7 }, brow: .2, look: [.2, -.4], lean: -.04 + Math.sin(q(t) * 8) * .02 })); });
shot(1.84, 2.78, t => { cam(330, 720, 2.3); home(t);
  owner(O(t, { lid: .5, brow: 0, look: [.9, .1], mouth: { o: talk('OWNER', t).o * .6, sm: -.6 }, nerv: 0 })); });
shot(2.78, 9.06, t => {                                  // the list: the camera visits each of the five places as it pops
  const k = devAppear.filter(a => t >= a - .2).length - 1, d = DEV[Math.max(0, k)];
  const prev = DEV[Math.max(0, k - 1)], tk = k < 0 ? 2.78 : devAppear[k] - .2;
  const u = eio(seg(t, tk, tk + .35)); cam(lerp(prev.x, d.x, u), lerp(prev.y, d.y, u) - 60, 1.9); home(t, { appear: devAppear });
});
shot(9.06, 10.08, t => { cam(330, 740, 2.1, 4, t); home(t);
  owner(O(t, { nerv: 1, brow: 1, pupil: 3, look: [-.3, -.6], ...holdHead, sweat: t })); });
shot(10.08, 12.0, t => { cam(540, 1010, 1.18); home(t);
  owner(O(t, { look: [.8, 0], nerv: .5, sweat: t }));
  const s = popS(t, 10.08, .35); if (s > 0) nod(N(t, { s, look: [-.6, 0] })); });
shot(12.0, 13.54, t => { cam(540, 960, 1.08); home(t, { shake: 6 });
  owner(O(t, { armL: { h: [-60, -150], bend: -20 }, armR: { h: [140, -140], bend: 20 }, look: [-.2, -.8], nerv: .8 })); nod(N(t, { look: [-.6, -.4] })); });
shot(13.54, 14.38, t => { cam(330, 720, 2.7, 10, t); home(t, { shake: 10 });
  owner(O(t, { nerv: 1.4, brow: 1, pupil: 2.6, look: [0, 0], mouth: { o: talk('OWNER', t).o * 1.5, sm: -.8 } })); });
shot(14.38, 15.44, t => {                                // dead air: nothing moves but the boil
  const z = lerp(1.15, 1.24, seg(t, 14.38, 15.44)); cam(540, 1010, z); home(14.4);
  owner(O(14.4, { t: 14.4, nerv: 0, brow: 1, look: [.9, 0], mouth: { o: 0, sm: -.9 } })); nod(N(14.4, { look: [-.9, 0], lid: .62 })); });
shot(15.44, 18.96, t => { cam(NX, 1000, 2.0); home(t, { devices: 0 });
  const one = t > wAt(48) - .2;
  nod(N(t, { look: [-.2, 0], hands: one ? [[-170, -300], [140, -560]] : undefined, point: one ? [0, 1] : undefined, handA: one ? [Math.PI + .3, -1.4] : undefined })); });
shot(18.96, 23.1, t => { const z = lerp(1.15, 1.25, seg(t, 18.96, 23.1)); cam(540, 1010, z); home(t);
  owner(O(t, { ...armsWide, look: [.7, -.2], brow: .3, lean: .05, mouth: { o: talk('OWNER', t).o, sm: .1 } })); nod(N(t, { look: [-.7, 0] })); });
shot(23.1, T.wipe1, t => {                               // Nod draws a circle in the air; the Nodstage portal opens
  const rush = seg(t, 24.55, T.wipe1);
  const [cx, cy, z] = rush > 0 ? camL(t, 24.55, T.wipe1, [540, 960, 1], [540, 500, 3.5], ei) : [540, 960, 1];
  cam(cx, cy, z); home(t);
  const op = t < T.portal ? 0 : back(clamp((t - T.portal) / .32), 1.7);
  portal(540, 500, 220, t, { open: op });
  if (op > 0) screenRect('rgba(255,90,170,.08)');
  const drawA = seg(t, 23.4, 23.85), ang = drawA * TAU;
  owner(O(t, { nerv: .9, look: [.6, -.7], brow: 1, ...holdHead, sweat: t }));
  nod(N(t, { look: [-.6, -.6], hands: [[-170, -300], drawA > 0 && drawA < 1 ? [-200 + Math.cos(ang) * 90, -620 + Math.sin(ang) * 90] : [80, -560]], point: [0, 1] }));
  if (t > T.title) titleArt(t);
});
// —— world 1: the lead ——
const bx = 800;
function leadScene(t, { owner_ = {}, nod_ = {} } = {}) {
  leadWorld(t);
  const pl = [180, 560], step = [[300, 620], [540, 520], [780, 620]];
  const ins = [wAt(73), wAt(77), wAt(80)];
  // path markers: lead → call → proposal
  for (let i = 0; i < 2; i++) { const a = step[i], b = step[i + 1], u = seg(t, ins[i + 1] - .2, ins[i + 1] + .3); if (u > 0) stroke([a, [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]], 6, { line: '#fffaf0' }); }
  const sL = popS(t, ins[0]); if (sL > 0) { push(); translate(step[0][0], step[0][1] - 40); scale(sL); cardProp(0, 0, 330, 210, 'NEW LEAD', ['Fernhill Coffee Co.', 'Hannah Brooks'], { head: '#2b8f8a', rot: -.05 }); pop(); }
  const sC = popS(t, ins[1]); if (sC > 0) { push(); translate(step[1][0], step[1][1] - 80); scale(sC); cardProp(0, 0, 300, 200, 'DISCOVERY CALL', ['Thu · 10:00'], { head: '#f08a3c', rot: .04 }); pop(); }
  const plane = seg(t, ins[2] - .1, ins[2] + .7);
  if (plane > 0) { const [px, py] = [lerp(NX - 120, step[2][0], eo(plane)), lerp(FLOOR - 560, step[2][1] - 20, eo(plane)) - Math.sin(plane * Math.PI) * 140]; push(); translate(px, py); rotate(.2 - plane * .3);
    shape([[-80, -10], [90, -40], [-40, 40]], { fill: '#fffaf0', lw: 6 }); stroke([[90, -40], [-10, 10]], 4); text('PROPOSAL', -6, -2, { font: F(22), fill: '#3b1f66' }); pop(); }
}
shot(T.wipe1, 31.1, t => { cam(540, 1000, 1.2);
  leadScene(t);
  const land = (from, to, t0, t1, P, f) => { if (t < t0) return; if (t < t1) { const [x, y, u] = flyIn(t, t0, t1, from, to, 120); f({ ...P, x, y, s: lerp(.4, 1, eo(u)), sq: 1.2 }); } else f({ ...P, sq: landSq(t, t1) }); };
  if (t < 25.4) portal(540, 520, 180, t, { open: 1 - seg(t, 25.3, 25.6) });
  land([540, 520], [OX - 90, FLOOR], 25.0, 25.35, O(t, { x: OX - 90, s: .82, look: [.6, -.3] }), owner);
  land([540, 520], [NX - 230, FLOOR], 25.1, 25.45, N(t, { x: NX - 230, s: .82, look: [.6, -.2] }), nod);
  const walkIn = eo(seg(t, 25.4, 26.0)), follow = seg(t, wAt(82), wAt(84) + .6);
  const bxx = lerp(1250, bx, walkIn);
  bean({ x: bxx, y: FLOOR, t: q(t), walk: walkIn < 1 || (follow > 0 && follow < 1), look: [-.6, 0], s: .9, hop: t > wAt(84) });
  if (t > wAt(68) - .1 && t < wAt(73)) { push(); translate(bxx - 70, FLOOR - 230); rotate(-.2); shape(rect(-55, -36, 110, 72), { fill: '#fffaf0', lw: 6 }); stroke([[-55, -36], [0, 6], [55, -36]], 5); text('INQUIRY', 0, 24, { font: F(20), fill: '#d0176f' }); pop(); }
});
shot(31.1, 32.42, t => { cam(300, 760, 2.2); leadWorld(t);
  owner(O(t, { look: [.9, -.2], brow: .1, mouth: { o: talk('OWNER', t).o, sm: .5 }, armR: { h: [60, -60], bend: 30, fist: true } })); });
shot(32.42, 34.18, t => { cam(540, 1000, 1.2); leadWorld(t);
  const won = popS(t, wAt(91)), morph = seg(t, wAt(94) - .2, wAt(94) + .4);
  if (morph < 1) { push(); translate(540, 640); scale(1 - morph); cardProp(0, 0, 360, 230, 'NEW LEAD', ['Fernhill Coffee Co.', 'Hannah Brooks'], { head: '#2b8f8a' }); pop(); stamp('WON', 600, 700, won * (1 - morph), -.15); }
  if (morph > 0) { push(); translate(540, 660); scale(eo(morph)); kanban(0, 0, t, { cards: [{ x: -165, y: -120, col: '#9fe3d6', txt: 'Moodboard' }, { x: -165, y: -20, col: '#ffd36e', txt: 'Homepage' }, { x: 0, y: -120, col: '#ffb3da', txt: 'Shop page' }] }); text('PROJECT · WEBSITE REFRESH', 0, -300, { font: F(34), fill: INK }); pop(); }
  owner(O(t, { x: 230, s: .82, look: [.5, -.6], brow: .2, mouth: { o: 0, sm: .4 } })); nod(N(t, { x: 480, s: .82, look: [.3, -.5] }));
  bean({ x: bx, y: FLOOR, t: q(t), look: [-.4, -.6], s: .9, armUp: t > wAt(91) && t < wAt(91) + .8, closed: t > wAt(91) && t < wAt(91) + .8 }); });
shot(34.18, T.wipe2, t => { cam(NX, 980, 2.0); leadWorld(t);
  nod(N(t, { look: [-.1, 0], lid: .55, hands: t > 35.3 ? [[-170, -300], [150, -520]] : undefined, fist: [0, t > 35.3] })); });
// —— world 2: the client's branded portal ——
shot(T.wipe2, 42.42, t => {
  const [cx, cy, z] = camL(t, 35.9, 38.4, [540, 1040, 1.05], [540, 960, 1.15]); cam(cx, cy, z); portalWorld(t);
  clientPortal(560, 800, 470, 560, t, { proof: seg(t, wAt(111), wAt(111) + .3), pins: seg(t, wAt(114) - .1, wAt(114) + .6), ok: seg(t, wAt(116), wAt(116) + .25) });
  owner(O(t, { x: 190, s: .8, look: [.7, -.6], brow: .4, armR: t > wAt(108) - .2 && t < 39.4 ? { h: [150, -120], bend: 20, point: true } : undefined, mouth: { o: 0, sm: .3 } }));
  nod(N(t, { x: 420, s: .78, look: [.4, -.5] }));
  bean({ x: 860, y: FLOOR, t: q(t), look: [-.6, -.7], s: .8, armUp: t > wAt(116), closed: t > wAt(116) + .3 });
});
shot(42.42, T.wipe3, t => { cam(300, 770, 2.3); portalWorld(t);
  owner(O(t, { look: [.9, -.3], brow: .9, nerv: .5, mouth: { o: talk('OWNER', t).o, sm: -.4 } })); });
// —— world 3: feedback becomes tasks ——
shot(T.wipe3, 50.6, t => { cam(540, 1000, 1.08); tasksWorld(t);
  // the proof, small, top left, with its two pins
  push(); translate(250, 560); shape(rr(-170, -150, 340, 300, 12), { fill: '#fffaf0', lw: 7 }); img(PROOF, -156, -136, 312, 262); pop();
  const pins = [[170, 500], [120, 610]]; pins.forEach(([x, y], i) => { shape(ell(x, y, 22, 22, 16), { fill: '#d0176f', lw: 5 }); text(String(i + 1), x, y + 2, { font: F(24), fill: '#fff' }); });
  const toTask = seg(t, wAt(127), wAt(129) + .3), team = seg(t, wAt(131), wAt(134) + .5), conn = seg(t, wAt(139) - .2, wAt(143));
  const cards = [0, 1].map(i => { const col = ['#ffb3da', '#9fe3d6'][i], txt = ['Price/cup', 'Hero copy'][i];
    const from = [pins[i][0] + 60 - 760, pins[i][1] - 40 - 700], to0 = [-165, -120 + i * 100], to1 = [165, -120 + i * 100];
    const a = eo(toTask), b = eio(team);
    return { x: lerp(lerp(from[0], to0[0], a), to1[0], b), y: lerp(lerp(from[1], to0[1], a), to1[1], b) - Math.sin(b * Math.PI) * 60, col, txt, r: (1 - a) * .3 }; });
  kanban(760, 700, t, { cards });
  if (conn > 0) [0, 1].forEach(i => { const a = [760 + 165 - 66, 700 - 120 + i * 100], b = pins[i]; const n = 20, pts = []; for (let k = 0; k <= n * eo(conn); k++) { const u = k / n; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * 90]); } if (pts.length > 1) stroke(pts, 5, { line: '#3b1f66' }); });
  // the team: three small round helpers carrying the cards
  for (let i = 0; i < 3; i++) { const x = lerp(560 + i * 90, 760 + i * 90, eio(team)), y = 1010 + Math.abs(Math.sin(q(t) * 10 + i)) * -16 * (team > 0 && team < 1);
    push(); translate(x, y); shape(ell(0, 0, 42, 40, 20), { fill: ['#7fd8ff', '#fff07a', '#c9b6ff'][i], lw: 6 }); eye(-12, -6, 12, 14, { look: [.5, 0], skin: '#7fd8ff', pupil: 3 }); eye(12, -6, 12, 14, { look: [.5, 0], skin: '#7fd8ff', pupil: 3 }); stroke(quad([-12, 18], [0, 26], [12, 18], 6), 4); pop(); }
  owner(O(t, { x: 210, s: .82, look: [.8, -.5], brow: .3, mouth: { o: 0, sm: .3 } })); nod(N(t, { x: 450, s: .8, look: [.5, -.4], hands: [[-170, -300], [190, -420]], point: [0, 1] }));
});
shot(50.6, T.wipe4, t => { cam(320, 760, 2.2); tasksWorld(t);
  owner(O(t, { look: [.9, -.1], brow: .1, closed: t > 51.0 && t < 51.4, mouth: { o: 0, sm: .7 } })); });
// —— world 4: more work than agreed ——
shot(T.wipe4, 53.4, t => { cam(540, 1000, 1.1); coWorld(t);
  const inA = eo(seg(t, wAt(150) - .4, wAt(150) + .4));
  hugeButton(lerp(1500, 830, inA), FLOOR, .8, t);
  bean({ x: lerp(1700, 1000, inA), y: FLOOR, t: q(t), walk: inA < 1, look: [-.6, 0], s: .8 });
  owner(O(t, { look: [.9, -.4], nerv: .6 + inA, brow: .9, sweat: inA > .5 ? t : null, mouth: { o: talk('OWNER', t).o, sm: -.4 } }));
  nod(N(t, { x: 520, look: [.6, -.2] })); });
shot(53.4, 54.66, t => { cam(330, 720, 2.7, 12, t); coWorld(t);
  owner(O(t, { nerv: 1.6, brow: 1, pupil: 2.4, look: [.7, -.4], mouth: { o: talk('OWNER', t).o * 1.6, sm: -.9 }, ...holdHead, sweat: t })); });
shot(54.66, 59.8, t => { cam(540, 1000, 1.1); coWorld(t);
  hugeButton(830, FLOOR, .8, t);
  const un = seg(t, wAt(160) - .1, wAt(161) + .3), sign = seg(t, wAt(164), wAt(166)), st = popS(t, wAt(167) + .1);
  push(); translate(620, 560); scale(.82); changeOrder(0, 0, un, t, { signed: sign, stampS: st }); pop();
  owner(O(t, { look: [.6, -.6], nerv: lerp(1.2, .1, seg(t, 57.5, 59.5)), brow: lerp(.9, .2, seg(t, 57.5, 59.5)), sweat: t < 58 ? t : null, mouth: { o: 0, sm: lerp(-.6, .5, seg(t, 58, 59.5)) } }));
  nod(N(t, { x: 520, look: [-.3, -.5], hands: un > 0 ? [[-170, -300], [140, -470]] : undefined }));
  bean({ x: 1000, y: FLOOR, t: q(t), look: [-.6, -.6], s: .8, armUp: sign > 0 && sign < 1 }); });
shot(59.8, T.wipe5, t => { cam(330, 740, 2.2); coWorld(t, 0);
  owner(O(t, { closed: true, brow: 0, mouth: { o: 0, sm: .9 }, nerv: 0 })); });
// —— home again: everything connected ——
shot(T.wipe5, 65.98, t => { cam(540, 980, 1.08); home(t, { devices: 0, board: 1 });
  owner(O(t, { look: [.4, -.9], brow: .2, mouth: { o: 0, sm: .5 }, closed: false })); nod(N(t, { look: [-.4, -.6], hands: [[-170, -300], [80, -560]], point: [0, 1] })); });
function stackOfFive(x, y, s, fall = 0, t = 0) {   // DEV holds all five old places in his arms
  const items = [register, phone, typewriter, cabinet, mailbox];
  items.forEach((f, i) => { const u = clamp(fall * 1.6 - i * .15), dx = (i - 2) * 60 * u, yy = y - i * 70 + u * (i * 70 + 150), rot = u * (i % 2 ? .6 : -.5);
    push(); translate(x + dx, yy); rotate(rot); scale(s * .4); f(0, 0, 1, t); pop(); });
}
shot(65.98, 68.46, t => { cam(400, 860, 1.35); home(t, { devices: 0, board: 1 });
  owner(O(t, { look: [.8, -.2], brow: .7, armL: { h: [40, 40], bend: -30, fist: true }, armR: { h: [-30, 40], bend: 30, fist: true }, mouth: { o: talk('OWNER', t).o, sm: .1 } }));
  stackOfFive(OX + 30, FLOOR - 120, 1, 0, t); nod(N(t, { look: [-.7, 0] })); });
shot(68.46, 69.3, t => { const z = lerp(1.12, 1.2, seg(t, 68.46, 69.3)); cam(540, 1000, z); home(68.5, { devices: 0, board: 1 });
  owner(O(68.5, { t: 68.5, look: [.9, 0], brow: .9, armL: { h: [40, 40], bend: -30, fist: true }, armR: { h: [-30, 40], bend: 30, fist: true }, mouth: { o: 0, sm: -.2 } }));
  stackOfFive(OX + 30, FLOOR - 120, 1, 0, 68.5); nod(N(68.5, { look: [-.9, 0], lid: .62 })); });
shot(69.3, 69.94, t => { cam(NX, 990, 2.4); home(t, { devices: 0, board: 1 }); nod(N(t, { look: [-.6, 0], lid: .6 })); });
shot(69.94, T.end, t => { cam(540, 980, 1.08); home(t, { devices: 0, board: 1 });
  const f = seg(t, T.drop, T.drop + .5);
  owner(O(t, { closed: t > T.drop + .4, brow: 0, mouth: { o: 0, sm: t > T.drop + .4 ? .9 : 0 }, armL: f > 0 ? { h: [-60, -140], bend: -20 } : { h: [40, 40], bend: -30, fist: true }, armR: f > 0 ? { h: [90, -150], bend: 20 } : { h: [-30, 40], bend: 30, fist: true }, nerv: 0 }));
  stackOfFive(OX + 30, FLOOR - 120, 1, f, t); nod(N(t, { look: [-.7, .3], closed: t > T.drop + .5 })); });

// ———————————————— title, end card, wipes, tags, subtitles ————————————————
function titleArt(t) {
  const s = q(t) < T.title + .25 ? back(seg(q(t), T.title, T.title + .25), 2.4) : 1;
  push(); reset(); translate(540, 330); scale(s); rotate(-.05);
  text('ONE CLIENT', 10, 10, { font: '400 128px Bungee', fill: '#d0176f', outlineW: 20 });
  text('ONE CLIENT', 0, 0, { font: '400 128px Bungee', fill: '#fff3d6', outlineW: 20 });
  for (let i = 0; i < 4; i++) { const x = [-420, 430, -300, 330][i], y = [-90, -80, 100, 96][i], r = 14 + 9 * Math.sin(t * 5 + i * 1.7);
    shape([[x, y - r], [x + r * .28, y - r * .28], [x + r, y], [x + r * .28, y + r * .28], [x, y + r], [x - r * .28, y + r * .28], [x - r, y], [x - r * .28, y - r * .28]], { fill: '#ffe066', lw: 5 }); }
  pop();
}
function endCard(t) {
  reset(); screenRect('#241339');
  portal(540, 700, 360, t * .6, { open: spring(t - T.end, 7, .45), sx: 1 });
  screenRect('#241339', .55);
  const a = ss(seg(t, T.end + .2, T.end + .6));
  reset(); g.globalAlpha = a;
  push(); translate(540, 700); scale(back(seg(q(t), T.end + .2, T.end + .5), 2));
  shape(rr(-300, -90, 600, 180, 30), { fill: '#ffffff', lw: 8 }); img(LOGO, -240, -57, 480, 114); pop();
  g.globalAlpha = 1;
  const b = ss(seg(t, wAt(197) - .1, wAt(197) + .3));
  if (b > 0) { g.globalAlpha = b; text('Run your creative studio', 540, 470, { font: '400 64px Bungee', fill: '#fff3d6', outlineW: 14 }); text('with Nodstage', 540, 560, { font: '400 64px Bungee', fill: '#ffb3da', outlineW: 14 }); g.globalAlpha = 1; }
  const c = ss(seg(t, wAt(201), wAt(201) + .4));
  if (c > 0) { g.globalAlpha = c; text('nodstage.com', 540, 860, { font: '400 72px VT323', fill: '#ffe066', outlineW: 8 }); g.globalAlpha = 1; }
  // the duo, small, at peace
  const k = t - T.end;
  reset(); owner(O(t, { x: 330, y: 1300, s: .5, closed: k > 5, brow: 0, mouth: { o: 0, sm: .8 }, nerv: 0, look: [.6, -.3] }));
  reset(); nod(N(t, { x: 650, y: 1300, s: .5, look: [-.5, -.3], closed: k > 5.3 }));
}
function wipe(t) {
  for (const [tc, hw] of WIPES) { const d = Math.abs(t - tc); if (d > hw) continue;
    const u = 1 - d / hw, R = 1500 * Math.pow(u, .6); reset(); portal(540, 900, R, t, { open: 1, sx: 1, spin: 2.2 }); if (d < .03) screenRect('#ffe6f3', .7); }
}
const TAGS = [[25.0, 31.1, 'WORLD 01', 'THE LEAD', '#2b8f8a', '#e8fbf6'], [32.42, 34.18, 'WORLD 01', 'WON → PROJECT', '#2b8f8a', '#e8fbf6'], [35.9, 42.42, 'WORLD 02', 'THE CLIENT PORTAL', '#2e1866', '#f2c14e'],
  [44.4, 50.6, 'WORLD 03', 'FEEDBACK → TASKS', '#c94a3a', '#fff3d6'], [51.76, 53.4, 'WORLD 04', 'MORE WORK', '#a91f2c', '#ffd36e'], [54.66, 59.8, 'WORLD 04', 'CHANGE ORDER', '#a91f2c', '#ffd36e'], [60.8, 65.98, 'HOME', 'ALL CONNECTED', '#2b2240', '#ffb3da']];
function tag(t) {
  for (const [a, b0, id, desc, bg, fg] of TAGS) { const b = Math.min(b0, a + 1.7); if (t < a || t >= b) continue;
    const n = Math.floor((t - a) * 40); reset(); push(); translate(56, 258); scale(back(seg(t, a, a + .18), 2.2));
    shape(rr(0, 0, 470, 108, 12), { fill: bg, lw: 7 });
    text('▶ ' + id.slice(0, n) + (n < id.length && Math.floor(t * 6) % 2 ? '█' : ''), 22, 34, { font: '400 50px VT323', fill: fg, align: 'left' });
    text(desc.slice(0, Math.max(0, n - id.length)), 24, 80, { font: '400 40px VT323', fill: fg, align: 'left' }); pop(); }
}
// subtitles: heavy rounded white type, thick black outline, a speaker pill in the character's colour
const WHO = { OWNER: ['DEV', '#f2b134'], NOD: ['NOD', '#d0176f'], NARRATOR: ['NODSTAGE', '#6440c4'] };
const CLEAN = [[14.38, 15.44], [68.46, 69.3], [69.94, 71.26]];
let SUBS = [];
function buildSubs(caps) {
  SUBS = caps.map((c, i) => { const L = LINES.find(l => c.t >= l.t0 - .05 && c.t <= l.t1); const nx = caps[i + 1] ? caps[i + 1].t : DUR;
    let t1 = Math.min(nx - .02, Math.max(c.t + 1.2, Math.min(nx - .02, (L ? L.t1 : c.t + 2) + .5)));
    for (const [a, b] of CLEAN) if (c.t < a && t1 > a) t1 = a;
    return { t0: c.t, t1, who: L ? L.who : 'NARRATOR', text: c.text }; });
}
function wrapSub(str, maxW = 860) { g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(56); const words = str.split(' '), out = []; let cur = '';
  for (const w of words) { const s = cur ? cur + ' ' + w : w; if (g.measureText(s).width > maxW && cur) { out.push(cur); cur = w; } else cur = s; } out.push(cur); return out; }
function subs(t) {
  const s = SUBS.find(x => t >= x.t0 && t < x.t1); if (!s) return;
  const lines = wrapSub(s.text), pop_ = back(seg(t, s.t0, s.t0 + .12), 2), [nm, col] = WHO[s.who];
  const yb = 1418, y0 = yb - (lines.length - 1) * 68;
  reset(); push(); translate(540, y0 - 74); scale(pop_); g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(30); const nw = g.measureText(nm).width + 36;
  shape(rr(-nw / 2, -24, nw, 48, 16), { fill: col, lw: 5 }); text(nm, 0, 2, { font: F(30), fill: '#fff', outlineW: 6 }); pop();
  reset(); lines.forEach((l, k) => text(l, 540, y0 + k * 68, { font: F(56), fill: '#fff', outlineW: 12 }));
}

function render(t) {
  frame(t); screenRect('#000');
  if (t >= T.end) endCard(t);
  else { const s = SH.find(([a, b]) => t >= a && t < b) || SH[SH.length - 1]; s[2](t); }
  wipe(t); tag(t); subs(t);
}

// sound events for mix.py
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  devAppear.forEach((x, i) => add('pop', x, { v: .7, f: 500 + i * 120 }));
  add('poof', 10.05); add('rattle', 12.0, { d: 1.5 }); add('shake', 13.54, { d: .8 }); add('silence', 14.38, { d: 1.06 });
  add('blip', wAt(48)); add('swirlDraw', 23.4, { d: .45 }); add('portalOpen', T.portal); add('slam', T.title); add('portalHum', T.portal + .1, { d: T.wipe1 - T.portal - .1 });
  WIPES.forEach(([tc]) => add('whoosh', tc - .25));
  add('pop', 25.35); add('boing', 25.45); add('portalClose', 25.5, { v: .5 });
  add('steps', 25.4, { d: .6 }); add('paper', wAt(68)); add('pop', wAt(73), { f: 700 }); add('pop', wAt(77), { f: 800 }); add('whoosh', wAt(80), { v: .5 }); add('steps', wAt(82), { d: 1.2 });
  add('stamp', wAt(91)); add('pop', wAt(94), { f: 600 });
  add('pop', wAt(111), { f: 500 }); add('pop', wAt(114), { f: 900 }); add('pop', wAt(114) + .5, { f: 900 }); add('stamp', wAt(116));
  add('pop', wAt(127), { f: 700 }); add('pop', wAt(127) + .2, { f: 760 }); add('steps', wAt(131), { d: 1.3 }); add('zip', wAt(139) - .2, { d: 1.2 });
  add('alarm', 51.75, { d: 1.6 }); add('rumble', wAt(150) - .4, { d: .9 }); add('shake', 53.4, { d: 1.2 });
  add('paper', wAt(160)); add('scribble', wAt(164), { d: wAt(166) - wAt(164) }); add('stamp', wAt(167) + .1);
  CHIPS.forEach(([, wi], i) => add('pop', wAt(wi), { f: 500 + i * 90, v: .7 })); add('zip', wAt(178) - .1, { d: .6 });
  add('silence', 68.46, { d: .84 }); add('clatter', T.drop, { d: .8 }); add('portalOpen', T.end, { v: .6 });
  return ev.sort((a, b) => a.t - b.t);
}
const caps = (await (await fetch('caps.json')).json());
buildSubs(caps);
window.render = render; window.DUR = DUR; window.EV = events(); window.SUBS = SUBS; window.T = T;
for (const f of ['800 50px "Baloo 2"', '400 60px Bungee', '400 40px VT323']) await document.fonts.load(f);
render(parseFloat(new URLSearchParams(location.search).get('t') ?? '10.5'));
window.READY = true;
