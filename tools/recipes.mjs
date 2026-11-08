// Sterke Beer – 3D-recepten.
// Eén bron voor alle modellen: Blender bouwt hier mooie .glb-modellen + renders van,
// en de game kan dezelfde recepten als reserve zelf opbouwen.
// Assen zoals three.js: Y = omhoog, +Z = voorkant. Eenheden in meters.
// Gebruik:  node tools/recipes.mjs > web/assets/models.json

const C = {
  bruin: "#9a6332", bruinD: "#7a4a22", tan: "#e8bf8a", neus: "#3a2418", oog: "#1d1630",
  roze: "#ff9fb4", wit: "#ffffff", grijs: "#b9b4c7", grijsD: "#8e88a3",
  groen: "#5fbf5a", groenD: "#3f9a45", geel: "#ffd45c", oranje: "#f08a32", oranjeD: "#c9661b",
  creme: "#fff3dc", uil: "#a88a6a", uilL: "#e9d8bf", rood: "#ff5d5d", blauw: "#4b8cff",
  paars: "#8a63ff", goud: "#ffc93c", zwart: "#24202e", hout: "#a8743f", houtD: "#7c5129",
  blad: "#57c46b", bladD: "#3aa257", dak: "#ff6f61", dakB: "#5c7cfa", steen: "#a7a9b8",
  water: "#7fd9ff", lava: "#ff7a2f", kristal: "#7df9ff"
};

// prim(type, part, pos, scale, color, extra)
const P = (type, part, pos, scale, color, x = {}) => ({ type, part, pos, scale, color, ...x });
const sph = (...a) => P("sphere", ...a);
const box = (...a) => P("box", ...a);
const cyl = (...a) => P("cyl", ...a);
const cone = (...a) => P("cone", ...a);
const tor = (...a) => P("torus", ...a);
const ico = (...a) => P("ico", ...a);
const star = (...a) => P("star", ...a);
const mirror = (prims) => prims.flatMap(p => {
  const m = { ...p, pos: [-p.pos[0], p.pos[1], p.pos[2]] };
  if (p.rot) m.rot = [p.rot[0], -p.rot[1], -p.rot[2]];
  if (p.part.endsWith("L")) m.part = p.part.slice(0, -1) + "R";
  return [p, m];
});

// Ogen: zwart glanzend + wit lichtpuntje (geeft leven aan het gezicht)
const eyes = (part, x, y, z, s = 1) => mirror([
  sph(part, [x, y, z], [0.05 * s, 0.065 * s, 0.035 * s], C.oog, { mat: "eye" }),
  sph(part, [x - 0.012 * s, y + 0.022 * s, z + 0.028 * s], [0.017 * s, 0.017 * s, 0.01 * s], C.wit, { mat: "emit" })
]);

const models = {};

