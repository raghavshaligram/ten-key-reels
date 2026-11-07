
// ---------------- speakers, lip sync
const LINES = [[0, "Y"], [11, "N"], [18, "Y"], [30, "N"], [35, "Y"], [38, "V"], [73, "Y"], [85, "N"], [91, "V"], [178, "Y"], [189, "N"], [193, "V"]];
const WIN = LINES.map(([k, s], i) => [tw(k) - .08, i + 1 < LINES.length ? tw(LINES[i + 1][0]) - .12 : END, s]);
const speakerAt = (t) => { let s = "Y"; for (const [a, , sp] of WIN) if (t >= a - .05) s = sp; return s; };
const ampOf = (who, t) => { const f = Math.min(TL.amp.length - 1, Math.floor(t * 30)); return WIN.some(([a, b, sp]) => sp === who && t >= a && t < b) ? (TL.amp[f] || 0) : 0; };
const CU = () => [[tw(30) - .04, tw(35) - .06, "N"], [tw(35) - .04, tw(38) - .1, "Y"], [tw(178) - .04, tw(189) - .06, "Y"], [tw(189) - .04, tw(193) - .1, "N"]];
const cuAt = (t) => CU().find(([a, b]) => t >= a && t < b);

// ---------------- captions: speaker label + line, the line in the speaker's colour (two-tone as in the reference)
const PH = TL.caps.map((c) => ({ t: c.t, text: c.text.replace(/[\[\]]/g, "") }));
const COL = { Y: ["YOU", "#FFFFFF", "#FFFFFF"], N: ["NOD", "#F2C14E", "#F2C14E"], V: ["NODSTAGE", "#FF9CCB", "#FFFFFF"] };
function captionTop(t) {
  let i = 0; for (let k = 0; k < PH.length; k++) if (t >= PH[k].t - .06) i = k;
  const ph = PH[i], sp = speakerAt(ph.t + .02), c = COL[sp];
  if ($("line").dataset.i != i) { $("line").textContent = ph.text; $("line").dataset.i = i; $("who").textContent = c[0]; }
  $("who").style.color = c[1]; $("line").style.color = c[2];
  const fit = Math.min(1, 1040 / Math.max(1, $("line").scrollWidth)), a = easeOut((t - ph.t + .06) / .18);
  $("line").style.opacity = a; $("line").style.transform = `translateY(${(1 - a) * 12}px) scale(${fit})`;
}

// ---------------- panel canvas (drawn in a 908x560 design space, scaled to 968x560)
const imgs = {}; for (const f of ["guest", "board", "invoice", "side3", "logo", "money"]) { const i = new Image(); i.src = f + ".png"; imgs[f] = i; }
const CW = 908, CH = 560, cvx = $("cv").getContext("2d"); let g = cvx;
const rr = (x, y, w, h, r, fill, stroke, lw = 3) => { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
const tx = (s, x, y, size, wt = 600, col = "#1B1C21", al = "left", fam = "Inter") => { g.font = `${wt} ${size}px ${fam}`; g.fillStyle = col; g.textAlign = al; g.fillText(s, x, y); };
const btn = (x, y, w, h, label, fill, col = "#fff") => { rr(x, y, w, h, 16, fill); tx(label, x + w / 2, y + h / 2 + 11, 30, 700, col, "center"); };
const ringR = (x, y, w, h, q, col = "#D0176F") => { if (q <= 0) return; const pad = 8 + (1 - q) * 26; g.globalAlpha = q; g.strokeStyle = col; g.lineWidth = 7; g.beginPath(); g.roundRect(x - pad, y - pad, w + 2 * pad, h + 2 * pad, 16); g.stroke(); g.globalAlpha = 1; };
function cursor(x, y, press = 0) { g.save(); g.translate(x, y); g.scale(1.6 - .2 * press, 1.6 - .2 * press); g.fillStyle = "#1B1C21"; g.strokeStyle = "#fff"; g.lineWidth = 1.6; g.lineJoin = "round";
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 17); g.lineTo(4.5, 12.8); g.lineTo(7.5, 19.4); g.lineTo(10.5, 18); g.lineTo(7.5, 11.6); g.lineTo(14, 11.6); g.closePath(); g.fill(); g.stroke();
  if (press > 0) { g.globalAlpha = press * .5; g.strokeStyle = "#D0176F"; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 14 + 10 * (1 - press), 0, 7); g.stroke(); } g.restore(); }
const lerp = (a, b, p) => a + (b - a) * p;
function curAt(t, path, clicks = []) { if (t < path[0][0]) return null; let x = path[0][1], y = path[0][2];
  for (let i = 1; i < path.length; i++) { const [t1, x1, y1] = path[i], [t0, x0, y0] = path[i - 1]; if (t >= t0) { const p = easeInOut((t - t0) / Math.max(.01, t1 - t0)); x = lerp(x0, x1, p); y = lerp(y0, y1, p); } }
  const pr = Math.max(0, ...clicks.map((c) => t >= c && t < c + .35 ? 1 - (t - c) / .35 : 0)); return [x, y, pr]; }
