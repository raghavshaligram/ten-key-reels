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
  if (!P.noShadow) fillOnly(ell(0, 0, 120 - bob, 20, 30), 'rgba(122,80,64,.15)', { boil: .2 });
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
// ———————————————— LAYOUT: three fixed zones, the same in every world ————————————————
// Zone A y 250–780 (x 70–850): the one prop for the current line.  Zone B y 800–1300: Dev left, Nod right, ground at 1300.
// Zone C y 1330–1430: subtitles only.  Below 1440: painted ground.  Two-shots never move the camera.
const FLOOR = 1950, AX = 460, AY = 515;
const DEVX = 290, NODX = 775, DS = 1.22, NS = 1.12, NODY = 1800;
let SUBY = 852;
function sky(cols, y0 = -100, y1 = 1500) { const n = cols.length; for (let i = 0; i < n; i++) fillOnly(rect(-50, lerp(y0, y1, i / n), 1180, (y1 - y0) / n + 4), cols[i], { boil: 0 });
  for (let i = 0; i < 7; i++) fillOnly(ell(hash(i * 3) * 1080, 300 + hash(i * 7) * 800, 220 + hash(i) * 180, 70 + hash(i + 2) * 50, 30), 'rgba(255,255,255,.2)', { boil: .1 }); }
function cloud(x, y, s, t) { push(); translate(x + Math.sin(t * .3 + x) * 10, y); scale(s); const P = spline([[-150, 30], [-170, -10], [-120, -50], [-70, -50], [-40, -100], [30, -110], [80, -70], [140, -70], [180, -20], [160, 30]]);
  shape(P, { fill: '#ffffff', lw: 4, line: '#e3cfc8', shade: () => fillOnly(ell(20, 30, 180, 40, 20), '#f3ecf4', { boil: .2 }) }); pop(); }
function ground(cols, t, hills = true) {      // rolling mid-ground behind the shoulders, then meadow to the bottom (no flat floor)
  if (hills) { shape(spline([[-60, 1180], [220, 1110], [520, 1170], [800, 1100], [1140, 1150], [1140, 1980], [-60, 1980]]), { fill: cols[0], lw: 4, line: '#b9cdb4' });
    shape(spline([[-60, 1560], [260, 1480], [600, 1540], [900, 1470], [1140, 1520], [1140, 1980], [-60, 1980]]), { fill: cols[1], lw: 4, line: '#b9cdb4' });
    for (let i = 0; i < 16; i++) { const x = 20 + hash(i * 5) * 1040, y = 1250 + hash(i * 9) * 640; stroke(spline([[x - 14, y], [x - 6, y - 24], [x, y - 4], [x + 8, y - 28], [x + 14, y]], false), 4, { line: cols[2] }); }
    for (let i = 0; i < 8; i++) { const x = 60 + hash(i * 11) * 960, y = 1300 + hash(i * 13) * 560; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; fillOnly(ell(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 9, 9, 10), ['#fff7c2', '#ffd6e6', '#e6dcff'][i % 3], { boil: .2 }); } fillOnly(ell(x, y, 6, 6, 8), '#ffd27a', { boil: .1 }); } }
  else {   // the studio: wainscot panels and a low shelf of plants behind the shoulders
    shape(rect(-60, 1420, 1200, 600), { fill: cols[1], lw: 4 }); shape(rect(-60, 1400, 1200, 26), { fill: cols[2], lw: 4 });
    for (let x = 30; x < 1080; x += 210) shape(rr(x, 1470, 170, 420, 16), { fill: cols[0], lw: 3 });
    shape(rr(-20, 1180, 1120, 30, 12), { fill: '#e8b898', lw: 4 });
    for (const [x, c] of [[90, '#b8e6be'], [540, '#ffd6e6'], [990, '#b8e6be']]) { shape(rr(x - 34, 1110, 68, 72, 14), { fill: '#ffc9a8', lw: 4 }); for (const [dx, dy, r] of [[-20, -10, 26], [16, -20, 28], [0, -44, 24]]) shape(ell(x + dx, 1110 + dy, r, r * .8, 14), { fill: c, lw: 4 }); }
    for (const x of [300, 760]) { push(); translate(x, 1150); shape(rr(-40, -36, 80, 40, 8), { fill: ['#e6dcff', '#bfeedd'][x > 500 ? 1 : 0], lw: 3 }); pop(); }
  }
}
const PAL = {
  home: { sky: ['#ffe9db', '#ffe4d3', '#ffdfcc', '#ffdac6'], g: ['#f6d2b8', '#f3c9a8', '#e8b898'], cloud: false, flat: '#ffe4d3' },
  lead: { sky: ['#cfeffd', '#dcf5fb', '#e7f8f2', '#f0fbf0'], g: ['#c9ecd0', '#b6e3bf', '#8fcf9c'], cloud: true, flat: '#dcf5fb' },
  portal: { sky: ['#e6dcff', '#ece3ff', '#f3eaff', '#fbf1ff'], g: ['#fff4c7', '#fff1b8', '#f2dc8a'], cloud: true, flat: '#ece3ff' },
  tasks: { sky: ['#d2e8ff', '#dcedff', '#e8f3ff', '#f4f9ff'], g: ['#ffe1cc', '#ffd6bd', '#f4b896'], cloud: true, flat: '#dcedff' },
  co: { sky: ['#ffd6e0', '#ffe0e7', '#ffeaee', '#fff3f2'], g: ['#fff3e0', '#ffedd5', '#f2d2a8'], cloud: true, flat: '#ffe0e7' } };
