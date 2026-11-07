// "One client, start to finish" — a Nodstage service card in the mid-century cartoon style (Lemo-Opuscar, midcentury-toon).
// 1080x1920, 30 fps, picture is a pure function of time. Engine: engine/toon.js, chars.js, icons.js (MIT / CC BY 4.0, Lemomo).
import { PAL, setClock, shape, plane, ink, rays, ellipse, rect, rrect, spline, move, xform, star, sparkle, text, fit, measure, arrow, dashed,
  paperFinish, kidney, boomerang, clamp, lerp, seg, ss, eo, eio, back, twos, TAU, hash } from './engine/toon.js';
import { drawOwner, drawHand } from './engine/chars.js';
import { icon } from './engine/icons.js';

export const W = 1080, H = 1920, DUR = 28.6;
const MAG = '#D0176F', MAGD = '#9E0F55', MAGL = '#F4B3CF';
const STEPC = [PAL.mustard, PAL.teal, PAL.blue, PAL.kraft, PAL.avocado, PAL.pink];
const LABEL = ['Book', 'Propose', 'Review', 'Extras', 'Invoice', 'Testimonial'];
const HEAD = ['Hannah books a call', 'The proposal, accepted', 'Feedback on the design', 'Extras become change orders', 'The invoice already has it', 'Then, a testimonial'];
const GROUND = [[PAL.mustardL, PAL.mustard], [PAL.tealL, PAL.teal], [PAL.blueL, PAL.blue], [PAL.kraftL, PAL.kraft], [PAL.avocadoL, PAL.avocado], [PAL.pink, PAL.pinkD]];
let IMG = {};
export function setImages(o) { IMG = o; }

// ---- sections
const S = [
  { k: 'hook', t0: 0, t1: 2.6 },
  { k: 0, t0: 2.6, t1: 5.05, focus: [200, 800] },
  { k: 1, t0: 5.05, t1: 7.65, focus: [770, 470] },
  { k: 2, t0: 7.65, t1: 11.9, focus: [770, 470] },
  { k: 3, t0: 11.9, t1: 16.8, focus: [770, 470] },
  { k: 4, t0: 16.8, t1: 19.65, focus: [770, 470] },
  { k: 5, t0: 19.65, t1: 22.0, focus: [770, 470] },
  { k: 'close', t0: 22.0, t1: DUR },
];
const pop = (t, t0, d = 0.28) => back(seg(t, t0, t0 + d), 1.9);
const blink = (t, ts) => ts.some(b => t > b && t < b + 0.13) ? 1 : 0;