function img(name, [sx, sy, sw, sh], t, t0, bg = "#fff") {
  const im = imgs[name]; g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
  const sc = Math.min(CW / sw, CH / sh), dw = sw * sc, dh = sh * sc, dx = (CW - dw) / 2, dy = (CH - dh) / 2, kb = 1 + .035 * clamp((t - t0) / 4);
  g.save(); g.translate(CW / 2, CH / 2); g.scale(kb, kb); g.translate(-CW / 2, -CH / 2); g.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh); g.restore();
  return (px, py) => [CW / 2 + (dx + (px - sx) * sc - CW / 2) * kb, CH / 2 + (dy + (py - sy) * sc - CH / 2) * kb];
}
function ringImg(map, x0, y0, x1, y1, q, col) { const [a, b] = map(x0, y0), [c, d] = map(x1, y1); ringR(a, b, c - a, d - b, q, col); }
const stamp = (label, x, y, q, col = "#1F7A4A", rot = -8) => { if (q <= 0) return; g.save(); g.translate(x, y); g.rotate(rot * Math.PI / 180); const s = q < 1 ? 1.8 - .8 * easeOut(q) : 1; g.scale(s, s); g.globalAlpha = Math.min(1, q * 2);
  g.font = "800 46px Archivo"; const w = g.measureText(label).width + 56; rr(-w / 2, -40, w, 80, 14, "rgba(255,255,255,.9)", col, 7); tx(label, 0, 16, 46, 800, col, "center", "Archivo"); g.restore(); };
const appear = (t, t0) => easeOut((t - t0) / .3);
const bgc = () => { g.fillStyle = "#F4EFE9"; g.fillRect(0, 0, CW, CH); };
const sheet = (h = 512) => rr(36, 24, 836, h, 26, "#fff");
const av = (x, y, ini, bg = "#DDEFE3", fg = "#1F7A4A", r = 30) => { rr(x, y, r * 2, r * 2, r, bg); tx(ini, x + r, y + r + 9, r * .8, 800, fg, "center"); };

// --- screens
function sIntro(t) { g.fillStyle = "#FBF6EE"; g.fillRect(0, 0, CW, CH); const t0 = W.connected - .05, s = .85 + .15 * spring((t - t0) / .6);
  g.save(); g.translate(CW / 2, 220); g.scale(s, s); rr(-300, -95, 600, 190, 34, "#fff"); g.drawImage(imgs.logo, -250, -59, 500, 118); g.restore();
  g.globalAlpha = appear(t, W.one - .1); tx("One connected workspace", CW / 2, 400, 40, 800, "#1B1C21", "center", "Archivo"); g.globalAlpha = appear(t, W.one + 1.2); tx("built around how creative studios actually work", CW / 2, 452, 28, 600, "#B8326E", "center"); g.globalAlpha = 1; }
const COLS = ["Inquiry", "Discovery call", "Proposal", "Won"];
function sPipe(t, stage, ringCol, follow = false, won = 0) { bgc(); sheet();
  tx("Pipeline", 72, 92, 40, 800, "#1B1C21", "left", "Archivo"); tx("Leads · Northbeam Studio", 836, 90, 24, 600, "#9A8F97", "right");
  COLS.forEach((c, i) => { const x = 64 + i * 200; rr(x, 124, 184, 380, 18, i === 3 && won > 0 ? "#E3F2E9" : "#F6F2EE"); tx(c, x + 92, 162, 24, 800, "#5A5158", "center"); if (ringCol === i) ringR(x, 124, 184, 380, 1); });
  const x = 64 + stage * 200 + 12; g.save(); g.translate(x + 80, 260); const q = stage === 3 ? spring(won) : 1; g.scale(.9 + .1 * q, .9 + .1 * q); rr(-80, -60, 160, 128, 14, "#fff", "#E4DCD4", 2);
  tx("Fernhill", 0, -22, 24, 800, "#1B1C21", "center"); tx("Coffee Co.", 0, 6, 22, 600, "#5A5158", "center"); av(-24, 22, "HB", "#DDEFE3", "#1F7A4A", 20); g.restore();
  [["Studio Ivy", 0, 400], ["Mesa Bakery", 1, 420]].forEach(([n, c, y]) => { rr(64 + c * 200 + 12, y - 40, 160, 70, 14, "#fff", "#EEE7E1", 2); tx(n, 64 + c * 200 + 92, y + 2, 22, 700, "#8A8189", "center"); });
  if (follow) { const q = spring((t - W.followups) / .5); if (t >= W.followups) { g.save(); g.translate(560, 470); g.scale(.8 + .2 * q, .8 + .2 * q); rr(-250, -36, 500, 72, 36, "#1B1C21"); tx("⏰ Follow up with Hannah · Thu", 0, 10, 26, 700, "#fff", "center"); g.restore(); } }
  if (won > 0) stamp("WON", 700, 380, won, "#1F7A4A", -10); }
