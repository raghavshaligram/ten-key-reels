const { chromium } = require("playwright"); const path = require("path"); const fs = require("fs");
const [mode, out, ...ts] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  await p.goto("file://" + path.resolve(process.env.HTML || "build.html")); await p.evaluate(() => window.ready);
  if (mode === "stills") {
    for (const t of ts) { await p.evaluate((t) => window.render(+t), t); await p.screenshot({ path: `${out}/still_${t}.jpg`, type: "jpeg", quality: 92 }); }
  } else {
    const fps = 30, dur = +ts[0], n = Math.round(fps * dur); fs.mkdirSync(out, { recursive: true });
    for (let i = 0; i < n; i++) { await p.evaluate((t) => window.render(t), i / fps);
      await p.screenshot({ path: `${out}/f${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 }); }
    console.log("frames", n);
  }
  await b.close();
})();