function world(w, t) { const P = PAL[w]; sky(P.sky);
  if (w === 'home') { for (let x = 0; x < 1100; x += 120) fillOnly(rect(x, -50, 50, 1500), 'rgba(255,255,255,.16)', { boil: 0 }); }
  else if (P.cloud) { cloud(150, 150, .7, t); cloud(940, 200, .55, t); }
  ground(P.g, t, w !== 'home'); }
// —— Zone A props (each fits x 70–850, y 250–780) ——
function mailbox(t) { shape(rect(-12, -10, 24, 120), { fill: '#d8c8b8', lw: 5 }); shape([...arc(0, -70, 100, 76, Math.PI, TAU, 18), [100, 0], [-100, 0]], { fill: '#bcd8ff', lw: 5, shade: () => fillOnly(rect(40, -160, 80, 170), '#a9c8f5', { boil: .2 }) });
  shape(rr(76, -126, 40, 24, 6), { fill: '#ffb3c7', lw: 4 }); for (let i = 0; i < 3; i++) { push(); translate(-60 + i * 20, -40 - i * 10 + Math.sin(t * 6 + i) * 3); rotate(-.4 + i * .2); shape(rr(-34, -22, 68, 44, 6), { fill: '#fffaf2', lw: 4 }); stroke([[-34, -22], [0, 4], [34, -22]], 3); pop(); } }
function cabinet(t) { shape(rr(-90, -220, 180, 220, 18), { fill: '#e2d6ff', lw: 5, shade: () => fillOnly(rect(40, -230, 70, 240), '#d2c2f6', { boil: .2 }) });
  for (let i = 0; i < 2; i++) { shape(rr(-70, -200 + i * 100, 140, 82, 12), { fill: '#f0e9ff', lw: 4 }); shape(rr(-24, -168 + i * 100, 48, 14, 7), { fill: '#c7b6ea', lw: 3 }); } }
function typewriter(t) { shape(rr(-64, -210, 128, 110, 8), { fill: '#fffaf2', lw: 4, shade: () => { for (let i = 0; i < 3; i++) fillOnly(rr(-44, -192 + i * 22, 80 - i * 12, 8, 4), '#d8c8e8', { boil: .2 }); } });
  shape(rr(-120, -110, 240, 90, 30), { fill: '#bfeedd', lw: 5 }); for (let i = 0; i < 6; i++) shape(ell(-75 + i * 30, -60 + (Math.floor(t * 12 + i) % 3 === 0 ? 3 : 0), 11, 11, 10), { fill: '#fffaf2', lw: 3 }); }
function phone(t) { shape(rr(-110, -100, 220, 100, 40), { fill: '#ffc2d4', lw: 5 }); shape(ell(0, -52, 40, 30, 20), { fill: '#fffaf2', lw: 4 });
  shape(spline([[-120, -120], [-96, -150], [96, -150], [120, -120], [90, -104], [66, -126], [-66, -126], [-90, -104]]), { fill: '#ffc2d4', lw: 5 }); }
function register(t) { shape(rr(-120, -150, 240, 150, 24), { fill: '#fff1b8', lw: 5, shade: () => fillOnly(rect(50, -160, 80, 170), '#ffe79a', { boil: .2 }) });
  shape(rr(-74, -216, 148, 64, 14), { fill: '#e2d6ff', lw: 4 }); text('$ $ $', 0, -184, { font: F(34), fill: '#7a5040' });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) shape(ell(-54 + c * 36, -104 + r * 36, 12, 12, 10), { fill: '#fffaf2', lw: 3 }); }
const TOOLS = [{ f: mailbox, x: 200, y: 470, label: 'Email' }, { f: cabinet, x: 460, y: 470, label: 'Projects' }, { f: typewriter, x: 720, y: 470, label: 'Proposals' },
  { f: phone, x: 330, y: 700, label: 'Feedback' }, { f: register, x: 590, y: 700, label: 'Invoices' }];