function sBooking(t) { bgc(); sheet(); const t0 = W.discovery;
  rr(72, 54, 58, 58, 14, "#1B1C21"); tx("NS", 101, 92, 24, 800, "#fff", "center"); tx("Northbeam Studio", 146, 93, 30, 700); tx("Booking page", 836, 93, 24, 600, "#9A8F97", "right");
  tx("Book a discovery call", 72, 168, 44, 800, "#1B1C21", "left", "Archivo"); tx("30 min · video call", 72, 206, 26, 500, "#7A7178");
  const thu = t >= t0 + .35, ten = t >= t0 + .75, done = t >= t0 + 1.1;
  [["MON", 6], ["TUE", 7], ["WED", 8], ["THU", 9], ["FRI", 10]].forEach(([d, n], i) => { const x = 72 + i * 156, on = thu && i === 3; rr(x, 232, 140, 106, 18, on ? "#D0176F" : "#F6F2EE", on ? null : "#E4DCD4");
    tx(d, x + 70, 266, 22, 700, on ? "#fff" : "#8A8189", "center"); tx(String(n), x + 70, 320, 46, 800, on ? "#fff" : "#1B1C21", "center", "Archivo"); });
  ["9:00", "10:00", "11:30", "2:00"].forEach((s, i) => { const x = 72 + i * 194, on = ten && i === 1; rr(x, 356, 180, 70, 16, on ? "#FBE3EE" : "#fff", on ? "#D0176F" : "#E4DCD4", on ? 4 : 3); tx(s, x + 90, 402, 30, 700, on ? "#D0176F" : "#1B1C21", "center"); });
  if (!done) btn(72, 446, 764, 70, "Confirm booking", "#D0176F"); else { rr(72, 446, 764, 70, 16, "#E3F2E9"); tx("✓ Call booked · Thu, Oct 9 · 10:00", 454, 492, 30, 800, "#1F7A4A", "center"); }
  const c = curAt(t, [[t0, 780, 520], [t0 + .35, 614, 300], [t0 + .75, 360, 400], [t0 + 1.1, 470, 486]], [t0 + .35, t0 + .75, t0 + 1.1]); if (c) cursor(...c); }
function sProposal(t) { bgc(); sheet(); const t0 = W.proposalsB;
  rr(72, 54, 150, 44, 22, "#FBE3EE"); tx("Proposal", 147, 85, 24, 800, "#D0176F", "center"); tx("for Fernhill Coffee Co. · Hannah Brooks", 238, 85, 24, 600, "#8A8189");
  tx("Website refresh", 72, 160, 52, 800, "#1B1C21", "left", "Archivo");
  [["Discovery and moodboard", "$800"], ["Design: homepage and shop", "$2,400"], ["Build: Shopify theme", "$3,600"]].forEach(([a, b], i) => { const y = 214 + i * 58; g.globalAlpha = appear(t, t0 - .1 + i * .1); tx(a, 72, y, 30, 500); tx(b, 836, y, 30, 700, "#1B1C21", "right"); g.fillStyle = "#EEE7E1"; g.fillRect(72, y + 18, 764, 2); g.globalAlpha = 1; });
  tx("Total", 72, 404, 34, 800); tx("$6,800", 836, 410, 50, 800, "#1B1C21", "right", "Archivo");
  btn(72, 446, 764, 70, "Accept proposal", "#D0176F"); }
function sProject(t) { const m = img("board", [0, 0, 1600, 560], t, W.turn - .2); ringImg(m, 190, 88, 490, 128, appear(t, W.projectB - .1)); }
function sBoardHead(t) { const m = img("board", [0, 0, 1600, 560], t, W.manageP - .2); ringImg(m, 190, 88, 490, 128, appear(t, W.manageP)); }
function sTasks(t) { const m = img("board", [40, 250, 1240, 583], t, W.tasks - .2); ringImg(m, 362, 556, 645, 670, appear(t, W.tasks)); ringImg(m, 785, 60, 900, 145, appear(t, W.deadlines), "#E0A100"); }
function sDeadline(t) { const m = img("board", [0, 0, 1600, 560], t, W.deadlines - .2); ringImg(m, 785, 60, 905, 145, appear(t, W.deadlines), "#E0A100"); }
function sWorkload(t) { bgc(); sheet(); tx("Team workload", 72, 100, 44, 800, "#1B1C21", "left", "Archivo"); tx("This week", 836, 98, 24, 600, "#9A8F97", "right");
  [["MC", "Maya", .78, "#7B5CD6"], ["TR", "Tomás", .55, "#2E8A7A"], ["RS", "Raghav", .42, "#D0176F"], ["AK", "Team member", .3, "#E0803A"]].forEach(([i, n, f, c], k) => { const y = 150 + k * 88, q = easeOut((t - W.workload + .9 - k * .08) / .5);
    av(72, y, i, "#EFEAF6", c, 28); tx(n, 148, y + 38, 28, 700); rr(360, y + 14, 476, 30, 15, "#F1ECE7"); rr(360, y + 14, 476 * f * q, 30, 15, c); }); }
function sPortal(t) { const m = img("guest", [0, 0, 1600, 870], t, W.give - .2); ringImg(m, 0, 0, 760, 62, appear(t, W.portal - .15)); }
function sShare(t) { const m = img("guest", [0, 0, 1600, 870], t, W.share - .2); ringImg(m, 1170, 10, 1435, 50, appear(t, W.proofs - .1)); }
function sFeedback(t) { const m = img("guest", [140, 170, 1460, 690], t, W.feedback - .5); ringImg(m, 455, 312, 505, 362, appear(t, W.feedback - .25)); ringImg(m, 1236, 533, 1590, 615, appear(t, W.feedback + .05)); }
function sRevisions(t) { const m = img("guest", [900, 60, 700, 600], t, W.revisions - .3); ringImg(m, 1240, 232, 1588, 306, appear(t, W.revisions - .05)); }
function sApprove(t) { const m = img("guest", [900, 0, 700, 600], t, W.approvals - .5); ringImg(m, 1445, 10, 1590, 52, appear(t, W.approvals - .2), "#1F7A4A"); stamp("APPROVED", 640, 330, (t - W.approvals) / .18); }
const CHIPS = ["Inbox", "Video", "Calendar", "Change orders", "Invoices", "Payments", "Automations", "Forms", "Templates", "Reports", "Testimonials"];
function chipBar(t, on) { g.fillStyle = "#1B1C21"; g.fillRect(0, 0, CW, 58); let x = 12; g.font = "800 19px Inter";
  CHIPS.forEach((c, i) => { const w = g.measureText(c).width + 26; const lit = i <= on; rr(x, 12, w, 34, 17, i === on ? "#D0176F" : lit ? "#5A2A44" : "#2E2A30"); tx(c, x + w / 2, 35, 19, 800, lit ? "#fff" : "#8A8189", "center"); x += w + 6; }); }