/* ===================== BEER (de speler) ===================== */
models.beer = {
  kind: "character",
  parts: {
    body: { pivot: [0, 0.32, 0] },
    head: { pivot: [0, 0.98, 0], parent: "body" },
    armL: { pivot: [0.33, 0.86, 0], parent: "body" },
    armR: { pivot: [-0.33, 0.86, 0], parent: "body" },
    legL: { pivot: [0.17, 0.32, 0] },
    legR: { pivot: [-0.17, 0.32, 0] },
    acc_cape: { pivot: [0, 0.95, -0.3], parent: "body" },
    acc_laarzenL: { pivot: [0.17, 0.32, 0], parent: "legL" },
    acc_laarzenR: { pivot: [-0.17, 0.32, 0], parent: "legR" },
    acc_lantaarn: { pivot: [0.47, 0.5, 0.1], parent: "body" },
    acc_megafoon: { pivot: [-0.45, 0.55, 0], parent: "body" },
    acc_ballon: { pivot: [0.2, 0.95, -0.3], parent: "body" },
    acc_magneet: { pivot: [0.26, 0.48, 0.3], parent: "body" },
    acc_kristal: { pivot: [0.45, 0.48, 0.05], parent: "armL" },
    acc_bril: { pivot: [0, 1.25, 0.36], parent: "head" },
    acc_armband: { pivot: [-0.45, 0.52, 0.04], parent: "armR" },
    acc_schild: { pivot: [0.56, 0.7, 0.05], parent: "armL" },
    acc_hoed: { pivot: [0, 1.52, 0], parent: "head" },
    acc_rugzak: { pivot: [0, 0.72, -0.34], parent: "body" },
    acc_sjaal: { pivot: [0, 0.97, 0], parent: "body" },
    acc_fluit: { pivot: [-0.22, 0.5, 0.33], parent: "body" },
    acc_vleugels: { pivot: [0, 0.85, -0.33], parent: "body" },
    acc_schelp: { pivot: [0, 0.9, 0.37], parent: "body" },
    acc_kroon: { pivot: [0, 1.57, 0], parent: "head" }
  },
  prims: [
    // lijf
    sph("body", [0, 0.64, 0], [0.4, 0.42, 0.36], C.bruin, { mat: "fur" }),
    sph("body", [0, 0.6, 0.17], [0.27, 0.3, 0.22], C.tan, { mat: "fur" }),
    sph("body", [0, 0.46, -0.33], [0.08, 0.08, 0.08], C.bruin, { mat: "fur" }),
    // hoofd
    sph("head", [0, 1.2, 0.02], [0.43, 0.38, 0.38], C.bruin, { mat: "fur" }),
    sph("head", [0, 1.1, 0.31], [0.18, 0.13, 0.13], C.tan, { mat: "fur" }),
    sph("head", [0, 1.15, 0.43], [0.07, 0.05, 0.045], C.neus, { mat: "shiny" }),
    ...eyes("head", 0.15, 1.27, 0.355, 1.25),
    ...mirror([
      sph("head", [0.29, 1.47, 0], [0.12, 0.12, 0.07], C.bruin, { mat: "fur" }),
      sph("head", [0.29, 1.47, 0.04], [0.075, 0.075, 0.04], C.tan, { mat: "fur" }),
      sph("head", [0.26, 1.1, 0.27], [0.065, 0.04, 0.03], C.roze, { mat: "fur" })
    ]),
    // armen en benen
    sph("armL", [0.42, 0.65, 0.03], [0.11, 0.21, 0.11], C.bruin, { mat: "fur" }),
    sph("armR", [-0.42, 0.65, 0.03], [0.11, 0.21, 0.11], C.bruin, { mat: "fur" }),
    sph("legL", [0.17, 0.16, 0.02], [0.13, 0.17, 0.15], C.bruin, { mat: "fur" }),
    sph("legR", [-0.17, 0.16, 0.02], [0.13, 0.17, 0.15], C.bruin, { mat: "fur" }),
    sph("legL", [0.17, 0.06, 0.1], [0.09, 0.05, 0.06], C.tan, { mat: "fur" }),
    sph("legR", [-0.17, 0.06, 0.1], [0.09, 0.05, 0.06], C.tan, { mat: "fur" }),

    // ===== accessoires / superkrachten =====
    box("acc_cape", [0, 0.68, -0.4], [0.66, 0.62, 0.035], C.rood, { rot: [10, 0, 0], mat: "cloth", round: 0.02 }),
    tor("acc_cape", [0, 0.96, -0.02], [1, 1, 1], C.goud, { args: [0.28, 0.035], mat: "metal" }),
    star("acc_cape", [0, 0.7, -0.43], [0.13, 0.13, 0.13], C.goud, { mat: "metal", rot: [10, 180, 0] }),
    cyl("acc_laarzenL", [0.17, 0.1, 0.03], [0.15, 0.2, 0.17], C.blauw, { mat: "shiny" }),
    cyl("acc_laarzenL", [0.17, 0.21, 0.03], [0.165, 0.04, 0.185], C.wit, { mat: "cloth" }),
    cyl("acc_laarzenR", [-0.17, 0.1, 0.03], [0.15, 0.2, 0.17], C.blauw, { mat: "shiny" }),
    cyl("acc_laarzenR", [-0.17, 0.21, 0.03], [0.165, 0.04, 0.185], C.wit, { mat: "cloth" }),
    box("acc_lantaarn", [0.52, 0.42, 0.12], [0.16, 0.2, 0.16], C.goud, { mat: "metal", round: 0.02 }),
    sph("acc_lantaarn", [0.52, 0.42, 0.12], [0.09, 0.1, 0.09], C.geel, { mat: "emit" }),
    cone("acc_lantaarn", [0.52, 0.57, 0.12], [0.12, 0.1, 0.12], C.houtD, { seg: 4 }),
    cone("acc_megafoon", [-0.5, 0.52, 0.02], [0.11, 0.3, 0.11], C.oranje, { mat: "shiny", rot: [90, 0, 0] }),
    cyl("acc_megafoon", [-0.5, 0.52, -0.15], [0.05, 0.08, 0.05], C.zwart, { rot: [90, 0, 0] }),
    cyl("acc_ballon", [0.2, 1.45, -0.32], [0.008, 1.0, 0.008], C.wit),
    sph("acc_ballon", [0.2, 2.15, -0.32], [0.28, 0.32, 0.28], C.rood, { mat: "shiny" }),
    cone("acc_ballon", [0.2, 1.82, -0.32], [0.05, 0.06, 0.05], C.rood, { rot: [180, 0, 0] }),
    tor("acc_magneet", [0.26, 0.48, 0.32], [1, 1, 1], C.rood, { args: [0.08, 0.03], rot: [90, 0, 0], mat: "shiny" }),
    box("acc_magneet", [0.22, 0.42, 0.33], [0.04, 0.05, 0.05], C.grijs, { mat: "metal" }),
    box("acc_magneet", [0.30, 0.42, 0.33], [0.04, 0.05, 0.05], C.grijs, { mat: "metal" }),
    tor("acc_kristal", [0.45, 0.5, 0.04], [1, 1, 1], C.goud, { args: [0.1, 0.025], mat: "metal" }),
    ico("acc_kristal", [0.45, 0.5, 0.15], [0.06, 0.09, 0.06], C.kristal, { mat: "emit" }),
    ...mirror([tor("acc_bril", [0.15, 1.26, 0.39], [1, 1, 1], C.zwart, { args: [0.085, 0.02], rot: [90, 0, 0], mat: "shiny" })]),
    sph("acc_bril", [0.15, 1.26, 0.39], [0.075, 0.075, 0.01], "#2a2a55", { mat: "glass" }),
    sph("acc_bril", [-0.15, 1.26, 0.39], [0.075, 0.075, 0.01], "#2a2a55", { mat: "glass" }),
    box("acc_bril", [0, 1.28, 0.4], [0.1, 0.02, 0.02], C.zwart),
    tor("acc_armband", [-0.45, 0.5, 0.03], [1, 1, 1], C.paars, { args: [0.11, 0.035], mat: "shiny" }),
    sph("acc_armband", [-0.45, 0.5, 0.15], [0.035, 0.035, 0.035], C.roze, { mat: "emit" }),
    cyl("acc_schild", [0.58, 0.62, 0.06], [0.24, 0.05, 0.24], C.blauw, { rot: [0, 0, 90], mat: "metal" }),
    tor("acc_schild", [0.61, 0.62, 0.06], [1, 1, 1], C.goud, { args: [0.22, 0.03], rot: [0, 0, 90], mat: "metal" }),
    star("acc_schild", [0.62, 0.62, 0.06], [0.1, 0.1, 0.1], C.goud, { rot: [0, 90, 0], mat: "metal" }),
    cyl("acc_hoed", [0, 1.52, 0.02], [0.42, 0.03, 0.42], "#c9a46b", { mat: "cloth" }),
    cyl("acc_hoed", [0, 1.62, 0.02], [0.25, 0.2, 0.25], "#c9a46b", { mat: "cloth", top: 0.85 }),
    cyl("acc_hoed", [0, 1.56, 0.02], [0.255, 0.05, 0.255], C.rood, { mat: "cloth" }),
    box("acc_rugzak", [0, 0.7, -0.42], [0.42, 0.44, 0.2], "#4cc38a", { mat: "cloth", round: 0.06 }),
    box("acc_rugzak", [0, 0.6, -0.53], [0.28, 0.18, 0.06], "#3aa575", { mat: "cloth", round: 0.03 }),
    star("acc_rugzak", [0, 0.82, -0.53], [0.08, 0.08, 0.08], C.goud, { mat: "metal", rot: [0, 180, 0] }),
    tor("acc_sjaal", [0, 0.97, 0.01], [1, 1, 1], "#ff6fb5", { args: [0.29, 0.075], mat: "cloth" }),
    box("acc_sjaal", [0.12, 0.8, 0.3], [0.12, 0.28, 0.05], "#7b6bff", { rot: [10, 0, -10], mat: "cloth", round: 0.02 }),
    cyl("acc_fluit", [-0.22, 0.5, 0.36], [0.03, 0.28, 0.03], "#7ad3ff", { rot: [0, 0, 70], mat: "shiny" }),
    sph("acc_fluit", [-0.1, 0.54, 0.36], [0.035, 0.035, 0.035], C.goud, { mat: "metal" }),
    ...mirror([sph("acc_vleugels", [0.24, 0.92, -0.42], [0.26, 0.17, 0.03], "#ffd1f3", { rot: [0, -25, 25], mat: "glow" }),
               sph("acc_vleugels", [0.2, 0.7, -0.41], [0.17, 0.11, 0.03], "#c9b5ff", { rot: [0, -25, -20], mat: "glow" })]),
    tor("acc_schelp", [0, 0.97, 0.02], [1, 1, 1], C.creme, { args: [0.27, 0.012] }),
    cone("acc_schelp", [0, 0.88, 0.38], [0.09, 0.07, 0.04], "#ffb6c8", { rot: [90, 0, 180], seg: 9, mat: "shiny" }),
    cyl("acc_kroon", [0, 1.57, 0.02], [0.2, 0.09, 0.2], C.goud, { mat: "metal", open: true }),
    ...[0, 72, 144, 216, 288].map(a => cone("acc_kroon", [0.19 * Math.sin(a * Math.PI / 180), 1.67, 0.02 + 0.19 * Math.cos(a * Math.PI / 180)], [0.045, 0.1, 0.045], C.goud, { mat: "metal" })),
    sph("acc_kroon", [0, 1.57, 0.22], [0.035, 0.035, 0.035], C.rood, { mat: "emit" })
  ]
};

