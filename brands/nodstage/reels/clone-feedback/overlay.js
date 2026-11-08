// ---------------- hook stickers (2D overlay, pop with overshoot, stack + jostle)
const MSG = [["Re: homepage v3", "#D0176F"], ["Re: Re: homepage v3", "#D0176F"], ["Fwd: homepage v3 (final)", "#D0176F"], ["Re: one more thing…", "#D0176F"]];
const WAVE = (n, s) => Array.from({ length: n }, (_, i) => `<u style="height:${8 + Math.abs(Math.sin(i * 1.7 + s)) * 26}px"></u>`).join("");
$("stk").innerHTML = MSG.map(([b, c], i) => `<div class="el msg" id="m${i}"><i style="background:${c}">HB</i><div><small>Hannah Brooks · email</small><b>${b}</b></div></div>`).join("")
  + [["0:42", 1], ["1:15", 2]].map(([d, s], i) => `<div class="el vn" id="v${i}"><i>▶</i><s>${WAVE(14, s)}</s>${d}</div>`).join("")
  + `<div class="el shot" id="sh"><div></div><p>screenshot_final2.png</p></div>`
  + `<div class="el" id="count"><b id="cn">1</b><span>new<br>messages</span></div>`
  + `<div class="el xl" id="xl"><div class="tb"><em>X</em>feedback-tracker.xlsx</div><table>${[["#", "From", "Note", "Version"], ["1", "email", "price per cup?", "v3"], ["2", "voice", "bigger logo", "v3?"], ["3", "email", "subscribe btn", "v4"], ["4", "screenshot", "this ↑", "??"]].map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`
  + `<div class="el sticky" id="sn">v3 or v4??<br>ask Hannah<br>again</div>`
  + `<div class="el" id="timer"><b id="tm">0:00:00</b><span>copy &amp; paste</span></div>`
  + `<div class="el stamp" id="slow">TOO SLOW</div>`;
const T_MSG = MSG.map((_, i) => W.emails - .05 + i * .16), T_VN = [W.voice - .05, W.voice + .2], T_SH = W.shot + .1, T_ALL = [...T_MSG, ...T_VN, T_SH];
function stickers(t) {
  const off1 = W.l4 - .15, off2 = T_PANEL - .4, fl = (i) => ({ x: Math.sin(t * 1.3 + i) * 4, y: Math.cos(t * 1.1 + i * 2) * 4 });
  const n = T_MSG.filter((x) => t >= x).length;
  MSG.forEach((_, i) => { const id = "m" + i; if (t < T_MSG[i] || t > off1 + .4) return hide(id);
    const slot = n - 1 - i, f = fl(i), yy = 600 - slot * 104 - (1 - easeOut((t - T_MSG[Math.min(n - 1, 3)]) / .25)) * -0; $(id).style.left = "48px";
    pop(id, t, T_MSG[i], { x: f.x, y: yy + f.y, r: (i % 2 ? 1.5 : -1.5) }); out(id, t, off1); });
  [["v0", 600, 410, -3, T_VN[0]], ["v1", 640, 512, 2, T_VN[1]], ["sh", 650, 628, 4, T_SH]].forEach(([id, x, y, r, t0], i) => { if (t < t0 || t > off1 + .4) return hide(id); const f = fl(i + 5);
    $(id).style.left = x + "px"; pop(id, t, t0, { x: f.x, y: y + f.y, r }); out(id, t, off1); });
  const c = T_ALL.filter((x) => t >= x).length;
  if (t < T_ALL[0] || t > off1 + .4) hide("count"); else { $("cn").textContent = c; $("count").style.left = "760px"; pop("count", t, T_ALL[0], { y: 236 + (c > 1 ? -4 * Math.exp(-(t - T_ALL[c - 1]) * 12) : 0) }); out("count", t, off1); }
  // the do-it-by-hand pile
  [["xl", 48, 300, -3, W.l4 - .02], ["sn", 770, 300, 6, W.sticky - .05]].forEach(([id, x, y, r, t0], i) => { if (t < t0 || t > off2 + .4) return hide(id); const f = fl(i + 9);
    $(id).style.left = x + "px"; pop(id, t, t0, { x: f.x, y: y + f.y, r }); out(id, t, off2); });
  if (t < W.hours - .12 || t > off2 + .4) hide("timer"); else { const p = easeInOut((t - W.hours) / (W.paste + .45 - W.hours)), s = Math.round(p * 10800), hh = Math.floor(s / 3600), mm = Math.floor(s / 60) % 60, ss = s % 60;
    $("tm").textContent = `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`; $("timer").style.left = "330px"; pop("timer", t, W.hours - .12, { y: 640 }); out("timer", t, off2); }
  if (t < W.paste + .5 || t > off2 + .4) hide("slow"); else { $("slow").style.left = "520px"; slam("slow", t, W.paste + .5, { y: 586, r: -9, x: Math.sin(t * 60) * 6 * Math.exp(-(t - W.paste - .5) * 10) }); out("slow", t, off2); }
}