function pill(str, x, y, size = 30, fill = '#fffaf2') { g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(size); const w = g.measureText(str).width + 34; push(); translate(x, y); shape(rr(-w / 2, -size * .75, w, size * 1.5, size * .75), { fill, lw: 4 }); text(str, 0, 3, { font: F(size), fill: '#7a5040' }); pop(); }
function shelf(t, { named = [], shake = 0 } = {}) {         // the five old places: one tidy shelf unit
  shape(rr(70, 270, 780, 478, 30), { fill: '#fff4ea', lw: 5 });
  for (const y of [472, 702]) shape(rr(110, y, 700, 18, 9), { fill: '#e8b898', lw: 4 });
  TOOLS.forEach((d, i) => { const k = named[i] ?? -9, b = t >= k ? (1 + .3 * Math.exp(-(t - k) * 6) * Math.sin((t - k) * 18)) : 1, hot = t >= k && t < k + 1.0;
    push(); translate(d.x + (shake ? Math.sin(t * 40 + i * 2) * shake : 0), d.y); scale(.6 * b, .6 / b); d.f(t); pop();
    if (hot) for (let s = 0; s < 3; s++) { const a = s / 3 * TAU + t * 3; sparkle(d.x + Math.cos(a) * 90, d.y - 70 + Math.sin(a) * 60, 10); }
    pill(d.label, d.x, d.y + 36, 30, hot ? '#ffd6ea' : '#fffaf2'); });
}
function card(x, y, w, h, title, lines, { head = '#ffc2d9', s = 1, rot = 0 } = {}) {
  if (s <= 0) return; push(); translate(x, y); rotate(rot); scale(s);
  shape(rr(-w / 2 + 10, -h / 2 + 12, w, h, 30), { fill: 'rgba(122,80,64,.12)', stroke: false });
  shape(rr(-w / 2, -h / 2, w, h, 30), { fill: '#fffaf2', lw: 5, shade: () => fillOnly(rect(-w / 2 - 10, -h / 2 - 10, w + 20, 96), head, { boil: .2 }) });
  text(title, 0, -h / 2 + 46, { font: F(44), fill: '#7a5040' });
  lines.forEach((l, i) => text(l, -w / 2 + 44, -h / 2 + 150 + i * 66, { font: F(46, 700), fill: '#7a5040', align: 'left' }));
  pop();
}
function stampK(str, x, y, s, rot, col = '#7cc79a') { if (s <= 0) return; push(); translate(x, y); rotate(rot); scale(s); g.setTransform(1, 0, 0, 1, 0, 0); g.font = '400 64px "Bagel Fat One"'; const w = g.measureText(str).width + 60;
  shape(rr(-w / 2, -52, w, 104, 52), { fill: '#fffaf2', lw: 7, line: col }); text(str, 0, 6, { font: '400 64px "Bagel Fat One"', fill: col }); pop(); }
const popS = (t, t0, d = .3) => t < t0 ? 0 : back(seg(t, t0, t0 + d), 2.2);
function envelope(t, s) { if (s <= 0) return; push(); translate(AX, AY); scale(s); rotate(-.04);
  shape(rr(-300, -190, 600, 380, 26), { fill: '#fffaf2', lw: 5 }); stroke([[-300, -190], [0, 40], [300, -190]], 5);
  pill('New inquiry', 0, 110, 40, '#ffd6ea'); shape(ell(200, -110, 40, 40, 20), { fill: '#ff9fc4', lw: 4 }); text('♥', 200, -108, { font: F(40), fill: '#fff' }); pop(); }
function journeyCard(t, s, path = 0) { if (s <= 0) return; push(); translate(AX, AY); scale(s);
  shape(rr(-390, -230, 780, 460, 34), { fill: '#fffaf2', lw: 5, shade: () => fillOnly(rect(-400, -240, 800, 100), '#e6dcff', { boil: .2 }) });
  text('One place for the whole journey', 0, -186, { font: F(40), fill: '#7a5040' });
  const xs = [-270, -135, 0, 135, 270]; for (let i = 0; i < 4; i++) { const u = clamp(path * 4 - i); if (u > 0) stroke([[xs[i] + 30, 20], [lerp(xs[i] + 30, xs[i + 1] - 30, u), 20]], 6, { line: '#ff9fc4' }); }
  xs.forEach((x, i) => shape(ell(x, 20, 30, 30, 20), { fill: ['#bfeedd', '#bfe6ff', '#e6dcff', '#fff1b8', '#ffc2d9'][i], lw: 4 }));
  text('first inquiry', -200, 110, { font: F(34), fill: '#7a5040' }); text('final payment', 200, 110, { font: F(34), fill: '#7a5040' });
  pop(); }