/* ===================== MUIS ===================== */
models.muis = {
  kind: "character",
  parts: {
    body: { pivot: [0, 0.25, 0] }, head: { pivot: [0, 0.68, 0], parent: "body" },
    armL: { pivot: [0.22, 0.58, 0], parent: "body" }, armR: { pivot: [-0.22, 0.58, 0], parent: "body" },
    legL: { pivot: [0.11, 0.22, 0] }, legR: { pivot: [-0.11, 0.22, 0] }, tail: { pivot: [0, 0.3, -0.24], parent: "body" }
  },
  prims: [
    sph("body", [0, 0.44, 0], [0.27, 0.3, 0.25], C.grijs, { mat: "fur" }),
    sph("body", [0, 0.42, 0.13], [0.18, 0.21, 0.14], C.creme, { mat: "fur" }),
    box("body", [0, 0.5, 0.05], [0.4, 0.06, 0.4], "#ff8fb0", { mat: "cloth", round: 0.02, rot: [0, 0, 0] }),
    sph("head", [0, 0.84, 0.03], [0.3, 0.26, 0.27], C.grijs, { mat: "fur" }),
    sph("head", [0, 0.78, 0.27], [0.1, 0.075, 0.09], C.grijs, { mat: "fur" }),
    sph("head", [0, 0.8, 0.36], [0.045, 0.04, 0.035], C.roze, { mat: "shiny" }),
    ...eyes("head", 0.11, 0.89, 0.27, 0.95),
    ...mirror([
      sph("head", [0.25, 1.08, -0.02], [0.17, 0.17, 0.04], C.grijs, { mat: "fur" }),
      sph("head", [0.25, 1.08, 0.015], [0.12, 0.12, 0.02], C.roze, { mat: "fur" }),
      sph("head", [0.18, 0.77, 0.21], [0.05, 0.03, 0.02], C.roze),
      cyl("head", [0.16, 0.8, 0.31], [0.004, 0.18, 0.004], C.grijsD, { rot: [0, 0, 80] })
    ]),
    sph("armL", [0.28, 0.45, 0.04], [0.07, 0.14, 0.07], C.grijs, { mat: "fur" }),
    sph("armR", [-0.28, 0.45, 0.04], [0.07, 0.14, 0.07], C.grijs, { mat: "fur" }),
    sph("legL", [0.11, 0.1, 0.04], [0.09, 0.11, 0.11], C.grijs, { mat: "fur" }),
    sph("legR", [-0.11, 0.1, 0.04], [0.09, 0.11, 0.11], C.grijs, { mat: "fur" }),
    ...[0, 1, 2, 3, 4, 5].map(i => sph("tail", [0.04 * Math.sin(i * 0.9), 0.3 + i * 0.07 - i * i * 0.008, -0.27 - i * 0.07], [0.035, 0.035, 0.035], C.roze, { mat: "fur" }))
  ]
};