function withBar(t, on, fn) { g.save(); g.translate(0, 58); g.beginPath(); g.rect(0, 0, CW, CH - 58); g.clip(); g.save(); g.translate(CW / 2, (CH - 58) / 2); g.scale(.9, .9); g.translate(-CW / 2, -CH / 2); fn(t); g.restore(); g.restore(); chipBar(t, on); }
function sInbox(t) { bgc(); sheet(); tx("Inbox · Fernhill Coffee", 72, 96, 38, 800, "#1B1C21", "left", "Archivo");
  [[0, "HB", "Love the new headline. Could we show the price per cup in the hero?", "Hannah · 2 days ago"], [1, "RS", "Happy to add this. It's outside the original scope, so I'll send a small change order.", "Raghav · 18h ago"]].forEach(([k, i, m, w], j) => {
    const y = 136 + j * 170, q = appear(t, W.keep + j * .3); g.globalAlpha = q; av(72, y, i, j ? "#FBE3EE" : "#DDEFE3", j ? "#D0176F" : "#1F7A4A"); rr(148, y, 690, 130, 18, j ? "#FBF1F6" : "#F6F2EE");
    const words = m.split(" "); let line = "", ly = y + 42; g.font = "600 25px Inter"; for (const wd of words) { if (g.measureText(line + wd).width > 640) { tx(line, 168, ly, 25, 600); line = ""; ly += 34; } line += wd + " "; } tx(line, 168, ly, 25, 600); tx(w, 168, y + 118, 20, 600, "#9A8F97"); g.globalAlpha = 1; }); }
function sVideo(t) { bgc(); sheet(); tx("Video message", 72, 96, 38, 800, "#1B1C21", "left", "Archivo"); tx("to Hannah · Homepage v2", 836, 94, 24, 600, "#9A8F97", "right");
  const m = imgs.guest; g.save(); g.beginPath(); g.roundRect(110, 128, 688, 360, 22); g.clip(); g.drawImage(m, 100, 60, 1100, 576, 110, 128, 688, 360); g.fillStyle = "rgba(20,14,18,.35)"; g.fillRect(110, 128, 688, 360); g.restore();
  const q = spring((t - W.video + .1) / .5); g.save(); g.translate(454, 308); g.scale(.7 + .3 * q, .7 + .3 * q); rr(-56, -56, 112, 112, 56, "#D0176F"); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(-16, -26); g.lineTo(30, 0); g.lineTo(-16, 26); g.fill(); g.restore();
  av(130, 420, "RS", "#FBE3EE", "#D0176F", 26); tx("Walkthrough of the new homepage", 196, 452, 24, 700, "#fff"); }
function sCalendar(t) { bgc(); sheet(); tx("October 2026", 72, 96, 40, 800, "#1B1C21", "left", "Archivo"); tx("Calendar", 836, 94, 24, 600, "#9A8F97", "right");
  ["M", "T", "W", "T", "F", "S", "S"].forEach((d, i) => tx(d, 112 + i * 112, 140, 22, 800, "#9A8F97", "center"));
  for (let k = 0; k < 28; k++) { const c = k % 7, r = Math.floor(k / 7), x = 60 + c * 112, y = 156 + r * 88, day = k + 1; rr(x, y, 104, 80, 12, "#F8F5F2"); tx(String(day), x + 12, y + 28, 20, 700, "#5A5158"); }
  [[8, "Discovery call", "#D0176F", 0], [13, "Status call", "#2E8A7A", .15], [21, "Proof due", "#E0803A", .3]].forEach(([d, l, c, dl]) => { const k = d - 1, x = 60 + (k % 7) * 112, y = 156 + Math.floor(k / 7) * 88; const q = appear(t, W.calendar - .4 + dl);
    g.globalAlpha = q; rr(x + 4, y + 40, 96, 32, 8, c); tx(l.length > 10 ? l.slice(0, 9) + "…" : l, x + 52, y + 62, 15, 800, "#fff", "center"); g.globalAlpha = 1; }); }