// ---------------- caption: one short phrase, words light up as spoken
const PHS = []; { let k = 0; PHC.forEach((n) => { PHS.push(k); k += n; }); }
const CAPCOL = { Y: "#F6EFE4", N: "#F2C14E" };
function caption(t) {
  if (t >= T_END) { $("cap").style.opacity = 0; return; }
  let i = 0; for (let k = 0; k < TL.caps.length; k++) if (t >= TL.caps[k].t - .06) i = k;
  const el = $("cap"), ph = TL.caps[i];
  if (el.dataset.i != i) { el.dataset.i = i; el.innerHTML = ph.text.replace(/[\[\]]/g, "").split(" ").map((w) => `<span>${w}</span>`).join(" "); el.style.color = CAPCOL[speakerAt(ph.t + .05)]; }
  [...el.children].forEach((s, j) => { const k0 = PHS[i] + j; s.style.opacity = t >= tw(Math.min(k0, TL.wt.length - 1)) - .04 ? 1 : .42; });
  const a = easeOut((t - ph.t + .06) / .2), top = t < T_PANEL ? 1478 : 1000;
  el.style.top = top + "px"; el.style.opacity = a; el.style.transform = `translateY(${(1 - a) * 8}px)`;
}

// ---------------- panel canvas helpers (984 x 720)
const imgs = {}; for (const f of ["guest", "board", "invoice", "side3"]) { const i = new Image(); i.src = f + ".png"; imgs[f] = i; }
const CW = 984, CH = 720, g = $("cv").getContext("2d");
const rr = (x, y, w, h, r, fill, stroke, lw = 3) => { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
const tx = (s, x, y, size, wt = 600, col = "#1B1C21", al = "left", fam = "Inter") => { g.font = `${wt} ${size}px ${fam}`; g.fillStyle = col; g.textAlign = al; g.fillText(s, x, y); return g.measureText(s).width; };
const appear = (t, t0) => easeOut((t - t0) / .3);
const slide = (t, t0, fn) => { if (t < t0) return; const a = appear(t, t0); g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * 12); fn(); g.restore(); };
function imgRect(name, [sx, sy, sw, sh], [dx, dy, dw, dh], t, t0) {
  const im = imgs[name], sc = Math.max(dw / sw, dh / sh), kb = 1 + .03 * clamp((t - t0) / 5), cx = dx + dw / 2, cy = dy + dh / 2;
  g.save(); g.beginPath(); g.rect(dx, dy, dw, dh); g.clip(); g.translate(cx, cy); g.scale(kb, kb); g.translate(-cx, -cy);
  const w = sw * sc, h = sh * sc, ox = dx + (dw - w) / 2, oy = dy + (dh - h) / 2; g.drawImage(im, sx, sy, sw, sh, ox, oy, w, h); g.restore();
  return (px, py) => [cx + (ox + (px - sx) * sc - cx) * kb, cy + (oy + (py - sy) * sc - cy) * kb];
}
const ring = (map, x0, y0, x1, y1, q, col = "#D0176F") => { if (q <= 0) return; const [a, b] = map(x0, y0), [c, d] = map(x1, y1), pad = 8 + (1 - q) * 22; g.globalAlpha = q; g.strokeStyle = col; g.lineWidth = 7; g.beginPath(); g.roundRect(a - pad, b - pad, c - a + 2 * pad, d - b + 2 * pad, 16); g.stroke(); g.globalAlpha = 1; };
const tick = (x, y, r, q, col = "#1F9D5A") => { if (q <= 0) return; const s = q < 1 ? spring(q) : 1; g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = "#fff"; g.lineWidth = r * .22; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(-r * .45, 0); g.lineTo(-r * .1, r * .35); g.lineTo(r * .5, -r * .35); g.stroke(); g.restore(); };
const stampC = (label, x, y, q, col = "#D8332A", rot = -9) => { if (q <= 0) return; g.save(); g.translate(x + Math.sin(q * 40) * 5 * Math.max(0, 1 - q * 1.5), y); g.rotate(rot * Math.PI / 180); const s = q < 1 ? 1.6 - .6 * easeOut(q) : 1; g.scale(s, s); g.globalAlpha = Math.min(1, q * 3);
  g.font = "800 56px Archivo"; const w = g.measureText(label).width + 56; rr(-w / 2, -44, w, 88, 14, "rgba(255,244,240,.92)", col, 8); tx(label, 0, 20, 56, 800, col, "center", "Archivo"); g.restore(); };
