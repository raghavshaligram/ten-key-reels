// "One Client" — pastel / kawaii restyle of the Nodstage two-hander.
// Engine: toon.js from Lemo-Opuscar's Sci-Fi Sitcom Toon demo (MIT / CC BY 4.0), retuned: warm-brown 5 px line, softer boil.
// Cast, worlds and story are original. Painterly pastoral feel; no existing studio's characters.
import { clamp, lerp, seg, ss, eo, ei, eio, back, spring, hash, TAU } from './lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, screenRect, noodle, reset, quad, getM } from './toon.js';

init(document.getElementById('c'));
const TL = await (await fetch('tl.json')).json();
const PROOF = new Image(); PROOF.src = 'proof.png'; const LOGO = new Image(); LOGO.src = 'logo.png';
await Promise.all([PROOF, LOGO].map(i => i.decode().catch(() => { })));
const DUR = 78.3, q = t => Math.floor(t * 12 + 1e-6) / 12, WT = TL.wt, LINES = TL.lines, wAt = i => WT[i][1];
const PUP = '#3a2630', BLUSH = 'rgba(255,140,170,.55)';
const F = (s, w = 800) => `${w} ${s}px "Baloo 2"`;

// ———————————————— paper / watercolour texture (built once, multiplied over every frame) ————————————————
const TEX = document.createElement('canvas'); TEX.width = W; TEX.height = H;
{ const c = TEX.getContext('2d'), im = c.createImageData(W, H); let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < im.data.length; i += 4) { const v = 236 + r() * 19; im.data[i] = v; im.data[i + 1] = v - 2; im.data[i + 2] = v - 6; im.data[i + 3] = 255; }
  c.putImageData(im, 0, 0);
  for (let k = 0; k < 40; k++) { const x = r() * W, y = r() * H, R = 80 + r() * 260; const gr = c.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, 'rgba(200,170,150,.10)'); gr.addColorStop(1, 'rgba(200,170,150,0)'); c.fillStyle = gr; c.fillRect(x - R, y - R, 2 * R, 2 * R); } }
function paper() { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .55; g.drawImage(TEX, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }

function talk(who, t) { const tq = q(t);
  for (const L of LINES) if (L.who === who && tq >= L.t0 - .03 && tq < L.t1 + .08) return { o: clamp((TL.amp[Math.floor(tq * 30)] || 0) * 1.05), talking: true };
  return { o: 0, talking: false }; }
function img(im, x, y, w, h) { const m = getM(); g.save(); g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); g.drawImage(im, x, y, w, h); g.restore(); }

// ———————————————— kawaii face parts ————————————————
function kEye(cx, cy, rx, ry, { blink = false, happy = false, look = [0, 0], wide = 1 } = {}) {
  if (happy) { stroke(arc(cx, cy + ry * .25, rx * .9, ry * .55, Math.PI * 1.08, Math.PI * 1.92, 14), 6, { line: PUP }); return; }
  if (blink) { stroke(quad([cx - rx, cy + 4], [cx, cy + ry * .35], [cx + rx, cy + 4], 10), 6, { line: PUP }); return; }
  rx *= wide; ry *= wide;
  shape(ell(cx + look[0] * 4, cy + look[1] * 4, rx, ry, 30), { fill: PUP, line: PUP, lw: 3, boil: .3, shade: () => {
    fillOnly(ell(cx + look[0] * 4, cy + ry * .45, rx * .8, ry * .45, 20), '#6a4656', { boil: .2 });
    fillOnly(ell(cx - rx * .32 + look[0] * 4, cy - ry * .38, rx * .36, ry * .3, 16), '#ffffff', { boil: .1 });
    fillOnly(ell(cx + rx * .34 + look[0] * 4, cy + ry * .28, rx * .16, ry * .13, 12), '#ffffff', { boil: .1 }); } });
}
function kMouth(cx, cy, w, o, { sm = .5, worry = 0 } = {}) {
  if (o < .08) { stroke(quad([cx - w / 2, cy - (worry ? -4 : 0)], [cx, cy + w * (worry ? -.25 : .35) * (sm + .3)], [cx + w / 2, cy - (worry ? -4 : 0)], 10), 5, { line: PUP }); return; }
  const h = 6 + o * w * .8;
  shape(spline([[cx - w * .45, cy], [cx, cy - 3], [cx + w * .45, cy], [cx + w * .3, cy + h * .8], [cx, cy + h], [cx - w * .3, cy + h * .8]]), { fill: '#a8455a', line: PUP, lw: 4, boil: .3,
    shade: () => fillOnly(ell(cx, cy + h * .9, w * .28, h * .35, 14), '#ff8fa6', { boil: .2 }) });
}
const mitt = (x, y, r, col, line = INK) => { shape(ell(x, y, r, r * .9, 20), { fill: col, lw: 5 }); shape(ell(x - r * .7, y - r * .3, r * .38, r * .32, 12), { fill: col, lw: 4 }); };
const sweatK = (x, y, s = 1) => shape(spline([[x, y - 18 * s], [x + 10 * s, y + 4 * s], [x, y + 14 * s], [x - 10 * s, y + 4 * s]]), { fill: '#cdeeff', lw: 4 });
const sparkle = (x, y, r, col = '#fff6b3') => shape([[x, y - r], [x + r * .25, y - r * .25], [x + r, y], [x + r * .25, y + r * .25], [x, y + r], [x - r * .25, y + r * .25], [x - r, y], [x - r * .25, y - r * .25]], { fill: col, lw: 4 });