function sCO(t) { const m = img("side3", [0, 280, 675, 860], t, W.co - .3); ringImg(m, 26, 1065, 650, 1125, appear(t, W.co), "#E0A100"); }
function sInvoice(t) { const m = img("invoice", [60, 40, 840, 320], t, W.invoicesC - .3); ringImg(m, 112, 112, 316, 194, appear(t, W.invoicesC)); stamp("PAID", 640, 330, (t - W.paymentsC) / .18, "#1F7A4A", -10); }
function sAuto(t) { bgc(); sheet(); tx("Automation", 72, 96, 40, 800, "#1B1C21", "left", "Archivo"); rr(700, 62, 136, 44, 22, "#E3F2E9"); tx("On", 768, 92, 24, 800, "#1F7A4A", "center");
  const q1 = appear(t, W.automate - .2), q2 = appear(t, W.automate + .2);
  g.globalAlpha = q1; rr(72, 140, 764, 120, 20, "#F6F2EE"); tx("WHEN", 100, 186, 22, 800, "#9A8F97"); tx("A proposal is accepted", 100, 232, 34, 800); g.globalAlpha = q2;
  g.fillStyle = "#D0176F"; g.fillRect(450, 262, 6, 40); rr(72, 304, 764, 120, 20, "#FBE3EE"); tx("THEN", 100, 350, 22, 800, "#D0176F"); tx("Create the project and its tasks", 100, 396, 34, 800); g.globalAlpha = 1; }
function sForms(t) { bgc(); sheet(); tx("Project brief", 72, 96, 40, 800, "#1B1C21", "left", "Archivo"); tx("Intake form", 836, 94, 24, 600, "#9A8F97", "right");
  [["What are we making?", "Website refresh"], ["Pages", "Home, shop, product, story, visit"], ["Launch date", "November"]].forEach(([l, v], i) => { const y = 132 + i * 96; tx(l, 72, y + 20, 22, 700, "#7A7178"); rr(72, y + 30, 520, 52, 12, "#fff", "#E4DCD4", 2); tx(v, 90, y + 64, 24, 600); });
  tx("Templates", 640, 152, 24, 800, "#7A7178"); ["Website project", "Brand identity", "Proposal", "Onboarding"].forEach((s, i) => { const q = appear(t, W.templates - .4 + i * .12); g.globalAlpha = q; rr(640, 170 + i * 72, 196, 56, 14, i === 0 ? "#D0176F" : "#F6F2EE"); tx(s, 738, 206 + i * 72, 20, 800, i === 0 ? "#fff" : "#1B1C21", "center"); g.globalAlpha = 1; }); }
function sReports(t) { const m = img("money", [20, 190, 1560, 420], t, W.track - .3); ringImg(m, 40, 230, 790, 420, appear(t, W.track + .1)); }
function sTesti(t) { bgc(); sheet(); av(72, 54, "HB"); tx("Hannah Brooks", 152, 82, 30, 700); tx("Fernhill Coffee Co.", 152, 114, 24, 500, "#8A8189");
  tx("Ask for a testimonial", 72, 192, 48, 800, "#1B1C21", "left", "Archivo");
  rr(72, 220, 764, 150, 18, "#FBF8F5", "#E4DCD4"); tx("Hi Hannah, it was great working on the refresh.", 98, 278, 28, 500, "#3A3D45"); tx("Would you share a few words about it?", 98, 324, 28, 500, "#3A3D45");
  const sent = t >= W.testimonials + .1; if (!sent) btn(72, 400, 764, 76, "Send request", "#D0176F"); else { rr(72, 400, 764, 76, 16, "#E3F2E9"); tx("✓ Request sent to Hannah", 454, 450, 30, 800, "#1F7A4A", "center"); }
  const c = curAt(t, [[W.testimonials - .6, 800, 520], [W.testimonials + .05, 520, 440]], [W.testimonials + .1]); if (c) cursor(...c); }
