// ---------------- placement, glow, halo
man.position.set(-.5, 0, .05); man.rotation.y = .55;
nod.scale.setScalar(.82);
face.material.emissive = new THREE.Color("#FFE9F2"); face.material.emissiveIntensity = .18;
const halo = new THREE.Mesh(new THREE.TorusGeometry(.62, .008, 6, 90), new THREE.MeshStandardMaterial({ color: "#FF5FA2", emissive: "#FF4F98", emissiveIntensity: 1.1 })); halo.rotation.x = 1.38; halo.position.y = -.05; nod.add(halo);
// ---------------- lights: low key, warm practicals, key from camera-left, warm rim behind
scene.add(new THREE.HemisphereLight("#FFD9B0", "#2A170C", .95));
const key = new THREE.SpotLight("#FFD2A0", 40, 14, .55, .6, 1.7); key.position.set(-1.8, 4.6, 5.2); key.target.position.set(.1, 1.9, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0005; scene.add(key, key.target);
const rim = new THREE.SpotLight("#FF9A50", 26, 9, .6, .7, 1.6); rim.position.set(1.8, 3.6, -1.9); rim.target.position.set(-.2, 2.0, .2); scene.add(rim, rim.target);
const wash = new THREE.SpotLight("#FFD6A8", 70, 14, .9, .8, 1.4); wash.position.set(.4, 5.2, 4.0); wash.target.position.set(.4, 2.4, -2.3); scene.add(wash, wash.target);
const rim2 = new THREE.PointLight("#FFB070", 2.2, 3.5, 2); rim2.position.set(-1.4, 2.6, -.9); scene.add(rim2);
const cuLight = new THREE.PointLight("#FFD8B4", 0, 3, 2); scene.add(cuLight);
// ---------------- post
const composer = new EffectComposer(R); composer.setPixelRatio(1); composer.setSize(RW, RH);
composer.addPass(new RenderPass(scene, cam));
const bokeh = new BokehPass(scene, cam, { focus: 6, aperture: .0035, maxblur: .009 }); composer.addPass(bokeh);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(RW, RH), .28, .5, .9));
composer.addPass(new OutputPass());
// grain tiles (deterministic)
const gctx = $("grain").getContext("2d"); const gid = gctx.createImageData(300, 300); let gs = 3;
const grainAt = (f) => { gs = 1 + (f * 7919) % 2147483646; for (let i = 0; i < gid.data.length; i += 4) { gs = (gs * 16807) % 2147483647; const v = (gs / 2147483647) * 255; gid.data[i] = gid.data[i + 1] = gid.data[i + 2] = v; gid.data[i + 3] = 255; } gctx.putImageData(gid, 0, 0); };

// ---------------- speakers
const LN = 25, SPK = "YNYNYNYNNYNYNNYNNYNYNYNYN";
const LS = Array.from({ length: LN }, (_, i) => W["l" + i]);
const lineAt = (t) => { let k = 0; for (let i = 0; i < LN; i++) if (t >= LS[i] - .1) k = i; return k; };
const speakerAt = (t) => SPK[lineAt(t)];
const ampOf = (who, t) => { const f = Math.min(TL.amp.length - 1, Math.floor(t * 30)); return speakerAt(t) === who ? (TL.amp[f] || 0) : 0; };
const env = (t, a, b, r = .25) => clamp(Math.min((t - a) / r, (b - t) / r));
const T_PANEL = W.l8 - .3, T_END = W.inboxes + 1.7;

// ---------------- shots (hard cuts). kinds: W wide hook, N nod CU, Y owner CU, S steps two-shot
const SHOTS = [[0, "W"], [W.l1 - .06, "N"], [W.l2 - .06, "Y"], [W.l3 - .06, "N"], [W.l4 - .06, "W"], [W.l5 - .06, "Y"], [W.l6 - .06, "W"], [T_PANEL, "S"]];
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[0]) s = x; return s; };
const hp = new THREE.Vector3(), np = new THREE.Vector3();
const nz = (t, a) => Math.sin(t * 1.3 + a) * .6 + Math.sin(t * 2.7 + a * 2) * .3 + Math.sin(t * 5.1 + a * 3) * .1;   // handheld
function camera(t) {
  const [t0, k] = shotAt(t), lt = t - t0; scene.updateMatrixWorld(true); head.getWorldPosition(hp); hp.y += .2; np.copy(nod.position);
  let fov = 40;
  if (k === "W") { const d = Math.min(lt, 6) * .07; cam.position.set(1.45 - d * .3, 2.3, 7.2 - d); cam.lookAt(.1, 1.98, 0); }
  else if (k === "S") { cam.position.set(1.35 + Math.sin(t * .15) * .12, 2.75, 8.6 + Math.sin(t * .11) * .1); cam.lookAt(.12, 3.72, 0); }
  else if (k === "N") { const d = Math.min(lt, 3) * .05; cam.position.set(np.x - .4, np.y + .3, np.z + 3.3 - d); cam.lookAt(np.x - .05, np.y + .3, np.z); fov = 38; }
  else { const d = Math.min(lt, 3) * .05; cam.position.set(hp.x + .85, hp.y + .02, hp.z + 2.3 - d); cam.lookAt(hp.x + .1, hp.y + .16, hp.z); fov = 38; }
  cam.fov = fov; cam.updateProjectionMatrix();
  cam.position.x += nz(t, 1) * .012; cam.position.y += nz(t, 2) * .01; cam.rotation.z += nz(t, 3) * .003;
  // focus: on whoever is speaking, rack over .35 s
  const fd = (w) => cam.position.distanceTo(w === "Y" ? hp : np);
  const li = lineAt(t), ts = LS[li] - .1, prev = li > 0 ? SPK[li - 1] : SPK[0], cur = SPK[li];
  const p = easeInOut((t - ts) / .35), focus = k === "Y" ? fd("Y") : k === "N" ? fd("N") : fd(prev) + (fd(cur) - fd(prev)) * p;
  bokeh.uniforms.focus.value = focus; bokeh.uniforms.aperture.value = k === "N" || k === "Y" ? .006 : .0038;
  cuLight.intensity = k === "N" || k === "Y" ? 1.6 : 0; cuLight.position.copy(cam.position); cuLight.position.y += .3; cuLight.position.x -= .6;
  return k;
}