// ———————————————— the cast ————————————————
// DEV: round head (~45% of height), sticky-note sweater, a headset he never takes off
const DC = { skin: '#d9a17c', skinS: '#c58a66', hair: '#6b4a48', hairS: '#5a3c3c', sw: '#ffd98a', swS: '#f4c46a', pants: '#a9c4ec', shoe: '#fff6ea', set: '#c7b6ea' };
function dev(P) {
  const t = P.t || 0, ner = P.nerv || 0, jit = ner ? (hash(Math.floor(t * 12) * 3.3) - .5) * 7 * ner : 0;
  const breathe = 1 + .018 * Math.sin(t * 2.6), sq = (P.sq ?? 1) * breathe;
  push(); translate(P.x + jit, P.y); scale((P.s ?? 1), (P.s ?? 1));
  fillOnly(ell(0, 4, 150, 22, 30), 'rgba(122,80,64,.16)', { boil: .2 });
  scale(1 / Math.sqrt(sq), sq);
  for (const sx of [-1, 1]) { const ank = [sx * 46, -28];
    shape(noodle([sx * 40, -150], ank, 0, 54, 50), { fill: DC.pants, lw: 5 });
    shape(ell(ank[0] + sx * 8, ank[1] + 16, 44, 24, 20), { fill: DC.shoe, lw: 5 }); }
  const sh = [[-104, -380], [104, -380]], A = [P.armL || { h: [-40, 120] }, P.armR || { h: [40, 120] }];
  const drawArm = (i) => { const s0 = sh[i], a = A[i], hp = [s0[0] + a.h[0], s0[1] + a.h[1]];
    shape(noodle(s0, hp, a.bend ?? (i ? 16 : -16), 46, 40), { fill: DC.sw, lw: 5 }); mitt(hp[0], hp[1], 28, DC.skin); };
  drawArm(0);
  shape(spline([[0, -440], [96, -418], [128, -300], [118, -150], [0, -128], [-118, -150], [-128, -300], [-96, -418]]), { fill: DC.sw, lw: 5, shade: () => {
    fillOnly(spline([[70, -450], [150, -400], [150, -150], [80, -130], [100, -300]]), DC.swS, { boil: .3 });
    const notes = [[-58, -330, '#ffb3c7', -.25], [24, -300, '#bfe6ff', .18], [-30, -230, '#c9f2d6', .12], [62, -220, '#ffb3c7', -.1], [0, -380, '#bfe6ff', -.1], [70, -360, '#c9f2d6', .2]];
    for (const [x, y, c, r] of notes) { push(); translate(x, y); rotate(r); fillOnly(rr(-22, -22, 44, 44, 6), c, { boil: .3 }); stroke([[-12, -6], [12, -8]], 3); stroke([[-12, 6], [6, 5]], 3); pop(); } } });
  // head
  push(); translate(0, -600); rotate(P.tilt || 0);
  shape(spline([[-200, -10], [-208, -110], [-150, -200], [-50, -232], [60, -226], [160, -186], [212, -96], [206, 0], [150, -30], [-150, -30]]), { fill: DC.hair, lw: 5, shade: () => { for (const [x, y] of [[-110, -150], [10, -196], [120, -140]]) fillOnly(ell(x, y, 34, 20, 14), DC.hairS, { boil: .3 }); } });
  shape(ell(0, 10, 182, 166, 60), { fill: DC.skin, lw: 5, shade: () => fillOnly(ell(176, 70, 60, 130, 30), DC.skinS, { boil: .2 }) });
  shape(spline([[-170, -40], [-120, -110], [-40, -136], [40, -140], [130, -110], [176, -40], [120, -76], [40, -96], [-40, -92], [-120, -70]]), { fill: DC.hair, lw: 5 });   // fringe
  fillOnly(ell(-104, 64, 34, 20, 16), BLUSH, { boil: .2 }); fillOnly(ell(104, 64, 34, 20, 16), BLUSH, { boil: .2 });
  const look = P.look || [0, 0], happy = P.happy, blink = P.blink;
  kEye(-60, 6, 34, 46, { blink, happy, look, wide: P.wide ?? 1 }); kEye(60, 6, 34, 46, { blink, happy, look, wide: P.wide ?? 1 });
  const br = P.brow ?? .4; stroke([[-90, -60 + br * 6], [-40, -66 - br * 12]], 6, { line: DC.hairS }); stroke([[90, -60 + br * 6], [40, -66 - br * 12]], 6, { line: DC.hairS });
  const m = P.mouth || {}; kMouth(0, 74, 46, m.o || 0, { sm: m.sm ?? .5, worry: m.worry });
  // headset (lavender)
  stroke(arc(0, -20, 214, 196, Math.PI * 1.08, Math.PI * 1.92, 26), 12, { line: DC.set });
  shape(ell(-196, 20, 28, 40, 16), { fill: DC.set, lw: 5 });
  stroke(spline([[-186, 52], [-160, 100], [-100, 116], [-62, 108]], false), 6, { line: '#a993d9' }); shape(ell(-58, 108, 12, 12, 10), { fill: '#ffb3c7', lw: 4 });
  pop();
  drawArm(1);
  pop();
  if (P.sweat != null) { const u = P.sweat % 1; sweatK(P.x + 190 * (P.s ?? 1), P.y - (820 - u * 40) * (P.s ?? 1), 1.2 * (P.s ?? 1)); sweatK(P.x - 200 * (P.s ?? 1), P.y - (760 - ((u + .5) % 1) * 40) * (P.s ?? 1), (P.s ?? 1)); }
}
// NOD: soft pastel-pink pin, big glossy eyes, floating mitts, a little bow
const NC = { body: '#ffb3d1', bodyS: '#f79bc1', hi: '#ffe3ef', face: '#fff6fa', bow: '#e85a9c' };
function nod(P) {
  const t = P.t || 0, bob = Math.sin(t * 2.2) * 12, sq = 1 + .03 * Math.sin(t * 4.4);
  push(); translate(P.x, P.y); scale(P.s ?? 1);
  fillOnly(ell(0, 0, 120 - bob, 20, 30), 'rgba(122,80,64,.15)', { boil: .2 });
  push(); translate(0, bob + (P.dy || 0)); rotate(P.tilt || 0); scale(1 / Math.sqrt(sq), sq);
  const pin = [...arc(0, -520, 176, 168, Math.PI * .78, Math.PI * 2.22, 44), [0, -230]];
  shape(pin, { fill: NC.body, lw: 5, shade: () => { fillOnly(ell(140, -500, 120, 240, 30), NC.bodyS, { boil: .3 }); fillOnly(ell(-96, -630, 40, 22, 16), NC.hi, { boil: .2 }); } });
  fillOnly(ell(-92, -470, 30, 18, 16), BLUSH, { boil: .2 }); fillOnly(ell(92, -470, 30, 18, 16), BLUSH, { boil: .2 });
  const look = P.look || [0, 0];
  kEye(-52, -530, 30, 40, { blink: P.blink, happy: P.happy, look, wide: P.wide ?? 1 }); kEye(52, -530, 30, 40, { blink: P.blink, happy: P.happy, look, wide: P.wide ?? 1 });
  if (P.sleepy) { for (const ex of [-52, 52]) fillOnly(rect(ex - 36, -584, 72, 36), NC.body, { boil: .2 }); stroke([[-88, -548], [-16, -548]], 5); stroke([[16, -548], [88, -548]], 5); }   // deadpan lids
  const m = P.mouth || {}; kMouth(0, -470, 36, m.o || 0, { sm: m.sm ?? .3 });
  push(); translate(0, -360); shape([[0, 0], [-58, -30], [-58, 30]], { fill: NC.bow, lw: 5 }); shape([[0, 0], [58, -30], [58, 30]], { fill: NC.bow, lw: 5 }); shape(ell(0, 0, 14, 14, 12), { fill: NC.bow, lw: 4 }); pop();
  pop();
  const hs = P.hands || [[-210, -380], [210, -380]];
  hs.forEach(([hx, hy], i) => { const w = Math.sin(t * 2.4 + i) * 8; mitt(hx, hy + bob + w, 34, NC.body); if (P.point?.[i]) shape(noodle([hx + 6, hy + bob + w - 20], [hx + 26, hy + bob + w - 70], 0, 18, 14), { fill: NC.body, lw: 4 }); });
  pop();
}
// BEAN, the client: a round little coffee bean with a sprout. Non-verbal.
function bean(P) {
  const t = P.t || 0, hop = P.hop ? Math.abs(Math.sin(t * 9)) * 22 : 0, sq = 1 + .04 * Math.sin(t * 5);
  push(); translate(P.x, P.y - hop); scale(P.s ?? 1); scale(1 / Math.sqrt(sq), sq);
  fillOnly(ell(0, hop, 80, 14, 24), 'rgba(122,80,64,.15)', { boil: .2 });
  for (const sx of [-1, 1]) shape(ell(sx * 34 + (P.walk ? Math.sin(t * 12 + sx) * 10 : 0), -8, 26, 14, 14), { fill: '#8a5a40', lw: 4 });
  shape(ell(0, -150, 108, 130, 40), { fill: '#c08560', lw: 5, shade: () => { fillOnly(ell(70, -140, 60, 130, 24), '#ad7350', { boil: .2 }); fillOnly(ell(-50, -230, 22, 14, 12), '#e8c0a0', { boil: .2 }); } });
  stroke(spline([[-4, -276], [14, -210], [-8, -140], [6, -40]], false), 5, { line: '#8a5a40' });
  shape(spline([[0, -276], [-4, -320], [-42, -344], [-66, -324], [-34, -308], [-8, -300]]), { fill: '#a8e0b4', lw: 5 });
  shape(spline([[4, -290], [30, -330], [64, -330], [50, -304], [16, -294]]), { fill: '#a8e0b4', lw: 5 });
  fillOnly(ell(-64, -120, 22, 13, 14), BLUSH, { boil: .2 }); fillOnly(ell(64, -120, 22, 13, 14), BLUSH, { boil: .2 });
  kEye(-36, -168, 22, 30, { blink: P.blink, happy: P.happy, look: P.look || [0, 0] }); kEye(36, -168, 22, 30, { blink: P.blink, happy: P.happy, look: P.look || [0, 0] });
  kMouth(0, -116, 24, P.o || 0, { sm: .8 });
  if (P.armUp) { shape(noodle([-96, -150], [-140, -240], -10, 22, 18), { fill: '#c08560', lw: 5 }); shape(noodle([96, -150], [140, -240], 10, 22, 18), { fill: '#c08560', lw: 5 }); }
  pop();
}

// ———————————————— the portal: the only thing that glows (softened Nodstage pink) ————————————————
function portal(cx, cy, r, t, { open = 1, sx = .8, spin = 1 } = {}) {
  if (open <= .001) return; const R = r * open;
  push(); translate(cx, cy); scale(sx, 1);
  fillOnly(ell(0, 0, R * 1.6, R * 1.5, 48), 'rgba(255,150,200,.18)', { boil: .5 }); fillOnly(ell(0, 0, R * 1.3, R * 1.24, 48), 'rgba(255,150,200,.22)', { boil: .5 });
  const rim = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, k = 1 + .06 * Math.sin(i * 1.7 + t * 3) + .04 * Math.sin(a * 5 + t * 6); rim.push([Math.cos(a) * R * k, Math.sin(a) * R * k]); }
  shape(spline(rim), { fill: '#ff86bf', lw: 6, shade: () => {
    fillOnly(ell(0, 0, R * .9, R * .9, 40), '#ffc2df', { boil: .3 });
    for (let k = 0; k < 5; k++) { const a1 = [], a2 = []; for (let j = 0; j <= 22; j++) { const u = j / 22, rr_ = R * (1 - u) * .95, a = k / 5 * TAU + u * 3.6 + t * 2.2 * spin; a1.push([Math.cos(a) * rr_, Math.sin(a) * rr_]); const b = a + .55 * (1 - u * .7); a2.push([Math.cos(b) * rr_, Math.sin(b) * rr_]); }
      fillOnly([...a1, ...a2.reverse()], k % 2 ? '#fff0f7' : '#f777b4', { boil: .3 }); }
    fillOnly(ell(0, 0, R * .3, R * .3, 24), '#fff6fb', { boil: .4 }); } });
  for (let i = 0; i < 12; i++) { const a = hash(i) * TAU + t * (1.5 + hash(i + 4) * 2), d = R * (1.05 + .25 * ((t * .8 + hash(i + 9)) % 1)); sparkle(Math.cos(a) * d, Math.sin(a) * d, 8 + hash(i + 2) * 8, i % 3 ? '#ffd6ea' : '#fff6b3'); }
  pop();
}

