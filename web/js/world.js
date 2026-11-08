// Moedeiland: de 3D-wereld (terrein, water, lucht, gras, personages, besturing, camera).
import * as THREE from 'three';
import * as M from './models.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { S, save, has, legend, today } from './state.js';
import { SND } from './audio.js';
import { NPCS } from './story.js';
import { KRACHT, GEMEEN } from './content.js';

/* ============ hulpjes ============ */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const gauss = (d, r) => Math.exp(-(d * d) / (2 * r * r));
const dist2 = (x, z, p) => Math.hypot(x - p[0], z - p[1]);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function hashStr(t) { let h = 2166136261; for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

/* ============ de kaart ============ */
export const Z = {
  dorp: [0, 0], molen: [-31, 4], vulkaan: [0, -34], vossenbos: [31, 9], vijver: [2, 28],
  schaduw: [-26, 27], mist: [-34, -27], klif: [26, -26], eiland: [45, -47], huis: [-7, 3], uilboom: [6.5, -9.5]
};
export const SEA = 0;
const KLIF_R = 6.2, LEDGE_R = 8.6;

// Hoogte van het eiland op punt (x, z)
export function height(x, z) {
  const r = Math.hypot(x, z), a = Math.atan2(z, x);
  const R = 52 + 3.5 * Math.sin(3 * a + 0.5) + 2.2 * Math.sin(5 * a + 1.3) + 1.2 * Math.sin(9 * a + 0.4);
  const t = (R - r) / 6;
  let h = lerp(-3.2, 0.75, smooth(-1, 1, t));
  h += (0.22 * Math.sin(x * 0.21) * Math.cos(z * 0.17) + 0.12 * Math.sin(x * 0.53 + z * 0.31)) * smooth(-0.5, 1, t);
  // dorpsplein vlak
  const dd = Math.hypot(x, z);
  h = lerp(h, 0.65, smooth(16, 9, dd));
  // vulkaanheuvel met krater
  const dv = dist2(x, z, Z.vulkaan);
  h += 4.6 * gauss(dv, 6.5) - 1.3 * gauss(dv, 1.6);
  // vijver
  const dp = dist2(x, z, Z.vijver);
  h -= 1.5 * smooth(6.5, 3.8, dp);
  // Hoge Klif met een richel aan de kant van het dorp
  const dk = dist2(x, z, Z.klif);
  const ka = Math.atan2(z - Z.klif[1], x - Z.klif[0]);
  const facing = Math.cos(ka - Math.atan2(-Z.klif[1], -Z.klif[0]));
  if (dk < KLIF_R + 0.6) h = Math.max(h, lerp(h, 5.4, smooth(KLIF_R + 0.6, KLIF_R, dk)));
  if (dk < LEDGE_R + 0.6 && facing > 0.35) h = Math.max(h, lerp(h, 2.75, smooth(LEDGE_R + 0.6, LEDGE_R, dk) * smooth(0.35, 0.5, facing)));
  // Sterreneilandje
  const de = dist2(x, z, Z.eiland);
  h = Math.max(h, lerp(-3.2, 1.3, smooth(6.5, 3.5, de)));
  // kleine heuvels voor afwisseling
  h += 1.2 * gauss(dist2(x, z, [-18, -14]), 4) + 0.9 * gauss(dist2(x, z, [18, 22]), 4.5) + 0.8 * gauss(dist2(x, z, [-14, 38]), 4);
  return h;
}
const PATHS = [[0, 0, -27, 5], [0, 0, 0, -26], [0, 0, 25, 8], [0, 0, 2, 21], [0, 0, -19, 20], [0, 0, -24, -20], [0, 0, 18, -18], [-6, 3, 0, 0], [6.5, -9.5, 0, 0]];
function pathDist(x, z) {
  let m = 99;
  for (const [ax, az, bx, bz] of PATHS) {
    const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / l, 0, 1);
    m = Math.min(m, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return m;
}
export const isWater = (x, z) => height(x, z) < -0.18;
export function inZone(x, z, zone, r) { return dist2(x, z, Z[zone]) < r; }

/* ============ renderer, scene, camera ============ */
export const CURVE = { value: 0.0032 };
const TIME = { value: 0 };
let renderer, scene, camera, sun, hemi, clock;
const colliders = []; // {x, z, r}
const interactables = []; // {pos, r, label, kind, ref}
let player, playerParts, lanternLight, muisMaatje, arrow;
const npcs = {}; const foxes = []; const stars = []; const bubbles = []; let chest, mistGroup, mistParticles, shockwaves = [];
// (deeltjes: zie verderop)
let dark = 0;
const cam = { zoom: 1, shake: 0, target: V(0, 0, 0), intro: 0 };
export const input = { x: 0, z: 0, mag: 0, jump: false, jumpPressed: false, frozen: false };
let hooks = {};

export function curveMat(mat) {
  if (!mat || mat.userData.curved) return mat;
  mat.userData.curved = true;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uCurve = CURVE;
    sh.vertexShader = 'uniform float uCurve;\n' + sh.vertexShader.replace('#include project_vertex',
      '#include project_vertex\n mvPosition.y -= uCurve * mvPosition.z * mvPosition.z; gl_Position = projectionMatrix * mvPosition;');
  };
  mat.customProgramCacheKey = () => 'curve|' + prevKey();
  mat.needsUpdate = true;
  return mat;
}
function curveAll(obj) { obj.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(curveMat); }); }

export function toScreen(v) {
  const p = v.clone().applyMatrix4(camera.matrixWorldInverse);
  p.y -= CURVE.value * p.z * p.z;
  const behind = p.z > 0;
  p.applyMatrix4(camera.projectionMatrix);
  return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, behind };
}

export async function init(canvas, h, onProgress) {
  hooks = h;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#cdeeff', 38, 120);
  camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 400);
  clock = new THREE.Clock();
  setupPost();
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    if (composer) { composer.setSize(innerWidth, innerHeight); bloom.resolution.set(innerWidth / 2, innerHeight / 2); }
    PSCALE.value = innerHeight * renderer.getPixelRatio() * 1.3;
  });
  PSCALE.value = innerHeight * renderer.getPixelRatio() * 1.3;

  hemi = new THREE.HemisphereLight('#e3f4ff', '#b89a6c', 1.0); scene.add(hemi);
  sun = new THREE.DirectionalLight('#fff1dc', 2.9);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 90;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target);

  onProgress(0.05);
  buildSky(); buildTerrain(); onProgress(0.12);
  buildWater(); buildGrass(); onProgress(0.18);
  const names = Object.keys(M.RECIPES.models);
  const fromBlender = await M.preload(names, p => onProgress(0.18 + p * 0.6));
  buildProps(); onProgress(0.85);
  buildCharacters(); buildStars(); buildBubbles(); buildGates(); buildFx(); onProgress(0.95);
  curveAll(scene);
  return fromBlender;
}

/* ============ nabewerking: gloed, vignet, kleur ============ */
let composer = null, bloom = null, grade = null;
export const GFX = { fancy: true };
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.32 }, uSat: { value: 1.12 }, uDark: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig, uSat, uDark; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(l), c.rgb, uSat);
      vec2 d = vUv - 0.5; float v = 1.0 - dot(d, d) * (uVig + uDark * 0.9) * 2.0;
      c.rgb *= clamp(v, 0.0, 1.0);
      c.rgb += vec3(0.012, 0.008, 0.0); // een vleugje warmte
      gl_FragColor = c; }`
};
function setupPost() {
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.5, 0.45, 0.97);
    composer.addPass(bloom);
    grade = new ShaderPass(GradeShader); composer.addPass(grade);
    composer.addPass(new OutputPass());
  } catch (e) { console.warn('nabewerking uit', e); composer = null; GFX.fancy = false; }
}
export function setQuality(fancy) {
  GFX.fancy = fancy && !!composer;
  renderer.setPixelRatio(fancy ? Math.min(devicePixelRatio || 1, 1.75) : 1);
  renderer.setSize(innerWidth, innerHeight);
  if (composer) composer.setSize(innerWidth, innerHeight);
  PSCALE.value = innerHeight * renderer.getPixelRatio() * 1.3;
  if (glints) glints.visible = fancy;
}
function draw() { if (GFX.fancy && composer) composer.render(); else renderer.render(scene, camera); }

/* ============ lucht en wolken ============ */
function buildSky() {
  const g = new THREE.SphereGeometry(300, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#4aa8ff') }, mid: { value: new THREE.Color('#bfe8ff') }, bot: { value: new THREE.Color('#fff2d8') }, dark: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, mid, bot; uniform float dark; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.6)) : mix(mid, bot, pow(-h, 0.5));
      float s = pow(max(dot(normalize(vP), normalize(vec3(0.5,0.45,-0.6))), 0.0), 64.0); c += vec3(1.0,0.9,0.7)*s*0.6;
      c = mix(c, vec3(0.08,0.07,0.2), dark*0.8); gl_FragColor = vec4(c,1.0); }`
  });
  const sky = new THREE.Mesh(g, m); sky.name = 'sky'; sky.renderOrder = -1; sky.userData.noCurve = true;
  scene.add(sky); scene.userData.sky = sky;
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e8f2ff', emissiveIntensity: 0.55, roughness: 1 });
  const r = rng(7); scene.userData.clouds = [];
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 5; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), cloudMat);
      s.scale.setScalar(2 + r() * 2.5); s.position.set(j * 2.6 - 5 + r(), r() * 1.2, r() * 2 - 1); s.scale.y *= 0.65; c.add(s);
    }
    const a = r() * Math.PI * 2, d = 40 + r() * 70;
    c.position.set(Math.cos(a) * d, 24 + r() * 10, Math.sin(a) * d); c.userData.speed = 0.4 + r() * 0.5;
    scene.add(c); scene.userData.clouds.push(c);
  }
}

