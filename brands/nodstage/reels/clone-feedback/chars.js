// the owner
const skin = M("#9A6343"), sweater = M("#2F6F73", { roughness: .95 }), navy = M("#2A2D3A"), dark = M("#1A1311");
const man = new THREE.Group(); man.position.set(-.2, 0, -.45); man.rotation.y = .5; scene.add(man);
const hips = new THREE.Group(); hips.position.set(0, 1.08, 0); man.add(hips);
box(.62, .24, .42, navy, 0, 0, 0, hips); for (const s of [-1, 1]) { box(.24, .22, .62, navy, s * .16, 0, .3, hips); box(.22, .62, .22, navy, s * .16, -.4, .58, hips); box(.26, .12, .38, dark, s * .16, -.72, .66, hips); }
const torso = new THREE.Group(); torso.position.set(0, .12, 0); hips.add(torso);
const body = new THREE.Mesh(new THREE.CylinderGeometry(.34, .36, .78, 8), sweater); body.position.y = .42; body.castShadow = true; torso.add(body);
box(.2, .05, .02, M("#E9DFC9"), 0, .78, .3, torso);
const head = new THREE.Group(); head.position.set(0, .95, 0); torso.add(head);
box(.14, .14, .14, skin, 0, -.08, 0, head); box(.42, .46, .42, skin, 0, .2, 0, head);
box(.44, .14, .44, dark, 0, .47, -.01, head); box(.44, .18, .1, dark, 0, .36, -.18, head);
box(.44, .16, .12, dark, 0, 0, .17, head); for (const sd of [-1, 1]) box(.06, .22, .3, dark, sd * .2, .12, .04, head); box(.2, .04, .03, dark, 0, .11, .225, head);
const eyeW = M("#F7F3EE"), eyeK = M("#16120F"); const eyes = [], brows = [];
for (const s of [-1, 1]) { const e = new THREE.Group(); e.position.set(s * .1, .24, .215); head.add(e); box(.09, .07, .01, eyeW, 0, 0, 0, e); box(.045, .05, .012, eyeK, s * -.005, -.005, .003, e); eyes.push(e);
  const br = box(.12, .03, .02, dark, s * .1, .32, .215, head); br.rotation.z = s * -.12; brows.push({ br, s }); }
const mouth = box(.1, .03, .02, M("#5A2418"), 0, .065, .238, head);
const arms = []; for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * .4, .74, 0); torso.add(sh);
  const up = new THREE.Mesh(new THREE.CylinderGeometry(.09, .1, .46, 6), sweater); up.position.y = -.23; up.castShadow = true; sh.add(up);
  const el = new THREE.Group(); el.position.y = -.46; sh.add(el); const lo = new THREE.Mesh(new THREE.CylinderGeometry(.08, .09, .42, 6), sweater); lo.position.y = -.21; lo.castShadow = true; el.add(lo);
  box(.13, .13, .13, skin, 0, -.46, 0, el); arms.push({ sh, el, s }); }
// Nod
const nod = new THREE.Group(); nod.scale.setScalar(.72); scene.add(nod);
const pinMat = M("#D1176F", { roughness: .38, metalness: .05, flatShading: true });
const prof = [new THREE.Vector2(0, -.78)];
for (let i = 1; i <= 8; i++) { const u = i / 8; prof.push(new THREE.Vector2(.3 * Math.pow(u, .8), -.78 + u * .56)); }
for (let i = 0; i <= 20; i++) { const a = Math.PI * (.68 - .68 * i / 20); prof.push(new THREE.Vector2(Math.sin(a) * .38, Math.cos(a) * .38)); }
const pinBody = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), pinMat); pinBody.castShadow = true; nod.add(pinBody);
const face = new THREE.Mesh(new THREE.SphereGeometry(.24, 32, 16), M("#FFF7FA", { roughness: .5 })); face.scale.set(1, .92, .5); face.position.set(0, .05, .3); nod.add(face);
const ink = M("#1A1216", { roughness: .4 }); const neyes = [];
for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.04, 16, 12), ink); e.scale.set(1, 1.25, .5); e.position.set(s * .085, .09, .42); nod.add(e); neyes.push(e);
  const sp = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), new THREE.MeshBasicMaterial({ color: "#fff" })); sp.position.set(s * .085 + .014, .11, .44); nod.add(sp);
  const ck = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), M("#F6A7C6")); ck.scale.set(1, .6, .3); ck.position.set(s * .15, -.01, .4); nod.add(ck); }
const lids = neyes.map((e) => { const l = new THREE.Mesh(new THREE.SphereGeometry(.046, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M("#FFF7FA", { roughness: .5 })); l.position.copy(e.position); l.position.z += .005; l.scale.set(1, 1.25, .6); nod.add(l); return l; });
const smile = new THREE.Mesh(new THREE.TorusGeometry(.055, .013, 6, 20, Math.PI), ink); smile.rotation.z = Math.PI; smile.position.set(0, 0, .43); nod.add(smile);
const omouth = new THREE.Mesh(new THREE.SphereGeometry(.04, 16, 10), M("#5A1A30")); omouth.scale.set(1, .3, .3); omouth.position.set(0, -.03, .425); nod.add(omouth);
const hands = []; for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 12), pinMat); h.scale.set(1, .85, .85); h.castShadow = true; nod.add(h); hands.push({ h, s }); }
const nodLight = new THREE.PointLight("#FF5FA2", .6, 1.6, 2); nodLight.position.y = -.8; nod.add(nodLight);
