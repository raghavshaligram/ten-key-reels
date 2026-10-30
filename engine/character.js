// "Tara": an original illustrated presenter drawn in SVG, posed by code. No video, no AI generation.
// Usage in a scene:
//   <svg id="tara" class="el" viewBox="0 0 1000 1000" width="1000" height="1000" style="left:40px;top:1150px"></svg>
//   const tara = Tara("tara");                         // builds the drawing
//   tara.render(t, POSES, TL.amp)                      // POSES = [[time, "wave"], [time, "point"], ...]; amp = mouth (lip sync)
// Poses: rest, wave, point, present, think, thumbs, oops, cheer. Arms use 2-bone IK toward a wrist target.
const TARA_POSES = {
  rest:    { L: { x: 250, y: 1030, h: "fist", r: 180 }, R: { x: 750, y: 1030, h: "fist", r: 180 }, brow: 0, tilt: 0, look: [0, 0], mood: 1 },
  wave:    { L: { x: 250, y: 1030, h: "fist", r: 180 }, R: { x: 830, y: 340, h: "open", r: 14, wave: 1 }, brow: 6, tilt: -4, look: [4, 0], mood: 1.2 },
  point:   { L: { x: 250, y: 1030, h: "fist", r: 180 }, R: { x: 780, y: 380, h: "point", r: -8 }, brow: 10, tilt: -5, look: [6, -10], mood: 1 },
  present: { L: { x: 150, y: 590, h: "open", r: -28 }, R: { x: 850, y: 590, h: "open", r: 28 }, brow: 12, tilt: 3, look: [0, -2], mood: 1.1 },
  think:   { L: { x: 455, y: 610, h: "point", r: 8, elbow: "down" }, R: { x: 750, y: 1030, h: "fist", r: 180 }, brow: -4, browTilt: 8, tilt: 6, look: [-10, -12], mood: 0.2 },
  thumbs:  { L: { x: 250, y: 1030, h: "fist", r: 180 }, R: { x: 800, y: 560, h: "thumb", r: 0 }, brow: 8, tilt: -3, look: [0, 0], mood: 1.4 },
  oops:    { L: { x: 482, y: 505, h: "open", r: 4, elbow: "down" }, R: { x: 750, y: 1030, h: "fist", r: 180 }, brow: 14, browTilt: -6, tilt: 4, look: [8, 0], mood: 0, cover: 1 },
  cheer:   { L: { x: 170, y: 330, h: "fist", r: -10 }, R: { x: 830, y: 330, h: "fist", r: 10 }, brow: 12, tilt: 0, look: [0, -6], mood: 1.5 },
};
function Tara(id, opt = {}) {
  const C = Object.assign({ skin: "#EDB892", skinS: "#D99A70", hair: "#2A1D19", hairS: "#1C1210", top: "#F6EBDD", topS: "#E6D5C1",
    knit: "#2F7A4F", knitS: "#245F3D", knitH: "#3C9160", lip: "#B0473C", mouthIn: "#6E2622", cheek: "#F08C78", ink: "#1E1A17" }, opt);
  const NS = "http://www.w3.org/2000/svg", root = document.getElementById(id);
  const el = (tag, at = {}, parent = root) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); parent.appendChild(e); return e; };
  root.innerHTML = "";
  // ground shadow + body
  const body = el("g");
  el("path", { d: "M330 600 Q330 470 380 420 L620 420 Q670 470 670 600 Z", fill: C.hairS }, body);             // back hair
  const torso = el("g", {}, body);
  el("path", { d: "M215 1010 L222 760 Q230 640 340 610 L430 590 L570 590 L660 610 Q770 640 778 760 L785 1010 Z", fill: C.knit }, torso);
  el("path", { d: "M430 592 L500 760 L570 592 Z", fill: C.top }, torso);                                         // tee
  el("path", { d: "M430 592 L500 760 L500 1010 L380 1010 L408 640 Z", fill: C.knitS, opacity: .35 }, torso);      // left panel shade
  el("path", { d: "M420 590 L500 800 L500 1010", fill: "none", stroke: C.knitH, "stroke-width": 10, opacity: .55 }, torso);
  el("path", { d: "M580 590 L500 800", fill: "none", stroke: C.knitH, "stroke-width": 10, opacity: .55 }, torso);
  for (const y of [850, 930]) el("circle", { cx: 518, cy: y, r: 9, fill: C.top, opacity: .9 }, torso);           // buttons
  el("path", { d: "M462 470 L538 470 L540 600 Q500 630 460 600 Z", fill: C.skin }, body);                         // neck
  el("path", { d: "M462 470 L538 470 L538 530 Q500 560 462 530 Z", fill: C.skinS }, body);
  // head
  const head = el("g", {}, body);
  el("ellipse", { cx: 372, cy: 345, rx: 22, ry: 32, fill: C.skinS }, head); el("ellipse", { cx: 628, cy: 345, rx: 22, ry: 32, fill: C.skinS }, head);
  el("ellipse", { cx: 500, cy: 330, rx: 128, ry: 150, fill: C.skin }, head);
  el("circle", { cx: 376, cy: 380, r: 8, fill: "#E2B04A" }, head); el("circle", { cx: 624, cy: 380, r: 8, fill: "#E2B04A" }, head);
  const cheeks = [el("ellipse", { cx: 430, cy: 392, rx: 30, ry: 17, fill: C.cheek, opacity: .32 }, head), el("ellipse", { cx: 570, cy: 392, rx: 30, ry: 17, fill: C.cheek, opacity: .32 }, head)];
  const eyes = el("g", {}, head), eyeL = el("g", {}, eyes), eyeR = el("g", {}, eyes);
  for (const [g, x] of [[eyeL, 450], [eyeR, 550]]) { el("ellipse", { cx: x, cy: 335, rx: 16, ry: 21, fill: C.ink }, g); el("circle", { cx: x + 6, cy: 327, r: 6, fill: "#fff" }, g); el("circle", { cx: x - 5, cy: 343, r: 2.5, fill: "#fff", opacity: .7 }, g); }
  const browL = el("path", { fill: "none", stroke: C.hair, "stroke-width": 10, "stroke-linecap": "round" }, head);
  const browR = el("path", { fill: "none", stroke: C.hair, "stroke-width": 10, "stroke-linecap": "round" }, head);
  el("path", { d: "M502 352 Q492 378 504 384", fill: "none", stroke: C.skinS, "stroke-width": 7, "stroke-linecap": "round" }, head);
  const mouth = el("path", { fill: C.mouthIn, stroke: C.lip, "stroke-width": 6, "stroke-linejoin": "round" }, head);
  const teeth = el("path", { fill: "#fff" }, head);
  // hair on top: side-parted bob
  el("path", { d: "M362 360 Q340 210 440 172 Q520 140 590 170 Q676 210 652 350 Q640 280 600 236 Q560 270 470 262 Q410 258 380 300 Q368 330 362 360 Z", fill: C.hair }, head);
  el("path", { d: "M362 330 Q350 440 380 540 Q395 500 392 420 Z", fill: C.hair }, head);
  el("path", { d: "M640 320 Q656 440 622 540 Q610 500 612 420 Z", fill: C.hair }, head);
  el("path", { d: "M450 190 Q520 170 590 196", fill: "none", stroke: "#4A3530", "stroke-width": 8, "stroke-linecap": "round", opacity: .7 }, head);
  // arms (drawn last so hands can go in front of the face)
  const arms = {};
  for (const side of ["L", "R"]) {
    const g = el("g"); const sleeve = el("polyline", { fill: "none", stroke: C.knit, "stroke-width": 78, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    const crease = el("polyline", { fill: "none", stroke: C.knitS, "stroke-width": 14, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: .55 }, g);
    const cuff = el("circle", { r: 36, fill: C.knitS }, g); const hand = el("g", {}, g);
    arms[side] = { g, sleeve, crease, cuff, hand, shape: null };
  }
  const HANDS = {
    open: `<rect x="-36" y="-84" width="72" height="88" rx="30" fill="${C.skin}"/>
      <rect x="-34" y="-136" width="17" height="70" rx="8.5" fill="${C.skin}"/><rect x="-15" y="-148" width="17" height="80" rx="8.5" fill="${C.skin}"/>
      <rect x="4" y="-144" width="17" height="76" rx="8.5" fill="${C.skin}"/><rect x="22" y="-128" width="16" height="62" rx="8" fill="${C.skin}"/>
      <rect x="-70" y="-62" width="20" height="58" rx="10" fill="${C.skin}" transform="rotate(-40 -60 -30)"/>
      <path d="M-22 -40 Q0 -28 22 -40" fill="none" stroke="${C.skinS}" stroke-width="5" stroke-linecap="round"/>`,
    point: `<rect x="-38" y="-80" width="76" height="84" rx="32" fill="${C.skin}"/>
      <rect x="-30" y="-158" width="20" height="96" rx="10" fill="${C.skin}"/>
      <path d="M-6 -64 L30 -64 M-6 -40 L30 -40" stroke="${C.skinS}" stroke-width="5" stroke-linecap="round"/>
      <rect x="-44" y="-50" width="44" height="22" rx="11" fill="${C.skinS}" opacity=".9"/>`,
    thumb: `<rect x="-38" y="-78" width="80" height="82" rx="30" fill="${C.skin}"/>
      <rect x="-36" y="-140" width="24" height="84" rx="12" fill="${C.skin}"/>
      <path d="M-4 -58 L38 -58 M-4 -36 L38 -36 M-4 -14 L34 -14" stroke="${C.skinS}" stroke-width="5" stroke-linecap="round"/>`,
    fist: `<rect x="-38" y="-78" width="76" height="82" rx="32" fill="${C.skin}"/>
      <path d="M-22 -58 L22 -58 M-22 -34 L22 -34" stroke="${C.skinS}" stroke-width="5" stroke-linecap="round"/>`,
  };
  const SH = { L: [300, 660], R: [700, 660] }, A = 205, B = 190;
  function ik(side, tx, ty, elbow) {
    const [sx, sy] = SH[side]; let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(A - B) + 2, Math.min(A + B - 2, d)); const phi = Math.atan2(dy, dx);
    const al = Math.acos((A * A + d * d - B * B) / (2 * A * d)); const wx = sx + Math.cos(phi) * d, wy = sy + Math.sin(phi) * d;
    const e1 = [sx + A * Math.cos(phi + al), sy + A * Math.sin(phi + al)], e2 = [sx + A * Math.cos(phi - al), sy + A * Math.sin(phi - al)];
    const out = elbow === "down" ? (e1[1] > e2[1] ? e1 : e2) : side === "L" ? (e1[0] < e2[0] ? e1 : e2) : (e1[0] > e2[0] ? e1 : e2);   // elbow points outward
    return { s: [sx, sy], e: out, w: [wx, wy] };
  }
  const lerp = (a, b, k) => a + (b - a) * k, cl = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => { x = cl(x); return 1 - Math.pow(1 - x, 3); };
  const back = (x) => { x = cl(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  function poseAt(t, sched) {
    let i = 0; for (let k = 0; k < sched.length; k++) if (t >= sched[k][0]) i = k;
    const cur = TARA_POSES[sched[i][1]], prev = TARA_POSES[i > 0 ? sched[i - 1][1] : sched[0][1]];
    const t0 = sched[i][0], k = i > 0 ? back((t - t0) / .42) : 1, lt = t - t0;
    return { cur, prev, k, lt, changed: t - t0 };
  }
  function render(t, sched, amp) {
    const { cur, prev, k, lt, changed } = poseAt(t, sched);
    const m = (key, d = 0) => lerp(prev[key] ?? d, cur[key] ?? d, cl(k));
    // whole body: breathe + a small hop on each pose change
    const hop = changed < .5 ? -Math.sin(cl(changed / .5) * Math.PI) * 16 : 0;
    body.setAttribute("transform", `translate(0 ${hop + Math.sin(t * 2.1) * 4})`);
    torso.setAttribute("transform", `translate(500 1000) scale(1 ${1 + Math.sin(t * 2.1) * .006}) translate(-500 -1000)`);
    const tilt = m("tilt") + Math.sin(t * 1.3) * 1.4;
    head.setAttribute("transform", `rotate(${tilt} 500 470) translate(0 ${Math.sin(t * 2.1 + .6) * 3})`);
    const [lx, ly] = [lerp(prev.look[0], cur.look[0], cl(k)), lerp(prev.look[1], cur.look[1], cl(k))];
    const bk = (t + .7) % 3.4, blink = bk < .12 ? Math.abs(bk - .06) / .06 : 1;
    for (const [g, x] of [[eyeL, 450], [eyeR, 550]]) g.setAttribute("transform", `translate(${lx} ${ly * .5}) translate(${x} 335) scale(1 ${Math.max(.08, blink)}) translate(${-x} -335)`);
    const br = m("brow"), bt = m("browTilt");
    browL.setAttribute("d", `M424 ${298 - br + bt} Q450 ${284 - br} 476 ${294 - br - bt * .3}`);
    browR.setAttribute("d", `M524 ${294 - br + bt * .3} Q550 ${284 - br} 576 ${298 - br - bt}`);
    // mouth: mood bends the smile, amp opens it (lip sync from the voice)
    const fi = Math.max(0, Math.floor(t * 30)), a = amp && amp.length ? (amp[Math.min(fi, amp.length - 1)] || 0) : 0;
    const open = cur.cover ? 0 : Math.min(1, a * 1.25) * 30, mood = m("mood", 1), w = 34 + mood * 4;
    const y0 = 418, cy = y0 + 6 + mood * 9;
    mouth.setAttribute("d", `M${500 - w} ${y0} Q500 ${y0 + 4 - mood * 2} ${500 + w} ${y0} Q500 ${cy + open * 1.25} ${500 - w} ${y0} Z`);
    mouth.setAttribute("fill", open > 3 ? C.mouthIn : C.lip);
    teeth.setAttribute("d", open > 6 ? `M${500 - w * .7} ${y0 + 2} Q500 ${y0 + 6} ${500 + w * .7} ${y0 + 2} L${500 + w * .6} ${y0 + 9} Q500 ${y0 + 13} ${500 - w * .6} ${y0 + 9} Z` : "");
    for (const c of cheeks) c.setAttribute("opacity", (.25 + .12 * mood).toFixed(2));
    for (const side of ["L", "R"]) {
      const P = prev[side], Q = cur[side], kk = cl(k);
      let tx = lerp(P.x, Q.x, k), ty = lerp(P.y, Q.y, k), hr = lerp(P.r, Q.r, kk);
      if (Q.wave) { const wv = Math.sin(lt * 9) * cl(lt / .3); tx += wv * 26; hr += wv * 16; }
      ty += Math.sin(t * 2.1 + (side === "L" ? 0 : 1)) * 3;
      const j = ik(side, tx, ty, kk > .5 ? Q.elbow : P.elbow), pts = `${j.s[0]},${j.s[1]} ${j.e[0]},${j.e[1]} ${j.w[0]},${j.w[1]}`;
      const A_ = arms[side]; A_.sleeve.setAttribute("points", pts);
      A_.crease.setAttribute("points", `${lerp(j.s[0], j.e[0], .75)},${lerp(j.s[1], j.e[1], .75)} ${j.e[0]},${j.e[1]} ${lerp(j.e[0], j.w[0], .2)},${lerp(j.e[1], j.w[1], .2)}`);
      A_.cuff.setAttribute("cx", j.w[0]); A_.cuff.setAttribute("cy", j.w[1]);
      const shape = kk > .5 ? Q.h : P.h; if (A_.shape !== shape) { A_.hand.innerHTML = HANDS[shape]; A_.shape = shape; }
      const flip = side === "L" ? -1 : 1;
      A_.hand.setAttribute("transform", `translate(${j.w[0]} ${j.w[1]}) rotate(${hr}) scale(${flip} 1) translate(0 -8)`);
    }
  }
  return { render };
}
