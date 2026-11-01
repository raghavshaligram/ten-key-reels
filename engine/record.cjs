// Record a real 1-minute run on the live site, the way a person would type it.
// Usage: node engine/record.cjs <outDir> '<json options>'
//   options: { mode: "Mixed" | "Whole numbers" | "Dollar amounts" | "ZIP codes", gap: 322 (ms per key),
//              slips: [23] (entry numbers that get one wrong digit), slipEvery: 0 (or N: every Nth entry),
//              frames: 9 (seconds of frames to capture from the start, 0 = none),
//              finishClean: false (true = stop before an entry the clock would cut off, so it isn't scored as a miss) }
// Writes: frames/f0000.jpg..., run.json ({clip, frames:[{t,f}]}), result.jpg, result.json (parsed numbers).
// Frames are real screenshots at 2x, so crops stay sharp. The site's sticky header is hidden for clean crops.
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
const OUT = path.resolve(process.argv[2]); const O = Object.assign({ mode: "Mixed", gap: 300, slips: [], slipEvery: 0, frames: 9, finishClean: false }, JSON.parse(process.argv[3] || "{}"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(path.join(OUT, "frames"), { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto("https://10keytypingtest.com/", { waitUntil: "networkidle" });
  await p.addStyleTag({ content: "header{display:none!important}" });
  if (O.mode !== "Mixed") { await p.getByRole("button", { name: O.mode }).first().click(); await sleep(600); }
  const panel = p.locator('section[aria-label$="panel"]').first();
  await p.evaluate(() => scrollBy(0, document.querySelector('section[aria-label$="panel"]').getBoundingClientRect().top - 20));
  await p.click("input[inputmode]"); await sleep(400);
  const box = await panel.boundingBox(); const stats = await p.locator('section[aria-label="Live score"]').boundingBox();
  const clip = { x: box.x, y: box.y, width: box.width, height: stats.y + stats.height - box.y };
  const shots = []; const t0 = Date.now(); let stop = false;
  const shooter = O.frames > 0 ? (async () => { while (!stop && Date.now() - t0 < O.frames * 1000) {
      const t = (Date.now() - t0) / 1000, f = `frames/f${String(shots.length).padStart(4, "0")}.jpg`;
      await p.screenshot({ path: path.join(OUT, f), type: "jpeg", quality: 90, clip }); shots.push({ t, f }); } })() : Promise.resolve();
  if (O.frames > 0) await sleep(1500);                 // a beat of the idle 1:00 clock before the first key
  let n = 0, tStart = 0;
  while (true) {
    const tl = p.locator('[data-testid="target-number"]').first();
    if (!(await tl.isVisible().catch(() => false))) break;
    const target = (await tl.innerText({ timeout: 800 }).catch(() => "")).trim(); if (!target) break;
    if (O.finishClean && tStart && (Date.now() - tStart) + (target.length + 1) * O.gap * 1.25 > 59500) {   // don't start an entry the clock will cut off
      while (await tl.isVisible().catch(() => false)) await sleep(200); break; }
    if (!tStart) tStart = Date.now();
    n++; const slipHere = O.slips.includes(n) || (O.slipEvery > 0 && n % O.slipEvery === 0);
    const slipAt = slipHere ? Math.max(0, [...target].findIndex((c) => /\d/.test(c)) + 1) : -1;
    for (let i = 0; i < target.length; i++) {
      let ch = target[i]; if (i === slipAt && /\d/.test(ch)) ch = String((+ch + 1) % 10);
      const k = /\d/.test(ch) ? "Numpad" + ch : ch === "." ? "NumpadDecimal" : ch === "-" ? "NumpadSubtract" : null;
      if (k) await p.keyboard.press(k).catch(() => {}); await sleep(O.gap * (0.8 + Math.random() * 0.4));
    }
    await p.keyboard.press("Enter").catch(() => {}); await sleep(O.gap);
  }
  stop = true; await shooter; await sleep(1200);
  const res = p.locator('[data-testid="results"]'); await res.scrollIntoViewIfNeeded();
  await res.screenshot({ path: path.join(OUT, "result.jpg"), type: "jpeg", quality: 92 });
  const txt = (await res.innerText()).replace(/\s+/g, " ");
  const num = (re) => { const m = txt.match(re); return m ? m[1] : null; };
  const result = { net: +(num(/([\d,]+) net KPH/) || "0").replace(/,/g, ""), gross: +(num(/([\d,]+) Gross KPH/) || "0").replace(/,/g, ""),
    acc: +(num(/([\d.]+)% Accuracy/) || 0), right: num(/(\d+ \/ \d+) Correct entries/), entries: n, mode: O.mode, text: txt.slice(0, 240) };
  fs.writeFileSync(path.join(OUT, "run.json"), JSON.stringify({ clip, frames: shots }));
  fs.writeFileSync(path.join(OUT, "result.json"), JSON.stringify(result, null, 1));
  console.log(JSON.stringify(result));
  await b.close();
})();