// ---- style pieces
function ground(ctx, i) {
  const [wall, floor] = GROUND[i];
  ctx.fillStyle = wall; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  plane(ctx, rect(-500, 1330, W + 1000, 1200), floor);
  ink(ctx, [[-20, 1330], [300, 1330]], 4, { seed: 5 + i, breaks: 0.2 }); ink(ctx, [[360, 1330], [W + 20, 1330]], 4, { seed: 9 + i, breaks: 0.2 });
}
function card(ctx, x, y, w, h, seed, fill = PAL.white) {
  shape(ctx, rrect(x + 14, y + 16, w, h, 22), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0, alpha: 0.14 });
  shape(ctx, rrect(x, y, w, h, 22), { fill, line: 4.5, seed, grain: 0.18, breaks: 0.08 });
}
function btn(ctx, x, y, w, h, label, fill = MAG, seed = 40, col = PAL.white) {
  shape(ctx, rrect(x, y, w, h, h / 2), { fill, line: 4, seed, grain: 0.2, breaks: 0.1 });
  text(ctx, label, x + w / 2, y + h / 2 + 14, { font: '600 40px Jost', fill: col, align: 'center' });
}
function header(ctx, t, i, t0) {
  const k = eo(seg(twos(t), t0 + 0.05, t0 + 0.4)); if (k <= 0) return;
  ctx.save(); ctx.translate(-(1 - k) * 700, 0);
  shape(ctx, ellipse(110, 322, 58, 58, 40), { fill: PAL.ink, line: 0, seed: 700, grain: 0.1, off: [0, 0] });
  text(ctx, String(i + 1), 110, 346, { font: '66px Slab', fill: PAL.paper, align: 'center' });
  text(ctx, `STEP ${i + 1} OF 6`, 196, 290, { font: '600 26px Jost', fill: PAL.ink, track: 6 });
  const f = fit(ctx, HEAD[i], '{px}px Slab', 66, 660, 1, 40);
  text(ctx, f.lines[0], 194, 362, { font: f.font, fill: PAL.ink, plate: PAL.white, off: [5, 5] });
  ctx.restore();
}
function tag(ctx, t, t0, str, x, y, o = {}) {
  const k = pop(t, t0); if (k <= 0) return;
  const f = fit(ctx, str, '500 {px}px Jost', o.px || 40, o.maxW || 520, 2, 28);
  const w = Math.max(...f.lines.map(l => measure(ctx, l, f.font))) + 100, h = 34 + f.lines.length * f.px * 1.2;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
  shape(ctx, rrect(x, y, w, h, 16), { fill: PAL.paper, line: 3.8, seed: 710, grain: 0.15, off: [6, 5] });
  star(ctx, x + 40, y + h / 2, 18, { n: 8, inner: 0.42, fill: MAG, off: [0, 0], rot: t * 0.6 });
  f.lines.forEach((l, j) => text(ctx, l, x + 70, y + 17 + f.px * 0.92 + j * f.px * 1.2, { font: f.font, fill: PAL.ink }));
  ctx.restore();
}
function medallion(ctx, i, x, y, r, k, rot = 0) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(rot);
  star(ctx, 0, 0, r * 1.2, { n: 16, inner: 0.84, fill: PAL.white, off: [0, 0], rot: i * 0.2 });
  shape(ctx, ellipse(0, 0, r, r, 64), { fill: STEPC[i], line: 5, seed: 730 + i, grain: 0.3 });
  text(ctx, String(i + 1), 0, r * 0.38, { font: `${Math.round(r * 1.1)}px Slab`, fill: PAL.ink, plate: PAL.white, off: [5, 5], align: 'center' });
  ctx.restore();
}
function stampWord(ctx, t, t0, word, x, y, col, rot = -0.14) {
  const u = seg(t, t0, t0 + 0.12); if (u <= 0) return;
  const k = lerp(2.4, 1, eo(u)) * (1 + Math.sin(seg(t, t0 + 0.12, t0 + 0.5) * Math.PI * 3) * 0.04 * (1 - seg(t, t0 + 0.12, t0 + 0.5)));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  star(ctx, 0, 0, 190, { n: 14, inner: 0.72, fill: PAL.mustardL, off: [0, 0], rot: 0.1, alpha: 0.95 });
  const w = measure(ctx, word, '64px Slab') + 70;
  shape(ctx, rrect(-w / 2, -54, w, 108, 18), { fill: PAL.white, line: 5.5, lineColor: col, seed: 750, grain: 0.3, breaks: 0.15 });
  text(ctx, word, 0, 24, { font: '64px Slab', fill: col, align: 'center' });
  ctx.restore();
}
// the glove that does the step: approach, anticipation, press, recoil
function pressHand(ctx, t, t0, tx, ty, from = [1250, 1750], k = 2.3) {
  const a = Math.atan2(ty - from[1], tx - from[0]);
  const reach = 56 * k, dir = [Math.cos(a), Math.sin(a)];
  let d;
  const u1 = seg(t, t0 - 0.5, t0 - 0.12), u2 = seg(t, t0 - 0.12, t0 - 0.03), u3 = seg(t, t0 - 0.03, t0 + 0.06), u4 = seg(t, t0 + 0.25, t0 + 0.6);
  if (t < t0 - 0.5 || u4 >= 1) return;
  const far = Math.hypot(tx - from[0], ty - from[1]);
  d = lerp(far, 40, eo(u1)) + 30 * ss(u2) - 70 * eo(u3);
  if (t > t0 + 0.06) d = -30 + 26 * ss(seg(t, t0 + 0.06, t0 + 0.2)) + lerp(0, far, ss(u4) * ss(u4));
  const tip = [tx - dir[0] * d, ty - dir[1] * d];
  const wrist = [tip[0] - dir[0] * reach, tip[1] - dir[1] * reach];
  // sleeve
  ink(ctx, [[wrist[0] - dir[0] * 600, wrist[1] - dir[1] * 600], wrist], 58, { seed: 801, taper: false, wob: 0.05 });
  ink(ctx, [[wrist[0] - dir[0] * 600 + 5, wrist[1] - dir[1] * 600 + 4], [wrist[0] + 5, wrist[1] + 4]], 46, { seed: 802, taper: false, wob: 0.04, color: PAL.coral });
  drawHand(ctx, wrist[0], wrist[1], a, 'point', -1, k);
}
function june(ctx, t, pose) {
  drawOwner(ctx, Object.assign({ x: 210, y: 1470, s: 0.8, dir: 1, view: 'q', face: 'neutral', blink: blink(t, [1.4, 4.6, 8.1, 12.9, 17.3, 20.4, 24.1, 27.2]) }, pose), t);
}
const ARM = {
  rest: { armF: { a1: 1.3, a2: 1.52 }, handF: 'open' },
  wave: { armF: { a1: -1.0, a2: -1.75 }, handF: 'open' },
  point: { armF: { a1: -0.55, a2: -0.95 }, handF: 'point' },
  present: { armF: { a1: -0.15, a2: -0.35 }, handF: 'open' },
};
function armAt(t, keys) {   // keys: [[t, name]], one in-between (limited animation, on twos)
  const tt = twos(t); let cur = keys[0][1], prev = cur, t0 = -9;
  for (const [kt, n] of keys) if (tt >= kt) { prev = cur; cur = n; t0 = kt; }
  const A = ARM[prev], B = ARM[cur], k = tt - t0 < 1 / 12 ? 0.5 : 1;
  return { armF: { a1: lerp(A.armF.a1, B.armF.a1, k), a2: lerp(A.armF.a2, B.armF.a2, k) }, handF: k < 1 ? A.handF : B.handF };
}