// ———————————————— painterly pastel worlds ————————————————
const FLOOR = 1330;
function sky(cols, y0 = -600, y1 = 1000) { const n = cols.length; for (let i = 0; i < n; i++) fillOnly(rect(-800, lerp(y0, y1, i / n), 2700, (y1 - y0) / n + 4), cols[i], { boil: 0 });
  for (let i = 0; i < 9; i++) fillOnly(ell(hash(i * 3) * 1100, y0 + hash(i * 7) * (y1 - y0), 260 + hash(i) * 220, 90 + hash(i + 2) * 70, 30), 'rgba(255,255,255,.22)', { boil: .1 }); }
function cloud(x, y, s, t) { push(); translate(x + Math.sin(t * .3 + x) * 14, y); scale(s); const P = spline([[-150, 30], [-170, -10], [-120, -50], [-70, -50], [-40, -100], [30, -110], [80, -70], [140, -70], [180, -20], [160, 30]]);
  shape(P, { fill: '#ffffff', lw: 4, line: '#e3cfc8', shade: () => fillOnly(ell(20, 30, 180, 40, 20), '#f3ecf4', { boil: .2 }) }); pop(); }
function meadow(top, cols, t) {   // rolling hills + grass + tufts + flowers
  shape(spline([[-800, top + 40], [-300, top - 60], [200, top + 10], [700, top - 70], [1300, top + 20], [1900, top - 40], [1900, top + 900], [-800, top + 900]]), { fill: cols[0], lw: 4, line: '#a7c9a0' });
  shape(rect(-800, FLOOR - 30, 2700, 1000), { fill: cols[1], lw: 4, line: '#a7c9a0' });
  for (let i = 0; i < 26; i++) { const x = -200 + hash(i * 5) * 1500, y = FLOOR + 20 + hash(i * 9) * 520; stroke(spline([[x - 14, y], [x - 6, y - 26], [x, y - 4], [x + 8, y - 30], [x + 14, y]], false), 4, { line: cols[2] }); }
  for (let i = 0; i < 10; i++) { const x = -100 + hash(i * 11) * 1300, y = FLOOR + 60 + hash(i * 13) * 420; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; fillOnly(ell(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 9, 9, 10), ['#fff7c2', '#ffd6e6', '#e6dcff'][i % 3], { boil: .2 }); } fillOnly(ell(x, y, 6, 6, 8), '#ffd27a', { boil: .1 }); }
}
function room(t, wall = '#ffe1cc', floor = '#f6cfb2') {      // the studio: peach walls, a window onto the meadow, warm floor
  fillOnly(rect(-800, -600, 2700, FLOOR + 600), wall, { boil: 0 });
  for (let x = -300; x < 1500; x += 120) fillOnly(rect(x, -600, 50, FLOOR + 600), 'rgba(255,255,255,.18)', { boil: 0 });
  push(); translate(880, 220); shape(rr(-170, -150, 340, 300, 30), { fill: '#d6efff', lw: 5, shade: () => { fillOnly(ell(0, 150, 260, 90, 30), '#c9f0cf', { boil: .2 }); fillOnly(ell(-60, -60, 70, 30, 20), '#ffffff', { boil: .2 }); } });
  stroke([[0, -150], [0, 150]], 6); stroke([[-170, 0], [170, 0]], 6); pop();
  shape(rect(-800, FLOOR - 30, 2700, 1000), { fill: floor, lw: 4 });
  for (let k = 0; k < 4; k++) stroke([[-800, FLOOR + 40 + k * 80 + k * k * 14], [1900, FLOOR + 40 + k * 80 + k * k * 14]], 3, { line: '#e8b898' });
  push(); translate(120, FLOOR - 20); shape(rr(-50, -110, 100, 110, 20), { fill: '#ffc9a8', lw: 5 }); for (const [x, y, r] of [[-30, -150, 40], [20, -170, 46], [0, -210, 40]]) shape(ell(x, y, r, r * .8, 16), { fill: '#b8e6be', lw: 5 }); pop();   // a plant
}
// the five old places, pastel junk on two shelves (always full — they bounce when named)
function mailbox(t) { shape(rect(-12, -10, 24, 120), { fill: '#d8c8b8', lw: 5 }); shape([...arc(0, -70, 100, 76, Math.PI, TAU, 18), [100, 0], [-100, 0]], { fill: '#bcd8ff', lw: 5, shade: () => fillOnly(rect(40, -160, 80, 170), '#a9c8f5', { boil: .2 }) });
  shape(rr(76, -126, 40, 24, 6), { fill: '#ffb3c7', lw: 4 }); for (let i = 0; i < 3; i++) { push(); translate(-60 + i * 20, -40 - i * 10 + Math.sin(t * 6 + i) * 3); rotate(-.4 + i * .2); shape(rr(-34, -22, 68, 44, 6), { fill: '#fffaf2', lw: 4 }); stroke([[-34, -22], [0, 4], [34, -22]], 3); pop(); } }
function cabinet(t) { shape(rr(-90, -220, 180, 220, 18), { fill: '#e2d6ff', lw: 5, shade: () => fillOnly(rect(40, -230, 70, 240), '#d2c2f6', { boil: .2 }) });
  for (let i = 0; i < 2; i++) { shape(rr(-70, -200 + i * 100, 140, 82, 12), { fill: '#f0e9ff', lw: 4 }); shape(rr(-24, -168 + i * 100, 48, 14, 7), { fill: '#c7b6ea', lw: 3 }); }
  for (let i = 0; i < 4; i++) { push(); translate(-48 + i * 32, -222); rotate(-.2 + i * .13); shape(rr(-16, -46, 32, 48, 4), { fill: i % 2 ? '#fff3b8' : '#fffaf2', lw: 4 }); pop(); } }
function typewriter(t) { shape(rr(-64, -210, 128, 110, 8), { fill: '#fffaf2', lw: 4, shade: () => { for (let i = 0; i < 3; i++) fillOnly(rr(-44, -192 + i * 22, 80 - i * 12, 8, 4), '#d8c8e8', { boil: .2 }); } });
  shape(rr(-120, -110, 240, 90, 30), { fill: '#bfeedd', lw: 5 }); for (let i = 0; i < 6; i++) shape(ell(-75 + i * 30, -60 + (Math.floor(t * 12 + i) % 3 === 0 ? 3 : 0), 11, 11, 10), { fill: '#fffaf2', lw: 3 }); }
function phone(t, ring = 0) { push(); if (ring) translate(Math.sin(t * 50) * 4, 0);
  shape(rr(-110, -100, 220, 100, 40), { fill: '#ffc2d4', lw: 5 }); shape(ell(0, -52, 40, 30, 20), { fill: '#fffaf2', lw: 4 });
  shape(spline([[-120, -120], [-96, -150], [96, -150], [120, -120], [90, -104], [66, -126], [-66, -126], [-90, -104]]), { fill: '#ffc2d4', lw: 5 });
  for (let i = 0; i < 2; i++) { const u = (t * 1.1 + i / 2) % 1; push(); translate(-60 + i * 120, -200 - u * 50); shape(rr(-40, -26, 80, 48, 20), { fill: '#fffaf2', lw: 4, alpha: 1 - u }); text('♡', 0, 0, { font: F(28), fill: '#ff86bf' }); pop(); } pop(); }
function register(t) { shape(rr(-120, -150, 240, 150, 24), { fill: '#fff1b8', lw: 5, shade: () => fillOnly(rect(50, -160, 80, 170), '#ffe79a', { boil: .2 }) });
  shape(rr(-74, -216, 148, 64, 14), { fill: '#e2d6ff', lw: 4 }); text('$ $ $', 0, -184, { font: F(34), fill: '#7a5040' });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) shape(ell(-54 + c * 36, -104 + r * 36, 12, 12, 10), { fill: '#fffaf2', lw: 3 });
  stroke(spline([[100, -150], [126, -196], [104, -236], [132, -270]], false), 14, { line: '#ffffff' }); }