function cursor(x, y, press = 0) { g.save(); g.translate(x, y); g.scale(2 - .25 * press, 2 - .25 * press); g.fillStyle = "#1B1C21"; g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.lineJoin = "round";
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 17); g.lineTo(4.5, 12.8); g.lineTo(7.5, 19.4); g.lineTo(10.5, 18); g.lineTo(7.5, 11.6); g.lineTo(14, 11.6); g.closePath(); g.fill(); g.stroke(); g.restore(); }
const typed = (s, t, t0, cps = 30) => { const n = Math.max(0, Math.min(s.length, Math.floor((t - t0) * cps))); return [s.slice(0, n), n < s.length]; };
const av = (x, y, ini, bg, r = 30) => { g.beginPath(); g.arc(x + r, y + r, r, 0, 7); g.fillStyle = bg; g.fill(); tx(ini, x + r, y + r + r * .32, r * .8, 800, "#fff", "center"); };
const light = (c = "#F6F2EE") => { g.fillStyle = c; g.fillRect(0, 0, CW, CH); };

// step 1 a: her portal, no account, click + comment
function s1a(t) {
  const m = imgRect("guest", [300, 0, 1300, 951], [0, 0, CW, CH], t, T_PANEL);
  ring(m, 1170, 12, 1592, 56, appear(t, W.portal - .1));
  ring(m, 1236, 72, 1586, 178, appear(t, W.l10 - .05), "#1F9D5A");
  slide(t, W.l10 - .05, () => { rr(40, 610, 420, 76, 38, "#1F9D5A"); tick(84, 648, 22, 1, "#fff"); g.strokeStyle = "#1F9D5A"; tx("No account needed", 122, 660, 32, 800, "#fff"); });
  const [px, py] = m(482, 338), tc = W.clicks + .45;
  if (t >= W.clicks - .2 && t < tc + .5) { const p = easeInOut((t - W.clicks + .2) / .65); cursor(lerp(820, px, p), lerp(560, py, p), t >= tc && t < tc + .3 ? 1 : 0); }
  if (t >= tc) { const q = spring((t - tc) / .4); g.save(); g.translate(px, py); g.scale(q, q); g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fillStyle = "#D0176F"; g.fill(); g.lineWidth = 5; g.strokeStyle = "#fff"; g.stroke(); tx("1", 0, 11, 28, 800, "#fff", "center"); g.restore(); }
  slide(t, tc + .15, () => { const bx = Math.min(px + 40, CW - 520), by = py + 40; rr(bx, by, 500, 150, 18, "#fff", "#E4DCD4", 2); av(bx + 18, by + 18, "HB", "#D0176F", 24); tx("Hannah Brooks", bx + 76, by + 52, 26, 800);
    const [s, on] = typed("Could we show the price per cup in the hero?", t, W.comments - .05, 34); g.font = "600 25px Inter"; const words = s.split(" "); let line = "", ly = by + 98, out = [];
    words.forEach((w) => { if (g.measureText(line + w).width > 450) { out.push(line); line = ""; } line += w + " "; }); out.push(line); out.forEach((l, i) => tx(l, bx + 22, ly + i * 32, 25, 600, "#3A3D45"));
    if (on || (t * 2) % 1 < .5) { g.font = "600 25px Inter"; const lw = g.measureText(out[out.length - 1]).width; g.fillStyle = "#D0176F"; g.fillRect(bx + 22 + lw, ly + (out.length - 1) * 32 - 22, 3, 28); } });
}
const lerp = (a, b, p) => a + (b - a) * p;
// step 1 b: comment types tick in
const TYPES = [["Aa", "Type a comment", "#5B6BD6", () => W.l11 - .2], ["🎙", "Voice note", "#D0176F", () => W.l12], ["▶", "Video", "#E0803A", () => W.video], ["↗", "Arrows on the design", "#1F9D5A", () => W.arrows]];
function s1b(t) {
  const m = imgRect("guest", [0, 60, 1180, 863], [0, 0, CW, CH], t, W.l11 - .4); g.fillStyle = "rgba(24,16,18,.28)"; g.fillRect(0, 0, CW, CH);
  ring(m, 4, 76, 62, 290, appear(t, W.l11));
  if (t > W.arrows) { const p = easeOut((t - W.arrows) / .45), [ax, ay] = m(250, 600), [bx, by] = m(470, 380); const ex = lerp(ax, bx, p), ey = lerp(ay, by, p);
    g.strokeStyle = "#FF2F7D"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ex, ey); g.stroke(); if (p > .9) { const an = Math.atan2(by - ay, bx - ax); g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - 34 * Math.cos(an - .45), by - 34 * Math.sin(an - .45)); g.moveTo(bx, by); g.lineTo(bx - 34 * Math.cos(an + .45), by - 34 * Math.sin(an + .45)); g.stroke(); } }
  TYPES.forEach(([ic, l, c, f], i) => { const t0 = f(), y = 70 + i * 150; slide(t, t0 - .05, () => { rr(470, y, 480, 124, 24, "#fff"); g.beginPath(); g.arc(538, y + 62, 40, 0, 7); g.fillStyle = c; g.fill(); tx(ic, 538, y + 75, 34, 800, "#fff", "center");
    tx(l, 600, y + 74, 34, 800); tick(906, y + 62, 24, clamp((t - t0 - .1) / .3)); }); });
}
// step 2: the comment becomes a task, pinned, assigned, dated
function s2(t) {
  const t0 = W.l13 - .15, m = imgRect("guest", [300, 120, 360, 602], [0, 0, 430, CH], t, t0);
  const [px, py] = m(482, 338), pq = env(t, W.l14 - .1, W.l16, .2); if (pq > 0) { g.globalAlpha = pq; g.strokeStyle = "#FF2F7D"; g.lineWidth = 7; g.beginPath(); g.arc(px, py, 40 + Math.sin(t * 8) * 5, 0, 7); g.stroke(); g.globalAlpha = 1; }
  g.fillStyle = "#F6F2EE"; g.fillRect(430, 0, 554, CH);
  slide(t, t0, () => { rr(458, 26, 500, 168, 20, "#fff", "#E4DCD4", 2); av(476, 44, "HB", "#D0176F", 24); tx("Hannah · comment 1", 534, 78, 26, 800); tx("Could we show the price", 478, 128, 27, 600, "#3A3D45"); tx("per cup in the hero?", 478, 164, 27, 600, "#3A3D45"); });
  slide(t, W.task - .1, () => { g.fillStyle = "#D0176F"; g.beginPath(); g.moveTo(708, 206); g.lineTo(708, 232); g.lineTo(694, 232); g.lineTo(708, 250); g.lineTo(722, 232); g.lineTo(708, 232); g.fill(); g.fillRect(704, 204, 8, 30); });
  slide(t, W.task - .05, () => { rr(458, 258, 500, 440, 22, "#fff", "#D0176F", 4); tx("TASK", 486, 304, 22, 800, "#D0176F");
    const [s] = typed("Show the price per cup in the hero", t, W.task, 40); g.font = "800 31px Inter"; const ws = s.split(" "), a = ws.slice(0, 5).join(" "), b = ws.slice(5).join(" "); tx(a, 486, 350, 31, 800); tx(b, 486, 390, 31, 800); });
  slide(t, W.l15 + .1, () => { rr(486, 418, 444, 70, 14, "#FBE3EE"); g.beginPath(); g.arc(522, 453, 18, 0, 7); g.fillStyle = "#D0176F"; g.fill(); tx("1", 522, 462, 22, 800, "#fff", "center"); tx("Pinned · Homepage v2", 556, 464, 28, 700, "#8E1E52"); });
  slide(t, W.assigned - .05, () => { av(486, 508, "MC", "#7B5CD6", 30); tx("Assigned to Maya", 560, 550, 30, 700); });
  slide(t, W.deadline - .05, () => { rr(486, 600, 300, 66, 33, "#FFF1DA", "#E0A100", 3); tx("Due Thu, Nov 12", 510, 644, 28, 800, "#8A5A00"); });
}
// step 3: the extra becomes a change order, approved, invoiced
function s3(t) {
  const t0 = W.l16 - .15, m = imgRect("side3", [0, 320, 675, 1130], [0, 0, 430, CH], t, t0);
  ring(m, 34, 335, 642, 568, appear(t, W.asks - .05), "#E0A100");
  g.fillStyle = "#F6F2EE"; g.fillRect(430, 0, 554, CH);
  slide(t, W.l18 - .05, () => { rr(458, 120, 500, 300, 22, "#fff", "#E4DCD4", 2); tx("CHANGE ORDER · CO-01", 486, 168, 22, 800, "#D0176F"); tx("Subscribe button", 486, 216, 32, 800); tx("under each bag", 486, 256, 32, 800); tx("Tomás · 3h · $270", 486, 304, 28, 600, "#7A7178");
    const ok = t >= W.approves + .2; if (ok) { rr(486, 334, 320, 62, 31, "#E3F4EA"); tick(518, 365, 18, clamp((t - W.approves - .2) / .3)); tx("Approved by Hannah", 546, 375, 26, 800, "#1F7A4A"); } else { rr(486, 334, 300, 62, 31, null, "#D0176F", 3); tx("Waiting for approval", 508, 375, 26, 700, "#D0176F"); } });
  slide(t, W.lands - .05, () => { const fl = env(t, W.lands + .1, W.lands + 1.2, .2); rr(458, 444, 500, 250, 22, "#fff", "#E4DCD4", 2); tx("Invoice INV-0012 · Fernhill Coffee Co.", 486, 490, 22, 700, "#8A8189");
    tx("Design stage: homepage + shop", 486, 548, 26, 600, "#3A3D45"); g.fillStyle = "#EEE7E1"; g.fillRect(486, 570, 444, 2);
    rr(476, 590, 464, 76, 12, fl > 0 ? `rgba(242,193,78,${.25 + .35 * fl})` : "rgba(242,193,78,.25)"); tx("Change order CO-01", 494, 638, 28, 800); tx("+$270", 926, 638, 32, 800, "#1F7A4A", "right"); });
  if (t >= W.l17 - .05) stampC("ROUND 5", 700, 70, clamp((t - W.l17 + .05) / .18), "#D8332A", -6);
}
// team: clients and freelancers come free
const TEAM = [["MC", "Maya", "Designer", "#7B5CD6", "Team", 0], ["TR", "Tomás", "Developer", "#2E8A7A", "Team", 0], ["RS", "Raghav", "Freelancer", "#E0803A", "Free", 1], ["HB", "Hannah Brooks", "Client · Fernhill Coffee Co.", "#D0176F", "Free", 1]];
function s4(t) { light();
  tx("Northbeam Studio · people", 40, 58, 28, 700, "#8A8189");
  TEAM.forEach(([ini, n, r, c, ch, free], i) => { const t0 = free ? W.clients - .05 + (i - 2) * .15 : W.l19 + .1 + i * .15, y = 84 + i * 136; slide(t, t0, () => { rr(30, y, 924, 118, 22, "#fff"); av(54, y + 24, ini, c, 35); tx(n, 146, y + 56, 34, 800); tx(r, 146, y + 94, 25, 600, "#8A8189");
    if (!free) { rr(770, y + 34, 160, 52, 26, "#EEE7E1"); tx("Team", 850, y + 69, 25, 800, "#5A5158", "center"); }
    else if (t >= W.free - .05) { const q = spring((t - W.free + .05) / .4); g.save(); g.translate(850, y + 60); g.scale(q, q); rr(-80, -28, 160, 56, 28, "#1F9D5A"); tx("Free", 0, 10, 28, 800, "#fff", "center"); g.restore(); } }); });
  slide(t, W.price - .05, () => { rr(30, 636, 924, 70, 35, "#2A1F23"); tx("One price per studio", 492, 682, 32, 800, "#F2C14E", "center"); });
}
// feedback, handled
const DONE = ["All her comments in one place", "Every comment is a task", "Extras approved and billed"];
function s5(t) { light();
  DONE.forEach((s, i) => { const y = 40 + i * 156; slide(t, W.l21 - .05 + i * .12, () => { rr(30, y, 924, 132, 24, "#fff"); tx(s, 132, y + 80, 36, 800); g.strokeStyle = "#D9D0C7"; g.lineWidth = 4; g.beginPath(); g.arc(80, y + 66, 26, 0, 7); g.stroke(); tick(80, y + 66, 28, clamp((t - W.l22 - i * .25) / .3)); }); });
  slide(t, W.still - .05, () => { rr(30, 520, 924, 170, 24, "#FFF4CF"); tx("Note to self", 66, 572, 24, 800, "#8A6A10"); tx("Clients will still change their minds.", 66, 630, 36, 700, "#4A3A10"); });
}
// why projects run late
const WHY = ["The design", "The client", "Feedback in four inboxes"];
function s6(t) { light("#FBF8F4");
  tx("Why projects run late", 48, 96, 54, 700, "#1B1C21", "left", "Lora"); g.fillStyle = "#E6DDD5"; g.fillRect(48, 128, 888, 3);
  WHY.forEach((s, i) => { const y = 240 + i * 172; slide(t, W.l23 + .05 + i * .14, () => { rr(48, y - 46, 56, 56, 10, "#fff", "#B9AEA6", 4);
    const st = i < 2 ? clamp((t - W.l24 - i * .4) / .35) : 0; const w = tx(s, 136, y, 50, 800, st > 0 ? `rgba(27,28,33,${1 - .55 * st})` : "#1B1C21");
    if (st > 0) { g.strokeStyle = "#D8332A"; g.lineWidth = 7; g.beginPath(); g.moveTo(128, y - 17); g.lineTo(128 + (w + 16) * st, y - 17); g.stroke(); } }); });
  if (t >= W.inboxes) stampC("FOUR INBOXES", 640, 470, clamp((t - W.inboxes) / .18), "#D8332A", -8);
}
const SEG = [[T_PANEL, W.l11 - .1, "STEP 1/3", "Share the proof", "nodstage · client portal", s1a, 0], [W.l11 - .1, W.l13 - .15, "STEP 1/3", "Share the proof", "nodstage · client portal", s1b, 0],
  [W.l13 - .15, W.l16 - .15, "STEP 2/3", "Comments become tasks", "nodstage · tasks", s2, 1], [W.l16 - .15, W.l19 - .1, "STEP 3/3", "Extras get paid", "nodstage · change orders", s3, 2],
  [W.l19 - .1, W.l21 - .1, "STEP 3/3", "Your whole team", "nodstage · people", s4, 2], [W.l21 - .1, W.l23 - .1, "STEP 3/3", "Feedback, handled", "nodstage · project", s5, 2],
  [W.l23 - .1, T_END + .5, "STEP 3/3", "Why projects run late", "notes", s6, 2]];