/* ===================== DRAAK ===================== */
models.draak = {
  kind: "character",
  parts: {
    body: { pivot: [0, 0.4, 0] }, head: { pivot: [0, 1.25, 0.05], parent: "body" },
    armL: { pivot: [0.4, 1.0, 0.05], parent: "body" }, armR: { pivot: [-0.4, 1.0, 0.05], parent: "body" },
    legL: { pivot: [0.24, 0.42, 0] }, legR: { pivot: [-0.24, 0.42, 0] },
    wingL: { pivot: [0.2, 1.1, -0.35], parent: "body" }, wingR: { pivot: [-0.2, 1.1, -0.35], parent: "body" },
    tail: { pivot: [0, 0.5, -0.4], parent: "body" }
  },
  prims: [
    sph("body", [0, 0.82, 0], [0.5, 0.56, 0.46], C.groen, { mat: "skin" }),
    sph("body", [0, 0.76, 0.22], [0.34, 0.42, 0.28], C.geel, { mat: "skin" }),
    ...[0, 1, 2, 3].map(i => cone("body", [0, 1.28 - i * 0.2, -0.38 - i * 0.05 + i * i * 0.02], [0.08, 0.15, 0.06], C.oranje, { rot: [-35 - i * 12, 0, 0], mat: "shiny" })),
    sph("head", [0, 1.55, 0.08], [0.42, 0.36, 0.38], C.groen, { mat: "skin" }),
    sph("head", [0, 1.45, 0.4], [0.27, 0.18, 0.2], C.groen, { mat: "skin" }),
    ...mirror([
      sph("head", [0.09, 1.5, 0.58], [0.03, 0.025, 0.02], C.groenD),
      cone("head", [0.2, 1.88, -0.02], [0.07, 0.22, 0.07], C.creme, { rot: [-20, 0, -15], mat: "shiny" }),
      sph("head", [0.27, 1.43, 0.33], [0.06, 0.04, 0.03], "#ff9a7a")
    ]),
    ...eyes("head", 0.16, 1.61, 0.42, 1.15),
    ...mirror([box("head", [0.16, 1.71, 0.4], [0.13, 0.03, 0.03], C.groenD, { rot: [0, 0, 20] })]), // stoere wenkbrauwen
    sph("armL", [0.48, 0.82, 0.12], [0.13, 0.24, 0.13], C.groen, { mat: "skin" }),
    sph("armR", [-0.48, 0.82, 0.12], [0.13, 0.24, 0.13], C.groen, { mat: "skin" }),
    sph("legL", [0.24, 0.22, 0.04], [0.18, 0.24, 0.2], C.groen, { mat: "skin" }),
    sph("legR", [-0.24, 0.22, 0.04], [0.18, 0.24, 0.2], C.groen, { mat: "skin" }),
    sph("wingL", [0.42, 1.25, -0.5], [0.34, 0.24, 0.04], C.oranje, { rot: [0, -30, 20], mat: "skin" }),
    sph("wingR", [-0.42, 1.25, -0.5], [0.34, 0.24, 0.04], C.oranje, { rot: [0, 30, -20], mat: "skin" }),
    sph("tail", [0, 0.42, -0.62], [0.17, 0.15, 0.3], C.groen, { mat: "skin", rot: [15, 0, 0] }),
    sph("tail", [0, 0.32, -0.92], [0.11, 0.1, 0.22], C.groen, { mat: "skin", rot: [20, 0, 0] }),
    cone("tail", [0, 0.3, -1.15], [0.1, 0.18, 0.04], C.oranje, { rot: [-100, 0, 0], mat: "shiny" })
  ]
};