// ---- HOOK
function sHook(ctx, t) {
  const z = lerp(1, 1.05, ss(t / 2.6));
  ctx.save(); ctx.translate(W / 2, 900); ctx.scale(z, z); ctx.translate(-W / 2, -900);
  ctx.fillStyle = PAL.paper; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  plane(ctx, rect(-500, 1330, W + 1000, 1200), PAL.paperD);
  ink(ctx, [[-20, 1330], [280, 1330]], 4, { seed: 3 }); ink(ctx, [[340, 1330], [W + 20, 1330]], 4, { seed: 4 });
  rays(ctx, 440, 880, 30, 900, MAGL, { rot: t * 0.05, alpha: 0.45 });
  shape(ctx, kidney(860, 1400, 100, 0.2), { fill: PAL.tealL, line: 3, seed: 21, grain: 0.3 });
  const k1 = pop(t, 0.25, 0.3);
  if (k1 > 0) { ctx.save(); ctx.translate(90, 0); ctx.globalAlpha = clamp(k1);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 300, 900 * ss(seg(t, 0.25, 0.9)), 220); ctx.clip();
    text(ctx, 'One client,', 0, 455, { font: '700 150px Oleo', fill: MAG, plate: PAL.white, off: [6, 6] }); ctx.restore();
    const f = fit(ctx, 'START TO FINISH', '{px}px Slab', 104, 740, 1, 60);
    const k2 = eo(seg(twos(t), 0.85, 1.2));
    ctx.save(); ctx.translate(-(1 - k2) * 900, 0); text(ctx, f.lines[0], 0, 590, { font: f.font, fill: PAL.ink, plate: PAL.mustard, off: [6, 6] }); ctx.restore();
    ctx.restore(); }
  // the six steps stamp on, one per beat
  for (let i = 0; i < 6; i++) { const x = 200 + (i % 3) * 240, y = 800 + Math.floor(i / 3) * 290;
    medallion(ctx, i, x, y, 90, pop(t, 1.15 + i * 0.13, 0.24));
    if (pop(t, 1.25 + i * 0.13) > 0.5) text(ctx, LABEL[i], x, y + 148, { font: '600 30px Jost', fill: PAL.ink, align: 'center' }); }
  ctx.restore();
  return { focus: [200, 800] };
}