const OLD = [["CRM", "Leads"], ["Project tool", "Tasks"], ["Email / Chat", "Conversations"], ["Proofing tool", "Feedback"], ["Calendar", "Meetings"], ["Finance tool", "Invoices"]];
const NEW = ["Pipeline", "Projects", "Tasks", "Review", "Clients", "Inbox", "Calendar", "Team", "Invoicing", "Payments", "Automations"];
function sCompare(t) { g.fillStyle = "#FBF6EE"; g.fillRect(0, 0, CW, CH); const t0 = W.less1 - .25;
  rr(18, 18, 420, 446, 22, "#EFE9E3"); tx("The way many studios", 228, 60, 27, 800, "#3A3238", "center"); tx("work today", 228, 92, 27, 800, "#3A3238", "center");
  OLD.forEach(([a, b], i) => { const y = 112 + i * 56, r = (i % 2 ? 1 : -1) * 1.5 * Math.PI / 180, q = appear(t, t0 + i * .06); g.globalAlpha = .4 + .6 * q; g.save(); g.translate(228, y + 26); g.rotate(r); rr(-192, -24, 384, 50, 12, "#fff", "#D9D0C7", 2); tx(a, -178, 10, 25, 800, "#1B1C21"); tx(b, 178, 10, 23, 600, "#8A8189", "right"); g.restore(); g.globalAlpha = 1; });
  rr(458, 18, 432, 446, 22, "#1F1A1F"); g.drawImage(imgs.logo, 540, 36, 270, 64); tx("one connected studio workspace", 674, 128, 24, 700, "#E9B3CD", "center");
  NEW.forEach((n, i) => { const c = i % 2, r = Math.floor(i / 2), x = 476 + c * 204, y = 146 + r * 50, q = spring((t - t0 - .3 - i * .05) / .45); if (t < t0 + .3 + i * .05) return; g.save(); g.translate(x + 96, y + 22); g.scale(.7 + .3 * q, .7 + .3 * q); rr(-98, -22, 196, 44, 22, "#D0176F"); tx(n, 0, 9, 24, 800, "#fff", "center"); g.restore(); });
  [[W.less1, "✓ Less switching", 150], [W.less2, "✓ Less chasing", 440], [W.onewf, "✓ One connected workflow", 730]].forEach(([tt, s, x]) => { if (t < tt) return; const q = spring((t - tt) / .45); g.save(); g.translate(x, 512); g.scale(.7 + .3 * q, .7 + .3 * q); g.font = "800 24px Inter"; const w = g.measureText(s).width + 36; rr(-w / 2, -26, w, 52, 26, "#1F7A4A"); tx(s, 0, 9, 24, 800, "#fff", "center"); g.restore(); });
}
const SEG = () => [
  [W.connected - .05, W.start - .12, "MEET", "Nodstage", "nodstage", sIntro, -1],
  [W.start - .12, W.discovery - .1, "STEP 1/3", "Get the business", "nodstage · pipeline", (t) => sPipe(t, 0, t >= W.inquiries - .1 ? 0 : -1), 0],
  [W.discovery - .1, W.followups - .1, "STEP 1/3", "Get the business", "nodstage · booking page", sBooking, 0],
  [W.followups - .1, W.proposalsB - .1, "STEP 1/3", "Get the business", "nodstage · pipeline", (t) => sPipe(t, 1, -1, true), 0],
  [W.proposalsB - .1, tw(115) - .1, "STEP 1/3", "Get the business", "nodstage · proposal", sProposal, 0],
  [tw(115) - .1, W.turn - .1, "STEP 1/3", "Get the business", "nodstage · pipeline", (t) => sPipe(t, t >= W.won - .05 ? 3 : 2, -1, false, t >= W.won - .05 ? (t - W.won + .05) / .3 : 0), 0],
  [W.turn - .1, W.manageP - .12, "STEP 1/3", "Get the business", "nodstage · projects", sProject, 0],
  [W.manageP - .12, W.tasks - .08, "STEP 2/3", "Deliver the work", "nodstage · projects", sBoardHead, 1],
  [W.tasks - .08, W.deadlines - .05, "STEP 2/3", "Deliver the work", "nodstage · tasks", sTasks, 1],
  [W.deadlines - .05, W.workload - .9, "STEP 2/3", "Deliver the work", "nodstage · projects", sDeadline, 1],
  [W.workload - .9, W.give - .1, "STEP 2/3", "Deliver the work", "nodstage · team", sWorkload, 1],
  [W.give - .1, W.share - .1, "STEP 2/3", "Deliver the work", "nodstage · client portal", sPortal, 1],
  [W.share - .1, tw(143) - .1, "STEP 2/3", "Deliver the work", "nodstage · client portal", sShare, 1],
  [tw(143) - .1, tw(146) - .1, "STEP 2/3", "Deliver the work", "nodstage · review", sFeedback, 1],
  [tw(146) - .1, tw(148) - .1, "STEP 2/3", "Deliver the work", "nodstage · review", sRevisions, 1],
  [tw(148) - .1, W.keep - .12, "STEP 2/3", "Deliver the work", "nodstage · review", sApprove, 1],
  [W.keep - .12, W.video - .1, "STEP 3/3", "Run the business", "nodstage · inbox", (t) => withBar(t, 0, sInbox), 2],
  [W.video - .1, tw(157) - .1, "STEP 3/3", "Run the business", "nodstage · video", (t) => withBar(t, 1, sVideo), 2],
  [tw(157) - .1, W.co - .1, "STEP 3/3", "Run the business", "nodstage · calendar", (t) => withBar(t, 2, sCalendar), 2],
  [W.co - .1, W.invoicesC - .1, "STEP 3/3", "Run the business", "nodstage · change orders", (t) => withBar(t, 3, sCO), 2],
  [W.invoicesC - .1, W.automate - .1, "STEP 3/3", "Run the business", "nodstage · invoices", (t) => withBar(t, t >= W.paymentsC - .05 ? 5 : 4, sInvoice), 2],
  [W.automate - .1, tw(168) - .1, "STEP 3/3", "Run the business", "nodstage · automations", (t) => withBar(t, 6, sAuto), 2],
  [tw(168) - .1, W.track - .1, "STEP 3/3", "Run the business", "nodstage · forms", (t) => withBar(t, t >= W.templates - .1 ? 8 : 7, sForms), 2],
  [W.track - .1, tw(175) - .1, "STEP 3/3", "Run the business", "nodstage · reports", (t) => withBar(t, 9, sReports), 2],
  [tw(175) - .1, W.so - .1, "STEP 3/3", "Run the business", "nodstage · testimonials", (t) => withBar(t, 10, sTesti), 2],
  [W.less1 - .3, W.ns2 - .15, "ALL 3", "One connected studio", "nodstage", sCompare, 3]];