const DEV = [{ f: mailbox, x: 170, y: 300, label: 'EMAIL', w: 12 }, { f: cabinet, x: 470, y: 300, label: 'PROJECTS', w: 15 }, { f: typewriter, x: 760, y: 300, label: 'PROPOSALS', w: 18 },
  { f: phone, x: 290, y: 620, label: 'FEEDBACK', w: 20 }, { f: register, x: 640, y: 620, label: 'INVOICES', w: 25 }];
function tagLabel(str, x, y, size = 32, fill = '#fffaf2') { g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(size); const w = g.measureText(str).width + 34; push(); translate(x, y); shape(rr(-w / 2, -size * .78, w, size * 1.56, size * .78), { fill, lw: 4 }); text(str, 0, 3, { font: F(size), fill: '#7a5040' }); pop(); }
function shelves(t, { named = [], shake = 0 } = {}) {
  for (const y of [304, 624]) shape(rr(20, y, 900, 28, 10), { fill: '#e8b898', lw: 5 });
  DEV.forEach((d, i) => { const k = named[i] ?? -9, b = t >= k ? (1 + .35 * Math.exp(-(t - k) * 6) * Math.sin((t - k) * 18)) : 1;
    push(); translate(d.x + (shake ? Math.sin(t * 40 + i * 2) * shake : 0), d.y); scale(.95 * b, .95 / b);
    if (t >= k && t < k + 1.2) for (let s = 0; s < 4; s++) { const a = s / 4 * TAU + t * 2; sparkle(Math.cos(a) * 150, -110 + Math.sin(a) * 110, 14); }
    d.f(t, shake ? 1 : 0); pop(); tagLabel(d.label, d.x, d.y + 70, 30, ['#ffe3ef', '#e6dcff', '#d4f5e4', '#ffe3ef', '#fff1b8'][i]); });
}
// big product cards (≥ 700 px on screen at the prop framing)
const CARD = { x: 465, y: 330, w: 640 };
function card(x, y, w, h, title, lines, { head = '#ffc2d9', rot = 0, s = 1 } = {}) {
  push(); translate(x, y); rotate(rot); scale(s);
  shape(rr(-w / 2 + 10, -h / 2 + 12, w, h, 30), { fill: 'rgba(122,80,64,.12)', stroke: false });
  shape(rr(-w / 2, -h / 2, w, h, 30), { fill: '#fffaf2', lw: 5, shade: () => fillOnly(rect(-w / 2 - 10, -h / 2 - 10, w + 20, 96), head, { boil: .2 }) });
  text(title, 0, -h / 2 + 46, { font: F(44), fill: '#7a5040' });
  lines.forEach((l, i) => text(l, -w / 2 + 40, -h / 2 + 140 + i * 62, { font: F(42, 700), fill: '#7a5040', align: 'left' }));
  pop();
}
function stampK(str, x, y, s, rot, col = '#7cc79a') { if (s <= 0) return; push(); translate(x, y); rotate(rot); scale(s); g.setTransform(1, 0, 0, 1, 0, 0); g.font = '400 70px "Bagel Fat One"'; const w = g.measureText(str).width + 60;
  shape(rr(-w / 2, -56, w, 112, 56), { fill: '#fffaf2', lw: 7, line: col }); text(str, 0, 6, { font: '400 70px "Bagel Fat One"', fill: col }); pop(); }
const popS = (t, t0, d = .3) => t < t0 ? 0 : back(seg(t, t0, t0 + d), 2.2);

// ———————————————— camera ————————————————
function cam(cx, cy, z, shake = 0, t = 0) { reset(); translate(W / 2, H / 2); if (shake) { const f = Math.floor(t * 24); translate((hash(f) - .5) * shake * 2, (hash(f + 77) - .5) * shake * 2); } scale(z); translate(-cx, -cy); }
const camL = (t, t0, t1, a, b, e = eio) => { const u = e(seg(t, t0, t1)); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; };
const PROP = [520, 700, 1.15], TWO = [560, 960, 1.38];
const camP = () => cam(...PROP), camT = () => cam(...TWO);
const blinkD = t => Math.floor(t * 12) % 41 < 2, blinkN = t => Math.floor(t * 12 + 17) % 53 < 2;
const DX = 330, NX = 660;
function Dv(t, o = {}) { const m = talk('OWNER', t); return { x: DX, y: FLOOR, t: q(t), nerv: .2, look: [.5, 0], blink: blinkD(t), brow: .5, mouth: { o: m.o, sm: .4 }, tilt: m.talking ? (m.o - .3) * .06 : Math.sin(q(t) * 1.6) * .03, ...o }; }
function Nd(t, o = {}) { const m = talk('NOD', t); return { x: NX, y: FLOOR, t: q(t), look: [-.6, 0], blink: blinkN(t), sleepy: true, mouth: { o: m.o, sm: .3 }, tilt: m.talking ? (m.o - .3) * .04 : 0, ...o }; }
const armsUp = { armL: { h: [-90, -170] }, armR: { h: [90, -170] } }, armsWide = { armL: { h: [-170, 20] }, armR: { h: [170, 20] } };
const holdHead = { armL: { h: [-70, -170], bend: -30 }, armR: { h: [70, -170], bend: 30 } };

// ———————————————— shots ————————————————
const T = { portal: 23.85, title: 24.05, wipe1: 24.95, wipe2: 35.82, wipe3: 44.33, wipe4: 51.68, wipe5: 60.72, drop: 70.0, end: 71.2 };
const WIPES = [[T.wipe1, .32], [T.wipe2, .3], [T.wipe3, .3], [T.wipe4, .3], [T.wipe5, .3], [T.end, .32]];
const named = [wAt(12), wAt(15), wAt(18), wAt(20), wAt(25)];
const SH = []; const shot = (a, b, f) => SH.push([a, b, f]);

shot(0, 1.84, t => { cam(DX + 40, 760, 1.6); room(t); shelves(t);
  dev(Dv(t, { ...armsUp, look: [.2, -.4], brow: .1, mouth: { o: talk('OWNER', t).o, sm: .9 } })); });
shot(1.84, 2.78, t => { cam(DX, 795, 2.6); room(t); shelves(t);
  dev(Dv(t, { look: [.9, 0], brow: 0, mouth: { o: talk('OWNER', t).o * .6, sm: -.2 }, nerv: 0 })); push(); translate(DX - 60, 520); fillOnly(rect(-60, 0, 240, 16), 'rgba(0,0,0,0)'); pop(); });
shot(2.78, 9.06, t => {   // the list: the camera visits each of the five places as it is named (shelves are never empty)
  const k = Math.max(0, named.filter(a => t >= a - .25).length - 1), d = DEV[k], p = DEV[Math.max(0, k - 1)], tk = named[k] - .25;
  const u = t < named[0] - .25 ? 0 : eio(seg(t, tk, tk + .35)); cam(lerp(p.x, d.x, u), lerp(p.y, d.y, u) - 40, 2.0); room(t); shelves(t, { named }); });
shot(9.06, 10.08, t => { cam(DX, 801, 2.4, 5, t); room(t); shelves(t);
  dev(Dv(t, { nerv: 1, brow: 1, wide: 1.15, look: [0, -.5], ...holdHead, mouth: { o: 0, worry: 1 }, sweat: t })); });
shot(10.08, 12.0, t => { camT(); room(t); shelves(t);
  dev(Dv(t, { look: [.8, 0], nerv: .5, sweat: t }));
  const s = popS(t, 10.08, .4); if (s > 0) { nod(Nd(t, { s })); if (t < 10.6) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; sparkle(NX + Math.cos(a) * 260 * eo(seg(t, 10.08, 10.6)), FLOOR - 520 + Math.sin(a) * 260 * eo(seg(t, 10.08, 10.6)), 20); } } });
shot(12.0, 13.54, t => { camP(); room(t); shelves(t, { shake: 6 });
  dev(Dv(t, { armL: { h: [-80, -190] }, armR: { h: [150, -170] }, look: [-.2, -.8], nerv: .8 })); nod(Nd(t, { look: [-.6, -.5] })); });
shot(13.54, 14.38, t => { cam(DX, 789, 2.9, 9, t); room(t); shelves(t, { shake: 9 });
  dev(Dv(t, { nerv: 1.4, brow: 1, wide: 1.25, look: [0, 0], mouth: { o: talk('OWNER', t).o * 1.4, worry: 1 } })); });