// ---- STEP 1: booking
function s1(ctx, t, s) {
  ground(ctx, 0); header(ctx, t, 0, s.t0);
  const x = 70, y = 450, w = 760, h = 560; card(ctx, x, y, w, h, 101);
  shape(ctx, rrect(x + 40, y + 40, 60, 60, 14), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  text(ctx, 'NS', x + 70, y + 80, { font: '700 26px Jost', fill: PAL.white, align: 'center' });
  text(ctx, 'Northbeam Studio', x + 120, y + 82, { font: '600 36px Jost', fill: PAL.ink });
  text(ctx, 'Book a discovery call', x + 40, y + 170, { font: '50px Slab', fill: PAL.ink });
  const days = [['Mon', 6], ['Tue', 7], ['Wed', 8], ['Thu', 9], ['Fri', 10]];
  days.forEach(([d, n], i) => { const cx = x + 40 + i * 140, on = t >= 3.5 && i === 3;
    shape(ctx, rrect(cx, y + 210, 124, 120, 18), { fill: on ? MAG : PAL.paper, line: 3.5, seed: 110 + i, grain: 0.15 });
    text(ctx, d, cx + 62, y + 252, { font: '500 28px Jost', fill: on ? PAL.white : PAL.inkSoft, align: 'center' });
    text(ctx, String(n), cx + 62, y + 306, { font: '44px Slab', fill: on ? PAL.white : PAL.ink, align: 'center' }); });
  ['9:00', '10:00', '11:30', '2:00'].forEach((sl, i) => { const cx = x + 40 + (i % 2) * 350, cy = y + 360 + Math.floor(i / 2) * 92, on = t >= 4.1 && i === 1;
    shape(ctx, rrect(cx, cy, 330, 76, 38), { fill: on ? MAGL : PAL.white, line: 3.5, lineColor: on ? MAG : PAL.ink, seed: 120 + i, grain: 0.1 });
    text(ctx, sl + (i < 3 ? ' AM' : ' PM'), cx + 165, cy + 51, { font: '600 36px Jost', fill: on ? MAGD : PAL.ink, align: 'center' }); });
  june(ctx, t, armAt(t, [[0, 'rest'], [2.9, 'point'], [4.6, 'present']]));
  tag(ctx, t, 4.62, 'Booked: Thu, Oct 9, 10 AM', 390, 1120, { maxW: 400 });
  pressHand(ctx, t, 3.5, x + 40 + 3 * 140 + 62, y + 270);
  pressHand(ctx, t, 4.1, x + 40 + 350 + 165, y + 398);
  medallion(ctx, 1, 770, 470, 70, pop(t, s.t1 - 0.5, 0.24));
  return {};
}

// ---- STEP 2: proposal
function s2(ctx, t, s) {
  ground(ctx, 1); header(ctx, t, 1, s.t0);
  const x = 70, y = 450, w = 760, h = 580; card(ctx, x, y, w, h, 201);
  shape(ctx, rrect(x + 40, y + 40, 190, 52, 26), { fill: MAGL, line: 3, seed: 202, grain: 0.1 });
  text(ctx, 'Proposal', x + 135, y + 76, { font: '600 30px Jost', fill: MAGD, align: 'center' });
  text(ctx, 'for Fernhill Coffee Co.', x + 250, y + 76, { font: '500 30px Jost', fill: PAL.inkSoft });
  text(ctx, 'Website refresh', x + 40, y + 160, { font: '56px Slab', fill: PAL.ink });
  const L = [['Discovery and moodboard', '$800'], ['Design: homepage + shop', '$2,400'], ['Build: Shopify theme', '$3,600']];
  L.forEach(([a, b], i) => { const k = eo(seg(twos(t), 5.4 + i * 0.12, 5.6 + i * 0.12)); if (k <= 0) return; const yy = y + 230 + i * 70;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(-(1 - k) * 40, 0);
    text(ctx, a, x + 40, yy, { font: '500 34px Jost', fill: PAL.ink }); text(ctx, b, x + w - 40, yy, { font: '600 34px Jost', fill: PAL.ink, align: 'right' });
    dashed(ctx, [[x + 40, yy + 22], [x + w - 40, yy + 22]], 2, 8, 8, 0, PAL.paperDD); ctx.restore(); });
  text(ctx, 'Total', x + 40, y + 460, { font: '700 40px Jost', fill: PAL.ink }); text(ctx, '$6,800', x + w - 40, y + 462, { font: '56px Slab', fill: PAL.ink, align: 'right' });
  ink(ctx, [[x + 40, y + 530], [x + 420, y + 530]], 3, { seed: 210, breaks: 0.1 });
  text(ctx, 'Client signature', x + 40, y + 560, { font: '500 24px Jost', fill: PAL.inkSoft });
  const u = seg(t, 6.25, 6.85);
  if (u > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x + 40, y + 440, 400 * u, 100); ctx.clip(); text(ctx, 'Hannah Brooks', x + 50, y + 518, { font: '700 58px Oleo', fill: MAGD }); ctx.restore(); }
  june(ctx, t, armAt(t, [[0, 'present'], [5.4, 'point']]));
  stampWord(ctx, t, 6.95, 'ACCEPTED', 620, 1150, '#2E7D52');
  medallion(ctx, 2, 770, 470, 70, pop(t, s.t1 - 0.5, 0.24));
  return {};
}