function clientPortal(t, { proof = 0, pins = 0, ok = 0 } = {}) {     // the client's branded portal: a wooden arch — pointedly not glowing
  const w = 440, h = 300; push(); translate(AX, 540);
  shape([...arc(0, -h / 2 + w / 2 - 60, w / 2 + 40, w / 2 + 40, Math.PI, TAU, 30), [w / 2 + 40, h / 2], [-w / 2 - 40, h / 2]], { fill: '#e8b898', lw: 5 });
  shape([...arc(0, -h / 2 + w / 2 - 60, w / 2, w / 2, Math.PI, TAU, 30), [w / 2, h / 2], [-w / 2, h / 2]], { fill: '#fffaf2', lw: 4 });
  if (proof > 0) { g.save(); g.globalAlpha = clamp(proof); img(PROOF, -w / 2 + 14, -h / 2 - 30, w - 28, (w - 28) * 792 / 944); g.restore(); }
  for (let i = 0; i < 2; i++) { const s = clamp(pins * 2 - i); if (s <= 0) continue; const [px, py] = [[-50, -120], [-130, 40]][i]; push(); translate(px, py); scale(back(s, 2)); shape(ell(0, 0, 28, 28, 20), { fill: '#ff86bf', lw: 4 }); text(String(i + 1), 0, 2, { font: F(30), fill: '#fff' }); pop(); }
  pop(); pill('Fernhill Coffee Co. · client portal', AX, 735, 32, '#fff1b8');
  if (ok > 0) stampK('APPROVED', AX + 90, 600, back(clamp(ok), 2.2), -.12);
}
function taskBoard(t, toT, team, conn) {
  push(); translate(AX, AY);
  shape(rr(-390, -240, 780, 480, 30), { fill: '#fffaf2', lw: 5, shade: () => fillOnly(rect(-400, -250, 800, 84), '#d2e8ff', { boil: .2 }) });
  text('Feedback → tasks', 0, -204, { font: F(40), fill: '#7a5040' });
  ['Proof', 'To do', 'Done'].forEach((c, i) => { text(c, -240 + i * 240, -128, { font: F(32), fill: '#a07a6a' }); if (i) stroke([[-360 + i * 240, -160], [-360 + i * 240, 200]], 3, { line: '#eadfd8' }); });
  push(); translate(-240, -10); shape(rr(-104, -84, 208, 168, 12), { fill: '#fff', lw: 4 }); img(PROOF, -96, -76, 192, 152); pop();
  const pins = [[-270, -50], [-200, 40]]; pins.forEach(([x, y], i) => { shape(ell(x, y, 20, 20, 16), { fill: '#ff86bf', lw: 4 }); text(String(i + 1), x, y + 2, { font: F(22), fill: '#fff' }); });
  [0, 1].forEach(i => { const a = eo(toT), b = eio(team); if (a <= 0) return;
    const x = lerp(lerp(pins[i][0], 0, a), 240, b), y = lerp(lerp(pins[i][1], -40 + i * 100, a), -40 + i * 100, b) - Math.sin(b * Math.PI) * 50;
    push(); translate(x, y); scale(lerp(.4, 1, a)); shape(rr(-100, -36, 200, 72, 20), { fill: ['#ffc2d9', '#bfeedd'][i], lw: 4 }); text(['Price per cup', 'Hero copy'][i], 0, 2, { font: F(30), fill: '#7a5040' }); pop(); });
  if (conn > 0) [0, 1].forEach(i => { const a = [240 - 100, -40 + i * 100], b = pins[i], pts = []; for (let k = 0; k <= 24 * eo(conn); k++) { const u = k / 24; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * 130]); } if (pts.length > 1) stroke(pts, 5, { line: '#e85a9c' }); });
  for (let i = 0; i < 3; i++) { const x = lerp(-60 + i * 80, 120 + i * 80, eio(team)), y = 190 - Math.abs(Math.sin(q(t) * 10 + i)) * 12 * (team > 0 && team < 1 ? 1 : 0);   // the team
    push(); translate(x, y); shape(ell(0, 0, 32, 30, 20), { fill: ['#bfe6ff', '#fff1b8', '#e6dcff'][i], lw: 4 }); kEye(-10, -4, 7, 9, { look: [.5, 0] }); kEye(10, -4, 7, 9, { look: [.5, 0] }); pop(); }
  pop();
}
function bigButton(t, dn, chute) {   // the extra request floats down on a parachute, then sits in zone A
  const y = lerp(-300, 600, dn); push(); translate(AX, y); scale(.72);
  if (chute > 0) { stroke([[-200, -170], [-60, -420]], 4); stroke([[200, -170], [60, -420]], 4); shape([...arc(0, -420, 260, 160, Math.PI, TAU, 26), [260, -420], [-260, -420]], { fill: '#ffc2d9', lw: 5, alpha: chute }); }
  shape(rr(-260, -180, 520, 320, 60), { fill: '#e6dcff', lw: 5 });
  shape(rr(-200, -60, 400, 130, 65), { fill: '#ff86bf', lw: 5 }); text('Subscribe', 0, 6, { font: '400 60px "Bagel Fat One"', fill: '#fff' });
  text('+ one more thing', 0, -118, { font: F(40), fill: '#7a5040' });
  pop();
}
function changeOrder(t, u, signed, st) {
  if (u <= 0) return; push(); translate(AX, AY); scale(1, eo(u));
  card(0, 0, 780, 470, 'Change order · CO-03', [], { head: '#ffc2d9' });
  ['Subscribe button', 'under each bag'].forEach((l, i) => text(l, -306, -84 + i * 64, { font: F(52), fill: '#7a5040', align: 'left' }));
  text('Requested by Hannah', -306, 54, { font: F(36, 700), fill: '#a07a6a', align: 'left' });
  stroke([[-306, 170], [80, 170]], 4);
  if (signed > 0) { const n = Math.floor(signed * 14), pts = []; for (let i = 0; i <= n; i++) pts.push([-290 + i * 24, 146 + Math.sin(i * 2.1) * 20]); if (pts.length > 1) stroke(spline(pts, false, 4), 6, { line: '#8fb8f0' }); }
  pop(); stampK('DOCUMENTED', AX + 150, AY + 150, st, -.1, '#a993d9');
}
const CHIPS = [['Projects', 168], ['Tasks', 169], ['Team', 170], ['Calendar', 171], ['Communication', 172], ['Invoices', 173], ['Payments', 175]];
function board(t) {
  push(); translate(AX, AY); shape(rr(-390, -240, 780, 480, 34), { fill: '#f3ecff', lw: 5, shade: () => fillOnly(rect(-400, -250, 800, 90), '#e2d6ff', { boil: .2 }) });
  text('Nodstage · one workspace', 0, -205, { font: F(40), fill: '#7a5040' }); pop();
  const pos = [[-170, -100], [160, -100], [-170, -10], [160, -10], [-110, 80], [210, 80], [60, 170]].map(([a, b]) => [AX + a, AY + b]);
  const hub = [AX - 270, AY + 170], lk = seg(t, wAt(178) - .1, wAt(178) + .5);
  if (lk > 0) pos.forEach(p => stroke([hub, [lerp(hub[0], p[0], eo(lk)), lerp(hub[1], p[1], eo(lk))]], 5, { line: '#ff86bf' }));
  CHIPS.forEach(([n, wi], i) => { const s = popS(t, wAt(wi) - .05, .25); if (s <= 0) return; push(); translate(pos[i][0], pos[i][1]); scale(s); g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(36); const w = g.measureText(n).width + 44;
    shape(rr(-w / 2, -34, w, 68, 34), { fill: ['#ffc2d9', '#bfe6ff', '#fff1b8', '#bfeedd', '#ffe1cc', '#e6dcff', '#ffc2d9'][i], lw: 4 }); text(n, 0, 2, { font: F(36), fill: '#7a5040' }); pop(); });
  if (lk > 0) { push(); translate(hub[0], hub[1]); scale(eo(lk)); shape(ell(0, 0, 40, 40, 24), { fill: '#ff86bf', lw: 5 }); stroke([[-20, 0], [20, 0]], 5, { line: '#fff' }); stroke([[0, -20], [0, 20]], 5, { line: '#fff' }); pop(); }
}