shot(14.38, 15.44, t => { const z = lerp(1.38, 1.5, seg(t, 14.38, 15.44)); cam(560, 900, z); room(14.4); shelves(14.4);   // dead air
  dev(Dv(14.4, { t: 14.4, nerv: 0, brow: 1, look: [.9, 0], mouth: { o: 0, worry: 1 } })); nod(Nd(14.4, { t: 14.4, look: [-.9, 0] })); });
shot(15.44, 18.96, t => { cam(NX, 881, 2.1); room(t); shelves(t);
  const one = t > wAt(48) - .2; nod(Nd(t, { look: [-.2, .1], hands: one ? [[-210, -380], [200, -700]] : undefined, point: one ? [0, 1] : undefined })); });
shot(18.96, 23.1, t => { const z = lerp(1.38, 1.46, seg(t, 18.96, 23.1)); cam(560, 960, z); room(t); shelves(t);
  dev(Dv(t, { ...armsWide, look: [.7, -.2], brow: .3, mouth: { o: talk('OWNER', t).o, sm: .6 } })); nod(Nd(t, { look: [-.7, 0] })); });
shot(23.1, T.wipe1, t => {
  const rush = seg(t, 24.55, T.wipe1), [cx, cy, z] = rush > 0 ? camL(t, 24.55, T.wipe1, PROP, [465, 380, 3.8], ei) : PROP;
  cam(cx, cy, z); room(t); shelves(t);
  const op = t < T.portal ? 0 : back(clamp((t - T.portal) / .32), 1.6); portal(465, 380, 230, t, { open: op });
  if (op > 0) screenRect('rgba(255,160,205,.08)');
  const dr = seg(t, 23.4, 23.85), ang = dr * TAU;
  dev(Dv(t, { nerv: .9, look: [.4, -.8], brow: 1, wide: 1.2, ...holdHead, sweat: t }));
  nod(Nd(t, { look: [-.5, -.7], sleepy: false, hands: [[-210, -380], dr > 0 && dr < 1 ? [-200 + Math.cos(ang) * 110, -760 + Math.sin(ang) * 110] : [60, -720]], point: [0, 1] }));
  if (t > T.title) titleArt(t);
});
// —— world 1: the lead (mint meadow) ——
function leadW(t) { sky(['#cfeffd', '#dcf5fb', '#e7f8f2', '#f0fbf0'], -700, 1000); cloud(120, 80, 1, t); cloud(820, 20, .8, t); meadow(1000, ['#c9ecd0', '#b6e3bf', '#8fcf9c'], t); }
const BX = 760;
shot(T.wipe1, 27.0, t => { cam(520, 860, 1.25); leadW(t);
  const land = (to, t0, t1, P, f) => { if (t < t0) return; const u = eo(seg(t, t0, t1)); f({ ...P, x: lerp(465, to, u), y: lerp(600, FLOOR, u) - Math.sin(u * Math.PI) * 160, s: lerp(.4, P.s ?? 1, u) }); };
  if (t < 25.6) portal(465, 520, 200, t, { open: 1 - seg(t, 25.35, 25.65) });
  land(DX - 60, 25.0, 25.4, Dv(t, { look: [.6, -.2], happy: t > 25.5 }), dev);
  land(NX - 120, 25.1, 25.5, Nd(t, { s: .9, look: [.5, 0] }), nod);
  const wi = eo(seg(t, 25.4, 26.1)); bean({ x: lerp(1300, BX, wi), y: FLOOR, t: q(t), walk: wi < 1, s: .8, look: [-.7, 0] });
  if (t > wAt(68) - .1) { push(); translate(lerp(1300, BX, wi) - 100, FLOOR - 360); rotate(-.15); scale(popS(t, wAt(68) - .1)); shape(rr(-90, -60, 180, 120, 18), { fill: '#fffaf2', lw: 5 }); stroke([[-90, -60], [0, 10], [90, -60]], 4); text('INQUIRY', 0, 36, { font: F(30), fill: '#e85a9c' }); pop(); } });
shot(27.0, 31.1, t => { camP(); leadW(t);
  const i0 = wAt(73), i1 = wAt(77), i2 = wAt(80), i3 = wAt(82);
  const c = t < i1 - .1 ? 0 : t < i2 - .1 ? 1 : 2;
  const cards = [['NEW LEAD', ['Fernhill Coffee Co.', 'Hannah Brooks'], '#bfeedd'], ['DISCOVERY CALL', ['Thursday · 10:00', 'with Hannah'], '#ffe1cc'], ['PROPOSAL', ['Website refresh', 'sent to Hannah ✓'], '#e6dcff']][c];
  const tc = [i0, i1, i2][c]; card(CARD.x, CARD.y, CARD.w, 340, cards[0], cards[1], { head: cards[2], s: popS(t, tc - .1, .35), rot: [-.03, .025, -.02][c] });
  dev(Dv(t, { x: DX - 60, look: [.4, -.7], happy: t > i3, mouth: { o: 0, sm: .8 } })); nod(Nd(t, { x: NX - 120, s: .9, look: [-.2, -.7], hands: [[-210, -380], [180, -640]], point: [0, 1] }));
  bean({ x: BX, y: FLOOR, t: q(t), s: .8, look: [-.5, -.7], hop: t > i3, happy: t > i3 }); });
shot(31.1, 32.42, t => { cam(DX - 60, 798, 2.5); leadW(t); dev(Dv(t, { x: DX - 60, look: [.8, -.3], brow: .1, mouth: { o: talk('OWNER', t).o, sm: .8 }, armR: { h: [60, -120] } })); });
shot(32.42, 34.18, t => { camP(); leadW(t);
  const won = popS(t, wAt(91)), mo = seg(t, wAt(94) - .2, wAt(94) + .35);
  if (mo < 1) { card(CARD.x, CARD.y, CARD.w, 340, 'NEW LEAD', ['Fernhill Coffee Co.', 'Hannah Brooks'], { head: '#bfeedd', s: 1 - mo }); stampK('WON!', CARD.x + 150, CARD.y + 90, won * (1 - mo), -.15, '#e85a9c'); }
  if (mo > 0) { push(); translate(CARD.x, CARD.y + 20); scale(eo(mo)); kanban(0, 0, t, { title: 'PROJECT · Website refresh', cards: [{ x: -200, y: -10, col: '#bfeedd', txt: 'Moodboard' }, { x: -200, y: 80, col: '#fff1b8', txt: 'Homepage' }, { x: 0, y: -10, col: '#ffc2d9', txt: 'Shop page' }] }); pop(); }
  dev(Dv(t, { x: DX - 60, look: [.4, -.8], happy: t > wAt(94), mouth: { o: 0, sm: .9 } })); nod(Nd(t, { x: NX - 120, s: .9, look: [-.2, -.7] }));
  bean({ x: BX, y: FLOOR, t: q(t), s: .8, look: [-.5, -.7], armUp: t > wAt(91) && t < wAt(91) + .9, happy: t > wAt(91) }); });
shot(34.18, T.wipe2, t => { cam(NX - 120, 881, 2.1); leadW(t); nod(Nd(t, { x: NX - 120, look: [-.1, 0] })); });
// —— world 2: the client's branded portal (lavender + butter) ——
function portalW(t) { sky(['#e6dcff', '#ece3ff', '#f3eaff', '#fbf1ff'], -700, 1000); cloud(100, 60, .9, t); cloud(900, 120, .7, t); meadow(1010, ['#fff4c7', '#fff1b8', '#f2dc8a'], t);
  for (let i = 0; i < 10; i++) sparkle(hash(i) * 1080, 100 + hash(i + 5) * 500, 10 + 6 * Math.sin(t * 3 + i), '#fff6b3'); }