// ---- STEP 3: feedback on the real proof
const PIN1 = [432, 655];
function proofCard(ctx, t, dim = 0) {
  const x = 60, y = 440, w = 780, h = 740;
  card(ctx, x, y, w, h, 301);
  text(ctx, 'Homepage v2', x + 34, y + 62, { font: '600 34px Jost', fill: PAL.ink });
  shape(ctx, rrect(x + w - 270, y + 26, 236, 50, 25), { fill: PAL.coralL, line: 3, seed: 302, grain: 0.1 });
  text(ctx, 'Changes asked', x + w - 152, y + 61, { font: '600 28px Jost', fill: PAL.ink, align: 'center' });
  if (IMG.proof) { ctx.save(); ctx.beginPath(); ctx.rect(x + 24, y + 94, w - 48, h - 118); ctx.clip();
    ctx.drawImage(IMG.proof, x + 24, y + 94, w - 48, (w - 48) * IMG.proof.height / IMG.proof.width);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(244,234,213,0.35)'; ctx.fillRect(x, y, w, h); ctx.restore(); }
  ink(ctx, rrect(x + 24, y + 94, w - 48, h - 118, 8), 3.4, { closed: true, seed: 303, breaks: 0.15 });
  if (dim) { ctx.save(); ctx.globalAlpha = dim; ctx.fillStyle = PAL.kraftL; ctx.fillRect(x - 20, y - 20, w + 60, h + 60); ctx.restore(); }
}
function pin(ctx, x, y, n, k) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  shape(ctx, spline([[0, 34], [-30, -6], [-24, -34], [0, -46], [24, -34], [30, -6]], true, 6), { fill: MAG, line: 4, seed: 320 + n, grain: 0.2 });
  text(ctx, String(n), 0, -6, { font: '36px Slab', fill: PAL.white, align: 'center' }); ctx.restore(); }
function bubbleText(ctx, lines, x, y, w) {
  shape(ctx, ellipse(x + 34, y + 36, 26, 26, 24), { fill: '#CFE7D6', line: 3, seed: 330, grain: 0 });
  text(ctx, 'HB', x + 34, y + 46, { font: '700 22px Jost', fill: '#2E7D52', align: 'center' });
  text(ctx, 'Hannah Brooks', x + 74, y + 47, { font: '600 30px Jost', fill: PAL.ink });
  lines.forEach((l, i) => text(ctx, l, x, y + 110 + i * 48, { font: '500 38px Jost', fill: PAL.ink }));
}
function s3(ctx, t, s) {
  ground(ctx, 2); header(ctx, t, 2, s.t0);
  const z = lerp(1, 1.06, ss(seg(t, 8.2, 11.9)));
  ctx.save(); ctx.translate(PIN1[0], PIN1[1]); ctx.scale(z, z); ctx.translate(-PIN1[0], -PIN1[1]);
  const k = eo(seg(twos(t), s.t0 + 0.15, s.t0 + 0.6)); ctx.translate(0, (1 - k) * 900);
  proofCard(ctx, t);
  pin(ctx, PIN1[0], PIN1[1], 1, pop(t, 8.55));
  ctx.restore();
  // round call-out: the comment, at native scale
  const kc = back(seg(t, 9.0, 9.32), 1.5);
  if (kc > 0) { const cx = 560, cy = 1170, R = 250 * kc;
    dashed(ctx, [[cx - 120, cy - R * 0.9], [PIN1[0], PIN1[1] + 40]], 4, 14, 10, -t * 40, PAL.ink, clamp(kc));
    shape(ctx, ellipse(cx, cy, R + 16, R + 16, 72), { fill: PAL.paper, line: 4.5, seed: 340, grain: 0.15, breaks: 0.05 });
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); ctx.fillStyle = PAL.white; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.translate(cx, cy); ctx.scale(kc, kc); bubbleText(ctx, ['Love the headline.', 'Could the hero show', 'the price per cup?'], -200, -150, 400); ctx.restore();
    ink(ctx, ellipse(cx, cy, R, R, 72), 4, { closed: true, seed: 341, breaks: 0.1 }); }
  medallion(ctx, 3, 770, 470, 70, pop(t, s.t1 - 0.5, 0.24));
  return {};
}