/* ===================== PLAAGVOS ===================== */
models.vos = {
  kind: "character",
  parts: {
    body: { pivot: [0, 0.3, 0] }, head: { pivot: [0, 0.9, 0.05], parent: "body" },
    armL: { pivot: [0.27, 0.78, 0.02], parent: "body" }, armR: { pivot: [-0.27, 0.78, 0.02], parent: "body" },
    legL: { pivot: [0.15, 0.3, 0] }, legR: { pivot: [-0.15, 0.3, 0] }, tail: { pivot: [0, 0.45, -0.3], parent: "body" }
  },
  prims: [
    sph("body", [0, 0.6, 0], [0.33, 0.38, 0.3], C.oranje, { mat: "fur" }),
    sph("body", [0, 0.6, 0.16], [0.2, 0.27, 0.16], C.creme, { mat: "fur" }),
    sph("head", [0, 1.1, 0.04], [0.35, 0.3, 0.31], C.oranje, { mat: "fur" }),
    cone("head", [0, 1.04, 0.42], [0.15, 0.3, 0.13], C.oranje, { rot: [90, 0, 0], mat: "fur" }),
    sph("head", [0, 1.0, 0.33], [0.15, 0.09, 0.14], C.creme, { mat: "fur" }),
    sph("head", [0, 1.05, 0.58], [0.05, 0.04, 0.04], C.neus, { mat: "shiny" }),
    ...mirror([
      cone("head", [0.2, 1.42, -0.02], [0.12, 0.26, 0.07], C.oranje, { rot: [0, 0, -18], mat: "fur" }),
      cone("head", [0.2, 1.4, 0.015], [0.07, 0.17, 0.04], C.zwart, { rot: [0, 0, -18], mat: "fur" })
    ]),
    // ondeugende halfgesloten oogjes
    ...mirror([
      sph("head", [0.13, 1.17, 0.305], [0.06, 0.05, 0.03], C.oog, { mat: "eye" }),
      box("head", [0.13, 1.215, 0.315], [0.14, 0.04, 0.05], C.oranje, { rot: [0, 0, -14], mat: "fur" })
    ]),
    sph("armL", [0.33, 0.58, 0.05], [0.09, 0.19, 0.09], C.oranje, { mat: "fur" }),
    sph("armR", [-0.33, 0.58, 0.05], [0.09, 0.19, 0.09], C.oranje, { mat: "fur" }),
    sph("legL", [0.15, 0.16, 0.03], [0.11, 0.17, 0.13], C.zwart, { mat: "fur" }),
    sph("legR", [-0.15, 0.16, 0.03], [0.11, 0.17, 0.13], C.zwart, { mat: "fur" }),
    sph("tail", [0, 0.62, -0.62], [0.2, 0.2, 0.42], C.oranje, { rot: [-40, 0, 0], mat: "fur" }),
    sph("tail", [0, 0.88, -0.92], [0.13, 0.13, 0.17], C.wit, { rot: [-40, 0, 0], mat: "fur" })
  ]
};