/* ============ terrein ============ */
let heightTex;
function buildTerrain() {
  const SIZE = 150, N = 220;
  const g = new THREE.PlaneGeometry(SIZE, SIZE, N, N); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const sand = new THREE.Color('#f3dfa5'), sandW = new THREE.Color('#d8c48c'), grass = new THREE.Color('#7fd36b'), grass2 = new THREE.Color('#5ebf5c'),
    pathC = new THREE.Color('#e9d2a3'), plein = new THREE.Color('#ead9bd'), rock = new THREE.Color('#9fa3b4'), lava = new THREE.Color('#6b5a6b'),
    shadowG = new THREE.Color('#3f4f6b'), klifG = new THREE.Color('#8fd07a'), deep = new THREE.Color('#b8a77a');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = height(x, z);
    pos.setY(i, Math.max(h, -4));
    const n = 0.5 + 0.5 * Math.sin(x * 0.37 + Math.sin(z * 0.23) * 2) * Math.cos(z * 0.31);
    c.copy(grass).lerp(grass2, n * 0.8);
    const pd = pathDist(x, z);
    if (pd < 1.3 && h > 0.3) c.lerp(pathC, smooth(1.3, 0.7, pd));
    if (Math.hypot(x, z) < 6.5) c.lerp(plein, smooth(6.5, 5.5, Math.hypot(x, z)));
    if (h < 0.45) c.lerp(sand, smooth(0.45, 0.2, h));
    if (h < -0.1) c.copy(sandW).lerp(deep, smooth(-0.1, -2.5, h));
    const dv = dist2(x, z, Z.vulkaan); if (dv < 5.5) c.lerp(lava, smooth(5.5, 2.5, dv));
    const dk = dist2(x, z, Z.klif); if (dk < LEDGE_R + 1.2 && h > 1.0) c.copy(h > 4.8 ? klifG : rock).lerp(grass2, h > 4.8 ? n * 0.4 : 0);
    if (inZone(x, z, 'schaduw', 10)) c.lerp(shadowG, smooth(10, 7, dist2(x, z, Z.schaduw)) * 0.85);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  mesh.receiveShadow = true; scene.add(mesh);

  // hoogtekaart voor het water (schuim langs de kust)
  const R = 256, data = new Uint8Array(R * R * 4);
  for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
    const x = (i / (R - 1) - 0.5) * 160, z = (j / (R - 1) - 0.5) * 160, h = height(x, z);
    const v = clamp((h + 4) / 6, 0, 1) * 255; const k = (j * R + i) * 4;
    data[k] = v; data[k + 1] = v; data[k + 2] = v; data[k + 3] = 255;
  }
  heightTex = new THREE.DataTexture(data, R, R); heightTex.magFilter = THREE.LinearFilter; heightTex.minFilter = THREE.LinearFilter; heightTex.needsUpdate = true;
}

/* ============ water ============ */
function waterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: TIME, uCurve: CURVE, hmap: { value: heightTex }, fogColor: { value: scene.fog.color }, fogNear: { value: 38 }, fogFar: { value: 120 }, dark: { value: 0 } },
    vertexShader: `uniform float uTime, uCurve; varying vec3 vW; varying float vFog;
      void main(){ vec3 p = position; vec4 w = modelMatrix * vec4(p,1.0);
        w.y += sin(w.x*0.35 + uTime*1.2)*0.06 + cos(w.z*0.3 + uTime*0.9)*0.06; vW = w.xyz;
        vec4 mv = viewMatrix * w; mv.y -= uCurve * mv.z * mv.z; vFog = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D hmap; uniform float uTime, fogNear, fogFar, dark; uniform vec3 fogColor; varying vec3 vW; varying float vFog;
      void main(){ vec2 uv = vW.xz/160.0 + 0.5; float h = texture2D(hmap, uv).r*6.0 - 4.0;
        float depth = clamp(-h/3.2, 0.0, 1.0);
        vec3 shallow = vec3(0.47,0.93,0.95), deep = vec3(0.13,0.55,0.86);
        vec3 c = mix(shallow, deep, smoothstep(0.0, 1.0, depth));
        float ripple = sin(vW.x*1.7 + uTime*1.5 + sin(vW.z*1.3)) * sin(vW.z*1.9 - uTime*1.1);
        c += vec3(0.08) * smoothstep(0.6, 1.0, ripple);
        float gl = sin(vW.x * 3.1 + uTime * 2.3) * sin(vW.z * 2.7 - uTime * 1.7) * sin((vW.x + vW.z) * 1.9 + uTime * 3.1);
        c += vec3(1.0, 0.95, 0.8) * smoothstep(0.86, 1.0, gl) * 2.2 * (1.0 - dark);
        float foam = smoothstep(0.42, 0.0, -h) * (0.55 + 0.45*sin(uTime*2.0 + length(vW.xz)*1.6));
        c = mix(c, vec3(1.0), clamp(foam, 0.0, 1.0)*0.85);
        float a = mix(0.72, 0.92, depth);
        c = mix(c, vec3(0.05,0.06,0.18), dark*0.6);
        float f = smoothstep(fogNear, fogFar, vFog); c = mix(c, fogColor, f);
        gl_FragColor = vec4(c, a); }`
  });
}
let waterMats = [];
function buildWater() {
  const m = waterMaterial(); m.userData.curved = true; waterMats.push(m);
  const w = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, 180, 180).rotateX(-Math.PI / 2), m);
  w.position.y = SEA; scene.add(w);
  const pm = waterMaterial(); pm.userData.curved = true; waterMats.push(pm);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(6.2, 40).rotateX(-Math.PI / 2), pm);
  pond.position.set(Z.vijver[0], -0.22, Z.vijver[1]); scene.add(pond);
}

/* ============ gras (wiegt in de wind) ============ */
function buildGrass() {
  const blade = new THREE.BufferGeometry();
  blade.setAttribute('position', new THREE.Float32BufferAttribute([-0.055, 0, 0, 0.055, 0, 0, 0, 0.34, 0], 3));
  blade.setAttribute('color', new THREE.Float32BufferAttribute([0.38, 0.7, 0.32, 0.38, 0.7, 0.32, 0.78, 0.97, 0.52], 3));
  blade.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = TIME;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include begin_vertex',
      `#include begin_vertex
       vec4 ip = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
       float sway = sin(uTime*1.8 + ip.x*0.45 + ip.z*0.3) * 0.5 + sin(uTime*3.1 + ip.x*1.3)*0.2;
       transformed.x += sway * 0.12 * position.y * 2.4; transformed.z += sway * 0.05 * position.y * 2.4;`);
  };
  mat.customProgramCacheKey = () => 'grass';
  const N = 14000, im = new THREE.InstancedMesh(blade, mat, N);
  const r = rng(42), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = V(0, 1, 0);
  let k = 0;
  for (let t = 0; t < N * 4 && k < N; t++) {
    const x = (r() - 0.5) * 108, z = (r() - 0.5) * 108, h = height(x, z);
    if (h < 0.35 || h > 4.8 || pathDist(x, z) < 1.4 || Math.hypot(x, z) < 7 || inZone(x, z, 'vulkaan', 5) || inZone(x, z, 'klif', LEDGE_R + 1)) continue;
    p.set(x, h - 0.02, z); q.setFromAxisAngle(up, r() * Math.PI); const sc = 0.7 + r() * 0.8; s.set(sc, sc * (0.8 + r() * 0.6), sc);
    m.compose(p, q, s); im.setMatrixAt(k++, m);
  }
  im.count = k; im.receiveShadow = true; scene.add(im);
}