// —— zone B: the two leads, always in the same places ——
const blinkD = t => Math.floor(t * 12) % 41 < 2, blinkN = t => Math.floor(t * 12 + 17) % 53 < 2;
function Dv(t, o = {}) { const m = talk('OWNER', t), other = talk('NOD', t).talking, tq = q(t);
  const k = 1, bounce = m.talking ? -Math.abs(Math.sin(tq * 7)) * 8 : 0;
  return { x: DEVX, y: FLOOR + bounce, s: DS * k, t: tq, nerv: .15, look: [.6, 0], blink: blinkD(t), brow: .5, mouth: { o: m.o, sm: .4 }, tilt: m.talking ? (m.o - .3) * .06 : other ? .07 * Math.sin(tq * 1.3) + .04 : 0, ...o }; }
function Nd(t, o = {}) { const m = talk('NOD', t), other = talk('OWNER', t).talking, tq = q(t);
  const k = 1;
  return { x: NODX, y: NODY - (m.talking ? Math.abs(Math.sin(tq * 6)) * 8 : 0), s: NS * k, noShadow: true, t: tq, look: [-.6, 0], blink: blinkN(t), sleepy: true, mouth: { o: m.o, sm: .3 }, tilt: m.talking ? (m.o - .3) * .04 : other ? -.05 : 0,
    hands: [[-150, -300], [170, -300]], ...o }; }
const armsUp = { armL: { h: [-90, -170] }, armR: { h: [90, -170] } }, armsWide = { armL: { h: [-150, 20] }, armR: { h: [150, 20] } };
const holdHead = { armL: { h: [-70, -170], bend: -30 }, armR: { h: [70, -170], bend: 30 } };
const pointA = { armR: { h: [110, -200] } };
const nodPoint = { hands: [[-150, -300], [190, -600]], point: [0, 1] };
const hug = { armL: { h: [60, 40], bend: -30 }, armR: { h: [-60, 40], bend: 30 } };
function beanAt(t, o = {}) { bean({ x: 485, y: FLOOR, s: .42, t: q(t), look: [0, -.6], ...o }); }
function fgStrip(w, t) {   // a thin strip of grass and flowers in front of the bodies at the very bottom (no feet, no floor)
  const c = w === 'home' ? ['#f3c9a8', '#e8b898'] : [PAL[w].g[1], PAL[w].g[2]];
  shape(spline([[-60, 1870], [180, 1846], [420, 1866], [700, 1842], [960, 1862], [1140, 1850], [1140, 1990], [-60, 1990]]), { fill: c[0], lw: 4, line: '#b9a89a' });
  for (let i = 0; i < 12; i++) { const x = 30 + i * 90 + hash(i) * 30, y = 1880 + hash(i + 3) * 20; if (w === 'home') continue; stroke(spline([[x - 12, y], [x - 5, y - 22], [x, y - 3], [x + 7, y - 26], [x + 12, y]], false), 4, { line: c[1] }); }
  for (let i = 0; i < 6; i++) { const x = 80 + i * 180 + hash(i * 7) * 40, y = 1890; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; fillOnly(ell(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 8, 8, 10), ['#fff7c2', '#ffd6e6', '#e6dcff'][i % 3], { boil: .2 }); } }
}
function zoneA(fn, t) { push(); translate(540, 520); scale(1.15); translate(-AX, -AY); fn(t); pop(); }
function two(w, t, propFn, dO = {}, nO = {}, beanO = null) {   // the locked medium two-shot (Bean stays out of it)
  reset(); world(w, t); if (propFn) zoneA(propFn, t);
  dev(Dv(t, dO)); nod(Nd(t, nO)); fgStrip(w, t);
}
function close(w, who, t, o = {}) {   // head and shoulders filling y ~450–1500; plain soft background
  reset(); screenRect(PAL[w].flat); SUBY = 330;
  for (let i = 0; i < 5; i++) fillOnly(ell(hash(i * 3) * 1080, 300 + hash(i * 7) * 1300, 300, 90, 30), 'rgba(255,255,255,.25)', { boil: .1 });
  if (who === 'dev') dev(Dv(t, { x: 540, y: 2280, s: 2.2, ...o })); else nod(Nd(t, { x: 540, y: 2150, s: 2.3, hands: [[-150, -300], [170, -300]], ...o }));
}
function stackOfFive(x, y, fall, t) {     // Dev hugs the five old places — small, at his chest, below his face
  const items = [register, phone, typewriter, cabinet, mailbox];
  items.forEach((f, i) => { const u = clamp(fall * 1.8 - i * .12), dx = (i - 2) * 70 * u, yy = y - i * 44 + u * (i * 44 + 420), rot = u * (i % 2 ? .7 : -.6);
    push(); translate(x + dx, yy); rotate(rot + (i - 2) * .05); scale(.38); f(t); pop(); });
}