let segKey = -1;
function panel(t) {
  const i = SEG.findIndex(([a, b]) => t >= a && t < b); if (i < 0 || t >= T_END + .3) { hide("dw"); return; }
  const [a, , chip, ttl, url, fn, step] = SEG[i];
  if (segKey !== i) { $("chip").textContent = chip; $("ttl").textContent = ttl; $("url").textContent = url; segKey = i; }
  $("ttl").style.opacity = easeOut((t - a) / .25);
  for (let k = 0; k < 3; k++) { let f = 0; if (step > k) f = 1; else if (step === k) { const sg = SEG.filter((x) => x[6] === k); f = clamp((t - sg[0][0]) / (sg[sg.length - 1][1] - sg[0][0])); } $("g" + k).style.width = (f * 100).toFixed(1) + "%"; }
  const e = easeOut((t - T_PANEL) / .35); set("dw", { o: e * (1 - clamp((t - T_END) / .3)), y: -30 * (1 - e) });
  g.save(); g.clearRect(0, 0, CW, CH); fn(t); g.restore();
}

// ---------------- render
window.render = function (t) {
  characters(t, null); const k = camera(t);
  composer.render();
  grainAt(Math.floor(t * 30)); $("grain").style.transform = `translate(${(Math.floor(t * 30) * 37) % 40}px,${(Math.floor(t * 30) * 53) % 40}px)`;
  stickers(t); panel(t); caption(t);
  const e = easeOut((t - T_END) / .5); $("endc").style.opacity = e; $("glow").style.transform = `scale(${.94 + .06 * e + Math.sin(t * 2) * .015})`;
};
window.ready = Promise.all(Object.values(imgs).map((i) => i.decode().catch(() => {}))).then(() => document.fonts.ready);