/* ============ props ============ */
function place(name, x, z, opts = {}) {
  const o = M.get(name);
  o.position.set(x, opts.y !== undefined ? opts.y : height(x, z), z);
  o.rotation.y = opts.rot || 0; if (opts.scale) o.scale.setScalar(opts.scale);
  scene.add(o);
  if (opts.r) colliders.push({ x, z, r: opts.r * (opts.scale || 1) });
  return o;
}
function buildProps() {
  const r = rng(11);
  place('house', Z.huis[0], Z.huis[1], { rot: 0.35, r: 2.2 });
  interactables.push({ pos: V(Z.huis[0] + 0.7, 0, Z.huis[1] + 1.8), r: 1.8, kind: 'home', label: 'Kledingkast' });
  place('uilboom', Z.uilboom[0], Z.uilboom[1], { rot: -0.6, r: 1.4 });
  const mol = place('molen', Z.molen[0], Z.molen[1], { rot: 1.1, r: 1.6 }); scene.userData.blades = mol.userData.parts.blades;
  place('board', -1.5, 5.2, { rot: 0.1, r: 0.9 });
  interactables.push({ pos: V(-1.5, 0, 6.4), r: 1.8, kind: 'board', label: 'Missiebord' });
  place('dock', Z.vijver[0], Z.vijver[1] - 6.3, { y: 0.15 });
  interactables.push({ pos: V(Z.vijver[0], 0, Z.vijver[1] - 3.2), r: 1.6, kind: 'rust', label: 'Rust bij de vijver' });
  [[4, 4], [-4, 4.5], [4.5, -3.5], [-4.5, -4]].forEach(([x, z]) => place('lamp', x, z, { r: 0.3 }));
  [[-9.5, 6.8, 0.35], [-11.3, 6.1, 0.35], [-4.6, 7.3, 0.35]].forEach(([x, z, a]) => place('fence', x, z, { rot: a, r: 0.4 }));
  place('lavarock', Z.vulkaan[0] + 3.2, Z.vulkaan[1] + 1.5, { r: 1 });
  place('lavarock', Z.vulkaan[0] - 3.5, Z.vulkaan[1] - 0.5, { r: 1, scale: 0.8 });
  chest = place('chest', Z.eiland[0] + 0.8, Z.eiland[1] + 0.6, { rot: -2.3, r: 0.6 });
  interactables.push({ pos: V(Z.eiland[0] + 0.8, 0, Z.eiland[1] + 0.6), r: 1.8, kind: 'chest', label: 'Schatkist openen' });
  if (S.chestOpen) chest.userData.parts.lid.rotation.x = -1.6;

  const trees = [], pines = [], darks = [], bushes = [], rocks = [], flowers = [], shrooms = [];
  const ok = (x, z, pad = 0) => {
    const h = height(x, z);
    if (h < 0.5 || h > 4.6 || pathDist(x, z) < 2 + pad || Math.hypot(x, z) < 13) return false;
    for (const k of ['molen', 'vulkaan', 'vijver', 'klif', 'huis', 'uilboom', 'mist']) if (inZone(x, z, k, k === 'klif' ? LEDGE_R + 2 : 7)) return false;
    return !colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 1.2);
  };
  for (let i = 0; i < 400 && trees.length + pines.length < 70; i++) {
    const a = r() * Math.PI * 2, d = 14 + r() * 36, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (!ok(x, z, 1) || inZone(x, z, 'schaduw', 10)) continue;
    const s = 0.85 + r() * 0.4, rec = { pos: V(x, height(x, z) - 0.1, z), rot: r() * 6.3, scale: s };
    (z < -12 && r() < 0.7 ? pines : trees).push(rec); colliders.push({ x, z, r: 0.55 * s });
  }
  // Vossenbos: extra dicht
  for (let i = 0; i < 60; i++) {
    const a = r() * 6.3, d = 4 + r() * 8, x = Z.vossenbos[0] + Math.cos(a) * d, z = Z.vossenbos[1] + Math.sin(a) * d;
    if (height(x, z) < 0.5 || colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 2.2)) continue;
    const s = 0.9 + r() * 0.3; trees.push({ pos: V(x, height(x, z) - 0.1, z), rot: r() * 6, scale: s }); colliders.push({ x, z, r: 0.55 * s });
  }
  // Schaduwbos
  for (let i = 0; i < 80; i++) {
    const a = r() * 6.3, d = 6.8 + r() * 3.8, x = Z.schaduw[0] + Math.cos(a) * d, z = Z.schaduw[1] + Math.sin(a) * d;
    if (height(x, z) < 0.4 || colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 2.4)) continue;
    if (Math.atan2(z - Z.schaduw[1], x - Z.schaduw[0]) > -1.3 && Math.atan2(z - Z.schaduw[1], x - Z.schaduw[0]) < -0.2) continue; // pad naar binnen
    const s = 0.9 + r() * 0.4; darks.push({ pos: V(x, height(x, z) - 0.1, z), rot: r() * 6, scale: s }); colliders.push({ x, z, r: 0.6 * s });
  }
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.3, x = Z.schaduw[0] + Math.cos(a) * 2.2, z = Z.schaduw[1] + Math.sin(a) * 2.2; place('crystal', x, z, { rot: a, scale: 0.9 + r() * 0.5 }); }
  for (let i = 0; i < 60; i++) {
    const a = r() * 6.3, d = 12 + r() * 40, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (!ok(x, z)) continue; bushes.push({ pos: V(x, height(x, z), z), rot: r() * 6, scale: 0.7 + r() * 0.5 }); colliders.push({ x, z, r: 0.5 });
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * 6.3, d = 20 + r() * 34, x = Math.cos(a) * d, z = Math.sin(a) * d; const h = height(x, z);
    if (h < -0.2 || h > 4 || pathDist(x, z) < 2 || inZone(x, z, 'klif', LEDGE_R + 1)) continue;
    const s = 0.6 + r() * 0.9; rocks.push({ pos: V(x, h - 0.1, z), rot: r() * 6, scale: s }); colliders.push({ x, z, r: 0.65 * s });
  }
  for (let i = 0; i < 900 && flowers.length < 220; i++) {
    const x = (r() - 0.5) * 100, z = (r() - 0.5) * 100; const h = height(x, z);
    if (h < 0.5 || h > 4 || pathDist(x, z) < 1.5 || Math.hypot(x, z) < 6.5 || inZone(x, z, 'schaduw', 10)) continue;
    flowers.push({ pos: V(x, h, z), rot: r() * 6, scale: 0.8 + r() * 0.6 });
  }
  for (let i = 0; i < 40; i++) { const a = r() * 6.3, d = r() * 8, x = Z.schaduw[0] + Math.cos(a) * d, z = Z.schaduw[1] + Math.sin(a) * d; shrooms.push({ pos: V(x, height(x, z), z), rot: r() * 6, scale: 0.8 + r() }); }
  // rotswanden rond de Hoge Klif
  const cliffRocks = [];
  for (let i = 0; i < 30; i++) {
    const a = i / 30 * Math.PI * 2, f = Math.cos(a - Math.atan2(-Z.klif[1], -Z.klif[0]));
    const ring = (rad, ys, sc) => ys.forEach(y => cliffRocks.push({ pos: V(Z.klif[0] + Math.cos(a + r() * 0.1) * rad, y, Z.klif[1] + Math.sin(a + r() * 0.1) * rad), rot: r() * 6, scale: sc + r() * 0.5 }));
    if (f > 0.45) { ring(LEDGE_R + 0.2, [-0.2, 1.1], 1.6); ring(KLIF_R + 0.3, [2.6, 3.8], 1.6); }
    else ring(KLIF_R + 0.4, [-0.2, 1.5, 3.2], 2.1);
  }
  scene.add(M.instanced('rock', cliffRocks));
  scene.add(M.instanced('tree', trees), M.instanced('pine', pines), M.instanced('darktree', darks), M.instanced('bush', bushes),
    M.instanced('rock', rocks), M.instanced('flower', flowers), M.instanced('mushroom', shrooms));
}