/* ===================== JUF UIL ===================== */
models.uil = {
  kind: "character",
  parts: {
    body: { pivot: [0, 0.2, 0] }, head: { pivot: [0, 1.0, 0], parent: "body" },
    armL: { pivot: [0.36, 0.95, 0], parent: "body" }, armR: { pivot: [-0.36, 0.95, 0], parent: "body" },
    legL: { pivot: [0.13, 0.15, 0] }, legR: { pivot: [-0.13, 0.15, 0] }
  },
  prims: [
    sph("body", [0, 0.72, 0], [0.45, 0.55, 0.42], C.uil, { mat: "fur" }),
    sph("body", [0, 0.68, 0.2], [0.32, 0.42, 0.27], C.uilL, { mat: "fur" }),
    ...[0, 1, 2].map(i => cone("body", [0, 0.88 - i * 0.16, 0.45], [0.05, 0.05, 0.02], C.uil, { rot: [180, 0, 0] })),
    sph("head", [0, 1.33, 0.02], [0.4, 0.33, 0.36], C.uil, { mat: "fur" }),
    ...mirror([
      sph("head", [0.15, 1.36, 0.28], [0.14, 0.14, 0.06], C.creme, { mat: "fur" }),
      sph("head", [0.15, 1.36, 0.33], [0.06, 0.07, 0.03], C.oog, { mat: "eye" }),
      sph("head", [0.13, 1.39, 0.36], [0.02, 0.02, 0.01], C.wit, { mat: "emit" }),
      tor("head", [0.15, 1.36, 0.36], [1, 1, 1], C.goud, { args: [0.15, 0.015], rot: [90, 0, 0], mat: "metal" }),
      cone("head", [0.28, 1.62, -0.02], [0.08, 0.16, 0.05], C.uil, { rot: [0, 0, -25], mat: "fur" })
    ]),
    cone("head", [0, 1.24, 0.4], [0.06, 0.12, 0.05], C.geel, { rot: [160, 0, 0], mat: "shiny" }),
    sph("armL", [0.45, 0.72, -0.02], [0.12, 0.34, 0.24], C.uil, { rot: [0, 0, -12], mat: "fur" }),
    sph("armR", [-0.45, 0.72, -0.02], [0.12, 0.34, 0.24], C.uil, { rot: [0, 0, 12], mat: "fur" }),
    ...mirror([cone("legL", [0.13 + 0.05 * 0, 0.06, 0.1], [0.05, 0.12, 0.03], C.oranje, { rot: [80, 0, 0] })]),
    cone("legL", [0.18, 0.06, 0.1], [0.04, 0.1, 0.03], C.oranje, { rot: [80, 0, -10] }),
    cone("legR", [-0.18, 0.06, 0.1], [0.04, 0.1, 0.03], C.oranje, { rot: [80, 0, 10] }),
    box("body", [0, 0.6, 0.38], [0.22, 0.28, 0.04], C.blauw, { rot: [8, 0, 0], round: 0.02, mat: "cloth" }) // boekje
  ]
};

/* ===================== PROPS ===================== */
const prop = (prims, extra = {}) => ({ kind: "prop", ...extra, parts: { root: { pivot: [0, 0, 0] }, ...(extra.parts || {}) }, prims });