// ———————————————— shots ————————————————
const T = { portal: 23.85, title: 24.05, wipe1: 24.95, wipe2: 35.82, wipe3: 44.33, wipe4: 51.68, wipe5: 60.72, drop: 70.0, end: 71.2 };
const WIPES = [[T.wipe1, .32], [T.wipe2, .3], [T.wipe3, .3], [T.wipe4, .3], [T.wipe5, .3], [T.end, .32]];
const named = [wAt(12), wAt(15), wAt(18), wAt(20), wAt(25)];
const SH = []; const shot = (a, b, f) => SH.push([a, b, f]);
// home
shot(0, 13.54, t => two('home', t, t => shelf(t, { named, shake: t > 12.0 ? 5 : 0 }),
  t < 1.84 ? { ...armsUp, look: [.4, -.2], mouth: { o: talk('OWNER', t).o, sm: .9 } } : t < 2.78 ? { look: [.9, 0], brow: 0, mouth: { o: talk('OWNER', t).o * .7, sm: -.2 } }
    : t < 9.06 ? { look: [.2, -.9], brow: .7, nerv: .5 } : t < 10.08 ? { ...holdHead, nerv: 1, brow: 1, wide: 1.1, sweat: t } : t < 12 ? { look: [.8, 0], nerv: .4 } : { ...pointA, look: [.2, -.9], nerv: .8 },
  t > 10.08 && t < 12 ? { look: [-.7, 0], sleepy: true } : { look: [-.5, -.4] }));
shot(13.54, 14.38, t => close('home', 'dev', t, { nerv: 1.3, brow: 1, wide: 1.2, mouth: { o: talk('OWNER', t).o * 1.3, worry: 1 } }));
shot(14.38, 15.44, t => two('home', 14.4, t => shelf(14.4), { t: 14.4, nerv: 0, brow: 1, look: [.9, 0], mouth: { o: 0, worry: 1 } }, { t: 14.4, look: [-.9, 0] }));   // dead air
shot(15.44, 23.1, t => two('home', t, t => journeyCard(t, popS(t, 15.44, .35), seg(t, wAt(56), wAt(61) + .3)),
  t < 18.96 ? { look: [.8, -.2], brow: .3 } : { ...armsWide, look: [.8, -.2], brow: .2, mouth: { o: talk('OWNER', t).o, sm: .6 } },
  t < 18.96 ? (t > wAt(48) - .2 ? { ...nodPoint, look: [-.3, -.3] } : { look: [-.4, 0] }) : { look: [-.7, 0] }));
shot(23.1, T.wipe1, t => {      // Nod draws a circle in the air; the Nodstage portal opens in zone A
  reset(); world('home', t);
  const op = t < T.portal ? 0 : back(clamp((t - T.portal) / .32), 1.6), rush = ei(seg(t, 24.55, T.wipe1));
  if (t < T.portal + .1) zoneA(t => journeyCard(t, 1 - ei(seg(t, T.portal - .25, T.portal + .1)), 1), t);
  portal(540, 560, 200 * (1 + rush * 6), t, { open: op, sx: .85 }); if (op > 0) screenRect('rgba(255,160,205,.06)');
  const dr = seg(t, 23.4, 23.85), ang = dr * TAU;
  dev(Dv(t, { nerv: .8, look: [.3, -.9], brow: 1, wide: 1.15, ...holdHead }));
  nod(Nd(t, { look: [-.4, -.8], sleepy: false, hands: [[-190, -380], dr > 0 && dr < 1 ? [20 + Math.cos(ang) * 80, -660 + Math.sin(ang) * 40] : [190, -600]], point: [0, 1] }));
  if (t > T.title) titleArt(t);
});
// world 1: the lead
const i0 = wAt(73), i1 = wAt(77), i2 = wAt(80), i3 = wAt(82);
function leadProp(t) {
  if (t < i0 - .1) return envelope(t, popS(t, 25.2, .35));
  const c = t < i1 - .1 ? 0 : t < i2 - .1 ? 1 : 2, C = [['New lead', ['Fernhill Coffee Co.', 'Hannah Brooks'], '#bfeedd'], ['Discovery call', ['Thursday · 10:00', 'with Hannah'], '#ffe1cc'], ['Proposal', ['Website refresh', 'sent to Hannah ✓'], '#e6dcff']][c];
  card(AX, AY, 780, 400, C[0], C[1], { head: C[2], s: popS(t, [i0, i1, i2][c] - .1, .35) });
  if (t > i3) stampK('Followed up ✓', AX + 120, AY + 170, popS(t, i3), -.06, '#7cc79a');
}
shot(T.wipe1, 31.1, t => two('lead', t, leadProp, { look: [.3, -.9], happy: t > i3 + .3, mouth: { o: talk('OWNER', t).o, sm: .8 } }, { ...nodPoint, look: [-.3, -.7] }, { hop: t > i3, happy: t > i3, look: [0, -.8] }));
shot(31.1, 32.42, t => close('lead', 'dev', t, { look: [.4, -.3], brow: .1, mouth: { o: talk('OWNER', t).o, sm: .8 } }));
shot(32.42, T.wipe2, t => two('lead', t, t => { const won = popS(t, wAt(91)), mo = seg(t, wAt(94) - .2, wAt(94) + .35);
    if (mo < .5) { card(AX, AY, 780, 400, 'New lead', ['Fernhill Coffee Co.', 'Hannah Brooks'], { head: '#bfeedd', s: 1 - mo * 2 }); stampK('WON!', AX + 170, AY + 120, won * (1 - mo * 2), -.15, '#e85a9c'); }
    else card(AX, AY, 780, 440, 'Project · Website refresh', ['☐ Moodboard', '☐ Homepage', '☐ Shop page'], { head: '#fff1b8', s: back(seg(mo, .5, 1), 2) }); },
  { look: [.3, -.9], happy: t > wAt(94), mouth: { o: 0, sm: .9 } }, t > 34.18 ? { look: [-.5, 0] } : { look: [-.3, -.7] }, { armUp: t > wAt(91) && t < wAt(91) + .9, happy: t > wAt(91), look: [0, -.8] }));