/* ============ personages ============ */
function makeChar(name, x, z, scale = 1) {
  const o = M.get(name); o.position.set(x, height(x, z), z); o.scale.setScalar(scale); scene.add(o);
  o.userData.anim = { t: Math.random() * 10, walk: 0, talk: 0 };
  return o;
}
function marker() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#fff'; g.stroke();
  g.fillStyle = '#5b3b00'; g.font = '900 84px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.scale.setScalar(0.75); s.renderOrder = 10;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: '#ffd23f', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
  glow.scale.setScalar(2.2); glow.renderOrder = 9; s.add(glow); s.userData.glow = glow;
  return s;
}
function buildCharacters() {
  player = makeChar('beer', S.pos ? S.pos[0] : Z.huis[0] + 1, S.pos ? S.pos[1] : Z.huis[1] + 3.5);
  playerParts = player.userData.parts;
  player.userData.vel = V(0, 0, 0); player.userData.ground = true; player.userData.safe = player.position.clone(); player.userData.jumps = 0;
  applyLook();
  // silhouet: blijft zichtbaar als een boom voor de beer staat
  const xray = new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.45, depthWrite: false, depthFunc: THREE.GreaterDepth });
  curveMat(xray);
  const meshes = []; player.traverse(o => { if (o.isMesh) meshes.push(o); });
  meshes.forEach(o => {
    // eigen materiaal voor de speler; 'transparent' zodat het silhouet vóór de beer getekend wordt
    o.material = o.material.clone(); o.material.userData = {}; curveMat(o.material);
    if (!o.material.transparent) { o.material.transparent = true; o.material.opacity = 1; }
    o.renderOrder = 10;
    const g = new THREE.Mesh(o.geometry, xray); g.renderOrder = 5; g.raycast = () => {}; g.castShadow = false; o.add(g);
  });
  lanternLight = new THREE.PointLight('#ffd27a', 0, 9, 1.6); lanternLight.position.set(0.5, 1.0, 0.4); player.add(lanternLight);

  for (const [id, n] of Object.entries(NPCS)) {
    const o = makeChar(n.model, n.home[0], n.home[1]); o.rotation.y = n.face;
    const mk = marker(); mk.position.set(0, id === 'draak' ? 2.6 : id === 'muis' ? 1.6 : 2.2, 0); mk.visible = false; o.add(mk);
    npcs[id] = { obj: o, id, marker: mk, face: n.face };
    colliders.push({ x: n.home[0], z: n.home[1], r: id === 'draak' ? 0.8 : 0.55 });
    interactables.push({ pos: o.position, r: 2.4, kind: 'npc', ref: id, label: 'Praat met ' + n.name });
  }
  // Plaagvossen in het bos
  const r = rng(hashStr(today()));
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * 6.3 + 0.5, x = Z.vossenbos[0] + Math.cos(a) * 6, z = Z.vossenbos[1] + Math.sin(a) * 6;
    const o = makeChar('vos', x, z, 0.85);
    foxes.push({ obj: o, home: V(x, 0, z), target: V(x, 0, z), wait: r() * 3, cool: 0, beaten: i < S.side.foxes, calm: 0, id: i });
    if (i < S.side.foxes) o.visible = false;
  }
  // Muis-maatje (armband)
  muisMaatje = makeChar('muis', player.position.x - 1.5, player.position.z, 0.55); muisMaatje.visible = has('armband');
  // richtingspijl naar je missie
  const ag = new THREE.ConeGeometry(0.22, 0.5, 4); ag.rotateX(Math.PI / 2);
  arrow = new THREE.Mesh(ag, new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#ffb000', emissiveIntensity: 0.6 }));
  arrow.visible = false; scene.add(arrow);
}
export function applyLook() {
  const furs = { bruin: ['#9a6332', '#e8bf8a'], ijs: ['#f2f4ff', '#ffffff'], panda: ['#f4f4f4', '#2b2b33'], nacht: ['#3d3a6b', '#9d8cff'], goud: ['#ffc94a', '#fff0b5'], roze: ['#ff9fcf', '#fff0f8'] };
  const [fur, belly] = furs[S.fur] || furs.bruin;
  const REF_FUR = new THREE.Color('#9a6332'), REF_BELLY = new THREE.Color('#e8bf8a');
  const close = (c, r) => Math.abs(c.r - r.r) + Math.abs(c.g - r.g) + Math.abs(c.b - r.b) < 0.03;
  player.traverse(o => {
    if (!o.isMesh || !o.material || !o.material.color) return;
    if (o.userData.kind === undefined) {
      const c = o.material.color;
      o.userData.kind = close(c, REF_FUR) ? 'fur' : close(c, REF_BELLY) ? 'belly' : '';
      if (o.userData.kind) { o.material = o.material.clone(); o.material.userData = {}; curveMat(o.material); }
    }
    if (o.userData.kind === 'fur') o.material.color.set(fur);
    if (o.userData.kind === 'belly') o.material.color.set(belly);
  });
  for (const [n, p] of Object.entries(playerParts)) {
    if (!n.startsWith('acc_')) continue;
    let item = n.slice(4).replace(/(L|R)$/, '');
    let vis = S.items.includes(item);
    if (item === 'hoed' && S.items.includes('kroon')) vis = false;
    p.visible = vis;
  }
  if (muisMaatje) muisMaatje.visible = has('armband');
}
// glTF-meshes hebben materialen per primitief; bont herkennen we aan de kleur
function matHex(m) { return '#' + m.color.getHexString(); }

/* ============ moedsterren ============ */
export const STAR_SPOTS = [
  [2, 9], [-9, -6], [10, 3], // dorp
  [-34, 9], [-28, -1], [-36, 0], // molen
  [0, -34, 3.9], [5, -29], [-5, -38], // vulkaan
  [36, 12], [28, 3], [37, 4], // vossenbos
  [2, 22.6, 0.6], [8, 31], // vijver
  [-46, 10], [20, 40], [-10, 46], [46, 12], // stranden
  [-26, 27], [-30, 22], [-21, 31], [-29, 31], // schaduwbos
  [-34, -27], [-38, -31], [-31, -32], // mistpad
  [26 + Math.cos(2.36) * 7.6, -26 + Math.sin(2.36) * 7.6, 3.5], [26, -26], [28, -23], // klif
  [45, -47], [43.5, -45.5] // eilandje
];
function buildStars() {
  STAR_SPOTS.forEach((s, i) => {
    if (S.stars.includes(i)) return;
    const o = M.get('star'); const h = s[2] !== undefined ? Math.max(s[2], height(s[0], s[1])) : height(s[0], s[1]);
    o.position.set(s[0], h + 0.9, s[1]); o.scale.setScalar(0.85); scene.add(o);
    o.traverse(m => { if (m.isMesh && m.material.emissive) { m.material = m.material.clone(); m.material.userData = {}; m.material.emissiveIntensity = 1.25; } });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: '#ffd23f', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.setScalar(2.2); o.add(halo);
    stars.push({ obj: o, id: i, base: o.position.y, halo });
  });
}

/* ============ gedachten-bubbels ============ */
function bubbleTex(text, good) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const grd = g.createRadialGradient(200, 90, 20, 256, 128, 240);
  grd.addColorStop(0, good ? 'rgba(220,255,235,0.98)' : 'rgba(230,226,245,0.98)'); grd.addColorStop(1, good ? 'rgba(80,220,150,0.9)' : 'rgba(120,110,160,0.92)');
  g.fillStyle = grd; g.beginPath(); g.ellipse(256, 128, 245, 118, 0, 0, 7); g.fill();
  g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.stroke();
  g.fillStyle = good ? '#0d4d2c' : '#2d2346'; g.font = '800 44px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const words = (good ? '💚 ' : '🌧️ ') + text, lines = []; let cur = '';
  for (const w of words.split(' ')) { if (g.measureText(cur + ' ' + w).width > 400 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
  lines.push(cur); lines.forEach((l, i) => g.fillText(l, 256, 128 + (i - (lines.length - 1) / 2) * 50));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildBubbles() {
  const r = rng(hashStr('bub' + today()));
  for (let i = 0; i < 8; i++) {
    if (S.side.bubbles.includes(i)) continue;
    let x, z, tries = 0;
    do { const a = r() * 6.3, d = 9 + r() * 34; x = Math.cos(a) * d; z = Math.sin(a) * d; tries++; }
    while ((height(x, z) < 0.5 || inZone(x, z, 'schaduw', 11) || inZone(x, z, 'mist', 9) || inZone(x, z, 'klif', LEDGE_R + 1) || inZone(x, z, 'vulkaan', 6)) && tries < 50);
    const good = r() < 0.5; const g = good ? null : GEMEEN[Math.floor(r() * GEMEEN.length)];
    const text = good ? KRACHT[Math.floor(r() * KRACHT.length)] : g[0];
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(text, good), transparent: true, depthWrite: false }));
    s.scale.set(2.6, 1.3, 1); s.position.set(x, height(x, z) + 1.6, z); scene.add(s);
    bubbles.push({ obj: s, id: i, good, text, flip: g ? g[1] : null, base: s.position.y });
  }
}

/* ============ poorten: mist ============ */
function softDot() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t;
}
const DOT = softDot();
function buildGates() {
  mistGroup = new THREE.Group(); scene.add(mistGroup);
  if (!S.mistGone) {
    const n = 420, pos = new Float32Array(n * 3), r = rng(5);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.3, d = 8.5 + r() * 1.8;
      const x = Z.mist[0] + Math.cos(a) * d, z = Z.mist[1] + Math.sin(a) * d;
      pos[i * 3] = x; pos[i * 3 + 1] = height(x, z) + 0.3 + r() * 3.5; pos[i * 3 + 2] = z;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    mistParticles = new THREE.Points(g, new THREE.PointsMaterial({ size: 3.2, map: DOT, transparent: true, opacity: 0.85, depthWrite: false, color: '#f4f6ff' }));
    mistGroup.add(mistParticles);
  }
}