models.tree = prop([
  cyl("root", [0, 0.9, 0], [0.22, 1.8, 0.22], C.hout, { top: 0.75, mat: "wood" }),
  sph("root", [0, 2.5, 0], [1.25, 1.05, 1.2], C.blad, { mat: "leaf" }),
  sph("root", [0.55, 2.15, 0.35], [0.8, 0.7, 0.8], C.bladD, { mat: "leaf" }),
  sph("root", [-0.55, 2.25, -0.25], [0.8, 0.72, 0.8], C.bladD, { mat: "leaf" }),
  ...[[0.7, 2.3, 0.85], [-0.8, 2.6, 0.6], [0.2, 2.0, 1.05], [-0.2, 3.1, 0.7], [0.95, 2.8, -0.3]].map(p => sph("root", p, [0.13, 0.13, 0.13], C.rood, { mat: "shiny" }))
]);
models.pine = prop([
  cyl("root", [0, 0.6, 0], [0.18, 1.2, 0.18], C.houtD, { mat: "wood" }),
  cone("root", [0, 1.6, 0], [1.1, 1.4, 1.1], "#3f9a6a", { mat: "leaf", seg: 9 }),
  cone("root", [0, 2.4, 0], [0.85, 1.2, 0.85], "#4cb07a", { mat: "leaf", seg: 9 }),
  cone("root", [0, 3.1, 0], [0.55, 1.0, 0.55], "#5ec58a", { mat: "leaf", seg: 9 })
]);
models.darktree = prop([
  cyl("root", [0, 0.9, 0], [0.25, 1.8, 0.25], "#4b3a52", { mat: "wood" }),
  sph("root", [0, 2.6, 0], [1.3, 1.1, 1.3], "#3b3a7a", { mat: "leaf" }),
  sph("root", [0.6, 2.2, 0.3], [0.8, 0.7, 0.8], "#2f2d63", { mat: "leaf" })
]);
models.bush = prop([
  sph("root", [0, 0.35, 0], [0.55, 0.45, 0.5], C.bladD, { mat: "leaf" }),
  sph("root", [0.4, 0.3, 0.1], [0.38, 0.32, 0.36], C.blad, { mat: "leaf" }),
  sph("root", [-0.35, 0.28, 0.12], [0.35, 0.3, 0.34], C.blad, { mat: "leaf" }),
  ...[[0.2, 0.62, 0.3], [-0.3, 0.5, 0.35], [0.5, 0.45, 0.3]].map(p => sph("root", p, [0.07, 0.07, 0.07], "#ffffff", { mat: "emit" }))
]);
models.rock = prop([
  ico("root", [0, 0.3, 0], [0.75, 0.5, 0.65], C.steen, { mat: "stone" }),
  ico("root", [0.5, 0.18, 0.3], [0.35, 0.26, 0.3], "#9597a8", { mat: "stone" })
]);
models.flower = prop([
  cyl("root", [0, 0.15, 0], [0.015, 0.3, 0.015], C.groenD),
  ...[0, 72, 144, 216, 288].map(a => sph("root", [0.07 * Math.sin(a * Math.PI / 180), 0.32, 0.07 * Math.cos(a * Math.PI / 180)], [0.06, 0.03, 0.06], "#ff7eb6")),
  sph("root", [0, 0.33, 0], [0.04, 0.03, 0.04], C.geel, { mat: "shiny" })
]);
models.mushroom = prop([
  cyl("root", [0, 0.15, 0], [0.08, 0.3, 0.08], C.creme),
  sph("root", [0, 0.32, 0], [0.22, 0.14, 0.22], C.rood, { mat: "shiny" }),
  ...[[0.1, 0.4, 0.08], [-0.08, 0.42, -0.06], [0.0, 0.44, 0.13]].map(p => sph("root", p, [0.03, 0.02, 0.03], C.wit))
]);
models.house = prop([
  box("root", [0, 1.1, 0], [3.2, 2.2, 2.8], C.creme, { round: 0.06, mat: "wall" }),
  cone("root", [0, 2.95, 0], [2.6, 1.6, 2.6], C.dak, { seg: 4, rot: [0, 45, 0], mat: "roof" }),
  box("root", [0, 0.7, 1.41], [0.75, 1.3, 0.08], C.houtD, { round: 0.03, mat: "wood" }),
  sph("root", [0.25, 0.7, 1.47], [0.04, 0.04, 0.04], C.goud, { mat: "metal" }),
  ...mirror([box("root", [0.95, 1.35, 1.41], [0.62, 0.62, 0.06], "#ffe9a8", { mat: "emit" }),
             box("root", [0.95, 1.35, 1.44], [0.66, 0.06, 0.04], C.hout)]),
  box("root", [0.9, 3.2, -0.6], [0.4, 0.9, 0.4], "#c45a4a", { mat: "wall" }),
  box("root", [0, 0.06, 1.9], [1.2, 0.12, 0.9], C.steen, { round: 0.03, mat: "stone" })
]);
models.molen = prop([
  cyl("root", [0, 1.5, 0], [1.3, 3.0, 1.3], "#f4e3c3", { top: 0.75, seg: 12, mat: "wall" }),
  cone("root", [0, 3.55, 0], [1.25, 1.2, 1.25], C.dakB, { seg: 12, mat: "roof" }),
  box("root", [0, 0.65, 1.2], [0.6, 1.2, 0.1], C.houtD, { round: 0.03, mat: "wood" }),
  sph("root", [0, 2.2, 1.12], [0.25, 0.25, 0.06], "#ffe9a8", { mat: "emit" }),
  cyl("blades", [0, 3.0, 1.3], [0.14, 0.3, 0.14], C.houtD, { rot: [90, 0, 0], mat: "wood" }),
  ...[0, 90, 180, 270].map(a => box("blades", [1.05 * Math.sin(a * Math.PI / 180), 3.0 + 1.05 * Math.cos(a * Math.PI / 180), 1.42], [0.35, 1.9, 0.05], C.creme, { rot: [0, 0, -a], mat: "cloth" }))
], { parts: { blades: { pivot: [0, 3.0, 1.35], parent: "root" } } });
models.uilboom = prop([
  cyl("root", [0, 2.0, 0], [1.0, 4.0, 1.0], C.hout, { top: 0.7, seg: 12, mat: "wood" }),
  sph("root", [0, 5.0, 0], [2.6, 2.0, 2.5], C.blad, { mat: "leaf" }),
  sph("root", [1.4, 4.4, 0.8], [1.5, 1.2, 1.4], C.bladD, { mat: "leaf" }),
  sph("root", [-1.5, 4.6, -0.4], [1.5, 1.3, 1.4], C.bladD, { mat: "leaf" }),
  box("root", [0, 0.75, 0.93], [0.7, 1.3, 0.12], C.houtD, { round: 0.05, mat: "wood" }),
  sph("root", [0, 2.6, 0.85], [0.32, 0.32, 0.1], "#ffe9a8", { mat: "emit" }),
  ...[[2.0, 4.0, 1.5], [-1.8, 5.5, 1.2], [0.6, 6.4, 1.4]].map(p => sph("root", p, [0.12, 0.12, 0.12], C.goud, { mat: "emit" }))
]);
models.board = prop([
  ...mirror([cyl("root", [0.8, 0.8, 0], [0.07, 1.6, 0.07], C.houtD, { mat: "wood" })]),
  box("root", [0, 1.15, 0.03], [1.8, 1.0, 0.1], C.hout, { round: 0.03, mat: "wood" }),
  box("root", [0, 1.75, 0.05], [2.0, 0.12, 0.45], C.dak, { round: 0.03, mat: "roof" }),
  ...[[-0.45, 1.2, 0.1, "#fff6c8"], [0.1, 1.05, 0.1, "#cdeaff"], [0.5, 1.25, 0.1, "#ffd6e7"]].map(([x, y, z, c]) => box("root", [x, y, z], [0.4, 0.5, 0.02], c, { rot: [0, 0, x * 10] })),
  star("root", [0, 1.62, 0.1], [0.12, 0.12, 0.12], C.goud, { mat: "metal" })
]);
models.dock = prop([
  ...[0, 1, 2, 3, 4, 5, 6].map(i => box("root", [0, 0.3, i * 0.55], [1.6, 0.1, 0.5], i % 2 ? C.hout : "#b9824c", { round: 0.02, mat: "wood" })),
  ...mirror([...[0, 3.3].map(z => cyl("root", [0.75, 0.1, z], [0.08, 0.9, 0.08], C.houtD, { mat: "wood" }))])
]);
models.lamp = prop([
  cyl("root", [0, 1.1, 0], [0.06, 2.2, 0.06], "#4a4458", { mat: "metal" }),
  sph("root", [0, 2.3, 0], [0.2, 0.22, 0.2], "#fff2b0", { mat: "emit" }),
  cone("root", [0, 2.52, 0], [0.26, 0.2, 0.26], "#4a4458", { mat: "metal", seg: 8 })
]);
models.fence = prop([
  ...[-0.9, 0, 0.9].map(x => box("root", [x, 0.45, 0], [0.12, 0.9, 0.12], C.creme, { round: 0.02, mat: "wood" })),
  box("root", [0, 0.62, 0], [2.0, 0.1, 0.06], C.creme, { mat: "wood" }),
  box("root", [0, 0.32, 0], [2.0, 0.1, 0.06], C.creme, { mat: "wood" })
]);
models.crystal = prop([
  ico("root", [0, 0.5, 0], [0.22, 0.6, 0.22], C.kristal, { mat: "emit" }),
  ico("root", [0.25, 0.3, 0.1], [0.13, 0.35, 0.13], "#b98cff", { mat: "emit", rot: [0, 0, -25] }),
  ico("root", [-0.22, 0.25, -0.05], [0.12, 0.3, 0.12], C.kristal, { mat: "emit", rot: [0, 0, 25] })
]);
models.chest = prop([
  box("root", [0, 0.3, 0], [0.9, 0.6, 0.6], C.hout, { round: 0.04, mat: "wood" }),
  cyl("lid", [0, 0.6, 0], [0.3, 0.9, 0.3], "#c98a4a", { rot: [0, 0, 90], mat: "wood", half: true }),
  box("root", [0, 0.45, 0.31], [0.14, 0.18, 0.04], C.goud, { mat: "metal" })
], { parts: { lid: { pivot: [0, 0.6, -0.3], parent: "root" } } });
models.star = prop([
  star("root", [0, 0, 0], [0.45, 0.45, 0.45], C.goud, { mat: "glow" })
]);
models.lavarock = prop([
  ico("root", [0, 0.5, 0], [1.0, 0.8, 0.9], "#5a4a5e", { mat: "stone" }),
  sph("root", [0.1, 0.95, 0.1], [0.35, 0.12, 0.3], C.lava, { mat: "emit" })
]);
models.bridge = prop([
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => box("root", [0, 0.25 + Math.sin(i / 7 * Math.PI) * 0.35, -1.75 + i * 0.5], [1.4, 0.1, 0.45], i % 2 ? C.hout : "#b9824c", { round: 0.02, mat: "wood" })),
  ...mirror([cyl("root", [0.7, 0.75, -1.75], [0.06, 1.0, 0.06], C.houtD), cyl("root", [0.7, 0.75, 1.75], [0.06, 1.0, 0.06], C.houtD)])
]);

// Wie spreekt in de dialogen + hoe het portret gerenderd wordt
const portraits = {
  beer: { model: "beer", target: [0, 1.12, 0], dist: 2.05 },
  muis: { model: "muis", target: [0, 0.8, 0], dist: 1.6 },
  draak: { model: "draak", target: [0, 1.4, 0.1], dist: 2.5 },
  vos: { model: "vos", target: [0, 1.02, 0.1], dist: 2.05 },
  uil: { model: "uil", target: [0, 1.15, 0], dist: 2.2 }
};

process.stdout.write(JSON.stringify({ version: 1, models, portraits }, null, 0));