// ---- STEP 4: the extra request becomes a change order (the peak)
function s4(ctx, t, s) {
  ground(ctx, 3);
  const lift = ss(seg(t, 13.55, 14.1));
  rays(ctx, 450, 960, 30, 1100, PAL.mustardL, { rot: t * 0.06, alpha: 0.85 * lift });
  header(ctx, t, 3, s.t0);
  // the request bubble
  const kb = pop(t, 12.15, 0.32);
  if (kb > 0) { ctx.save(); const by = lerp(470, 440, lift); ctx.translate(450, by + 130); ctx.scale(kb * lerp(1, 0.86, lift), kb * lerp(1, 0.86, lift)); ctx.translate(-450, -(by + 130));
    shape(ctx, [...rrect(70, by, 760, 280, 30)], { fill: PAL.white, line: 4.5, seed: 401, grain: 0.15 });
    shape(ctx, [[160, by + 276], [150, by + 340], [220, by + 278]], { fill: PAL.white, line: 4, seed: 402, grain: 0 });
    bubbleText(ctx, ['Add a Subscribe button', 'under each bag, please.'], 110, by + 22, 680);
    pin(ctx, 800, by + 10, 2, 1);
    const ko = pop(t, 13.05, 0.25); if (ko > 0) { ctx.save(); ctx.translate(640, by + 250); ctx.scale(ko, ko); ctx.rotate(-0.08);
      shape(ctx, rrect(-130, -34, 260, 68, 34), { fill: PAL.mustard, line: 3.5, seed: 403, grain: 0.2 });
      text(ctx, 'Out of scope', 0, 12, { font: '600 32px Jost', fill: PAL.ink, align: 'center' }); ctx.restore(); }
    ctx.restore(); }
  // the change order card unfolds from the bubble on the beat
  const kc = back(seg(twos(t), 13.6, 14.05), 1.6);
  if (kc > 0) { const x = 110, y = 790, w = 680, h = 470;
    ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(1, kc); ctx.translate(-(x + w / 2), -y);
    card(ctx, x, y, w, h, 410);
    shape(ctx, rrect(x + 36, y + 34, 240, 50, 25), { fill: MAGL, line: 3, seed: 411, grain: 0.1 });
    text(ctx, 'Change order', x + 156, y + 69, { font: '600 28px Jost', fill: MAGD, align: 'center' });
    text(ctx, 'CO-03', x + w - 40, y + 70, { font: '600 30px Jost', fill: PAL.inkSoft, align: 'right' });
    text(ctx, 'Subscribe buttons', x + 36, y + 160, { font: '52px Slab', fill: PAL.ink });
    text(ctx, 'Extra design and build', x + 36, y + 240, { font: '500 34px Jost', fill: PAL.ink });
    text(ctx, '+$225', x + w - 36, y + 244, { font: '58px Slab', fill: MAG, plate: PAL.white, off: [4, 4], align: 'right' });
    const ok = t >= 15.62;
    btn(ctx, x + 36, y + 320, w - 72, 100, ok ? 'Approved ✓' : 'Approve', ok ? '#2E7D52' : MAG, 412);
    ctx.restore(); }
  pressHand(ctx, t, 15.6, 450, 1160);
  if (t > 15.62) { const u = seg(t, 15.62, 16.4); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; sparkle(ctx, 450 + Math.cos(a) * (120 + 220 * eo(u)), 1160 + Math.sin(a) * (80 + 180 * eo(u)), 30 * (1 - u), { fill: PAL.white }); } }
  medallion(ctx, 4, 770, 470, 70, pop(t, s.t1 - 0.5, 0.24));
  return {};
}