function clientPortal(t, { proof = 0, pins = 0, ok = 0 } = {}) {   // a wooden arch with the client's sign; pointedly not glowing
  const x = CARD.x, y = 560, w = 520, h = 360;
  push(); translate(x, y);
  shape([...arc(0, -h / 2 + w / 2 - 60, w / 2 + 44, w / 2 + 44, Math.PI, TAU, 30), [w / 2 + 44, h / 2], [-w / 2 - 44, h / 2]], { fill: '#e8b898', lw: 5, shade: () => fillOnly(rect(w / 2 - 20, -h, 120, 2 * h), '#dba585', { boil: .2 }) });
  shape([...arc(0, -h / 2 + w / 2 - 60, w / 2, w / 2, Math.PI, TAU, 30), [w / 2, h / 2], [-w / 2, h / 2]], { fill: '#fffaf2', lw: 4 });
  if (proof > 0) { g.save(); g.globalAlpha = clamp(proof); img(PROOF, -w / 2 + 16, -h / 2 - 40, w - 32, (w - 32) * 792 / 944); g.restore(); }
  for (let i = 0; i < 2; i++) { const s = clamp(pins * 2 - i); if (s <= 0) continue; const [px, py] = [[-60, -120], [-150, 60]][i]; push(); translate(px, py); scale(back(s, 2)); shape(ell(0, 0, 32, 32, 20), { fill: '#ff86bf', lw: 5 }); text(String(i + 1), 0, 2, { font: F(34), fill: '#fff' }); pop(); }
  push(); translate(0, -h / 2 - w / 2 + 40); shape(rr(-270, -48, 540, 96, 48), { fill: '#fff1b8', lw: 5 }); text('Fernhill Coffee Co.', 0, -2, { font: '400 46px "Bagel Fat One"', fill: '#7a5040' }); text('client portal', 0, 64, { font: F(30), fill: '#a07a6a' }); pop();
  pop();
  if (ok > 0) stampK('APPROVED', x + 60, y + 60, back(clamp(ok), 2.2), -.12);
}
shot(T.wipe2, 42.42, t => { const [cx, cy, z] = camL(t, 35.85, 38.2, [520, 760, 1.05], PROP); cam(cx, cy, z); portalW(t);
  clientPortal(t, { proof: seg(t, wAt(111), wAt(111) + .3), pins: seg(t, wAt(114) - .1, wAt(114) + .6), ok: seg(t, wAt(116), wAt(116) + .25) });
  dev(Dv(t, { x: DX - 60, look: [.5, -.8], wide: t > wAt(107) && t < 39 ? 1.2 : 1, happy: t > wAt(116) + .3, armR: t > wAt(107) && t < 39.2 ? { h: [140, -230] } : undefined, mouth: { o: 0, sm: .8 } }));
  nod(Nd(t, { x: NX - 120, s: .9, look: [-.2, -.7] }));
  bean({ x: BX, y: FLOOR, t: q(t), s: .8, look: [-.6, -.7], armUp: t > wAt(116), happy: t > wAt(116) + .3 }); });
shot(42.42, T.wipe3, t => { cam(DX - 60, 798, 2.5); portalW(t); dev(Dv(t, { x: DX - 60, look: [.9, -.3], brow: .9, nerv: .4, mouth: { o: talk('OWNER', t).o, worry: 1 } })); });
// —— world 3: feedback becomes tasks (sky + peach) ——
function tasksW(t) { sky(['#d2e8ff', '#dcedff', '#e8f3ff', '#f4f9ff'], -700, 1000); cloud(140, 40, 1, t); cloud(860, 110, .8, t); meadow(1010, ['#ffe1cc', '#ffd6bd', '#f4b896'], t); }
function kanban(x, y, t, { cards = [], title = 'TASKS', proofIn = false } = {}) {
  push(); translate(x, y);
  shape(rr(-320, -230, 640, 470, 30), { fill: '#fffaf2', lw: 5, shade: () => fillOnly(rect(-330, -240, 660, 80), '#e6dcff', { boil: .2 }) });
  text(title, 0, -196, { font: F(38), fill: '#7a5040' });
  ['TO DO', 'DOING', 'DONE'].forEach((c, i) => { text(c, -200 + i * 200, -124, { font: F(30), fill: '#a07a6a' }); if (i) stroke([[-320 + i * 213, -150], [-320 + i * 213, 230]], 3, { line: '#eadfd8' }); });
  cards.forEach(c => { push(); translate(c.x, c.y); rotate(c.r || 0); shape(rr(-92, -36, 184, 72, 20), { fill: c.col, lw: 4 }); text(c.txt, 0, 2, { font: F(30), fill: '#7a5040' }); pop(); });
  pop();
}
shot(T.wipe3, 50.6, t => { camP(); tasksW(t);
  const toT = seg(t, wAt(127), wAt(129) + .3), team = seg(t, wAt(131), wAt(134) + .5), conn = seg(t, wAt(139) - .2, wAt(143));
  // the proof hangs above the board on a little easel line; its pins send their notes down
  push(); translate(CARD.x - 190, 140); shape(rr(-120, -90, 240, 190, 16), { fill: '#fffaf2', lw: 4 }); img(PROOF, -108, -78, 216, 166); pop();
  const pins = [[CARD.x - 220, 110], [CARD.x - 260, 180]]; pins.forEach(([x, y], i) => { shape(ell(x, y, 22, 22, 16), { fill: '#ff86bf', lw: 4 }); text(String(i + 1), x, y + 2, { font: F(24), fill: '#fff' }); });
  const kx = CARD.x + 20, ky = 480;
  const cards = [0, 1].map(i => { const from = [pins[i][0] - kx + 60, pins[i][1] - ky], to0 = [-200, -50 + i * 100], to1 = [200, -50 + i * 100], a = eo(toT), b = eio(team);
    return { x: lerp(lerp(from[0], to0[0], a), to1[0], b), y: lerp(lerp(from[1], to0[1], a), to1[1], b) - Math.sin(b * Math.PI) * 70, col: ['#ffc2d9', '#bfeedd'][i], txt: ['Price per cup', 'Hero copy'][i], r: (1 - a) * .25 }; });
  kanban(kx, ky, t, { cards, title: 'FEEDBACK → TASKS' });
  if (conn > 0) [0, 1].forEach(i => { const a = [kx + 200 - 92, ky - 50 + i * 100], b = pins[i], pts = []; for (let k = 0; k <= 24 * eo(conn); k++) { const u = k / 24; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 120]); } if (pts.length > 1) stroke(pts, 5, { line: '#e85a9c' }); });
  for (let i = 0; i < 3; i++) { const x = lerp(kx - 160 + i * 90, kx + 40 + i * 90, eio(team)), y = ky + 290 - Math.abs(Math.sin(q(t) * 10 + i)) * 16 * (team > 0 && team < 1 ? 1 : 0);   // the team: three little helpers
    push(); translate(x, y); shape(ell(0, 0, 46, 42, 22), { fill: ['#bfe6ff', '#fff1b8', '#e6dcff'][i], lw: 4 }); kEye(-14, -6, 9, 12, { look: [.5, 0] }); kEye(14, -6, 9, 12, { look: [.5, 0] }); fillOnly(ell(-26, 10, 9, 6, 10), BLUSH); fillOnly(ell(26, 10, 9, 6, 10), BLUSH); pop(); }
  dev(Dv(t, { x: DX - 60, look: [.4, -.8], happy: conn > .5, mouth: { o: 0, sm: .8 } })); nod(Nd(t, { x: NX - 100, s: .9, look: [-.3, -.7], hands: [[-210, -380], [170, -640]], point: [0, 1] })); });
shot(50.6, T.wipe4, t => { cam(DX - 60, 798, 2.5); tasksW(t); dev(Dv(t, { x: DX - 60, look: [.9, -.1], happy: t > 50.9 && t < 51.5, mouth: { o: 0, sm: .9 } })); });
// —— world 4: more work than agreed (rose + cream) ——
function coW(t) { sky(['#ffd6e0', '#ffe0e7', '#ffeaee', '#fff3f2'], -700, 1000); cloud(160, 60, .9, t); meadow(1010, ['#fff3e0', '#ffedd5', '#f2d2a8'], t);
  for (let i = 0; i < 3; i++) shape(ell(180 + i * 300, -40, 34, 34, 20), { fill: Math.floor(t * 3 + i) % 2 ? '#ff9fb4' : '#ffe3ea', lw: 4 }); }