// world 2: the client's branded portal
shot(T.wipe2, 44.33, t => two('portal', t, t => clientPortal(t, { proof: seg(t, wAt(99), wAt(99) + .3), pins: seg(t, wAt(114) - .1, wAt(114) + .6), ok: seg(t, wAt(116), wAt(116) + .25) }),
  t < 42.42 ? { look: [.3, -.9], happy: t > wAt(116) + .3, mouth: { o: 0, sm: .8 } } : { look: [.8, -.2], brow: .9, nerv: .3, mouth: { o: talk('OWNER', t).o, worry: 1 } },
  t < 42.42 ? { ...nodPoint, look: [-.3, -.7] } : { look: [-.6, 0] }, t < 42.42 ? { armUp: t > wAt(116), happy: t > wAt(116) + .3, look: [0, -.8] } : null));
// world 3: feedback becomes tasks
shot(T.wipe3, 51.68, t => two('tasks', t, t => taskBoard(t, seg(t, wAt(127), wAt(129) + .3), seg(t, wAt(131), wAt(134) + .5), seg(t, wAt(139) - .2, wAt(143))),
  { look: [.3, -.9], happy: t > 50.0, mouth: { o: 0, sm: .8 } }, { ...nodPoint, look: [-.3, -.7] }));
// world 4: more work than agreed
shot(T.wipe4, 54.66, t => { const dn = eo(seg(t, wAt(150) - .7, wAt(150) + .3));
  two('co', t, t => bigButton(t, dn, 1 - seg(t, wAt(150) + .3, wAt(150) + .8)),
    { look: [.3, -.9], nerv: .4 + dn, brow: .9, wide: 1 + .15 * dn, sweat: dn > .5 ? t : null, mouth: { o: talk('OWNER', t).o, worry: 1 } }, { look: [-.3, -.8] }, { happy: true, look: [0, -.8] }); });
shot(54.66, T.wipe5, t => { const un = seg(t, wAt(160) - .1, wAt(161) + .3), sign = seg(t, wAt(164), wAt(166)), st = popS(t, wAt(167) + .1), calm = seg(t, 57.5, 59.5);
  two('co', t, t => { if (un < .5) bigButton(t, 1, 0); else changeOrder(t, (un - .5) * 2, sign, st); },
    { look: [.3, -.9], nerv: lerp(1, 0, calm), brow: lerp(.9, .2, calm), sweat: t < 58 ? t : null, happy: t > 59.4, mouth: { o: 0, sm: lerp(-.2, .9, calm), worry: calm < .5 } },
    un > 0 ? { ...nodPoint, look: [-.3, -.7] } : { look: [-.3, -.7] }, { armUp: sign > 0 && sign < 1, happy: st > 0, look: [0, -.8] }); });
// home again: everything connected
shot(T.wipe5, 65.98, t => two('home', t, board, { look: [.3, -.9], happy: t > wAt(178), mouth: { o: 0, sm: .8 } }, { ...nodPoint, look: [-.3, -.8] }));
shot(65.98, 68.46, t => { two('home', t, board, { look: [.8, -.1], brow: .6, ...hug, mouth: { o: talk('OWNER', t).o, sm: .4 } }, { look: [-.7, 0] }); stackOfFive(DEVX, 1680, 0, t); });
shot(68.46, 69.3, t => { two('home', 68.5, board, { t: 68.5, look: [.9, 0], brow: .9, ...hug, mouth: { o: 0, worry: 1 } }, { t: 68.5, look: [-.9, 0] }); stackOfFive(DEVX, 1680, 0, 68.5); });   // dead air
shot(69.3, 69.94, t => close('home', 'nod', t, { look: [-.2, .1] }));
shot(69.94, T.end, t => { const f = seg(t, T.drop, T.drop + .45);
  two('home', t, board, { happy: t > T.drop + .35, brow: 0, mouth: { o: 0, sm: 1 }, nerv: 0, ...(f > 0 ? armsUp : hug) }, { look: [-.6, .3], happy: t > T.drop + .4, sleepy: t <= T.drop + .4 });
  stackOfFive(DEVX, 1680, f, t);
  if (t > T.drop + .35) for (let i = 0; i < 4; i++) sparkle(120 + i * 120, 960 + Math.sin(t * 6 + i) * 20, 18); });