let segKey = -1;
function panel(t, onCU) {
  const L = SEG(), i = L.findIndex(([a, b]) => t >= a && t < b);
  if (i < 0 || onCU) { hide("dw"); return null; }
  const [a, , chip, ttl, url, fn, step] = L[i];
  if (segKey !== i) { $("chip").textContent = chip; $("ttl").textContent = ttl; $("url").textContent = url; segKey = i; }
  for (let k = 0; k < 3; k++) { let f = 0; if (step > k || step >= 3) f = 1; else if (step === k) { const sg = L.filter((x) => x[6] === k); f = clamp((t - sg[0][0]) / (sg[sg.length - 1][1] - sg[0][0])); } $("g" + k).style.width = (f * 100).toFixed(1) + "%"; }
  const first = L[0][0]; if (t < first + .6) pop("dw", t, first, {}); else if (i === L.length - 1 && t < a + .5) pop("dw", t, a, {}); else set("dw", { o: 1, s: 1 + .01 * Math.max(0, 1 - (t - a) / .2) });
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 968, 560); g.setTransform(968 / 908, 0, 0, 1, 0, 0); fn(t); g.restore();
  // the three closing ticks under the comparison
  return i;
}

// ---------------- scene 1 icons, scene 2 window pile
const ICONS = [["find", "Leads", "#2E8A7A", '<circle cx="26" cy="26" r="16"/><path d="M38 38l14 14"/>'],
  ["manage1", "Projects", "#5B6BD6", '<rect x="6" y="8" width="14" height="40" rx="3"/><rect x="25" y="8" width="14" height="28" rx="3"/><rect x="44" y="8" width="10" height="18" rx="3"/>'],
  ["talk", "Messages", "#E0803A", '<path d="M8 10h44v28H24l-12 10v-10H8z"/>'],
  ["getd", "Approvals", "#7B5CD6", '<path d="M10 30l12 12 26-28"/>'],
  ["chase", "Payments", "#1F7A4A", '<path d="M30 6v48M42 16c-3-5-21-6-21 4s23 6 23 17-19 9-23 3"/>']];
$("hook").innerHTML = ICONS.map(([m, l, c, p], i) => `<div class="el ic" id="i${i}" style="left:${50 + i * 196}px;top:${600 + (i % 2) * 150}px"><div style="background:${c}"><svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${p}</svg></div>${l}</div>`).join("");
const WINS = [["crm", "w", "CRM", "New lead · discovery call · follow up", 60, 360, -4], ["pm", "w", "Project tool", "To do · Doing · Done", 560, 410, 3], ["email", "w", "Email", "Re: Re: Re: logo v5", 90, 640, 2],
  ["proofing", "w", "Proofing app", "3 comments on Homepage", 590, 700, -3], ["conv", "w", "Chat", "Hannah: any update?", 140, 900, -2], ["invoices", "w", "Invoices", "Invoice #12 · unpaid", 560, 960, 4],
  ["proposals", "n", "Proposal_v3.pdf", "#6E7480", 330, 560, -5], ["payments", "n", "Payment overdue", "#D0453C", 430, 840, 3], ["tools", "n", "Reminder · call at 3:00", "#5B6BD6", 120, 1110, -2],
  ["none", "n", "“Can the logo be bigger?”", "#D0176F", 470, 1120, 2], ["seem", "n", "Board · tasks due today", "#2E8A7A", 300, 400, 3]];
$("wins").innerHTML = WINS.map(([m, k, a, b, x, y], i) => k === "w" ? `<div class="el win" id="w${i}" style="left:${x}px;top:${y}px"><div class="tb"><i></i><i></i><i></i><span>${a}</span></div><div class="bd">${b}<div class="sk" style="width:90%"></div><div class="sk" style="width:70%"></div><div class="sk" style="width:80%"></div></div></div>`
  : `<div class="el nt" id="w${i}" style="left:${x}px;top:${y}px"><i style="background:${b}">!</i>${a}</div>`).join("");
function pile(t) {
  const end = W.connected - .05;
  WINS.forEach(([m, , , , x, y, r], i) => { const id = "w" + i, t0 = W[m] - .1;
    if (t < t0 || t >= end + .05) { hide(id); return; }
    const jit = Math.min(1, Math.max(0, (t - W.crm) / (W.others - W.crm))) * (t < W.what ? 1 : .3), jx = Math.sin(t * 37 + i * 3) * 5 * jit, jy = Math.cos(t * 31 + i) * 5 * jit;
    if (t < W.what - .1) { slam(id, t, t0, { r, x: jx, y: jy }); return; }
    // fly together and snap into the panel
    const p = easeInOut((t - (W.what - .1)) / (end - W.what + .1)), cx = 540 - (x + 215), cy = 760 - (y + 60);
    set(id, { o: 1 - clamp((p - .8) / .2), x: cx * p + jx, y: cy * p + jy, r: r * (1 - p), s: 1 - .55 * p }); });
}
function hookIcons(t) {
  ICONS.forEach(([m], i) => { const id = "i" + i; if (t < W[m] - .08 || t > W.crm - .3) { hide(id); return; } pop(id, t, W[m] - .08, { y: Math.sin(t * 1.8 + i) * 6 }); out(id, t, W.way); });
  let n = 0; ICONS.forEach(([m]) => { if (t >= W[m] - .05) n++; });
  if (n === 0 || t > W.lot - .1) hide("cnt"); else { $("cnt").textContent = n; slam("cnt", t, W[ICONS[n - 1][0]] - .05, { r: -6 }); }
}