// ---- STEP 5: invoice
function s5(ctx, t, s) {
  ground(ctx, 4); header(ctx, t, 4, s.t0);
  const x = 70, y = 450, w = 760, h = 560; card(ctx, x, y, w, h, 501);
  shape(ctx, rrect(x + 40, y + 40, 60, 60, 14), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  text(ctx, 'NS', x + 70, y + 80, { font: '700 26px Jost', fill: PAL.white, align: 'center' });
  text(ctx, 'Invoice INV-0012', x + 120, y + 82, { font: '600 34px Jost', fill: PAL.inkSoft });
  text(ctx, 'Website refresh', x + 40, y + 170, { font: '52px Slab', fill: PAL.ink });
  text(ctx, 'Design: homepage + shop', x + 40, y + 260, { font: '500 34px Jost', fill: PAL.ink }); text(ctx, '$1,500', x + w - 40, y + 260, { font: '600 34px Jost', fill: PAL.ink, align: 'right' });
  // the change order arrives as a line, with the manual arrow
  const ka = seg(t, 17.3, 17.75);
  if (ka > 0 && ka < 1.2) arrow(ctx, [960, 1150], [x + w - 60, y + 330], { u: ka, bob: (t * 2) % 1, bend: -0.3, fill: MAG });
  const kl = eo(seg(twos(t), 17.7, 17.95));
  if (kl > 0) { ctx.save(); ctx.globalAlpha = kl; ctx.translate((1 - kl) * 80, 0);
    shape(ctx, rrect(x + 26, y + 300, w - 52, 64, 12), { fill: MAGL, line: 0, off: [0, 0], grain: 0.2, alpha: 0.6 });
    text(ctx, 'Change order CO-03', x + 40, y + 344, { font: '500 34px Jost', fill: PAL.ink }); text(ctx, '$225', x + w - 40, y + 344, { font: '600 34px Jost', fill: PAL.ink, align: 'right' }); ctx.restore(); }
  ink(ctx, [[x + 40, y + 400], [x + w - 40, y + 400]], 3, { seed: 510, breaks: 0.05 });
  text(ctx, 'Amount due', x + 40, y + 470, { font: '700 40px Jost', fill: PAL.ink });
  text(ctx, kl > 0.5 ? '$1,725' : '$1,500', x + w - 40, y + 476, { font: '60px Slab', fill: PAL.ink, plate: PAL.white, off: [4, 4], align: 'right' });
  june(ctx, t, armAt(t, [[0, 'rest'], [17.2, 'point'], [18.7, 'present']]));
  stampWord(ctx, t, 18.6, 'PAID', 640, 1110, '#2E7D52', -0.12);
  medallion(ctx, 5, 770, 470, 70, pop(t, s.t1 - 0.5, 0.24));
  return {};
}

// ---- STEP 6: testimonial request
function s6(ctx, t, s) {
  ground(ctx, 5); header(ctx, t, 5, s.t0);
  const x = 70, y = 450, w = 760, h = 560; card(ctx, x, y, w, h, 601);
  shape(ctx, ellipse(x + 70, y + 72, 32, 32, 24), { fill: '#CFE7D6', line: 3, seed: 602, grain: 0 });
  text(ctx, 'HB', x + 70, y + 83, { font: '700 26px Jost', fill: '#2E7D52', align: 'center' });
  text(ctx, 'To: Hannah Brooks', x + 120, y + 84, { font: '600 34px Jost', fill: PAL.ink });
  text(ctx, 'Ask for a testimonial', x + 40, y + 170, { font: '50px Slab', fill: PAL.ink });
  shape(ctx, rrect(x + 40, y + 205, w - 80, 190, 16), { fill: PAL.paper, line: 3, seed: 603, grain: 0.1 });
  ['Hi Hannah, it was great working on', 'the refresh. Would you share a few', 'words about it?'].forEach((l, i) => text(ctx, l, x + 66, y + 260 + i * 50, { font: '500 34px Jost', fill: PAL.inkSoft }));
  const sent = t >= 20.92;
  btn(ctx, x + 40, y + 430, w - 80, 96, sent ? 'Request sent ✓' : 'Send request', sent ? '#2E7D52' : MAG, 604);
  pressHand(ctx, t, 20.9, x + w / 2, y + 478);
  const ke = seg(t, 20.95, 21.7);
  if (ke > 0 && ke < 1) { const px = lerp(x + w / 2, 900, eio(ke)), py = lerp(y + 478, 300, eio(ke)) - Math.sin(ke * Math.PI) * 120;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.3 + ke * 0.5); ctx.scale(1 - ke * 0.4, 1 - ke * 0.4);
    shape(ctx, rrect(-70, -46, 140, 92, 10), { fill: PAL.white, line: 4, seed: 610, grain: 0.1 }); ink(ctx, [[-66, -40], [0, 8], [66, -40]], 4, { seed: 611 }); ctx.restore();
    dashed(ctx, [[x + w / 2, y + 478], [px, py]], 4, 12, 10, -t * 50, PAL.ink); }
  june(ctx, t, armAt(t, [[0, 'present'], [20.1, 'point'], [21.3, 'rest']]));
  tag(ctx, t, 21.05, 'Sent to Hannah', 420, 1110, { maxW: 360 });
  return {};
}