// ---------------- characters
const DEAD = [1, 7, 22, 24];   // Nod squints on deadpans
function characters(t, k) {
  const sp = speakerAt(t), li = lineAt(t), aY = ampOf("Y", t), aN = ampOf("N", t), talkY = sp === "Y", talkN = sp === "N";
  const breathe = Math.sin(t * 1.7) * .012;
  head.rotation.y = (talkN ? .55 : .12) + Math.sin(t * .7) * .04; head.rotation.x = (talkN ? .02 : -.03) + Math.sin(t * 1.3) * .02;
  const shock = env(t, W.l2 - .1, W.l3, .15) * .8 + env(t, W.hours - .1, W.l5, .2) * .6, hope = env(t, W.l21 - .1, W.l22, .2), deflate = env(t, W.l23 - .1, END, .2);
  torso.rotation.x = .04 + breathe + (talkY ? .05 : 0) - shock * .05 + deflate * .08; torso.scale.y = 1 + breathe * .6;
  const gst = talkY ? (Math.sin(t * 2.6) * .5 + .5) : 0, count = env(t, W.emails - .1, W.l1 - .1, .2);
  arms.forEach(({ sh, el, s }, i) => { const gi = i ? gst : gst * .4, cnt = i === 1 ? count : 0, bob = cnt ? Math.abs(Math.sin(t * 6.5)) * .2 : 0;
    sh.rotation.x = -.35 - gi * .45 - shock * .35 - hope * .4 - cnt * 1.0 - bob; sh.rotation.z = s * (.1 + gi * .18 + shock * .55 + hope * .3 + cnt * .1); el.rotation.x = -1.0 - gi * .45 - shock * .5 - cnt * .9; el.rotation.z = s * -(gi * .3 + shock * .2); });
  mouth.scale.y = 1 + aY * 3.5 + shock * .5; mouth.scale.x = 1 + shock * .2;
  brows.forEach(({ br, s }) => { br.position.y = .32 + shock * .04; br.rotation.z = s * (-.12 + shock * .25 - deflate * .15); });
  const bl = (t % 3.3) < .12 ? .1 : 1; eyes.forEach((e) => { e.scale.y = bl * (1 + shock * .3); });
  // Nod: floats at head height, bobs, turns to the owner when he talks
  nod.position.set(.72 + Math.sin(t * .6) * .03, 2.12 + Math.sin(t * 1.9) * .05, .05);
  nod.rotation.y = talkN ? -.32 : -.62 + Math.sin(t * .8) * .05; nod.rotation.z = Math.sin(t * 1.1) * .04 + (talkY ? .08 : 0);
  halo.rotation.z = t * .6; halo.rotation.x = 1.38 + Math.sin(t * .9) * .06;
  smile.visible = aN < .08; omouth.visible = !smile.visible; omouth.scale.set(1, .3 + aN * 1.1, .3);
  const dead = DEAD.includes(li) && talkN ? env(t, LS[li] - .1, (LS[li + 1] ?? END) - .05, .12) : 0;
  const nb = (t % 2.9) < .12 ? .15 : 1; neyes.forEach((e) => e.scale.y = 1.25 * nb); lids.forEach((l) => { l.visible = dead > .01; l.scale.y = 1.25 * dead; });
  hands.forEach(({ h, s }) => { const g2 = talkN ? Math.sin(t * 3 + s) * .5 + .5 : 0, up = talkN && s < 0 && t > W.l8 ? .6 : 0;
    h.position.set(s * (.5 + g2 * .05) + up * .05, -.12 + Math.sin(t * 2.1 + s) * .04 + g2 * .1 + up, .12 + up * .15); });
}