function bigButton(x, y, s, t, chute = 0) {      // the extra request floats down on a parachute
  if (s <= 0) return; push(); translate(x, y); scale(s);
  if (chute > 0) { stroke([[-200, -170], [-60, -420]], 4); stroke([[200, -170], [60, -420]], 4); shape([...arc(0, -420, 260, 160, Math.PI, TAU, 26), [260, -420], [-260, -420]], { fill: '#ffc2d9', lw: 5, alpha: chute, shade: () => { for (let k = -2; k <= 2; k++) fillOnly(rect(k * 104 - 26, -600, 52, 200), '#fff0f6', { boil: .2 }); } }); }
  shape(rr(-240, -170, 480, 300, 60), { fill: '#e6dcff', lw: 5, shade: () => fillOnly(rect(120, -180, 140, 320), '#d6c8fb', { boil: .2 }) });
  shape(rr(-190, -70, 380, 120, 60), { fill: '#ff86bf', lw: 5 }); text('Subscribe', 0, -8, { font: '400 56px "Bagel Fat One"', fill: '#fff' });
  text('+ one more thing', 0, -122, { font: F(38), fill: '#7a5040' });
  pop();
}
function changeOrder(t, u, { signed = 0, st = 0 } = {}) {
  if (u <= 0) return; push(); translate(CARD.x, 380); scale(1, eo(u));
  card(0, 0, 660, 470, 'CHANGE ORDER · CO-03', [], { head: '#ffc2d9' });
  ['Subscribe button', 'under each bag'].forEach((l, i) => text(l, -290, -90 + i * 62, { font: F(50), fill: '#7a5040', align: 'left' }));
  text('Requested by Hannah', -290, 50, { font: F(36, 700), fill: '#a07a6a', align: 'left' });
  stroke([[-290, 166], [120, 166]], 4);
  if (signed > 0) { const n = Math.floor(signed * 14), pts = []; for (let i = 0; i <= n; i++) pts.push([-270 + i * 26, 140 + Math.sin(i * 2.1) * 22]); if (pts.length > 1) stroke(spline(pts, false, 4), 6, { line: '#8fb8f0' }); }
  text('client signature', -290, 200, { font: F(28, 700), fill: '#a07a6a', align: 'left' });
  pop(); stampK('DOCUMENTED', CARD.x + 60, 610, st, -.1, '#a993d9');
}
shot(T.wipe4, 53.85, t => { camP(); coW(t);
  const dn = eo(seg(t, wAt(150) - .7, wAt(150) + .3)); bigButton(CARD.x, lerp(-500, 420, dn), .95, t, 1 - seg(t, wAt(150) + .5, wAt(150) + 1));
  bean({ x: BX, y: FLOOR, t: q(t), s: .8, look: [-.4, -.8], happy: true });
  dev(Dv(t, { x: DX - 60, look: [.4, -.9], nerv: .4 + dn, brow: .9, wide: 1 + .2 * dn, sweat: dn > .5 ? t : null, mouth: { o: talk('OWNER', t).o, worry: 1 } }));
  nod(Nd(t, { x: NX - 100, s: .9, look: [-.2, -.8] })); });
shot(53.85, 54.66, t => { cam(DX - 60, 789, 2.9, 10, t); coW(t);
  dev(Dv(t, { x: DX - 60, nerv: 1.5, brow: 1, wide: 1.3, look: [.6, -.5], ...holdHead, mouth: { o: talk('OWNER', t).o * 1.4, worry: 1 }, sweat: t })); });
shot(54.66, 59.8, t => { camP(); coW(t);
  const un = seg(t, wAt(160) - .1, wAt(161) + .3), sign = seg(t, wAt(164), wAt(166)), st = popS(t, wAt(167) + .1);
  if (un < 1) bigButton(CARD.x, 420, .95 * (1 - eo(un)), t);
  changeOrder(t, un, { signed: sign, st });
  const calm = seg(t, 57.5, 59.5);
  dev(Dv(t, { x: DX - 60, look: [.4, -.8], nerv: lerp(1.1, 0, calm), brow: lerp(.9, .2, calm), sweat: t < 58 ? t : null, happy: t > 59.2, mouth: { o: 0, sm: lerp(-.2, .9, calm), worry: calm < .5 } }));
  nod(Nd(t, { x: NX - 100, s: .9, look: [-.3, -.7], hands: un > 0 ? [[-210, -380], [160, -620]] : undefined }));
  bean({ x: BX, y: FLOOR, t: q(t), s: .8, look: [-.6, -.7], armUp: sign > 0 && sign < 1, happy: st > 0 }); });
shot(59.8, T.wipe5, t => { cam(DX - 60, 798, 2.5); coW(t); dev(Dv(t, { x: DX - 60, happy: true, brow: 0, mouth: { o: 0, sm: 1 }, nerv: 0 })); });
// —— home again: everything connected ——
const CHIPS = [['Projects', 168], ['Tasks', 169], ['Team', 170], ['Calendar', 171], ['Communication', 172], ['Invoices', 173], ['Payments', 175]];
function board(t) {
  const x = CARD.x, y = 360;
  push(); translate(x, y); shape(rr(-330, -280, 660, 560, 36), { fill: '#f3ecff', lw: 5, shade: () => fillOnly(rect(-340, -290, 680, 92), '#e2d6ff', { boil: .2 }) });
  text('Nodstage · one workspace', 0, -236, { font: F(40), fill: '#7a5040' }); pop();
  const pos = [[-170, -130], [130, -130], [-170, -30], [130, -30], [-110, 70], [170, 70], [30, 170]].map(([a, b]) => [x + a, y + b]);
  const hub = [x - 230, y + 190], lk = seg(t, wAt(178) - .1, wAt(178) + .5);
  if (lk > 0) pos.forEach(p => stroke([hub, [lerp(hub[0], p[0], eo(lk)), lerp(hub[1], p[1], eo(lk))]], 5, { line: '#ff86bf' }));
  CHIPS.forEach(([n, wi], i) => { const s = popS(t, wAt(wi) - .05, .25); if (s <= 0) return; push(); translate(pos[i][0], pos[i][1]); scale(s); g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(40); const w = g.measureText(n).width + 50;
    shape(rr(-w / 2, -38, w, 76, 38), { fill: ['#ffc2d9', '#bfe6ff', '#fff1b8', '#bfeedd', '#ffe1cc', '#e6dcff', '#ffc2d9'][i], lw: 4 }); text(n, 0, 2, { font: F(40), fill: '#7a5040' }); pop(); });
  if (lk > 0) { push(); translate(hub[0], hub[1]); scale(eo(lk)); shape(ell(0, 0, 46, 46, 24), { fill: '#ff86bf', lw: 5 }); stroke([[-22, 0], [22, 0]], 5, { line: '#fff' }); stroke([[0, -22], [0, 22]], 5, { line: '#fff' }); pop(); }
}
function homeConnected(t) { room(t); board(t); }
shot(T.wipe5, 65.98, t => { camP(); homeConnected(t);
  dev(Dv(t, { look: [.3, -.9], happy: t > wAt(178), mouth: { o: 0, sm: .8 } })); nod(Nd(t, { look: [-.3, -.8], hands: [[-210, -380], [150, -680]], point: [0, 1] })); });
function stackOfFive(x, y, fall, t) {     // Dev hugs all five old places to his chest
  const items = [register, phone, typewriter, cabinet, mailbox];
  items.forEach((f, i) => { const u = clamp(fall * 1.8 - i * .12), dx = (i - 2) * 80 * u, yy = y - i * 52 + u * (i * 52 + 330), rot = u * (i % 2 ? .7 : -.6);
    push(); translate(x + dx + (i % 2 ? 10 : -10), yy); rotate(rot + (i - 2) * .05); scale(.42); f(t); pop(); });
}
const hug = { armL: { h: [60, 40], bend: -30 }, armR: { h: [-60, 40], bend: 30 } };
shot(65.98, 68.46, t => { camT(); homeConnected(t);
  dev(Dv(t, { look: [.8, -.1], brow: .6, ...hug, mouth: { o: talk('OWNER', t).o, sm: .4 } })); stackOfFive(DX + 10, FLOOR - 260, 0, t); nod(Nd(t, { look: [-.7, 0] })); });
shot(68.46, 69.3, t => { const z = lerp(1.38, 1.48, seg(t, 68.46, 69.3)); cam(560, 920, z); homeConnected(68.5);       // dead air
  dev(Dv(68.5, { t: 68.5, look: [.9, 0], brow: .9, ...hug, mouth: { o: 0, worry: 1 } })); stackOfFive(DX + 10, FLOOR - 260, 0, 68.5); nod(Nd(68.5, { t: 68.5, look: [-.9, 0] })); });
shot(69.3, 69.94, t => { cam(NX, 871, 2.4); homeConnected(t); nod(Nd(t, { look: [-.6, .1] })); });
shot(69.94, T.end, t => { camT(); homeConnected(t);
  const f = seg(t, T.drop, T.drop + .45);
  dev(Dv(t, { happy: t > T.drop + .35, brow: 0, mouth: { o: 0, sm: 1 }, nerv: 0, ...(f > 0 ? armsUp : hug) }));
  stackOfFive(DX + 10, FLOOR - 260, f, t);
  if (t > T.drop + .35) for (let i = 0; i < 5; i++) sparkle(DX - 200 + i * 110, 300 + Math.sin(t * 6 + i) * 30, 18);
  nod(Nd(t, { look: [-.6, .3], happy: t > T.drop + .4, sleepy: t <= T.drop + .4 })); });