// ---- CLOSE: the six steps become one ring around the logo (function into ornament)
function sClose(ctx, t, s) {
  ctx.fillStyle = PAL.paper; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  plane(ctx, rect(-500, 1330, W + 1000, 1200), PAL.paperD);
  ink(ctx, [[-20, 1330], [300, 1330]], 4, { seed: 903 }); ink(ctx, [[360, 1330], [W + 20, 1330]], 4, { seed: 904 });
  const cx = 470, cy = 880, still = 25.6, tr = Math.min(t, still);
  rays(ctx, cx, cy, 30, 900, MAGL, { rot: tr * 0.04, alpha: 0.5 });
  const kr = ss(seg(t, 22.3, 23.4)), R = lerp(40, 285, kr), rot = (tr - 22.3) * 0.12;
  // the ring itself: a dashed route joining the steps
  if (kr > 0) dashed(ctx, ellipse(cx, cy, R, R, 90), 5, 16, 12, -tr * 30, PAL.ink, kr);
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i / 6 * TAU + rot, k = pop(t, 22.4 + i * 0.12, 0.26);
    medallion(ctx, i, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 62, k); }
  const kl = pop(t, 24.9, 0.35);
  if (kl > 0) { ctx.save(); ctx.translate(cx, cy); ctx.scale(kl, kl);
    star(ctx, 0, 0, 200, { n: 18, inner: 0.82, fill: PAL.white, off: [0, 0] });
    shape(ctx, ellipse(0, 0, 168, 168, 72), { fill: PAL.white, line: 5, seed: 905, grain: 0.15 });
    if (IMG.logo) { const lw = 290, lh = lw * IMG.logo.height / IMG.logo.width; ctx.drawImage(IMG.logo, -lw / 2, -lh / 2, lw, lh); }
    ctx.restore(); }
  // the line, written on
  const u1 = seg(t, 22.15, 23.3);
  if (u1 > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 220, 120 + 900 * u1, 160); ctx.clip();
    text(ctx, 'From the first inquiry', 70, 330, { font: '700 92px Oleo', fill: MAG, plate: PAL.white, off: [5, 5] }); ctx.restore(); }
  const k2 = eo(seg(twos(t), 23.4, 23.8));
  if (k2 > 0) { const f = fit(ctx, 'TO THE FINAL PAYMENT', '{px}px Slab', 80, 760, 1, 50);
    ctx.save(); ctx.translate(-(1 - k2) * 900, 0); text(ctx, f.lines[0], 70, 450, { font: f.font, fill: PAL.ink, plate: PAL.mustard, off: [5, 5] }); ctx.restore(); }
  const ku = pop(t, 25.4, 0.3);
  if (ku > 0) { ctx.save(); ctx.translate(560, 1268); ctx.scale(ku, ku);
    shape(ctx, rrect(-230, -48, 460, 96, 48), { fill: MAG, line: 4, seed: 906, grain: 0.2 });
    text(ctx, 'nodstage.com', 0, 16, { font: '600 44px Jost', fill: PAL.white, align: 'center' }); ctx.restore(); }
  if (t > 25.6) [[880, 620], [150, 1150], [860, 1170]].forEach(([x, y], i) => sparkle(ctx, x, y, 26 + 10 * Math.sin(t * 3 + i), { fill: MAG, rot: 0.2 }));
  return {};
}

const DRAW = { hook: sHook, 0: s1, 1: s2, 2: s3, 3: s4, 4: s5, 5: s6, close: sClose };
function drawSec(ctx, t, s) { ctx.save(); const r = DRAW[s.k](ctx, t, s) || {}; ctx.restore(); return r; }

export function render(ctx, t) {
  setClock(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const i = S.findIndex(s => t >= s.t0 && t < s.t1), idx = i < 0 ? S.length - 1 : i, s = S[idx];
  const nx = S[idx + 1], pv = S[idx - 1];
  const irisOut = nx && typeof nx.k === 'number' && t >= nx.t0 - 0.25 ? nx : null;
  const irisIn = typeof s.k === 'number' && pv && t < s.t0 + 0.35 ? s : null;
  if (irisOut || irisIn) {
    const inc = irisOut || irisIn, prev = S[S.indexOf(inc) - 1];
    const k = eio(seg(t, inc.t0 - 0.25, inc.t0 + 0.35));
    drawSec(ctx, Math.min(t, inc.t0 - 1e-3), prev);
    const f = inc.focus, cx = lerp(f[0], W / 2, k), cy = lerp(f[1], H / 2, k), r = lerp(70, 2100, k * k);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); drawSec(ctx, Math.max(t, inc.t0 + 1e-3), inc); ctx.restore();
    ink(ctx, ellipse(cx, cy, r, r, 90), 7, { closed: true, seed: 960 });
  } else if (s.k === 'close' && t < s.t0 + 0.32) {
    const k = eio(seg(t, s.t0, s.t0 + 0.32));
    drawSec(ctx, pv.t1 - 1e-3, pv);
    ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - k), W, H); ctx.clip(); drawSec(ctx, t, s); ctx.restore();
    ink(ctx, [[-10, H * (1 - k)], [W + 10, H * (1 - k)]], 6, { seed: 963 });
  } else drawSec(ctx, t, s);
  paperFinish(ctx, W, H, 1);
}