// ---------------- render
const env = (t, a, b, r = .25) => clamp(Math.min((t - a) / r, (b - t) / r));
const hp = new THREE.Vector3();
window.render = function (t) {
  const cu = cuAt(t), sp = speakerAt(t), aY = ampOf("Y", t), aN = ampOf("N", t), talkY = sp === "Y", talkN = sp === "N", end = t >= S[8] - .15;
  let hy = talkN ? .5 : .05, hx = 0; if (cu && cu[2] === "Y") { hy = 0; hx = .02; }
  const mess = t >= W.crm && t < W.what ? env(t, W.crm, W.what, .4) : 0; if (mess && !talkY) { hy = .1 + Math.sin(t * 2.3) * .45; hx = -.12; }
  head.rotation.y = hy + Math.sin(t * .7) * .04; head.rotation.x = hx + Math.sin(t * 1.3) * .02;
  const count = env(t, W.find - .2, W.lot - .1, .2), shock = env(t, tw(35) - .1, tw(38), .15) + env(t, tw(73) - .1, tw(85), .3) * .6, hope = env(t, tw(178) - .1, tw(189), .2);
  torso.rotation.x = .04 + Math.sin(t * 1.6) * .015 + (talkY ? .06 : 0) - shock * .05;
  const gst = talkY && !count ? (Math.sin(t * 2.6) * .5 + .5) : 0;
  arms.forEach(({ sh, el, s }, i) => { const gi = (i ? gst : gst * .4), cnt = i === 1 ? count : 0, bob = cnt ? Math.abs(Math.sin(t * 6.5)) * .25 : 0;
    sh.rotation.x = -.35 - gi * .45 - shock * .35 - hope * .45 - cnt * 1.1 - bob; sh.rotation.z = s * (.1 + gi * .18 + shock * .6 + hope * .35 + cnt * .1); el.rotation.x = -1.0 - gi * .45 - shock * .55 - cnt * .9; el.rotation.z = s * -(gi * .3 + shock * .2); });
  mouth.scale.y = 1 + aY * 3.5 + shock * .6; mouth.scale.x = 1 + shock * .25;
  brows.forEach(({ br, s }) => { br.position.y = .32 + shock * .04 + hope * .02; br.rotation.z = s * (-.12 + shock * .25 + mess * .2); });
  const bl = (t % 3.3) < .12 ? .1 : 1; eyes.forEach((e) => { e.scale.y = bl * (1 + shock * .3); e.scale.x = 1 + shock * .12; });
  const dead = env(t, tw(30) - .1, tw(35), .12) + env(t, tw(189) - .1, tw(193), .12);
  nod.position.set(.82 + Math.sin(t * .6) * .03, 2.25 + Math.sin(t * 1.9) * .05, -.5);
  nod.rotation.y = (cu && cu[2] === "N") ? -.05 : talkN ? -.25 : -.55 + Math.sin(t * .8) * .05; nod.rotation.z = Math.sin(t * 1.1) * .04 + (talkY && !cu ? .1 : 0);
  smile.visible = aN < .08; omouth.visible = !smile.visible; omouth.scale.set(1, .3 + aN * 1.1, .3);
  const nb = (t % 2.9) < .12 ? .15 : 1; neyes.forEach((e) => e.scale.y = 1.25 * nb); lids.forEach((l) => { l.visible = dead > .01; l.scale.y = 1.25 * dead; });
  const pointUp = (talkN || sp === "V") && !cu && t >= W.connected && !end, conn = env(t, W.what - .1, W.meet, .3);
  hands.forEach(({ h, s }) => { const up = pointUp && s < 0 ? 1 : 0, g2 = talkN ? Math.sin(t * 3 + s) * .5 + .5 : 0, wide = conn;
    h.position.set(s * (.5 + g2 * .05 + wide * .25) + up * .05, -.12 + Math.sin(t * 2.1 + s) * .04 + g2 * .1 + up * .62 + wide * .45, .12 + up * .12 + wide * .1); });
  bulbs.forEach((b, i) => b.material.color.setScalar(.85 + .15 * Math.sin(t * 2 + i)));
  if (cu && cu[2] === "Y") { head.getWorldPosition(hp); hp.y += .18; const lt = t - cu[0]; cam.position.set(hp.x + 1.0, hp.y + .1, hp.z + 1.85 - lt * .06); cam.lookAt(hp.x, hp.y - .12, hp.z); }
  else if (cu && cu[2] === "N") { const lt = t - cu[0]; cam.position.set(nod.position.x - .12, nod.position.y + .08, nod.position.z + 2.3 - lt * .06); cam.lookAt(nod.position.x, nod.position.y - .1, nod.position.z); }
  else { cam.position.set(.32 + Math.sin(t * .2) * .03, 2.5, 4.8); cam.lookAt(.32, 3.2, -.7); }
  cuLight.intensity = cu ? 2.2 : 0; cuLight.position.copy(cam.position); cuLight.position.y += .2;
  R.render(scene, cam);
  for (let i = 0; i < ICONS.length; i++) if (cu) hide("i" + i);
  if (!cu) hookIcons(t); else hide("cnt");
  pile(t); panel(t, !!cu || end);
  const e = easeOut((t - S[8] + .15) / .5); $("endc").style.opacity = e; $("endc").style.transform = `scale(${1.04 - .04 * e})`;
  captionTop(t);
};
window.ready = new Promise((res) => { THREE.DefaultLoadingManager.onLoad = () => Promise.all(Object.values(imgs).map((i) => i.decode().catch(() => {}))).then(() => document.fonts.ready).then(res); setTimeout(res, 5000); });
</script></body></html>
