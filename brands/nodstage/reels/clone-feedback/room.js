// ---------------- renderer at half resolution (upscaled by CSS), post: DOF + bloom
const RW = 540, RH = 960;
const R = new THREE.WebGLRenderer({ canvas: $("c"), antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(RW, RH, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.4;
const scene = new THREE.Scene(); scene.background = new THREE.Color("#140B07"); scene.fog = new THREE.Fog("#1E120B", 9, 24);
const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, .05, 60);
const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, metalness: 0 }, o));
const box = (w, h, d, m, x, y, z, p = scene) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.position.set(x, y, z); g.castShadow = g.receiveShadow = true; p.add(g); return g; };
const cyl = (rt, rb, h, m, x, y, z, seg = 20, p = scene) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); g.position.set(x, y, z); g.castShadow = g.receiveShadow = true; p.add(g); return g; };
const tex = (draw, w = 512, h = 512) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// walls: dark warm wood planks
const plank = tex((g, w, h) => { g.fillStyle = "#4A2C1C"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 64) { g.fillStyle = `rgb(${70 + rnd() * 18},${42 + rnd() * 10},${26 + rnd() * 8})`; g.fillRect(x + 2, 0, 60, h); g.fillStyle = "#2A170E"; g.fillRect(x, 0, 3, h); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(20,10,4,${rnd() * .12})`; g.fillRect(rnd() * w, rnd() * h, 2, 10 + rnd() * 30); } });
plank.wrapS = plank.wrapT = THREE.RepeatWrapping; plank.repeat.set(4, 2);
box(14, 6, .2, M("#fff", { map: plank }), 0, 3, -2.4);
const pl2 = plank.clone(); pl2.needsUpdate = true; box(.2, 6, 10, M("#fff", { map: pl2 }), -3.2, 3, 1.5);
const floorTex = tex((g, w, h) => { g.fillStyle = "#3A2418"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 48) { g.fillStyle = `rgb(${54 + rnd() * 12},${34 + rnd() * 8},${22 + rnd() * 6})`; g.fillRect(0, y + 2, w, 44); } });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M("#fff", { map: floorTex, roughness: .7 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const rugTex = tex((g, w, h) => { g.fillStyle = "#6E1E1A"; g.fillRect(0, 0, w, h); g.strokeStyle = "#C98A3A"; g.lineWidth = 10; g.strokeRect(24, 24, w - 48, h - 48); g.strokeStyle = "#3A100E"; g.lineWidth = 6;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(60, 70 + i * 70); for (let x = 60; x < w - 60; x += 40) g.lineTo(x + 20, 70 + i * 70 + (x % 80 ? 18 : -18)); g.stroke(); } });
const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.6), M("#fff", { map: rugTex })); rug.rotation.x = -Math.PI / 2; rug.position.set(.1, .01, .6); rug.receiveShadow = true; scene.add(rug);
// checkered acoustic foam panels on the back wall
const foamTex = tex((g, w, h) => { const n = 8, s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = (i + j) % 2; const gr = g.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
  gr.addColorStop(0, a ? "#6A5444" : "#2A1D15"); gr.addColorStop(1, a ? "#3A2A1E" : "#5A4636"); g.fillStyle = gr; g.fillRect(i * s, j * s, s, s); } });
for (const [x, y] of [[-.9, 2.2], [.15, 2.2], [1.2, 2.2], [-.9, 3.25], [.15, 3.25], [1.2, 3.25], [2.25, 2.2]]) box(1.0, 1.0, .1, M("#fff", { map: foamTex, roughness: 1 }), x, y, -2.25);
// fabric panels left (yellow + red), like a cosy booth
[["#B8892E", -2.1, -2.2], ["#8E2A1E", -1.65, -2.22], ["#C79A3A", -3.05, -.6], ["#7A2318", -3.05, .4]].forEach(([c, x, z], i) => { const p = box(i < 2 ? .5 : .08, 3.4, i < 2 ? .08 : .55, M(c, { roughness: 1 }), x, 2.0, z); });
// pinboard + shelf (right)
box(1.2, .8, .05, M("#5A3A22"), 2.2, 3.35, -2.28); box(1.1, .7, .04, M("#A9784A"), 2.2, 3.35, -2.25);
[[1.9, 3.4, .05, "#EFE6D6"], [2.25, 3.32, -.06, "#F2C14E"], [2.55, 3.42, .04, "#EFE6D6"]].forEach(([x, y, r, c]) => { box(.24, .3, .01, M(c), x, y, -2.22).rotation.z = r; });
box(1.4, .05, .32, M("#3A2416"), 2.4, 1.55, -2.1); [["#8E2A1E", .1, .34], ["#C9A23A", .09, .3], ["#2E4A3A", .12, .36], ["#D8CBB4", .1, .28], ["#6E3A5A", .11, .33]].reduce((x, [c, w, h]) => { box(w, h, .24, M(c), x, 1.6 + h / 2, -2.1); return x + w + .02; }, 1.85);
// right wall sconce (red cone) and a floor lamp (left back) — practicals
const glowM = (c, i = 2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i });
const sc = new THREE.Mesh(new THREE.ConeGeometry(.22, .3, 3, 1, true), M("#B52A1E", { side: THREE.DoubleSide, emissive: "#6A1008", emissiveIntensity: .6 })); sc.position.set(2.6, 3.6, -2.15); sc.rotation.z = Math.PI; scene.add(sc);
const sb = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), glowM("#FFC27A", 6)); sb.position.set(2.6, 3.52, -2.12); scene.add(sb);
const scL = new THREE.PointLight("#FF9A4A", 3.5, 4.5, 2); scL.position.set(2.6, 3.4, -1.9); scene.add(scL);
cyl(.015, .015, 2.2, M("#2A1A12"), -1.75, 1.1, -1.5); cyl(.18, .2, .04, M("#2A1A12"), -1.75, .02, -1.5);
const shade = new THREE.Mesh(new THREE.CylinderGeometry(.2, .3, .34, 20, 1, true), M("#E8C48A", { side: THREE.DoubleSide, emissive: "#FFB060", emissiveIntensity: 1.6 })); shade.position.set(-1.75, 2.3, -1.5); scene.add(shade);
const flL = new THREE.PointLight("#FFB066", 5, 5.5, 2); flL.position.set(-1.75, 2.2, -1.35); scene.add(flL);
// small LEDs on a rack (bokeh points)
for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), glowM(i % 3 ? "#FF3A2A" : "#FFB040", 8)); b.position.set(-.55 + i * .08, .55, -1.9); scene.add(b); }
box(.7, .5, .35, M("#1E1714"), -.35, .25, -1.95);
// side table + laptop (left)
box(.7, .05, .5, M("#5A3A22"), -1.45, .74, .35); cyl(.03, .03, .72, M("#2A1A12"), -1.45, .37, .35);
const lap = new THREE.Group(); lap.position.set(-1.45, .78, .35); lap.rotation.y = .7; scene.add(lap);
box(.46, .02, .32, M("#B9B6B2", { metalness: .5, roughness: .4 }), 0, 0, 0, lap); const ls = box(.46, .3, .015, M("#B9B6B2", { metalness: .5, roughness: .4 }), 0, .15, -.16, lap); ls.rotation.x = -.25;
const lscr = new THREE.Mesh(new THREE.PlaneGeometry(.42, .26), glowM("#9FB6D8", .5)); lscr.position.set(0, .15, -.15); lscr.rotation.x = -.25; lap.add(lscr);
// mic on a boom arm (between them, behind)
cyl(.025, .025, 1.7, M("#1A1412", { metalness: .6, roughness: .4 }), .35, .85, -.55); cyl(.22, .24, .04, M("#1A1412"), .35, .02, -.55);
const arm = cyl(.016, .016, 1.0, M("#1A1412", { metalness: .6, roughness: .4 }), .12, 1.95, -.35); arm.rotation.z = .9; arm.rotation.x = -.35;
const mic = cyl(.06, .05, .24, M("#2A2422", { metalness: .7, roughness: .35 }), -.2, 2.2, -.12); mic.rotation.z = 1.2;
// desk fan (right front)
const fan = new THREE.Group(); fan.position.set(1.75, 0, .8); fan.rotation.y = -.7; scene.add(fan);
cyl(.2, .22, .05, M("#CFC8BE", { metalness: .4, roughness: .4 }), 0, .03, 0, 20, fan); cyl(.02, .02, 1.05, M("#CFC8BE", { metalness: .5 }), 0, .55, 0, 10, fan);
const cage = new THREE.Mesh(new THREE.TorusGeometry(.28, .012, 6, 40), M("#D8D2C8", { metalness: .6, roughness: .3 })); cage.position.set(0, 1.12, .02); fan.add(cage);
for (let i = 0; i < 10; i++) { const s = box(.006, .56, .006, M("#D8D2C8", { metalness: .6 }), 0, 1.12, .02, fan); s.rotation.z = i * Math.PI / 10; }
cyl(.08, .08, .14, M("#CFC8BE", { metalness: .4 }), 0, 1.12, -.08, 16, fan).rotation.x = Math.PI / 2;
// stool (red) under the owner
cyl(.34, .3, .14, M("#9A2A20", { roughness: .7 }), -.5, .86, .05); cyl(.04, .04, .8, M("#2A1A12", { metalness: .5 }), -.5, .42, .05); cyl(.26, .28, .03, M("#2A1A12", { metalness: .5 }), -.5, .03, .05);