// ———————————————— title, end card, wipes, tags, subtitles ————————————————
function titleArt(t) { const s = q(t) < T.title + .25 ? back(seg(q(t), T.title, T.title + .25), 2.4) : 1;
  reset(); push(); translate(540, 320); scale(s); rotate(-.04);
  text('One Client', 8, 10, { font: '400 132px "Bagel Fat One"', fill: '#ff86bf', outlineW: 16, outlineCol: INK });
  text('One Client', 0, 0, { font: '400 132px "Bagel Fat One"', fill: '#fffaf2', outlineW: 16, outlineCol: INK });
  for (let i = 0; i < 4; i++) sparkle([-400, 410, -300, 320][i], [-90, -80, 96, 90][i], 16 + 8 * Math.sin(t * 5 + i * 1.7)); pop(); }
function endCard(t) {
  reset(); sky(['#fde6f1', '#f6e4fa', '#ece6ff', '#e6f0ff'], 0, 1920);
  reset(); cloud(160, 1500, 1.1, t); cloud(900, 1560, .9, t); meadow(1460, ['#d7f0dc', '#c6ead0', '#9fd8ab'], t);
  reset(); portal(540, 640, 300, t * .6, { open: spring(t - T.end, 7, .45), sx: 1 });
  reset(); screenRect('rgba(253,236,246,.55)');
  const a = ss(seg(t, T.end + .2, T.end + .6));
  reset(); g.globalAlpha = a; push(); translate(540, 640); scale(back(seg(q(t), T.end + .2, T.end + .5), 2));
  shape(rr(-310, -96, 620, 192, 96), { fill: '#ffffff', lw: 5 }); img(LOGO, -240, -57, 480, 114); pop(); g.globalAlpha = 1;
  const b = ss(seg(t, wAt(197) - .1, wAt(197) + .3)); if (b > 0) { g.globalAlpha = b; reset(); text('Run your creative studio', 540, 330, { font: '400 66px "Bagel Fat One"', fill: '#fffaf2', outlineW: 12, outlineCol: INK }); text('with Nodstage', 540, 420, { font: '400 66px "Bagel Fat One"', fill: '#ff86bf', outlineW: 12, outlineCol: INK }); g.globalAlpha = 1; }
  const c = ss(seg(t, wAt(201), wAt(201) + .4)); if (c > 0) { g.globalAlpha = c; reset(); text('nodstage.com', 540, 800, { font: F(64), fill: '#7a5040' }); g.globalAlpha = 1; }
  const k = t - T.end;
  reset(); dev(Dv(t, { x: 310, y: 1440, s: .72, happy: k > 4.8, brow: 0, mouth: { o: 0, sm: 1 }, nerv: 0, look: [.6, -.4] }));
  reset(); nod(Nd(t, { x: 700, y: 1440, s: .7, look: [-.5, -.4], sleepy: false, happy: k > 5 }));
}
function wipe(t) { for (const [tc, hw] of WIPES) { const d = Math.abs(t - tc); if (d > hw) continue; const u = 1 - d / hw; reset(); portal(540, 900, 1500 * Math.pow(u, .6), t, { open: 1, sx: 1, spin: 2 }); if (d < .03) screenRect('#fff0f7', .7); } }
const TAGS = [[25.0, 'World 1', 'the lead', '#bfeedd'], [35.9, 'World 2', 'the client portal', '#e6dcff'], [44.4, 'World 3', 'feedback → tasks', '#d2e8ff'], [51.76, 'World 4', 'more work', '#ffd6e0'], [60.8, 'Home', 'all connected', '#fff1b8']];
function tag(t) { for (const [a, id, desc, bg] of TAGS) { if (t < a || t >= a + 1.7) continue;
  reset(); push(); translate(60, 262); scale(back(seg(t, a, a + .2), 2.2)); g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(40); const w = g.measureText(id + ' · ' + desc).width + 60;
  shape(rr(0, 0, w, 80, 40), { fill: bg, lw: 5 }); text(id + ' · ' + desc, 30, 42, { font: F(40), fill: '#7a5040', align: 'left' }); pop(); } }
const WHO = { OWNER: ['Dev', '#ffd98a'], NOD: ['Nod', '#ffb3d1'], NARRATOR: ['Nodstage', '#c9b6ff'] };
const CLEAN = [[14.38, 15.44], [68.46, 69.3], [69.94, 71.26]];
let SUBS = [];
function buildSubs(caps) { SUBS = caps.map((c, i) => { const L = LINES.find(l => c.t >= l.t0 - .05 && c.t <= l.t1), nx = caps[i + 1] ? caps[i + 1].t : DUR;
  let t1 = Math.min(nx - .02, Math.max(c.t + 1.2, Math.min(nx - .02, (L ? L.t1 : c.t + 2) + .5))); for (const [a] of CLEAN) if (c.t < a && t1 > a) t1 = a;
  return { t0: c.t, t1, who: L ? L.who : 'NARRATOR', text: c.text }; }); }
function wrapSub(str, maxW = 860) { g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(56); const ws = str.split(' '), out = []; let cur = '';
  for (const w of ws) { const s = cur ? cur + ' ' + w : w; if (g.measureText(s).width > maxW && cur) { out.push(cur); cur = w; } else cur = s; } out.push(cur); return out; }
function subs(t) { const s = SUBS.find(x => t >= x.t0 && t < x.t1); if (!s) return;
  const lines = wrapSub(s.text), p = back(seg(t, s.t0, s.t0 + .14), 2), [nm, col] = WHO[s.who], yb = 1408, y0 = yb - (lines.length - 1) * 68;
  reset(); push(); translate(540, y0 - 76); scale(p); g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(32); const nw = g.measureText(nm).width + 44;
  shape(rr(-nw / 2, -26, nw, 52, 26), { fill: col, lw: 4 }); text(nm, 0, 2, { font: F(32), fill: '#7a5040' }); pop();
  reset(); lines.forEach((l, k) => text(l, 540, y0 + k * 68, { font: F(56), fill: '#ffffff', outlineW: 13, outlineCol: '#8a5a48' })); }

function render(t) {
  frame(t); screenRect('#fff8f2');
  if (t >= T.end) endCard(t); else { const s = SH.find(([a, b]) => t >= a && t < b) || SH[SH.length - 1]; s[2](t); }
  paper(); wipe(t); tag(t); subs(t);
}
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  named.forEach((x, i) => add('pop', x, { v: .7, f: 700 + i * 110 }));
  add('poof', 10.1); add('rattle', 12.0, { d: 1.5 }); add('shake', 13.54, { d: .8 });
  add('blip', wAt(48)); add('swirlDraw', 23.4, { d: .45 }); add('portalOpen', T.portal); add('slam', T.title); add('portalHum', T.portal + .1, { d: T.wipe1 - T.portal - .1 });
  WIPES.forEach(([tc]) => add('whoosh', tc - .25));
  add('pop', 25.4); add('boing', 25.5); add('portalClose', 25.5, { v: .5 }); add('steps', 25.4, { d: .7 }); add('paper', wAt(68));
  add('pop', wAt(73), { f: 700 }); add('pop', wAt(77), { f: 820 }); add('pop', wAt(80), { f: 940 }); add('boing', wAt(84), { v: .6 });
  add('stamp', wAt(91)); add('pop', wAt(94), { f: 600 });
  add('pop', wAt(111), { f: 500 }); add('pop', wAt(114), { f: 900 }); add('pop', wAt(114) + .5, { f: 900 }); add('stamp', wAt(116));
  add('pop', wAt(127), { f: 700 }); add('pop', wAt(127) + .2, { f: 760 }); add('steps', wAt(131), { d: 1.3 }); add('zip', wAt(139) - .2, { d: 1.2 });
  add('alarm', 51.75, { d: 1.4 }); add('whoosh', wAt(150) - .5, { v: .6 }); add('boing', wAt(150) + .5); add('shake', 53.4, { d: 1.2 });
  add('paper', wAt(160)); add('scribble', wAt(164), { d: wAt(166) - wAt(164) }); add('stamp', wAt(167) + .1);
  CHIPS.forEach(([, wi], i) => add('pop', wAt(wi), { f: 600 + i * 90, v: .7 })); add('zip', wAt(178) - .1, { d: .6 });
  add('clatter', T.drop + .15, { d: .8 }); add('sparkle', T.drop + .4); add('portalOpen', T.end, { v: .5 });
  return ev.sort((a, b) => a.t - b.t);
}
buildSubs(await (await fetch('caps.json')).json());
window.render = render; window.DUR = DUR; window.EV = events(); window.SUBS = SUBS; window.T = T;
for (const f of ['800 50px "Baloo 2"', '700 50px "Baloo 2"', '400 60px "Bagel Fat One"']) await document.fonts.load(f);
render(parseFloat(new URLSearchParams(location.search).get('t') ?? '10.5'));
window.READY = true;