/* ============ deeltjes (gloed en stof) ============ */
let fx, soft, glints, butterflies = [], rings = [];
function particleSystem(n, additive) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3).fill(-999), 3));
  g.setAttribute('pcolor', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n), 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uCurve: CURVE, map: { value: DOT }, uScale: PSCALE },
    vertexShader: `attribute vec3 pcolor; attribute float alpha; attribute float size; uniform float uCurve, uScale; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); mv.y -= uCurve * mv.z * mv.z; gl_Position = projectionMatrix * mv;
        gl_PointSize = size * uScale / max(0.1, -mv.z); vC = pcolor; vA = alpha; }`,
    fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA;
      void main(){ float a = texture2D(map, gl_PointCoord).a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC, a); }`
  });
  m.userData.curved = true;
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  return { pts, n, i: 0, life: new Float32Array(n), max: new Float32Array(n), vel: new Float32Array(n * 3), size0: new Float32Array(n), grow: new Float32Array(n), grav: new Float32Array(n) };
}
const PSCALE = { value: 600 };
function buildFx() {
  fx = particleSystem(900, true);
  soft = particleSystem(500, false);
  // zwevende glinsters (pollen in de zon, vuurvliegjes in het donker)
  const n = 260, g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 60; pos[i * 3 + 1] = Math.random() * 6; pos[i * 3 + 2] = (Math.random() - .5) * 60; ph[i] = Math.random() * 100; }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: TIME, uCurve: CURVE, uCenter: { value: V(0, 0, 0) }, uDark: { value: 0 }, map: { value: DOT }, uScale: PSCALE },
    vertexShader: `attribute float phase; uniform float uTime, uCurve, uDark, uScale; uniform vec3 uCenter; varying float vA;
      void main(){ vec3 p = position;
        p.x += sin(uTime * 0.23 + phase) * 2.0; p.z += cos(uTime * 0.19 + phase * 1.3) * 2.0; p.y += sin(uTime * 0.5 + phase) * 0.6;
        p.xz = mod(p.xz - uCenter.xz + 30.0, 60.0) - 30.0 + uCenter.xz; p.y += uCenter.y + 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); mv.y -= uCurve * mv.z * mv.z; gl_Position = projectionMatrix * mv;
        float tw = 0.5 + 0.5 * sin(uTime * (1.5 + fract(phase) * 2.0) + phase * 7.0);
        vA = tw * (0.35 + uDark * 0.65) * smoothstep(40.0, 10.0, -mv.z);
        gl_PointSize = (0.07 + 0.08 * uDark) * uScale * (0.6 + tw) / max(0.1, -mv.z); }`,
    fragmentShader: `uniform sampler2D map; uniform float uDark; varying float vA;
      void main(){ float a = texture2D(map, gl_PointCoord).a * vA; if (a < 0.01) discard;
        gl_FragColor = vec4(mix(vec3(1.0, 0.96, 0.8), vec3(0.75, 1.0, 0.45), uDark) * 1.6, a); }`
  });
  m.userData.curved = true;
  glints = new THREE.Points(g, m); glints.frustumCulled = false; scene.add(glints);
  // vlinders
  const cols = ['#ff8fcf', '#ffd23f', '#8fd3ff', '#ffffff', '#c49bff', '#ff9f5a'];
  const wing = new THREE.CircleGeometry(0.13, 10); wing.scale(1, 0.75, 1);
  const r = rng(99);
  for (let i = 0; i < 18; i++) {
    let x, z; do { const a = r() * 6.3, d = 8 + r() * 38; x = Math.cos(a) * d; z = Math.sin(a) * d; } while (height(x, z) < 0.5 || inZone(x, z, 'schaduw', 11));
    const mat = new THREE.MeshStandardMaterial({ color: cols[i % cols.length], emissive: cols[i % cols.length], emissiveIntensity: 0.35, side: THREE.DoubleSide, roughness: 0.6 });
    const b = new THREE.Group(), L = new THREE.Mesh(wing, mat), R = new THREE.Mesh(wing, mat);
    L.position.x = 0.11; R.position.x = -0.11; L.rotation.x = R.rotation.x = -Math.PI / 2;
    const pl = new THREE.Group(), pr = new THREE.Group(); pl.add(L); pr.add(R); b.add(pl, pr);
    b.position.set(x, height(x, z) + 1, z); scene.add(b);
    butterflies.push({ obj: b, L: pl, R: pr, home: V(x, 0, z), target: V(x, 0, z), t: r() * 10, sp: 1.2 + r() });
  }
}
function emit(sys, p, color, count, speed, up, size, life, grow = 0, grav = 4) {
  const pos = sys.pts.geometry.attributes.position, col = sys.pts.geometry.attributes.pcolor, c = new THREE.Color(color);
  for (let k = 0; k < count; k++) {
    const i = sys.i = (sys.i + 1) % sys.n;
    pos.setXYZ(i, p.x, p.y, p.z); col.setXYZ(i, c.r, c.g, c.b);
    const a = Math.random() * 6.3, s = speed * (0.3 + Math.random() * 0.7);
    sys.vel[i * 3] = Math.cos(a) * s; sys.vel[i * 3 + 1] = up * (0.5 + Math.random()); sys.vel[i * 3 + 2] = Math.sin(a) * s;
    sys.life[i] = sys.max[i] = life * (0.7 + Math.random() * 0.6); sys.size0[i] = size * (0.7 + Math.random() * 0.6); sys.grow[i] = grow; sys.grav[i] = grav;
  }
}
export function burst(p, color = '#ffd23f', count = 24, speed = 4, up = 2) { emit(fx, p, color, count, speed, up, 0.42, 0.95); }
export function puff(p, color = '#efe3c8', count = 4, speed = 0.6, up = 0.5, size = 0.55) { emit(soft, p, color, count, speed, up, size, 0.7, 1.6, -0.4); }
function stepSys(sys, dt) {
  const pos = sys.pts.geometry.attributes.position, al = sys.pts.geometry.attributes.alpha, sz = sys.pts.geometry.attributes.size;
  for (let i = 0; i < sys.n; i++) {
    if (sys.life[i] <= 0) { if (al.getX(i) !== 0) { al.setX(i, 0); pos.setXYZ(i, -999, -999, -999); } continue; }
    sys.life[i] -= dt;
    sys.vel[i * 3 + 1] -= sys.grav[i] * dt;
    sys.vel[i * 3] *= 0.985; sys.vel[i * 3 + 2] *= 0.985;
    pos.setXYZ(i, pos.getX(i) + sys.vel[i * 3] * dt, pos.getY(i) + sys.vel[i * 3 + 1] * dt, pos.getZ(i) + sys.vel[i * 3 + 2] * dt);
    const f = Math.max(0, sys.life[i] / sys.max[i]);
    al.setX(i, Math.min(1, f * 2.2)); sz.setX(i, sys.size0[i] * (1 + (1 - f) * sys.grow[i]) * (0.6 + 0.4 * Math.min(1, f * 3)));
  }
  pos.needsUpdate = true; al.needsUpdate = true; sz.needsUpdate = true;
}
function updateFx(dt) {
  stepSys(fx, dt); stepSys(soft, dt);
  if (glints) { glints.material.uniforms.uCenter.value.copy(cam.target); glints.material.uniforms.uDark.value = dark; }
  for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; r.m.scale.setScalar(0.3 + r.t * 5); r.m.material.opacity = 0.9 * (1 - r.t / 0.5); if (r.t > 0.5) { scene.remove(r.m); rings.splice(i, 1); } }
}
function ring(p, color) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.copy(p); m.lookAt(camera.position); curveMat(m.material); scene.add(m); rings.push({ m, t: 0 });
}
// Vuurwerk boven het eiland (na een hoofdmissie)
export function fireworks(n = 9) {
  const cols = ['#ff5d8f', '#ffd23f', '#5de2ff', '#9b7bff', '#7cf0a8', '#ff9f5a'];
  for (let k = 0; k < n; k++) setTimeout(() => {
    const p = player.position.clone().add(V((Math.random() - .5) * 14, 7 + Math.random() * 5, -4 - Math.random() * 6));
    const c = cols[k % cols.length];
    emit(fx, p, c, 70, 7, 1.5, 0.55, 1.6, 0, 2.2); emit(fx, p, '#ffffff', 12, 2, 1, 0.8, 0.5, 0, 0);
    SND.pop();
  }, k * 330);
}

function updateButterflies(dt) {
  const pp = player ? player.position : V(0, 0, 0);
  for (const b of butterflies) {
    const o = b.obj; if (o.position.distanceTo(pp) > 45) continue;
    b.t += dt;
    const f = Math.sin(b.t * 18) * 1.1; b.L.rotation.z = f; b.R.rotation.z = -f;
    const dx = b.target.x - o.position.x, dz = b.target.z - o.position.z, d = Math.hypot(dx, dz);
    if (d < 0.6 || b.t % 7 < dt) { const a = Math.random() * 6.3, r = 2 + Math.random() * 5; b.target.set(b.home.x + Math.cos(a) * r, 0, b.home.z + Math.sin(a) * r); }
    o.position.x += dx / (d || 1) * b.sp * dt; o.position.z += dz / (d || 1) * b.sp * dt;
    o.position.y = height(o.position.x, o.position.z) + 0.9 + Math.sin(b.t * 2.3) * 0.35;
    o.rotation.y = Math.atan2(dx, dz);
    // vlucht een beetje als de beer dichtbij komt
    if (o.position.distanceTo(pp) < 1.6) { b.target.set(o.position.x + (o.position.x - pp.x) * 3, 0, o.position.z + (o.position.z - pp.z) * 3); }
  }
}

/* ============ acties van superkrachten ============ */
export function roar() {
  SND.roar(); cam.shake = 0.5;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.9 }));
  ring.position.copy(player.position).add(V(0, 0.6, 0)); curveMat(ring.material); scene.add(ring); shockwaves.push({ m: ring, t: 0 });
  burst(player.position.clone().add(V(0, 1, 0)), '#ffcf66', 40, 7, 1);
  foxes.forEach(f => { if (f.obj.position.distanceTo(player.position) < 8) { f.scared = 1.2; } });
  if (!S.mistGone && dist2(player.position.x, player.position.z, Z.mist) < 15) {
    S.mistGone = true; save();
    hooks.toast && hooks.toast('💨 Je BRUL blaast de mist weg! Het Mistpad is open.');
    hooks.gateOpened && hooks.gateOpened('mist');
  }
}
export function flute() {
  SND.flute();
  burst(player.position.clone().add(V(0, 1.5, 0)), '#ff9fcf', 30, 2, 2.5);
  foxes.forEach(f => { if (f.obj.position.distanceTo(player.position) < 14) f.calm = 30; });
  hooks.toast && hooks.toast('🎶 De vossen in de buurt worden even heel lief.');
}
export function teleport(where) {
  const spots = { huis: [Z.huis[0] + 1, Z.huis[1] + 3.6], uil: [3.5, -4], muis: [-25, 7.5], draak: [2, -27], vos: [29, 5], vijver: [2, 19.5] };
  const s = spots[where]; if (!s) return;
  burst(player.position.clone().add(V(0, 1, 0)), '#9be7ff', 40, 3, 3);
  player.position.set(s[0], height(s[0], s[1]), s[1]); player.userData.vel.set(0, 0, 0);
  cam.snap = true; SND.magic();
  setTimeout(() => burst(player.position.clone().add(V(0, 1, 0)), '#9be7ff', 40, 3, 3), 50);
}
export function openChest() {
  if (S.chestOpen) return false;
  S.chestOpen = true; save();
  chest.userData.openT = 0; SND.magic(); burst(chest.position.clone().add(V(0, 1, 0)), '#ffd23f', 80, 5, 4);
  return true;
}

/* ============ update-lus ============ */
let questTarget = null;
export function setQuestTarget(npcId, show) {
  for (const n of Object.values(npcs)) n.marker.visible = false;
  questTarget = npcId ? npcs[npcId] : null;
  if (questTarget && show) questTarget.marker.visible = true;
}
export function getState() {
  return {
    player: player.position, rot: player.rotation.y, npcs, foxes, stars, bubbles, questTarget, dark,
    interact: nearestInteract()
  };
}
let lastInteract = null;
function nearestInteract() {
  let best = null, bd = 1e9;
  for (const it of interactables) {
    const d = Math.hypot(it.pos.x - player.position.x, it.pos.z - player.position.z);
    if (d < it.r && d < bd) { best = it; bd = d; }
  }
  return best;
}
export function facePlayer(npcId) {
  const n = npcs[npcId]; if (!n) return;
  const o = n.obj; o.userData.faceTo = Math.atan2(player.position.x - o.position.x, player.position.z - o.position.z);
  player.userData.faceTo = Math.atan2(o.position.x - player.position.x, o.position.z - player.position.z);
  n.obj.userData.anim.talk = 3;
}

const tmp = V(0, 0, 0);
function animChar(o, dt, moving, speed) {
  const a = o.userData.anim, p = o.userData.parts; a.t += dt;
  a.walk = lerp(a.walk, moving ? 1 : 0, Math.min(1, dt * 8));
  const f = a.t * (6 + speed * 1.4), w = a.walk;
  const sw = Math.sin(f) * 0.7 * w;
  if (p.legL) p.legL.rotation.x = sw; if (p.legR) p.legR.rotation.x = -sw;
  if (p.armL) { p.armL.rotation.x = -sw * 0.8; p.armL.rotation.z = -0.08 - 0.06 * Math.sin(a.t * 2) * (1 - w); }
  if (p.armR) { p.armR.rotation.x = sw * 0.8; p.armR.rotation.z = 0.08 + 0.06 * Math.sin(a.t * 2) * (1 - w); }
  if (p.body) { p.body.position.y = (p.body.userData.y0 ??= p.body.position.y) + Math.abs(Math.cos(f)) * 0.06 * w + Math.sin(a.t * 2.2) * 0.015 * (1 - w); p.body.rotation.z = Math.sin(f) * 0.06 * w; }
  if (p.head) { p.head.rotation.z = Math.sin(a.t * 1.3) * 0.04 + (a.talk > 0 ? Math.sin(a.t * 9) * 0.05 : 0); p.head.rotation.x = a.talk > 0 ? Math.sin(a.t * 7) * 0.06 : 0; }
  if (p.tail) p.tail.rotation.y = Math.sin(a.t * 3) * 0.25;
  if (p.wingL) { p.wingL.rotation.y = Math.sin(a.t * 4) * 0.2; p.wingR.rotation.y = -Math.sin(a.t * 4) * 0.2; }
  if (p.acc_cape) p.acc_cape.rotation.x = 0.12 + w * 0.35 + Math.sin(a.t * 5) * 0.06 * (0.3 + w);
  if (p.acc_ballon) p.acc_ballon.rotation.z = Math.sin(a.t * 1.7) * 0.08;
  if (p.acc_vleugels) p.acc_vleugels.rotation.y = Math.sin(a.t * 10) * 0.12;
  a.talk = Math.max(0, a.talk - dt);
}

let saveT = 0, trailT = 0, stepT = 0, ambientT = 0;
export function update(dt) {
  dt = Math.min(dt, 0.05);
  TIME.value += dt;
  const u = player.userData, pos = player.position;
  const L = legend() ? 1.2 : 1;

  /* --- beweging --- */
  let mx = input.frozen ? 0 : input.x, mz = input.frozen ? 0 : input.z;
  const mag = Math.min(1, Math.hypot(mx, mz));
  const sprint = has('laarzen') && mag > 0.92;
  const speed = (sprint ? 8.2 : 4.6) * (has('sjaal') ? 1.1 : 1) * (sprint ? L : 1);
  const want = V(mx, 0, mz).multiplyScalar(speed);
  const acc = u.ground ? 14 : 5;
  u.vel.x = lerp(u.vel.x, want.x, Math.min(1, acc * dt)); u.vel.z = lerp(u.vel.z, want.z, Math.min(1, acc * dt));
  if (mag > 0.08) u.faceTo = Math.atan2(mx, mz);
  if (u.faceTo !== undefined) {
    let d = u.faceTo - player.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    player.rotation.y += d * Math.min(1, dt * 12);
  }
  // springen
  if (input.jumpPressed && !input.frozen) {
    input.jumpPressed = false;
    const maxJumps = has('vleugels') ? 2 : 1;
    if (u.ground || u.jumps < maxJumps) {
      const jv = (has('cape') ? 10.8 : 7.2) * (u.ground ? 1 : 0.85) * Math.sqrt(L);
      u.vel.y = jv; u.ground = false; u.jumps++; SND.jump();
      if (u.jumps === 2) { burst(pos.clone().add(V(0, 0.6, 0)), '#ffc4f0', 20, 2.5, 0.5); ring(pos.clone().add(V(0, 0.4, 0)), '#ffc4f0'); }
      else puff(pos.clone().add(V(0, 0.05, 0)), '#f1e6cc', 5, 1.2, 0.2, 0.5);
    }
  }
  input.jumpPressed = false;
  u.vel.y -= 24 * dt;
  const gliding = has('ballon') && !u.ground && input.jump && u.vel.y < 0;
  if (gliding) { u.vel.y = Math.max(u.vel.y, -1.3); }
  // horizontaal bewegen met botsingen
  const nx = pos.x + u.vel.x * dt, nz = pos.z + u.vel.z * dt;
  const tryMove = (x, z) => {
    const gh = height(x, z);
    if (gh - pos.y > 0.55) return false; // te hoog om op te stappen
    for (const c of colliders) if (Math.hypot(c.x - x, c.z - z) < c.r + 0.42) return false;
    if (Math.hypot(x, z) > 72) return false;
    // poorten
    if (!has('lantaarn') && inZone(x, z, 'schaduw', 9.6) && !inZone(pos.x, pos.z, 'schaduw', 9.6)) { hooks.blocked && hooks.blocked('schaduw'); return false; }
    if (!S.mistGone && inZone(x, z, 'mist', 9.2) && !inZone(pos.x, pos.z, 'mist', 9.2)) { hooks.blocked && hooks.blocked('mist'); return false; }
    return true;
  };
  if (tryMove(nx, nz)) { pos.x = nx; pos.z = nz; }
  else if (tryMove(nx, pos.z)) { pos.x = nx; u.vel.z *= 0.5; }
  else if (tryMove(pos.x, nz)) { pos.z = nz; u.vel.x *= 0.5; }
  else { u.vel.x *= 0.2; u.vel.z *= 0.2; }
  // verticaal
  pos.y += u.vel.y * dt;
  const gh = height(pos.x, pos.z);
  if (pos.y <= gh) {
    if (!u.ground && u.vel.y < -6) { SND.land(); puff(pos.clone().add(V(0, 0.1, 0)), '#f1e6cc', 10, 1.8, 0.3, 0.7); }
    pos.y = gh; u.vel.y = 0; u.ground = true; u.jumps = 0;
  } else if (pos.y - gh > 0.08) { u.ground = false; if (u.jumps === 0) u.jumps = 1; }
  // water
  if (u.ground && gh < -0.18) {
    SND.splash(); burst(pos.clone(), '#bff3ff', 30, 3, 3);
    pos.copy(u.safe); u.vel.set(0, 0, 0);
    hooks.toast && hooks.toast('💦 Oei, nat! Beren kunnen hier niet zwemmen.' + (has('ballon') ? '' : ''));
  }
  if (u.ground && gh > 0.1) { saveT += dt; if (saveT > 0.6) { u.safe.copy(pos); saveT = 0; } }
  if (u.ground && Math.hypot(u.vel.x, u.vel.z) > 1.5) { stepT += dt * (sprint ? 1.8 : 1); if (stepT > 0.26) { stepT = 0; const back = V(-Math.sin(player.rotation.y) * 0.3, 0.05, -Math.cos(player.rotation.y) * 0.3); puff(pos.clone().add(back), gh < 0.45 ? '#f6e7b8' : '#e3efc8', sprint ? 3 : 2, 0.5, 0.4, sprint ? 0.6 : 0.45); } }
  animChar(player, dt, u.ground && Math.hypot(u.vel.x, u.vel.z) > 0.6, Math.hypot(u.vel.x, u.vel.z));
  if (!u.ground) { playerParts.legL.rotation.x = -0.5; playerParts.legR.rotation.x = 0.3; playerParts.armL.rotation.z = gliding ? -1.2 : -0.5; playerParts.armR.rotation.z = gliding ? 1.2 : 0.5; }

  /* --- sjaal: regenboogspoor --- */
  if (has('sjaal') && Math.hypot(u.vel.x, u.vel.z) > 1.5) {
    trailT += dt; if (trailT > 0.05) { trailT = 0; const cols = ['#ff5d5d', '#ffb347', '#ffe66d', '#7ae582', '#6ec3ff', '#b28dff']; burst(pos.clone().add(V(0, 0.5, 0)), cols[Math.floor(TIME.value * 8) % 6], 2, 0.4, 0.2); }
  }
  if (legend() && Math.random() < dt * 8) burst(pos.clone().add(V((Math.random() - .5), 1.6, (Math.random() - .5))), '#ffd23f', 1, 0.3, 0.5);

  /* --- donker in het Schaduwbos --- */
  const inDark = inZone(pos.x, pos.z, 'schaduw', 10.5) ? smooth(10.5, 6, dist2(pos.x, pos.z, Z.schaduw)) : 0;
  dark = lerp(dark, inDark, Math.min(1, dt * 2));
  hemi.intensity = 1.0 * (1 - 0.8 * dark); sun.intensity = 2.9 * (1 - 0.92 * dark);
  renderer.toneMappingExposure = 1.05 * (1 - 0.45 * dark); scene.fog.near = lerp(38, 6, dark); scene.fog.far = lerp(120, 26, dark);
  scene.fog.color.set('#cdeeff').lerp(new THREE.Color('#1c1846'), dark);
  scene.userData.sky.material.uniforms.dark.value = dark;
  waterMats.forEach(m => m.uniforms.dark.value = dark);
  lanternLight.intensity = has('lantaarn') ? lerp(0.3, 9, dark) : 0;

  /* --- NPC's --- */
  for (const n of Object.values(npcs)) {
    const o = n.obj, d = o.position.distanceTo(pos);
    const target = d < 4 ? Math.atan2(pos.x - o.position.x, pos.z - o.position.z) : (o.userData.faceTo ?? n.face);
    let dd = target - o.rotation.y; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); o.rotation.y += dd * Math.min(1, dt * 4);
    animChar(o, dt, false, 0);
    if (n.marker.visible) { n.marker.position.y = (n.id === 'draak' ? 2.6 : n.id === 'muis' ? 1.6 : 2.2) + Math.sin(TIME.value * 3) * 0.12; n.marker.userData.glow.material.opacity = 0.5 + 0.35 * Math.sin(TIME.value * 4); if (Math.random() < dt * 3) burst(n.obj.localToWorld(n.marker.position.clone()), '#ffe27a', 1, 0.6, 0.8); }
    // sfeer per personage
    if (d < 25) {
      n.fxT = (n.fxT || 0) + dt;
      if (n.id === 'draak' && n.fxT > 1.6) { n.fxT = 0; const h = n.obj.userData.parts.head; if (h) { const np = h.localToWorld(V(0, 1.5 - 1.25, 0.62)); puff(np, '#cfcfd8', 3, 0.3, 0.7, 0.35); } }
      if (n.id === 'muis' && n.fxT > 2.2 && d < 8) { n.fxT = 0; burst(n.obj.position.clone().add(V(0, 1.3, 0)), '#ff7eb6', 3, 0.4, 1.2); }
      if (n.id === 'uil' && n.fxT > 3 && d < 10) { n.fxT = 0; burst(n.obj.position.clone().add(V(0, 1.8, 0)), '#bda7ff', 4, 0.5, 1); }
    }
  }
  if (scene.userData.blades) scene.userData.blades.rotation.z += dt * 0.8;

  /* --- vossen --- */
  for (const f of foxes) {
    if (f.beaten) { if (f.leaving > 0) { f.leaving -= dt; f.obj.position.x += Math.sin(f.obj.rotation.y) * 8 * dt; f.obj.position.z += Math.cos(f.obj.rotation.y) * 8 * dt; f.obj.position.y = height(f.obj.position.x, f.obj.position.z); animChar(f.obj, dt, true, 8); if (f.leaving <= 0) { f.obj.visible = false; burst(f.obj.position.clone().add(V(0, 1, 0)), '#ffffff', 30, 2, 2); } } continue; }
    f.cool -= dt; f.calm = Math.max(0, f.calm - dt);
    const o = f.obj, d = o.position.distanceTo(pos);
    let moving = false;
    if (f.encounter) { o.rotation.y = Math.atan2(pos.x - o.position.x, pos.z - o.position.z); animChar(o, dt, false, 0); continue; }
    if (f.scared > 0) { f.scared -= dt; const a = Math.atan2(o.position.x - pos.x, o.position.z - pos.z); o.rotation.y = a; o.position.x += Math.sin(a) * 6 * dt; o.position.z += Math.cos(a) * 6 * dt; moving = true; }
    else if (d < 6 && f.calm <= 0) { o.rotation.y = Math.atan2(pos.x - o.position.x, pos.z - o.position.z); if (d > 2.2) { o.position.x += Math.sin(o.rotation.y) * 2.6 * dt; o.position.z += Math.cos(o.rotation.y) * 2.6 * dt; moving = true; } }
    else {
      f.wait -= dt;
      if (f.wait <= 0) { const a = Math.random() * 6.3, r = Math.random() * 5; f.target.set(f.home.x + Math.cos(a) * r, 0, f.home.z + Math.sin(a) * r); f.wait = 3 + Math.random() * 4; }
      const dx = f.target.x - o.position.x, dz = f.target.z - o.position.z, dl = Math.hypot(dx, dz);
      if (dl > 0.3) { o.rotation.y = Math.atan2(dx, dz); o.position.x += dx / dl * 1.6 * dt; o.position.z += dz / dl * 1.6 * dt; moving = true; }
    }
    o.position.y = height(o.position.x, o.position.z);
    animChar(o, dt, moving, 3);
    if (f.calm > 0 && Math.random() < dt * 2) burst(o.position.clone().add(V(0, 1.6, 0)), '#ff7eb6', 2, 0.3, 1);
    if (d < 2.6 && f.cool <= 0 && f.calm <= 0 && !input.frozen && hooks.foxEncounter) { f.encounter = true; hooks.foxEncounter(f); }
  }

  /* --- moedsterren --- */
  const magnet = has('magneet') ? 6.5 : 1.3;
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i], o = s.obj;
    o.rotation.y += dt * 2; o.position.y = s.base + Math.sin(TIME.value * 2 + s.id) * 0.15;
    s.halo.material.opacity = 0.35 + 0.25 * Math.sin(TIME.value * 3 + s.id);
    const dx = pos.x - o.position.x, dz = pos.z - o.position.z, dy = pos.y + 0.8 - o.position.y, d = Math.hypot(dx, dz, dy * 0.6);
    if (d < magnet && Math.abs(dy) < (has('magneet') ? 4 : 1.6)) {
      if (d > 1.0) { o.position.x += dx * dt * 6; o.position.z += dz * dt * 6; s.base += dy * dt * 6; }
      else {
        scene.remove(o); stars.splice(i, 1); S.stars.push(s.id);
        const gain = has('rugzak') ? 2 : 1; S.moed += gain; save(); SND.star();
        burst(o.position.clone(), '#ffd23f', 40, 3.5, 2.8); burst(o.position.clone(), '#ffffff', 12, 1.5, 1.5);
        ring(o.position.clone(), '#ffd23f');
        hooks.star && hooks.star(gain, o.position.clone());
      }
    }
  }
  /* --- bubbels --- */
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]; b.obj.position.y = b.base + Math.sin(TIME.value * 1.5 + b.id) * 0.25;
    if (b.obj.position.distanceTo(pos.clone().add(V(0, 1.2, 0))) < 1.6) {
      scene.remove(b.obj); bubbles.splice(i, 1); S.side.bubbles.push(b.id); save();
      SND.pop(); burst(b.obj.position.clone(), b.good ? '#7cf0a8' : '#ffd23f', 30, 3, 2);
      hooks.bubble && hooks.bubble(b);
    }
  }
  /* --- schatkist --- */
  if (chest.userData.openT !== undefined && chest.userData.openT < 1) { chest.userData.openT += dt * 1.5; chest.userData.parts.lid.rotation.x = -1.6 * smooth(0, 1, chest.userData.openT); }
  /* --- mist verdwijnt --- */
  if (S.mistGone && mistParticles) { mistParticles.material.opacity -= dt * 0.6; mistParticles.position.y += dt * 2; if (mistParticles.material.opacity <= 0) { mistGroup.remove(mistParticles); mistParticles = null; } }
  else if (mistParticles) { mistParticles.rotation.y = 0; const p = mistParticles.geometry.attributes.position; for (let i = 0; i < p.count; i += 7) p.setY(i, p.getY(i) + Math.sin(TIME.value + i) * 0.003); p.needsUpdate = true; }
  for (let i = shockwaves.length - 1; i >= 0; i--) { const s = shockwaves[i]; s.t += dt; s.m.scale.setScalar(1 + s.t * 18); s.m.material.opacity = 0.9 * (1 - s.t / 0.7); if (s.t > 0.7) { scene.remove(s.m); shockwaves.splice(i, 1); } }
  /* --- sfeer --- */
  ambientT += dt;
  if (ambientT > 0.12) {
    ambientT = 0;
    if (dist2(pos.x, pos.z, Z.vulkaan) < 30) burst(V(Z.vulkaan[0] + (Math.random() - .5) * 2, height(Z.vulkaan[0], Z.vulkaan[1]) + 0.5, Z.vulkaan[1] + (Math.random() - .5) * 2), '#ff8a3d', 2, 1, 3);
    if (dark > 0.2) burst(V(Z.schaduw[0] + (Math.random() - .5) * 16, 1 + Math.random() * 2, Z.schaduw[1] + (Math.random() - .5) * 16), '#c6ff7a', 1, 0.3, 0.3);
    if (dist2(pos.x, pos.z, Z.vulkaan) < 30 && Math.random() < 0.3) puff(V(Z.vulkaan[0] + (Math.random() - .5) * 1.5, height(Z.vulkaan[0], Z.vulkaan[1]) + 0.8, Z.vulkaan[1] + (Math.random() - .5) * 1.5), '#b9b3c4', 1, 0.3, 1.2, 1.4);
    stars.forEach(s => { if (Math.random() < 0.15 && s.obj.position.distanceTo(pos) < 25) burst(s.obj.position.clone().add(V((Math.random() - .5) * .6, (Math.random() - .5) * .6, 0)), '#fff2a8', 1, 0.4, 0.6); });
  }
  scene.userData.clouds.forEach(c => { c.position.x += c.userData.speed * dt; if (c.position.x > 120) c.position.x = -120; });
  updateFx(dt); updateButterflies(dt);

  /* --- muis-maatje --- */
  if (muisMaatje.visible) {
    const back = V(-Math.sin(player.rotation.y) * 1.4 + Math.cos(player.rotation.y) * 0.9, 0, -Math.cos(player.rotation.y) * 1.4 - Math.sin(player.rotation.y) * 0.9).add(pos);
    const mv = muisMaatje.position; const d = Math.hypot(back.x - mv.x, back.z - mv.z);
    if (d > 0.2) { mv.x = lerp(mv.x, back.x, Math.min(1, dt * 4)); mv.z = lerp(mv.z, back.z, Math.min(1, dt * 4)); }
    mv.y = height(mv.x, mv.z);
    let nearest = null, nd = 1e9; stars.forEach(s => { const dd = s.obj.position.distanceTo(pos); if (dd < nd) { nd = dd; nearest = s; } });
    muisMaatje.rotation.y = nearest ? Math.atan2(nearest.obj.position.x - mv.x, nearest.obj.position.z - mv.z) : player.rotation.y;
    animChar(muisMaatje, dt, d > 0.4, 4);
    if (muisMaatje.userData.parts.armR) muisMaatje.userData.parts.armR.rotation.x = nearest ? -2.4 : 0;
  }
  /* --- pijl naar de missie --- */
  if (questTarget && questTarget.marker.visible) {
    const t = questTarget.obj.position, d = Math.hypot(t.x - pos.x, t.z - pos.z);
    arrow.visible = d > 6;
    const a = Math.atan2(t.x - pos.x, t.z - pos.z);
    arrow.position.set(pos.x + Math.sin(a) * 1.3, pos.y + 0.25 + Math.sin(TIME.value * 4) * 0.05, pos.z + Math.cos(a) * 1.3);
    arrow.rotation.y = a;
  } else arrow.visible = false;

  /* --- camera --- */
  const zoom = cam.zoom;
  const off = V(0, 7.6 * zoom, 9.6 * zoom);
  cam.target.lerp(V(pos.x, pos.y * 0.6 + 0.8, pos.z), cam.snap ? 1 : Math.min(1, dt * 5)); cam.snap = false;
  const desired = cam.target.clone().add(off);
  if (cam.intro > 0) { cam.intro -= dt; const a = cam.intro * 0.35; desired.add(V(Math.sin(a) * 18, 8 * Math.min(1, cam.intro / 3), Math.cos(a) * 6 - 6)); }
  camera.position.lerp(desired, cam.intro > 0 ? Math.min(1, dt * 1.5) : 1);
  if (cam.shake > 0) { cam.shake -= dt; camera.position.x += (Math.random() - .5) * cam.shake * 0.6; camera.position.y += (Math.random() - .5) * cam.shake * 0.6; }
  camera.lookAt(cam.target);
  sun.position.copy(cam.target).add(V(14, 26, 10)); sun.target.position.copy(cam.target);

  /* --- opslaan van positie --- */
  if (Math.random() < dt * 0.5) { S.pos = [pos.x, pos.z]; save(); }
  if (grade) grade.uniforms.uDark.value = dark;
  draw();
}

export function renderOnly(dt) { TIME.value += dt; updateFx(dt); updateButterflies(dt); scene.userData.clouds.forEach(c => { c.position.x += c.userData.speed * dt; }); draw(); }
export function titleCamera(t) {
  const a = t * 0.06;
  camera.position.set(Math.sin(a) * 38, 22 + Math.sin(t * 0.2) * 2, Math.cos(a) * 38);
  camera.lookAt(0, 0, 0);
}
export function setZoom(z) { cam.zoom = clamp(z, 0.6, 1.5); }
export function getZoom() { return cam.zoom; }
export function introSweep() { cam.intro = 4.5; }
export function foxDone(f, won) {
  f.encounter = false;
  if (won) { f.beaten = true; f.leaving = 1.4; f.obj.rotation.y += Math.PI; S.side.foxes++; save(); burst(f.obj.position.clone().add(V(0, 1.2, 0)), '#ffd23f', 20, 2, 2); }
  else f.cool = 6;
}
export function playerPos() { return player.position; }
export function minimapData() {
  return { p: player.position, rot: player.rotation.y, npcs: Object.values(npcs).map(n => ({ id: n.id, x: n.obj.position.x, z: n.obj.position.z, quest: n.marker.visible })), stars: stars.map(s => ({ x: s.obj.position.x, z: s.obj.position.z })) };
}