// ———————————————— title, end card, wipes, tags, subtitles ————————————————
function titleArt(t) { const s = q(t) < T.title + .25 ? back(seg(q(t), T.title, T.title + .25), 2.4) : 1;
  reset(); push(); translate(540, 320); scale(s * .9); rotate(-.04);
  text('One Client', 8, 10, { font: '400 132px "Bagel Fat One"', fill: '#ff86bf', outlineW: 16, outlineCol: INK });
  text('One Client', 0, 0, { font: '400 132px "Bagel Fat One"', fill: '#fffaf2', outlineW: 16, outlineCol: INK });
  for (let i = 0; i < 4; i++) sparkle([-400, 410, -300, 320][i], [-90, -80, 96, 90][i], 16 + 8 * Math.sin(t * 5 + i * 1.7)); pop(); }
function endCard(t) {
  reset(); sky(['#fde6f1', '#f6e4fa', '#ece6ff', '#e6f0ff']); cloud(150, 160, .6, t); cloud(950, 210, .5, t); ground(['#d7f0dc', '#c6ead0', '#9fd8ab'], t);
  reset(); portal(540, 560, 230, t * .6, { open: spring(t - T.end, 7, .45), sx: 1 });
  reset(); screenRect('rgba(253,236,246,.45)');
  const b = ss(seg(t, wAt(197) - .1, wAt(197) + .3)); if (b > 0) { g.globalAlpha = b; reset(); text('Run your creative studio', 540, 330, { font: '400 58px "Bagel Fat One"', fill: '#fffaf2', outlineW: 12, outlineCol: INK }); text('with Nodstage', 540, 410, { font: '400 58px "Bagel Fat One"', fill: '#ff86bf', outlineW: 12, outlineCol: INK }); g.globalAlpha = 1; }
  const a = ss(seg(t, T.end + .2, T.end + .6));
  reset(); g.globalAlpha = a; push(); translate(540, 580); scale(back(seg(q(t), T.end + .2, T.end + .5), 2));
  shape(rr(-300, -90, 600, 180, 90), { fill: '#ffffff', lw: 5 }); img(LOGO, -230, -55, 460, 109); pop(); g.globalAlpha = 1;
  const c = ss(seg(t, wAt(201), wAt(201) + .4)); if (c > 0) { g.globalAlpha = c; reset(); pill('nodstage.com', 540, 730, 44, '#fffaf2'); g.globalAlpha = 1; }
  const k = t - T.end;
  reset(); dev(Dv(t, { happy: k > 4.8, brow: 0, mouth: { o: 0, sm: 1 }, nerv: 0, look: [.6, -.4] }));
  reset(); nod(Nd(t, { look: [-.5, -.4], sleepy: false, happy: k > 5 }));
  reset(); fgStrip('lead', t);
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
function wrapSub(str, maxW, size) { g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(size); const ws = str.split(' '), out = []; let cur = '';
  for (const w of ws) { const s = cur ? cur + ' ' + w : w; if (g.measureText(s).width > maxW && cur) { out.push(cur); cur = w; } else cur = s; } out.push(cur); return out; }
function subs(t) { const s = SUBS.find(x => t >= x.t0 && t < x.t1); if (!s) return;
  const [nm, col] = WHO[s.who]; g.setTransform(1, 0, 0, 1, 0, 0); g.font = F(26); const nw = g.measureText(nm).width + 32;
  let size = 40, lines = wrapSub(s.text, 900 - nw, size); if (lines.length > 1) { size = 34; lines = wrapSub(s.text, 900 - nw, size); }
  if (lines.length > 2) lines = [lines[0], lines.slice(1).join(' ')];
  g.font = F(size); const tw = Math.max(...lines.map(l => g.measureText(l).width)), W_ = nw + 16 + tw + 44, H_ = lines.length > 1 ? 86 : 64;
  const cy = SUBY, x0 = 540 - W_ / 2, p = back(seg(t, s.t0, s.t0 + .14), 2);
  reset(); push(); translate(540, cy); scale(p, p); shape(rr(-W_ / 2, -H_ / 2, W_, H_, H_ / 2), { fill: 'rgba(255,250,244,.94)', lw: 4 }); pop();
  reset(); push(); translate(x0 + 22 + nw / 2, cy - (lines.length > 1 ? 18 : 0)); shape(rr(-nw / 2, -19, nw, 38, 19), { fill: col, lw: 3 }); text(nm, 0, 2, { font: F(26), fill: '#7a5040' }); pop();
  reset(); lines.forEach((l, k) => text(l, x0 + 22 + nw + 16, cy + (lines.length > 1 ? (k ? 20 : -18) : 2), { font: F(size), fill: '#7a5040', align: 'left' })); }

function render(t) {
  frame(t); screenRect('#fff8f2'); SUBY = 852;
  if (t >= T.end) endCard(t); else { const s = SH.find(([a, b]) => t >= a && t < b) || SH[SH.length - 1]; s[2](t); }
  paper(); wipe(t); subs(t);
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
