// twin3d/car_parts.js — ONE consistent high-detail car renderer (R6, R9, R10 proportions).
// OWNED BY the 3D car quality lead. vehicles.js consumes this; other agents must
// not edit it. shared.js is FROZEN and is NOT imported here.
//
// WHY THIS REPLACES R5's PARTS-BY-COMMITTEE
// The R5 "assemble a car from a swarm of named panels" approach produced
// disconnected parts that never aggregated into a believable car: blocky bodies,
// rear decks that ANGLED UP at the tail (no real car does this), body-colored
// windows, and identical wheels. R6 throws that out. There is now ONE parametric
// car builder — buildCar(spec) — and every recognizable model is just a set of
// numbers fed to it. The silhouette, glass, lights, mirrors, and wheels are all
// produced by the SAME code, so the whole fleet is consistent and each car reads
// as a specific real vehicle.
//
// R9 — REAL DIMENSIONS + MODEL-APPROPRIATE FRONT ENDS
// R6-R8 hand-fudged each model's L/W/etc independently, and length got inflated
// far more than width (a Camry ran 7.9 world units long on a 2.04-wide body —
// width/length = 0.26, vs a real Camry's 0.38). That's the "boxy, skinny,
// rectangular" complaint: the fleet was too narrow and too flat-sided for its
// length. R9 fixes this at the root — car_specs.js (a sibling module) exports
// CAR_SPECS: real-world mm dimensions + front-end cues per model. Every model's
// full envelope (L/W/H/wheelbase/track/overhangs) now comes from ONE consistent
// mm->world-unit factor (MM, derived below) applied to those real numbers, so
// relative sizes come out physically correct across the whole fleet (an F-150 or
// Odyssey reads as clearly longer/taller than a Corolla) instead of each model
// being independently eyeballed. On top of the correct envelope: sculptLower()
// gained a wheel-arch bulge (real fender flare, not just a dark trim ring), and
// the headlights/grille are now built per spec.headlight/spec.grille instead of
// a generic swept lamp + one grille shape on every car — see addHeadlights() and
// addGrilleAndBumpers() below.
//
// HARD QUALITY RULES ENFORCED BY THE GEOMETRY (not by convention):
//   * The rear deck is built monotonically NON-RISING toward the tail — deckY is
//     clamped <= beltY, so an upturned trunk is geometrically impossible.
//   * The greenhouse is a single DARK-GLASS prism (tumblehome-inset) with a
//     body-color roof cap + slim pillars laid on top — windows are never body
//     colored (the #1 realism tell), and the windshield/backlight rake is real.
//   * Wheels carry a per-model alloy texture (distinct spoke pattern + rim color
//     + diameter) — no two classes share a wheel. Dark tire, machined rim.
//   * Real per-style headlamps (front) / tail lamps (red, rear), side mirrors on
//     the A-pillar, a per-style grille, and front/rear bumpers on every car.
//
// R10 — SILHOUETTE ACCURACY PASS (proportions correct since R9; this pass is
// about the SHAPE reading like the specific real model, not just its box size)
// R9 fixed the envelope (L/W/H/overhangs); every model's greenhouse/roofline
// still leaned on similar STYLE numbers, so cars of the same body type read
// too alike (three SUVs with near-identical tail rake, four sedans with near-
// identical hoods). R10 re-tunes STYLE per model against blueprint/press-kit
// references (drawingdatabase/vector-templates side-profile conventions +
// manufacturer press-kit design copy) so each reads distinctly: SUVs now
// spread from boxiest to most sloped tailgate (Bronco Sport < Forester < CR-V),
// sedans differ in windshield rake + roof/backlight length (Accord's sportier
// one-motion roofline vs Camry's flatter/formal deck vs Corolla's short
// cab-forward greenhouse vs Model 3's steep-rake, near-fastback glass roof).
// Two small builder additions make cues STYLE alone couldn't express:
//   * c.backlightKink (addGreenhouse) — an optional two-tier "kammback" bend
//     in the backlight, used for the Prius's shallow-upper/steep-lower rear
//     glass split. 0/absent for every other model = the old single-line
//     backlight, unchanged.
//   * c.parts.blackoutPillar (addGreenhouse) — an optional dark quarter/
//     D-pillar, used for the Odyssey's "floating roof" black-out cue instead
//     of a body-color pillar. false/absent for every other model = unchanged.
// Also fixed: the `quarter` flag was previously read but never actually
// gated anything (qX was computed unconditionally), so `quarter: false`
// (corolla/f150) silently did nothing — now false genuinely removes the
// quarter-glass divider instead of always adding one.
//
// CHEAP: geometry is built ONCE per model at template time and clones share it;
// wheel rim art + the mesh-grille pattern are shared CanvasTextures cached once.
// vehicles.js clones templates and only swaps the paint material per car.
//
// Models (key -> real vehicle the numbers approximate) — see CAR_LIBRARY below
// for the full, citable name/model/year catalog per key.
import * as THREE from 'three';
import { toCreasedNormals } from '/vendor/utils/BufferGeometryUtils.js';
import { CAR_SPECS } from './car_specs.js';

// ===== CAR LIBRARY ===========================================================
// Explicit, human-readable catalog: every body TYPE key (below, in MODELS) maps
// to ONE real-world vehicle (name/model/year) so future feedback can reference
// a specific car ("the Bronco Sport", "the '15 Camry") instead of "the SUV".
// `name` is the plain-English label used for the mesh tag; `model`/`year` are
// the real-world reference vehicle the proportions in MODELS approximate
// (picked from the generation the numbers were measured against — see the R7
// reference-photo note above MODELS). This is a LOOKUP TABLE, not a per-car
// paint record — an instance's actual paint is randomized per spawn (vehicles.js
// CARCOLORS / FILLER_PALETTE) and is added alongside this entry when a car is
// tagged (see cloneBody in vehicles.js: mesh.userData.car = {...}).
export const CAR_LIBRARY = {
  forester: { id: 'forester', name: 'Subaru Forester',            model: 'Subaru Forester',        year: 2020 },
  bronco:   { id: 'bronco',   name: 'Ford Bronco Sport Heritage', model: 'Ford Bronco Sport',      year: 2023 },
  crv:      { id: 'crv',      name: 'Honda CR-V',                 model: 'Honda CR-V',             year: 2017 },
  accord:   { id: 'accord',   name: 'Honda Accord',               model: 'Honda Accord',           year: 2021 },
  camry:    { id: 'camry',    name: 'Toyota Camry',               model: 'Toyota Camry',           year: 2020 },
  corolla:  { id: 'corolla',  name: 'Toyota Corolla',             model: 'Toyota Corolla',         year: 2020 },
  prius:    { id: 'prius',    name: 'Toyota Prius',               model: 'Toyota Prius',           year: 2012 },
  odyssey:  { id: 'odyssey',  name: 'Honda Odyssey (1st-gen)',    model: 'Honda Odyssey',          year: 1999 },
  f150:     { id: 'f150',     name: 'Ford F-150 Raptor',          model: 'Ford F-150 Raptor',      year: 2017 },
  model3:   { id: 'model3',   name: 'Tesla Model 3',              model: 'Tesla Model 3',          year: 2018 },
  jeep:     { id: 'jeep',     name: 'Jeep Wrangler Rubicon',      model: 'Jeep Wrangler',          year: 2007 },
  porsche:  { id: 'porsche',  name: 'Porsche 911 Turbo',          model: 'Porsche 911 (930)',      year: 1975 },
};

// ---- realistic automotive paint palette (10) --------------------------------
// Real curbs skew white/silver/gray/black with a few colors. Kept at 10 entries
// so vehicles.js CARCOLORS index math is unchanged.
export const PAINTS = [
  0xe9ecee, // 0 arctic white
  0xc2c7cc, // 1 silver
  0x8d9298, // 2 gray
  0x1b1e22, // 3 black
  0x2b3a56, // 4 navy blue
  0x3c4a3a, // 5 olive green
  0x8f2222, // 6 deep red
  0x40454b, // 7 charcoal
  0xb8a888, // 8 champagne beige
  0x5a1f26, // 9 burgundy
];

// ---- paint material (per-car; retinted on clone) ----------------------------
// MeshStandardMaterial (NOT physical clearcoat — that mirrored the sky and washed
// every body to white in R4). Modest metalness + higher roughness + low env keeps
// the real hue on the panel with a painted-metal sheen.
export function mkPaint(color) {
  // R19 materials pass: real automotive CLEARCOAT paint — a metallic base coat under a
  // glossy clear layer, so with an environment map it picks up studio-lit reflections
  // instead of reading as flat matte plastic. Needs scene.environment set (main twin +
  // gallery both provide the venice HDRI); degrades to a soft sheen without one.
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.6, roughness: 0.42,
    clearcoat: 0.85, clearcoatRoughness: 0.18, envMapIntensity: 1.0 });
}
const PAINT0 = mkPaint(0x9098a0);   // placeholder; every paint mesh is retinted per clone

// ---- shared non-paint materials (one instance reused across the whole fleet) -
// GLASS is DARK, slightly reflective tint — never body colored. This is what
// makes the greenhouse read as real glass.
export const GLASS = new THREE.MeshStandardMaterial({ color: 0x0c1013, metalness: 0.55,
  roughness: 0.12, envMapIntensity: 1.0 });
export const TIRE = new THREE.MeshStandardMaterial({ color: 0x121316, metalness: 0.0, roughness: 0.94 });
export const CHROME = new THREE.MeshStandardMaterial({ color: 0xc7cbce, metalness: 1.0, roughness: 0.22 });
const HUB = new THREE.MeshStandardMaterial({ color: 0xb7bcc1, metalness: 0.85, roughness: 0.3 });
const DARK = new THREE.MeshStandardMaterial({ color: 0x1b1d20, metalness: 0.3, roughness: 0.62 });
const CLAD = new THREE.MeshStandardMaterial({ color: 0x181a1c, metalness: 0.1, roughness: 0.85 }); // matte black plastic cladding
// R9: glossier + slightly brighter than R6-R8 so lenses read as lit glass, not
// painted plastic, across every headlight style below (round/rect/slim-led/...).
const HEAD = new THREE.MeshStandardMaterial({ color: 0xf4f7ff, emissive: 0xdfe6ff,
  emissiveIntensity: 0.6, metalness: 0.15, roughness: 0.15 });
const AMBER = new THREE.MeshStandardMaterial({ color: 0xd98a1a, emissive: 0xc06a08,
  emissiveIntensity: 0.35, roughness: 0.4 });
const TAIL = new THREE.MeshStandardMaterial({ color: 0x5c0f0c, emissive: 0xcc1e12,
  emissiveIntensity: 0.9, roughness: 0.4 });
const PLATE = new THREE.MeshStandardMaterial({ color: 0xe8e4d4, metalness: 0.1, roughness: 0.5 });

// ===== MODEL-SPECIFIC COMPONENTS (R14) =======================================
// The fleet is parametric — shared builders fed per-model NUMBERS — which is why
// the SUVs read as siblings and why shared-builder edits leak across models. This
// is the counter-pattern: a per-model BESPOKE-COMPONENT hook. A model whose STYLE
// sets parts.headBuilder gets a hand-built headlight instead of the shared enum
// styles. It also disproves the "extruded body can't do compound curves" ceiling —
// these are real surface math: a LatheGeometry reflector (surface of revolution), a
// TubeGeometry DRL (swept along a 3D Catmull-Rom curve), and a hand-meshed
// parametric (u,v) lens that curves in TWO directions at once (a true bicubic-ish
// patch, evaluated densely — exactly the calculus a slab extrude can't express).
const LENS = new THREE.MeshPhysicalMaterial({ color: 0xeaf2ff, metalness: 0.0,
  roughness: 0.05, transmission: 0.72, transparent: true, opacity: 0.5,
  clearcoat: 1.0, clearcoatRoughness: 0.04, ior: 1.45, envMapIntensity: 1.3,
  side: THREE.DoubleSide });
const LEDW = new THREE.MeshStandardMaterial({ color: 0xf6faff, emissive: 0xdff0ff,
  emissiveIntensity: 1.5, roughness: 0.3 });
const REFLECTOR = new THREE.MeshStandardMaterial({ color: 0xdadfe4, metalness: 1.0,
  roughness: 0.07, side: THREE.DoubleSide });
const HL_SHELL = new THREE.MeshStandardMaterial({ color: 0x111316, metalness: 0.4,
  roughness: 0.5, side: THREE.DoubleSide });

// mesh a parametric surface f(u,v)->[x,y,z] over a uSeg x vSeg grid. This is the
// primitive the fleet was missing: a surface free to curve in both u and v.
function parametricSurface(fn, uSeg, vSeg, mat) {
  const pos = [], idx = [], row = vSeg + 1;
  for (let i = 0; i <= uSeg; i++)
    for (let j = 0; j <= vSeg; j++) { const p = fn(i / uSeg, j / vSeg); pos.push(p[0], p[1], p[2]); }
  for (let i = 0; i < uSeg; i++)
    for (let j = 0; j < vSeg; j++) {
      const a = i * row + j, b = a + row;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
}

// ===== CROSS-SECTION LOFT ENGINE (R17) =======================================
// The primitive the fleet lacked. addLowerBody extrudes ONE side profile across a
// constant width -> a slab. Real car bodies are a LOFT: a surface skinned through
// cross-sections (the outline you'd see slicing straight down through the car) that
// CHANGE shape along the length. loftBody skins quads through a list of stations,
// each a closed-loop profile in the Y-Z plane at a given X. Because the section
// varies station to station, the surface curves in both directions AND the whole
// form is model-specific (proportions + section shape are just data). This is how
// we fix the "generic shared body" that no amount of bolt-on detail could.
//
// stations: [{ x, profile }], profile = array of [y,z] pairs, a closed loop, SAME
// length N and consistent ordering across every station so points connect cleanly.
export function loftBody(stations, mat, opts = {}) {
  const N = stations[0].profile.length;
  const pos = [], idx = [];
  const W = opts.warp || ((x, y, z) => [x, y, z]);   // R19: post-warp (e.g. rake the rear)
  for (const st of stations) for (const p of st.profile) { const q = W(st.x, p[0], p[1]); pos.push(q[0], q[1], q[2]); }
  const flip = !!opts.flip;                       // swap winding if normals face inward
  for (let s = 0; s < stations.length - 1; s++)
    for (let p = 0; p < N; p++) {
      const pn = (p + 1) % N;
      const a = s * N + p, b = (s + 1) * N + p, a2 = s * N + pn, b2 = (s + 1) * N + pn;
      if (flip) idx.push(a, a2, b, a2, b2, b);
      else idx.push(a, b, a2, a2, b, b2);
    }
  if (opts.cap !== false) {                        // triangle-fan end caps to the centroid
    for (const end of [0, 1]) {
      const si = end === 0 ? 0 : stations.length - 1, st = stations[si];
      let cy = 0, cz = 0; for (const p of st.profile) { cy += p[0]; cz += p[1]; }
      const ci = pos.length / 3; const qc = W(st.x, cy / N, cz / N); pos.push(qc[0], qc[1], qc[2]);
      for (let p = 0; p < N; p++) {
        const pn = (p + 1) % N, a = si * N + p, b = si * N + pn;
        const front = (end === 0) !== flip;
        if (front) idx.push(ci, a, b); else idx.push(ci, b, a);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(toCreasedNormals(g, opts.crease ?? 0.5), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// a superellipse (squircle) cross-section as a closed loop of N [y,z] points, centred
// at height yc, half-height hh, half-width hw. `n` sets the corner sharpness: n=2 is a
// pure ellipse (round), n->infinity is a rectangle (boxy) -- this single exponent is
// the boxy<->sleek dial (Forester ~4-5 boxy, a sports car ~2.5 round). `tumble` tucks
// the top inward (tumblehome). Even angular sampling keeps points corresponding across
// stations so loftBody connects them cleanly.
export function sectionSquircle(yc, hh, hw, n, N, tumble = 0) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    const z = hw * Math.sign(ca) * Math.abs(ca) ** (2 / n);
    const y = hh * Math.sign(sa) * Math.abs(sa) ** (2 / n);
    pts.push([yc + y, z * (1 - tumble * Math.max(0, sa))]);
  }
  return pts;
}

// R17 Phase 2: the Forester lower body as a cross-section LOFT — boxy, flat-sided,
// fender-flared — instead of the shared constant-section extrude. This is the actual
// model-specific FORM the diagnosis said we were missing. Stations run nose->tail with
// squircle sections (n high = flat Subaru sides), widest at the fenders (arch flare),
// tapering at the nose/tail; proportions read off the real 2018-2021 SK blueprint.
function buildForesterBody(g, c) {
  const hl = c.L / 2, hw = c.W / 2;
  const axF = c.axleF * hl, axR = c.axleR * hl;
  const y0 = c.sillY - 0.04, N = 64, cowlX = c.cowlF * hl;
  // R19: the section TOP follows the hood/beltline. Over the hood (nose->cowl) it rises
  // GRADUALLY from the low nose up to the beltline at the cowl (a gentle curve into the
  // glass), not a long flat slab-top. Fixes "hood too long / transforms too abruptly".
  const topAt = (x) => x >= cowlX
    ? c.beltY + (c.noseY - 0.06 - c.beltY) * ((x - cowlX) / (hl - cowlX)) ** 1.7
    : c.beltY;
  const S = (x, wf, n, tum) => {
    const top = topAt(x), yc = (y0 + top) / 2, hh = (top - y0) / 2;
    return { x, profile: sectionSquircle(yc, hh, hw * wf, n, N, tum) };
  };
  const arch = 1.03;
  const stations = [
    // R19 plan taper: widest at the FRONT fenders, tapering IN toward the tail (the
    // SK's rounded-rectangle plan) instead of holding full width to the back. Nose is
    // blunt-wide (SUV), the cabin narrows rearward, the tail tucks in + rounds.
    S(hl,               0.72, 3.8, 0),      // nose (WIDE blunt SUV face, per blueprint front)
    S(hl - 0.14,        0.90, 4.2, 0),      // fascia (wide)
    S(axF + 0.38,       arch, 5.0, 0.04),   // front fender lead (widest)
    S(axF,              arch, 5.0, 0.04),   // front axle (flare)
    S(axF - 0.55,       0.98, 5.2, 0.08),   // front door
    S((axF + axR) / 2,  0.97, 5.2, 0.10),   // cabin mid
    S(axR + 0.55,       0.97, 5.2, 0.08),   // rear door (holds width — SUV)
    S(axR,              arch * 0.99, 5.0, 0.05),   // rear axle (flare)
    S(axR - 0.38,       0.99, 4.8, 0.05),   // rear fender trail
    S(-hl + 0.30,       0.95, 4.6, 0.04),   // rear quarter
    S(-hl + 0.12,       0.90, 4.0, 0.03),   // tail (WIDE + planted per blueprint rear)
    S(-hl,              0.82, 3.6, 0.02),   // tail end (wide, boxy rounded corner)
  ];
  // R19 rear shaping: toward the tail, pull the beltline FORWARD (trims the overhang +
  // makes the belt-tail meet the canopy backlight base) and the sill forward LESS, so the
  // tailgate LEANS FORWARD at the top — a raked, angled-in rear instead of a flat wall.
  const rearWarp = (x, y, z) => {
    const rf = Math.max(0, (-x / hl - 0.60) / 0.40);          // 0 ahead of -0.60hl .. 1 at tail
    if (rf <= 0) return [x, y, z];
    const ht = Math.max(0, Math.min(1, (y - c.sillY) / (c.beltY - c.sillY)));  // 0 sill .. 1 belt
    return [x + rf * rf * (0.10 * ht + 0.055 * (1 - ht)), y, z];
  };
  const body = loftBody(stations, PAINT0, { crease: 0.5, warp: rearWarp });
  body.userData.paint = true;
  g.add(body);
}

// ===== R18: 9 lofted per-model bodies (fan-out) ============================
// AUTO-EXTRACTED 9 lofted body builders

// bodyKey: crv
function buildCrvBody(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl, axR = c.axleR*hl;
  const y0 = c.sillY-0.04, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.045;
  const stations = [
    S(hl,        0.46, 2.8, 0.02),
    S(hl-0.16,   0.74, 3.4, 0.03),
    S(axF+0.42,  arch, 4.2, 0.07),
    S(axF,       arch, 4.2, 0.08),
    S(axF-0.50,  0.96, 4.3, 0.11),
    S((axF+axR)/2, 0.98, 4.4, 0.13),
    S(axR+0.50,  0.96, 4.3, 0.11),
    S(axR,       arch, 4.2, 0.08),
    S(axR-0.42,  arch, 4.1, 0.07),
    S(-hl+0.20,  0.78, 3.7, 0.04),
    S(-hl+0.06,  0.60, 3.2, 0.03),
    S(-hl,       0.42, 2.7, 0.02),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}


// bodyKey: accord
function buildAccordBody(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl, axR = c.axleR*hl;
  const y0 = c.sillY-0.04, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.015;
  const stations = [
    S(hl,           0.44, 2.3, 0.02),
    S(hl-0.20,       0.72, 2.7, 0.02),
    S(axF+0.42,      0.94*arch, 3.2, 0.04),
    S(axF,           0.97*arch, 3.2, 0.05),
    S(axF-0.55,      1.00, 3.3, 0.07),
    S(axF-1.10,      1.00, 3.4, 0.08),
    S((axF+axR)/2,   1.00, 3.4, 0.08),
    S(axR+0.75,      0.98, 3.4, 0.07),
    S(axR+0.30,      0.96*arch, 3.2, 0.05),
    S(axR,           0.94*arch, 3.2, 0.04),
    S(axR-0.55,      0.82, 2.9, 0.02),
    S(-hl+0.28,      0.66, 2.6, 0.02),
    S(-hl,           0.46, 2.3, 0.02),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}


// bodyKey: bronco
function buildBroncoBody(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl, axR = c.axleR*hl;
  const y0 = c.sillY-0.04, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.06;
  const stations = [
    S(hl,        0.60, 4.0, 0.02),
    S(hl-0.10,   0.86, 5.5, 0.03),
    S(axF+0.30,  arch, 6.0, 0.05),
    S(axF,       arch, 6.0, 0.05),
    S(axF-0.45,  1.00, 6.5, 0.06),
    S((axF+axR)/2, 1.00, 6.5, 0.06),
    S(axR+0.45,  1.00, 6.5, 0.06),
    S(axR,       arch, 6.0, 0.05),
    S(axR-0.30,  arch, 6.0, 0.05),
    S(-hl+0.10,  0.87, 5.5, 0.03),
    S(-hl,       0.62, 4.0, 0.02),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}

// bodyKey: camry
function buildCamryBody(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl, axR = c.axleR*hl;
  const y0 = c.sillY-0.03, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.035;
  const stations = [
    S(hl,          0.40, 2.8, 0.02),
    S(hl-0.18,     0.70, 3.0, 0.02),
    S(axF+0.36,    arch, 3.2, 0.05),
    S(axF,         arch, 3.2, 0.05),
    S(axF-0.55,    0.97, 3.3, 0.07),
    S((axF+axR)/2+0.9, 0.99, 3.3, 0.08),
    S((axF+axR)/2,     1.00, 3.3, 0.08),
    S((axF+axR)/2-0.9, 0.99, 3.3, 0.07),
    S(axR+0.55,    arch, 3.3, 0.06),
    S(axR,         arch, 3.3, 0.05),
    S(axR-0.42,    0.90, 3.5, 0.02),
    S(-hl+0.20,    0.76, 3.6, 0),
    S(-hl,         0.46, 3.2, 0),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}

// bodyKey: corolla
function buildCorollaBody(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl, axR = c.axleR*hl;
  const y0 = c.sillY-0.04, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.05;
  const stations = [
    S(hl,          0.42, 2.6, 0.02),
    S(hl-0.12,     0.62, 2.8, 0.03),
    S(axF+0.30,    arch, 3.0, 0.06),
    S(axF,         arch, 3.0, 0.07),
    S(axF-0.45,    0.94, 3.2, 0.10),
    S((axF+axR)/2, 0.96, 3.2, 0.12),
    S(axR+0.45,    0.94, 3.2, 0.10),
    S(axR,         arch, 3.0, 0.07),
    S(axR-0.30,    arch, 3.0, 0.06),
    S(-hl+0.18,    0.66, 2.8, 0.02),
    S(-hl,         0.46, 2.8, 0),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}

// bodyKey: odyssey
function buildOdysseyBody(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl, axR = c.axleR*hl;
  const y0 = c.sillY-0.04, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.035;
  const stations = [
    S(hl, 0.62, 3.2, 0.02),
    S(hl-0.22, 0.86, 3.8, 0.02),
    S(axF+0.35, 0.97, 4.5, 0.05),
    S(axF, arch, 4.6, 0.06),
    S(axF-0.45, 1.00, 4.6, 0.08),
    S((axF+axR)/2+0.3, 1.015, 4.6, 0.08),
    S((axF+axR)/2-0.3, 1.015, 4.6, 0.08),
    S(axR+0.45, 1.00, 4.6, 0.08),
    S(axR, arch, 4.6, 0.06),
    S(axR-0.35, 0.97, 4.5, 0.04),
    S(-hl+0.18, 0.90, 4.3, 0.02),
    S(-hl, 0.80, 4.5, 0),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}

// bodyKey: model3
function buildModel3Body(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl, axR = c.axleR*hl;
  const y0 = c.sillY-0.04, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.03;
  const stations = [
    S(hl,0.40,2.5,0.02), S(hl-0.28,0.66,2.6,0.04), S(axF+0.42,0.93,2.7,0.07),
    S(axF,arch,2.8,0.08), S(axF-0.50,0.99,2.9,0.10), S((axF+axR)/2+0.55,1.00,2.9,0.11),
    S((axF+axR)/2,1.00,2.9,0.12), S((axF+axR)/2-0.55,1.00,2.9,0.11), S(axR+0.40,1.02,2.8,0.09),
    S(axR,arch,2.8,0.07), S(axR-0.38,0.90,2.7,0.04), S(-hl+0.22,0.60,2.6,0.02), S(-hl,0.38,2.6,0),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}


// bodyKey: f150
function buildF150Body(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl;
  const cabRearX = (typeof c.bbF === 'number') ? c.bbF*hl : -0.2*hl;
  const y0 = c.sillY - 0.04, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.10;
  const mid = (axF + cabRearX) / 2;
  const stations = [
    S(hl,          0.62, 3.8, 0.02),
    S(hl-0.20,     0.86, 5.0, 0.02),
    S(hl-0.55,     0.94, 5.5, 0.02),
    S(axF+0.45,    0.96, 5.8, 0.03),
    S(axF,         arch, 5.8, 0.03),
    S(axF-0.45,    1.00, 5.8, 0.04),
    S(mid+0.6,     1.00, 6.0, 0.04),
    S(mid,         1.00, 6.0, 0.04),
    S(mid-0.6,     1.00, 6.0, 0.04),
    S(cabRearX+0.25, 0.98, 5.6, 0.03),
    S(cabRearX,    0.90, 5.0, 0.02),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}

// bodyKey: prius
function buildPriusBody(g, c) {
  const hl = c.L/2, hw = c.W/2;
  const axF = c.axleF*hl, axR = c.axleR*hl;
  const y0 = c.sillY-0.04, y1 = c.beltY;
  const yc = (y0+y1)/2, hh = (y1-y0)/2, N = 64;
  const S = (x, wf, n, tum) => ({ x, profile: sectionSquircle(yc, hh, hw*wf, n, N, tum) });
  const arch = 1.02;
  const stations = [
    S(hl,0.35,2.8,0.02),
    S(hl-0.20,0.62,2.8,0.02),
    S(hl-0.45,0.85,2.9,0.03),
    S(axF+0.30,arch*0.98,3.0,0.04),
    S(axF,arch,3.0,0.04),
    S(axF-0.50,0.99,3.1,0.05),
    S((axF+axR)/2,1.00,3.1,0.06),
    S(axR+0.50,0.99,3.0,0.05),
    S(axR,arch,3.0,0.04),
    S(axR-0.40,0.94,3.0,0.03),
    S(-hl+0.35,0.75,2.9,0.02),
    S(-hl+0.10,0.55,2.8,0.01),
    S(-hl,0.52,2.8,0),
  ];
  const body = loftBody(stations, PAINT0, {crease:0.5});
  body.userData.paint = true;
  g.add(body);
}

// bespoke 2019 Subaru Forester SK headlamp cluster. Built in local coords
// (+X forward, +Z outboard, origin at the cluster centre); `sz` bakes the mirror
// into the coordinates so both sides keep correct outward-facing normals.
function buildForesterHeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.60, Hin = 0.32, Hout = 0.19, domeX = 0.13;
  const Zc = u => (-W / 2 + u * W) * sz;         // inboard(0) -> outboard(1), mirrored by sz
  const Hu = u => Hin + (Hout - Hin) * u;        // taller inboard, tapers to the fender
  const sweepX = u => -u * u * 0.34;             // outboard edge wraps BACK around the fender
  // (1) clear compound-curved outer lens (curves in plan via sweepX AND in section via the dome)
  grp.add(parametricSurface((u, v) => {
    const h = Hu(u), y = (v - 0.5) * h - 0.01;
    const section = 1 - ((v - 0.5) * 2) ** 2 * 0.55;      // domes across the height
    const x = sweepX(u) + domeX * section * (1 - 0.22 * u);
    return [x, y, Zc(u)];
  }, 30, 15, LENS));
  // dark housing shell behind the lens (same outline, pushed back)
  grp.add(parametricSurface((u, v) => {
    const h = Hu(u) * 0.98, y = (v - 0.5) * h - 0.01;
    return [sweepX(u) - 0.12, y, Zc(u) * 0.99];
  }, 22, 11, HL_SHELL));
  // (2) projector reflector bowl — a LatheGeometry surface of revolution (parabola)
  const prof = [];
  for (let k = 0; k <= 12; k++) { const t = k / 12; prof.push(new THREE.Vector2(0.004 + t * 0.08, -0.10 * (1 - t * t))); }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 26), REFLECTOR);
  bowl.rotation.z = -Math.PI / 2; bowl.position.set(-0.03, -0.02, Zc(0.28)); grp.add(bowl);
  const proj = new THREE.Mesh(new THREE.SphereGeometry(0.058, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2), LENS);
  proj.rotation.z = -Math.PI / 2; proj.position.set(0.02, -0.02, Zc(0.28)); grp.add(proj);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 22), CHROME);
  rim.rotation.y = Math.PI / 2; rim.position.set(0.035, -0.02, Zc(0.28)); grp.add(rim);
  // (3) C-shaped LED DRL — TubeGeometry swept along a 3D Catmull-Rom curve (the SK signature)
  const P = (x, y, u) => new THREE.Vector3(x, y, Zc(u));
  const drlCurve = new THREE.CatmullRomCurve3([
    P(0.03, 0.12, 0.16), P(0.06, 0.13, 0.42), P(0.04, 0.10, 0.72),
    P(-0.02, 0.0, 0.9), P(-0.02, -0.11, 0.74),
  ]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(drlCurve, 44, 0.019, 10), LEDW));
  // (4) amber turn signal — low-outboard
  const amb = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.17), AMBER);
  amb.position.set(0.0, -0.11, Zc(0.80)); grp.add(amb);
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return grp;
}

// ===== R16: 9 more bespoke per-model headlamps (fan-out builders) ===========
// AUTO-EXTRACTED 9 headlight builders

// headKey: corolla — Narrow swept-back halogen lamp with a plain reflector bowl, small amber corner, and no fancy DRL signature
function buildCorollaHeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.52, Hin = 0.18, Hout = 0.11;
  const Zc = u => (-W/2 + u*W)*sz;
  const Hu = u => Hin + (Hout-Hin)*u;
  const sweepX = u => -u*u*0.22;
  grp.add(parametricSurface((u,v)=>{ const h=Hu(u), y=(v-0.5)*h; const section=1-((v-0.5)*2)**2*0.5; const x=sweepX(u)+0.075*section*(1-0.3*u); return [x,y,Zc(u)]; }, 24,12, LENS));
  grp.add(parametricSurface((u,v)=>{ const h=Hu(u)*0.96, y=(v-0.5)*h; return [sweepX(u)-0.07, y, Zc(u)*0.99]; }, 18,9, HL_SHELL));
  const prof=[]; for(let k=0;k<=10;k++){const t=k/10; prof.push(new THREE.Vector2(0.004+t*0.06, -0.075*(1-t*t)));}
  const bowl=new THREE.Mesh(new THREE.LatheGeometry(prof,20), REFLECTOR); bowl.rotation.z=-Math.PI/2; bowl.position.set(-0.015,-0.01,Zc(0.32)); grp.add(bowl);
  const proj=new THREE.Mesh(new THREE.SphereGeometry(0.042,18,14,0,Math.PI*2,0,Math.PI/2), LENS); proj.rotation.z=-Math.PI/2; proj.position.set(0.012,-0.01,Zc(0.32)); grp.add(proj);
  const amb=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.032,0.13), AMBER); amb.position.set(-0.01,-0.05,Zc(0.82)); grp.add(amb);
  const P=(x,y,u)=>new THREE.Vector3(x,y,Zc(u));
  const drlCurve=new THREE.CatmullRomCurve3([P(0.01,0.05,0.20),P(0.02,0.055,0.45),P(0.01,0.045,0.68)]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(drlCurve,20,0.010,8), LEDW));
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;}); return grp;
}

// headKey: odyssey — Wide wraparound cluster with a straight LED DRL blade slashing across the top edge above a chrome-ringed projector.
function buildOdysseyHeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.72, Hin = 0.30, Hout = 0.17, domeX = 0.12;
  const Zc = u => (-W/2 + u*W)*sz;
  const Hu = u => Hin + (Hout-Hin)*u;
  const sweepX = u => -u*u*0.30;
  grp.add(parametricSurface((u,v)=>{ const h=Hu(u), y=(v-0.5)*h+0.02; const section=1-((v-0.5)*2)**2*0.5; const x=sweepX(u)+domeX*section*(1-0.2*u); return [x,y,Zc(u)]; }, 32,15, LENS));
  grp.add(parametricSurface((u,v)=>{ const h=Hu(u)*0.97, y=(v-0.5)*h+0.02; return [sweepX(u)-0.11, y, Zc(u)*0.99]; }, 24,11, HL_SHELL));
  const prof=[]; for(let k=0;k<=12;k++){const t=k/12; prof.push(new THREE.Vector2(0.004+t*0.075, -0.095*(1-t*t)));}
  const bowl=new THREE.Mesh(new THREE.LatheGeometry(prof,26), REFLECTOR); bowl.rotation.z=-Math.PI/2; bowl.position.set(-0.02,0.0,Zc(0.30)); grp.add(bowl);
  const proj=new THREE.Mesh(new THREE.SphereGeometry(0.055,22,16,0,Math.PI*2,0,Math.PI/2), LENS); proj.rotation.z=-Math.PI/2; proj.position.set(0.03,0.0,Zc(0.30)); grp.add(proj);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.058,0.011,8,22), CHROME); rim.rotation.y=Math.PI/2; rim.position.set(0.045,0.0,Zc(0.30)); grp.add(rim);
  const P=(x,y,u)=>new THREE.Vector3(x,y,Zc(u));
  const blade=new THREE.CatmullRomCurve3([P(0.05,0.135,0.06),P(0.09,0.15,0.35),P(0.10,0.155,0.65),P(0.07,0.14,0.92)]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(blade,40,0.017,10), LEDW));
  const chromeBar=new THREE.CatmullRomCurve3([P(0.03,0.10,0.10),P(0.065,0.115,0.35),P(0.075,0.12,0.65),P(0.05,0.105,0.90)]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(chromeBar,32,0.008,8), CHROME));
  const amb=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.05,0.15), AMBER); amb.position.set(-0.01,-0.10,Zc(0.85)); grp.add(amb);
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;}); return grp;
}

// headKey: accord — Twin jewel-eye projector bowls glinting side by side behind one sharply swept angular lens.
function buildAccordHeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.62, Hin = 0.30, Hout = 0.15, domeX = 0.11;
  const Zc = u => (-W/2 + u*W)*sz;
  const Hu = u => Hin + (Hout-Hin)*Math.pow(u,1.3);
  const sweepX = u => -Math.pow(u,1.6)*0.30;
  grp.add(parametricSurface((u,v)=>{ const h=Hu(u), t=(v-0.5)*2, y=(v-0.5)*h-0.015; const section=1-Math.pow(Math.abs(t),1.6)*0.6; const x=sweepX(u)+domeX*section*(1-0.3*u); return [x,y,Zc(u)]; }, 30,15, LENS));
  grp.add(parametricSurface((u,v)=>{ const h=Hu(u)*0.97, y=(v-0.5)*h-0.015; return [sweepX(u)-0.10, y, Zc(u)*0.99]; }, 22,11, HL_SHELL));
  const prof=[]; for(let k=0;k<=12;k++){const t=k/12; prof.push(new THREE.Vector2(0.004+t*0.062, -0.078*(1-t*t)));}
  const bowlU = [0.22, 0.50];
  const bowlY = [-0.02, -0.01];
  for (let i=0;i<2;i++){
    const bu = bowlU[i], by = bowlY[i];
    const bowl=new THREE.Mesh(new THREE.LatheGeometry(prof,22), REFLECTOR); bowl.rotation.z=-Math.PI/2; bowl.position.set(sweepX(bu)-0.02, by, Zc(bu)); grp.add(bowl);
    const proj=new THREE.Mesh(new THREE.SphereGeometry(0.046,20,14,0,Math.PI*2,0,Math.PI/2), LENS); proj.rotation.z=-Math.PI/2; proj.position.set(sweepX(bu)+0.02, by, Zc(bu)); grp.add(proj);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(0.048,0.010,8,20), CHROME); rim.rotation.y=Math.PI/2; rim.position.set(sweepX(bu)+0.03, by, Zc(bu)); grp.add(rim);
  }
  const P=(x,y,u)=>new THREE.Vector3(x,y,Zc(u));
  const ledCurve=new THREE.CatmullRomCurve3([P(sweepX(0.06)+0.02,-0.135,0.06),P(sweepX(0.35)+0.01,-0.14,0.35),P(sweepX(0.62)-0.01,-0.135,0.62),P(sweepX(0.85)-0.03,-0.10,0.85),P(sweepX(0.96)-0.05,-0.03,0.95)]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(ledCurve,40,0.015,10), LEDW));
  const amb=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.05,0.15), AMBER); amb.position.set(sweepX(0.9)-0.02,-0.09,Zc(0.90)); grp.add(amb);
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;}); return grp;
}

// headKey: camry — Slender swept lens with a thin straight LED accent tracing the lower edge, single projector inboard and reflector fill sweeping out to the fender tip.
function buildCamryHeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.56, Hin = 0.185, Hout = 0.135, domeX = 0.10;
  const Zc = u => (-W*0.06 + u*W)*sz;
  const Hu = u => Hin + (Hout-Hin)*u*u;
  const sweepX = u => -u*u*0.30;
  const lowEdge = u => -Hu(u)*0.5 + 0.012*Math.sin(u*Math.PI);
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u), base=lowEdge(u), y=base+v*h;
    const section=1-((v-0.42)*2.1)**2*0.5;
    const x=sweepX(u)+domeX*section*(1-0.18*u);
    return [x,y,Zc(u)];
  }, 30,14, LENS));
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u)*0.96, base=lowEdge(u)+0.006, y=base+v*h;
    return [sweepX(u)-0.10, y, Zc(u)*0.99];
  }, 22,10, HL_SHELL));
  const prof=[]; for(let k=0;k<=12;k++){const t=k/12; prof.push(new THREE.Vector2(0.003+t*0.062, -0.078*(1-t*t)));}
  const bowl=new THREE.Mesh(new THREE.LatheGeometry(prof,24), REFLECTOR);
  bowl.rotation.z=-Math.PI/2; bowl.position.set(-0.02,0.02,Zc(0.22)); grp.add(bowl);
  const proj=new THREE.Mesh(new THREE.SphereGeometry(0.045,20,14,0,Math.PI*2,0,Math.PI/2), LENS);
  proj.rotation.z=-Math.PI/2; proj.position.set(0.018,0.02,Zc(0.22)); grp.add(proj);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.047,0.009,8,20), CHROME);
  rim.rotation.y=Math.PI/2; rim.position.set(0.028,0.02,Zc(0.22)); grp.add(rim);
  const fanBowl=new THREE.Mesh(new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p.x*0.85,p.y*0.85)),20), REFLECTOR);
  fanBowl.rotation.z=-Math.PI/2; fanBowl.position.set(-0.015,0.055,Zc(0.62)); grp.add(fanBowl);
  const P=(x,y,u)=>new THREE.Vector3(x,y,Zc(u));
  const ledCurve=new THREE.CatmullRomCurve3([
    P(sweepX(0.06)-0.02, lowEdge(0.06)+0.006, 0.06),
    P(sweepX(0.30)-0.02, lowEdge(0.30)+0.006, 0.30),
    P(sweepX(0.55)-0.02, lowEdge(0.55)+0.006, 0.55),
    P(sweepX(0.80)-0.02, lowEdge(0.80)+0.006, 0.80),
    P(sweepX(0.95)-0.02, lowEdge(0.95)+0.006, 0.95)
  ]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(ledCurve,40,0.010,8), LEDW));
  const amb=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.05,0.10), AMBER);
  amb.position.set(sweepX(0.86)-0.01,0.005,Zc(0.86)); grp.add(amb);
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return grp;
}

// headKey: f150 — Big boxy trapezoidal halogen lamp, flat lens, chrome-framed square projector + horizontal reflector bar, amber inboard corner.
function buildF150HeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.70, Hin = 0.34, Hout = 0.27;
  const Zc = u => (-W/2 + u*W)*sz;
  const Hu = u => Hin + (Hout-Hin)*u;
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u), y=(v-0.5)*h;
    const corner = 1-Math.pow(Math.abs(v-0.5)*2,6)*0.10 - Math.pow(Math.abs(u-0.5)*2,6)*0.06;
    const x = 0.07*corner - u*0.02;
    return [x, y, Zc(u)];
  }, 26,14, LENS));
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u)*0.96, y=(v-0.5)*h;
    return [-0.10, y, Zc(u)*0.99];
  }, 20,10, HL_SHELL));
  const frameU=[0,1], frameShape=[-0.5,0.5];
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.02, Hin+0.02, W-0.02), CHROME);
  frame.position.set(0.075, 0.0, 0);
  grp.add(frame);
  const barProf=[]; for(let k=0;k<=10;k++){const t=k/10; barProf.push(new THREE.Vector2(0.003+t*0.055,-0.045*(1-t*t)));}
  const bar = new THREE.Mesh(new THREE.LatheGeometry(barProf,4,0,Math.PI*2), REFLECTOR);
  bar.rotation.z=-Math.PI/2; bar.rotation.x=Math.PI/2;
  bar.scale.set(1,1,3.6);
  bar.position.set(-0.04, 0.06, Zc(0.32));
  grp.add(bar);
  const bowlProf=[]; for(let k=0;k<=10;k++){const t=k/10; bowlProf.push(new THREE.Vector2(0.004+t*0.075,-0.09*(1-t*t)));}
  const bowl=new THREE.Mesh(new THREE.LatheGeometry(bowlProf,24), REFLECTOR);
  bowl.rotation.z=-Math.PI/2; bowl.position.set(-0.03,-0.06,Zc(0.62)); grp.add(bowl);
  const proj=new THREE.Mesh(new THREE.SphereGeometry(0.05,20,14,0,Math.PI*2,0,Math.PI/2), LENS);
  proj.rotation.z=-Math.PI/2; proj.position.set(0.02,-0.06,Zc(0.62)); grp.add(proj);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.052,0.011,8,20), CHROME);
  rim.rotation.y=Math.PI/2; rim.position.set(0.03,-0.06,Zc(0.62)); grp.add(rim);
  const amb=new THREE.Mesh(new THREE.BoxGeometry(0.045,Hin*0.55,0.08), AMBER);
  amb.position.set(0.03,0.0,Zc(0.06)); grp.add(amb);
  const trimTop = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, W-0.03), CHROME);
  trimTop.position.set(0.08, Hin/2-0.01, 0); grp.add(trimTop);
  const trimBot = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, W-0.05), CHROME);
  trimBot.position.set(0.08, -Hout/2+0.01, 0); grp.add(trimBot);
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return grp;
}

// headKey: model3 — Ultra-thin tapered lens (0.05 to 0.14 tall) with a slim tapering multi-segment LED strip, no chrome/projector/amber
function buildModel3HeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.52, Hin = 0.05, Hout = 0.14, domeX = 0.065;
  const Zc = u => (-W/2 + u*W)*sz;
  const Hu = u => Hin + (Hout-Hin)*Math.pow(u,1.3);
  const sweepX = u => 0.015 + u*0.025;
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u), y=(v-0.5)*h;
    const section = 1-((v-0.5)*2)**2*0.5;
    const x = sweepX(u) + domeX*section*(0.2+0.8*u);
    return [x,y,Zc(u)];
  }, 34,10, LENS));
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u)*0.88, y=(v-0.5)*h;
    return [sweepX(u)-0.02, y, Zc(u)*0.995];
  }, 26,8, HL_SHELL));
  const ledY = u => Hu(u)*0.05;
  const segCount = 5;
  for (let i=0;i<segCount;i++){
    const u0=i/segCount, u1=(i+1)/segCount, um=(u0+u1)/2;
    const c0=new THREE.Vector3(sweepX(u0)+0.012, ledY(u0), Zc(u0));
    const cm=new THREE.Vector3(sweepX(um)+0.012, ledY(um), Zc(um));
    const c1=new THREE.Vector3(sweepX(u1)+0.012, ledY(u1), Zc(u1));
    const curve=new THREE.CatmullRomCurve3([c0,cm,c1]);
    const rad = 0.005 + 0.016*um;
    grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve,6,rad,8), LEDW));
  }
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return grp;
}

// headKey: crv — Swept-wrap lens curling back into the fender under a chrome brow, with a straight horizontal LED bar tracing the top edge
function buildCrvHeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.56, Hin = 0.21, Hout = 0.14, domeX = 0.10;
  const Zc = u => (-W/2 + u*W)*sz;
  const Hu = u => Hin + (Hout-Hin)*u;
  const sweepX = u => -u*u*u*0.30 - u*0.02;
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u), y=(v-0.5)*h;
    const section = 1-((v-0.5)*2)**2*0.5;
    const x = sweepX(u) + domeX*section*(1-0.3*u);
    return [x,y,Zc(u)];
  }, 30,15, LENS));
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u)*0.97, y=(v-0.5)*h;
    return [sweepX(u)-0.10, y, Zc(u)*0.99];
  }, 22,11, HL_SHELL));
  grp.add(parametricSurface((u,v)=>{
    const h=Hu(u);
    const y = h*0.5 + 0.006 + v*0.012;
    const x = sweepX(u) + domeX*0.55*(1-0.3*u) - v*0.03;
    return [x,y,Zc(u)];
  }, 24,4, CHROME));
  const ledStart = new THREE.Vector3(sweepX(0.05)+domeX*0.5, Hu(0.05)*0.5-0.005, Zc(0.05));
  const ledEnd = new THREE.Vector3(sweepX(0.85)+domeX*0.5*(1-0.3*0.85), Hu(0.85)*0.5-0.005, Zc(0.85));
  const ledMid = new THREE.Vector3((ledStart.x+ledEnd.x)/2, (ledStart.y+ledEnd.y)/2+0.005, (ledStart.z+ledEnd.z)/2);
  const ledCurve = new THREE.CatmullRomCurve3([ledStart, ledMid, ledEnd]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(ledCurve, 30, 0.014, 8), LEDW));
  const prof=[]; for(let k=0;k<=12;k++){const t=k/12; prof.push(new THREE.Vector2(0.004+t*0.07, -0.09*(1-t*t)));}
  const bowl=new THREE.Mesh(new THREE.LatheGeometry(prof,24), REFLECTOR);
  bowl.rotation.z=-Math.PI/2; bowl.position.set(sweepX(0.30)-0.02,-0.015,Zc(0.30)); grp.add(bowl);
  const proj=new THREE.Mesh(new THREE.SphereGeometry(0.05,20,14,0,Math.PI*2,0,Math.PI/2), LENS);
  proj.rotation.z=-Math.PI/2; proj.position.set(sweepX(0.30)+0.025,-0.015,Zc(0.30)); grp.add(proj);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.052,0.01,8,20), CHROME);
  rim.rotation.y=Math.PI/2; rim.position.set(sweepX(0.30)+0.035,-0.015,Zc(0.30)); grp.add(rim);
  const amb=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.05,0.13), AMBER);
  amb.position.set(sweepX(0.82)-0.02,-Hu(0.82)*0.35,Zc(0.82)); grp.add(amb);
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return grp;
}

// headKey: prius — Ultra-thin boomerang LED strip (sharp kink, two hook legs) wrapped by a slim domeless lens, no projector, no amber.
function buildPriusHeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.60, domeX = 0.08, kink = 0.38;
  const Zc = u => (-W/2 + u*W)*sz;
  const sweepX = u => -0.10 - 0.22*u;
  const spineY = u => u<kink ? (-0.03 + 0.10*(u/kink)) : (0.07 - 0.15*((u-kink)/(1-kink)));
  const Hu = u => 0.08 + 0.04*Math.sin(u*Math.PI);
  grp.add(parametricSurface((u,v)=>{ const h=Hu(u), y=spineY(u)+(v-0.5)*h; const section=1-((v-0.5)*2)**2*0.5; const x=sweepX(u)+domeX*section*(1-0.2*u); return [x,y,Zc(u)]; }, 34,10, LENS));
  grp.add(parametricSurface((u,v)=>{ const h=Hu(u)*0.95, y=spineY(u)+(v-0.5)*h; return [sweepX(u)-0.05, y, Zc(u)*0.99]; }, 26,8, HL_SHELL));
  const P=(u,xOff=0.02,yOff=0)=> new THREE.Vector3(sweepX(u)+xOff, spineY(u)+yOff, Zc(u));
  const leg1 = new THREE.CatmullRomCurve3([P(0.03), P(0.16), P(kink)]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(leg1,20,0.013,8), LEDW));
  const leg2 = new THREE.CatmullRomCurve3([P(kink), P(0.62), P(0.90)]);
  grp.add(new THREE.Mesh(new THREE.TubeGeometry(leg2,20,0.013,8), LEDW));
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.014,10,8), LEDW);
  joint.position.copy(P(kink)); grp.add(joint);
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;}); return grp;
}

// headKey: bronco-sport — Round LED projector lamp with chrome ring and C-shaped DRL arc, set flush into a boxy square dark housing with no rearward sweep.
function buildBroncoHeadlightUnit(sz) {
  const grp = new THREE.Group();
  const W = 0.56, H = 0.30, D = 0.11, lensR = 0.135, domeX = 0.095;
  const Zc = u => (-W/2 + u*W)*sz;
  const Zcenter = Zc(0.5);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(D*0.9, H, W), HL_SHELL);
  shell.position.set(-D*0.5, 0, 0);
  grp.add(shell);
  grp.add(parametricSurface((u,v)=>{
    const r = u*lensR;
    const ang = v*Math.PI*2;
    const y = Math.cos(ang)*r;
    const dz = Math.sin(ang)*r*sz;
    const x = domeX*Math.sqrt(1-u*u);
    return [x, y, Zcenter + dz];
  }, 18,28, LENS));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(lensR, 0.012, 8, 28), CHROME);
  ring.rotation.y = Math.PI/2;
  ring.position.set(0.012, 0, Zcenter);
  grp.add(ring);
  const drl = new THREE.Mesh(new THREE.TorusGeometry(lensR+0.028, 0.014, 8, 24, Math.PI*1.5), LEDW);
  drl.rotation.y = Math.PI/2;
  drl.rotation.z = Math.PI*0.25*sz;
  drl.position.set(0.0, 0, Zcenter);
  grp.add(drl);
  const prof = [];
  for (let k=0;k<=12;k++){ const t=k/12; prof.push(new THREE.Vector2(0.004+t*0.115, -0.09*(1-(1-t)*(1-t)))); }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof,26), REFLECTOR);
  bowl.rotation.z = -Math.PI/2;
  bowl.position.set(-0.045, 0, Zcenter);
  grp.add(bowl);
  const amb = new THREE.Mesh(new THREE.BoxGeometry(0.035, H*0.22, 0.05), AMBER);
  amb.position.set(-0.02, -H*0.32, Zc(0.94));
  grp.add(amb);
  grp.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return grp;
}

// R16: headKey -> bespoke unit builder. Each model opts in via parts.headBuilder.
const HEAD_UNITS = {
  'forester-sk': buildForesterHeadlightUnit,
  'bronco-sport': buildBroncoHeadlightUnit,
  'crv': buildCrvHeadlightUnit,
  'accord': buildAccordHeadlightUnit,
  'camry': buildCamryHeadlightUnit,
  'corolla': buildCorollaHeadlightUnit,
  'prius': buildPriusHeadlightUnit,
  'odyssey': buildOdysseyHeadlightUnit,
  'f150': buildF150HeadlightUnit,
  'model3': buildModel3HeadlightUnit,
};
function addBespokeHeadlights(g, c, unitFn) {
  const xF = c.L / 2, off = c.body === 'pickup' ? 0.32 : 0.35;
  for (const sz of [-1, 1]) {
    const u = unitFn(sz);
    u.position.set(xF - 0.02, c.noseY - 0.01, sz * (c.W * off));
    g.add(u);
  }
}

// ===== FORESTER SK BESPOKE PART SUITE (R15) ==================================
// Ten hand-built, model-specific Forester parts, each using the R14 methodology
// (LatheGeometry / TubeGeometry / parametric (u,v) surfaces). Enabled by parts.sk
// on the Forester only, and each hooked into its shared builder so it OVERRIDES the
// parametric fleet version for this one model — the specificity pattern at scale.
const SK_ALLOY = new THREE.MeshStandardMaterial({ color: 0xb2b7bc, metalness: 0.88, roughness: 0.3 });
const SK_ALLOYD = new THREE.MeshStandardMaterial({ color: 0x8b9096, metalness: 0.85, roughness: 0.34, side: THREE.DoubleSide });
const SK_REDLENS = new THREE.MeshStandardMaterial({ color: 0x7a1210, emissive: 0x8f1512,
  emissiveIntensity: 0.55, roughness: 0.32, transparent: true, opacity: 0.92, side: THREE.DoubleSide });

// (1) 3D alloy wheel face — a lathe rim barrel + real 5-split spokes + hub (no flat disc)
function foresterWheelDisc(c, sz) {
  const g = new THREE.Group();
  const r = c.wheelR, tw = c.tireW, rr = r * 0.9;
  const prof = [new THREE.Vector2(r * 0.30, tw * 0.52), new THREE.Vector2(rr * 0.98, tw * 0.52),
    new THREE.Vector2(rr, tw * 0.18), new THREE.Vector2(rr * 0.6, -tw * 0.1), new THREE.Vector2(r * 0.30, -tw * 0.05)];
  const barrel = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), SK_ALLOYD);
  barrel.rotation.x = Math.PI / 2; g.add(barrel);
  for (let i = 0; i < 5; i++) {                          // 5 split spokes (V pairs)
    const a = (i / 5) * Math.PI * 2;
    for (const off of [-0.17, 0.17]) {
      const ang = a + off;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(rr * 0.8, 0.055, 0.09), SK_ALLOY);
      spoke.position.set(Math.cos(ang) * rr * 0.46, Math.sin(ang) * rr * 0.46, tw * 0.44);
      spoke.rotation.z = ang; spoke.castShadow = true; g.add(spoke);
    }
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.3, rr * 0.3, tw * 0.5, 20), SK_ALLOY);
  hub.rotation.x = Math.PI / 2; hub.position.z = tw * 0.38; g.add(hub);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(rr * 0.14, rr * 0.14, tw * 0.12, 16), CHROME);
  cap.rotation.x = Math.PI / 2; cap.position.z = tw * 0.5; g.add(cap);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8), DARK);
    lug.rotation.x = Math.PI / 2; lug.position.set(Math.cos(a) * rr * 0.2, Math.sin(a) * rr * 0.2, tw * 0.47); g.add(lug);
  }
  if (sz < 0) g.scale.z = -1;
  return g;
}

// (2) compound-curved hood — parametric (u,v) skin: centre power-dome + 2 creases
function foresterHood(g, c) {
  const hl = c.L / 2, xF = hl, cowlX = c.cowlF * hl, hw = c.W * 0.44;
  const skin = parametricSurface((u, v) => {
    const x = xF - 0.1 + (cowlX - xF + 0.1) * u, z = -hw + 2 * hw * v;
    const baseY = c.noseY + (c.beltY - c.noseY) * u * u;
    const dome = 0.055 * (1 - ((v - 0.5) * 2) ** 2) * (1 - u * 0.25);
    const crease = -0.02 * Math.exp(-(((Math.abs(z) - hw * 0.52) / (hw * 0.1)) ** 2));
    return [x, baseY + dome + crease + 0.025, z];
  }, 26, 22, PAINT0);
  skin.userData.paint = true; g.add(skin);
}

// (3) bespoke SK hexagon grille — domed dark insert + curved fins + chrome wing + hex frame
function foresterGrille(g, c) {
  const hl = c.L / 2, xF = hl, backX = xF - 0.02;
  const gy0 = c.sillY + 0.34, gy1 = c.noseY - 0.02, halfW = c.W * 0.32, gymid = (gy0 + gy1) / 2;
  g.add(parametricSurface((u, v) => {
    const z = (-halfW * 1.08 + 2 * halfW * 1.08 * u) * (0.82 + 0.18 * v), y = gy0 + (gy1 - gy0) * v;
    const bow = 0.05 * (1 - ((u - 0.5) * 2) ** 2) * (1 - ((v - 0.5) * 2) ** 2);
    return [backX + bow - 0.02, y, z];
  }, 22, 12, DARK));
  for (let i = -3; i <= 3; i++) {                        // curved vertical fins
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, (gy1 - gy0) * 0.9, 0.028), CHROME);
    fin.position.set(backX + 0.05, gymid, i * halfW * 0.28); g.add(fin);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, halfW * 2.5), CHROME);
  wing.position.set(backX + 0.07, gy1 - 0.01, 0); g.add(wing);   // SK chrome wing across the top
  const topW = halfW * 0.72, botW = halfW, midW = halfW * 1.12, fx = backX + 0.08;
  const E = (y0, z0, y1, z1) => frameEdgeYZ(g, y0, z0, y1, z1, fx, 0.05, 0.05, CHROME);
  E(gy1, -topW, gy1, topW); E(gy1, topW, gymid, midW); E(gymid, midW, gy0, botW);
  E(gy0, botW, gy0, -botW); E(gy0, -botW, gymid, -midW); E(gymid, -midW, gy1, -topW);
}

// (4) C-shaped tail lamp — red TubeGeometry C-curve + a domed red lens + body mount
function foresterTailLamp(g, c, sz) {
  const hl = c.L / 2, xR = -hl, faceX = xR - 0.01, cy = c.beltY - 0.10, cz = sz * (c.W * 0.40);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const curve = new THREE.CatmullRomCurve3([
    V(faceX - 0.02, cy + 0.24, cz - sz * 0.02), V(faceX + 0.02, cy + 0.24, cz + sz * 0.07),
    V(faceX + 0.03, cy, cz + sz * 0.09), V(faceX + 0.02, cy - 0.24, cz + sz * 0.07),
    V(faceX - 0.02, cy - 0.24, cz - sz * 0.02)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.036, 10), TAIL));
  g.add(parametricSurface((u, v) => {
    const y = cy - 0.22 + 0.44 * u, zz = cz - sz * 0.02 + sz * 0.10 * v;
    return [faceX + 0.02 + 0.03 * (1 - ((u - 0.5) * 2) ** 2), y, zz];
  }, 12, 8, SK_REDLENS));
  slab(g, xR - 0.02, xR + 0.06, cy - 0.28, cy + 0.28, cz - sz * 0.02 - 0.05, cz + sz * 0.11 + 0.03, null, true);
}

// (5) bespoke front fascia — a curved silver skid plate (parametric) + trapezoid intake
function foresterFrontFascia(g, c) {
  const hl = c.L / 2, xF = hl;
  g.add(parametricSurface((u, v) => {
    const z = -c.W * 0.30 + c.W * 0.60 * u, y = c.sillY + 0.02 + 0.12 * v, curl = 0.10 * (1 - v);
    return [xF - 0.02 - curl * 0.6, y, z * (0.9 + 0.1 * v)];
  }, 18, 6, HUB));
  const iy0 = c.sillY + 0.16, iy1 = c.noseY - 0.30, iw = c.W * 0.32;
  slab(g, xF - 0.14, xF - 0.03, iy0, iy1, -iw, iw, DARK, false);
  for (const sz of [-1, 1]) frameEdgeYZ(g, iy0, sz * iw, iy1, sz * iw * 0.8, xF - 0.02, 0.03, 0.04, CHROME);
}

// (6) bespoke rear fascia — a curved matte-black valance (parametric)
function foresterRearFascia(g, c) {
  const hl = c.L / 2, xR = -hl;
  g.add(parametricSurface((u, v) => {
    const z = -c.W * 0.42 + c.W * 0.84 * u, y = c.sillY + 0.02 + 0.14 * v, curl = 0.08 * (1 - v);
    return [xR + 0.02 + curl * 0.6, y, z * (0.9 + 0.1 * v)];
  }, 18, 6, CLAD));
}

// (7) aero side mirror — a compound-curved shell + glass + turn repeater
function foresterMirror(g, c) {
  const hl = c.L / 2, x = c.cowlF * hl - 0.05;
  for (const sz of [-1, 1]) {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.05, 0.08), DARK);
    stalk.position.set(x, c.beltY - 0.03, sz * (c.W / 2 + 0.03)); g.add(stalk);
    const shell = parametricSurface((u, v) => {
      const zz = sz * (c.W / 2 + 0.13) + sz * (-0.04 + 0.08 * u), yy = c.beltY + 0.03 + 0.11 * (v - 0.5);
      const xx = x - 0.02 - 0.07 * Math.sin(Math.PI * u) - 0.05 * (1 - ((v - 0.5) * 2) ** 2);
      return [xx, yy, zz];
    }, 12, 8, PAINT0);
    shell.userData.paint = true; g.add(shell);
    const mg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.10, 0.11), GLASS);
    mg.position.set(x - 0.11, c.beltY + 0.03, sz * (c.W / 2 + 0.13)); g.add(mg);
    const rep = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.07), AMBER);
    rep.position.set(x - 0.03, c.beltY + 0.08, sz * (c.W / 2 + 0.15)); g.add(rep);
  }
}

// (8) aero roof rails — a TubeGeometry rail on shaped feet (not box bars)
function foresterRoofRails(g, c) {
  const hl = c.L / 2, wsX = c.wsTopF * hl, rrX = c.roofRearF * hl;
  const Wg = c.W * c.greenhouse, capHW = Wg / 2 * 0.86 + 0.02;
  for (const sz of [-1, 1]) {
    const z = sz * (capHW - 0.04);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(wsX + 0.1, c.roofY + 0.05, z), new THREE.Vector3((wsX + rrX) / 2, c.roofY + 0.11, z),
      new THREE.Vector3(rrX - 0.1, c.roofY + 0.05, z)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.028, 8), DARK));
    for (const fx of [wsX + 0.08, (wsX + rrX) / 2, rrX - 0.08]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.045), DARK);
      foot.position.set(fx, c.roofY + 0.02, z); g.add(foot);
    }
  }
}

// (9) bespoke fog lamp — a recessed lathe cup + dome lens + a C-shaped chrome trim tube
function foresterFog(g, c) {
  const hl = c.L / 2, xF = hl;
  for (const sz of [-1, 1]) {
    const cz = sz * (c.W * 0.36);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.09, 16), DARK);
    cup.rotation.z = Math.PI / 2; cup.position.set(xF - 0.11, c.sillY + 0.17, cz); g.add(cup);
    const fog = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), HEAD);
    fog.rotation.z = -Math.PI / 2; fog.position.set(xF - 0.05, c.sillY + 0.17, cz); g.add(fog);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xF - 0.05, c.sillY + 0.26, cz - sz * 0.02), new THREE.Vector3(xF - 0.05, c.sillY + 0.17, cz + sz * 0.12),
      new THREE.Vector3(xF - 0.05, c.sillY + 0.08, cz - sz * 0.02)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.016, 8), CHROME));
  }
}

// (10) compound-curved windshield — a parametric (u,v) glass that bows in two directions
function foresterWindshield(g, c) {
  const hl = c.L / 2, cowlX = c.cowlF * hl, wsX = c.wsTopF * hl;
  const Wg = c.W * c.greenhouse, hw = Wg / 2 * 0.9;
  g.add(parametricSurface((u, v) => {
    const x = cowlX + (wsX - cowlX) * u, y = c.beltY + (c.roofY - c.beltY) * u, z = -hw + 2 * hw * v;
    const curv = 0.06 * (1 - ((v - 0.5) * 2) ** 2) * u;
    return [x + curv, y, z * (1 - 0.15 * u)];
  }, 16, 14, GLASS));
}

// ---- low-level helpers ------------------------------------------------------
// extrude a side-profile Shape across the width, center it on Z, crease-smooth so
// bevelled roof/hood round instead of faceting (the old boxy tell).
// `warp(x,y,z)->[x,y,z]` optionally sculpts every vertex BEFORE creasing so the
// flat extruded side walls can be given real barrel/tumblehome curvature (the fix
// for "blocky slab sides"). curveSegments is bumped so the warp reads smoothly.
function extrudeProfile(shape, depth, bevel, warp) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, steps: 1, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  if (warp) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const r = warp(p.getX(i), p.getY(i), p.getZ(i));
      p.setXYZ(i, r[0], r[1], r[2]);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
  }
  return toCreasedNormals(g, 0.7);
}
// smoothstep 0..1
function smooth(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
function paintMesh(geom) {
  const m = new THREE.Mesh(geom, PAINT0);
  m.userData.paint = true; m.castShadow = true; m.receiveShadow = true;
  return m;
}
// axis-aligned slab from two corners. isPaint -> body-color panel (retinted on clone)
function slab(g, x0, x1, y0, y1, z0, z1, mat, isPaint) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(Math.abs(x1 - x0), 0.01),
    Math.max(Math.abs(y1 - y0), 0.01), Math.max(Math.abs(z1 - z0), 0.01)),
    isPaint ? PAINT0 : mat);
  if (isPaint) m.userData.paint = true;
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
// a thin oriented bar between two points in the XY plane (pillar / trim), at fixed z.
// isPaint -> body-color panel (marked so vehicles.js retints it on clone).
function bar(g, x0, y0, x1, y1, z, thick, depth, mat, isPaint) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 0.01;
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, thick, depth), isPaint ? PAINT0 : mat);
  if (isPaint) m.userData.paint = true;
  m.rotation.z = Math.atan2(dy, dx);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
  m.castShadow = true; g.add(m); return m;
}
// the Y-Z analog of bar() — a thin bar between two points in the Y-Z plane at a
// fixed world X. Used for the trapezoid-chrome grille frame (a front-facing
// shape, so its edges run in height x width, not the pillar/trim length x height
// that bar() handles).
function frameEdgeYZ(g, y0, z0, y1, z1, x, thick, depth, mat) {
  const dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dy, dz) || 0.01;
  const m = new THREE.Mesh(new THREE.BoxGeometry(depth, len, thick), mat);
  m.rotation.x = Math.atan2(dz, dy);
  m.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = true; g.add(m); return m;
}

// ---- alloy-wheel rim art (shared CanvasTexture, cached per style+color) ------
// Distinct spoke patterns per model class. Pockets are drawn dark (void behind
// the spokes); spokes/hub are the rim color. Cheap: two meshes per wheel (tire +
// a textured disc) regardless of spoke count.
const RIM_TEX = new Map();
function rgbShade(hex, f) {           // f>0 -> toward white, f<0 -> toward black
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const m = f < 0 ? 0 : 255, t = Math.min(Math.abs(f), 1);
  const mix = c => Math.round(c + (m - c) * t);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
function rimTexture(style, color) {
  const key = style + '|' + color;
  if (RIM_TEX.has(key)) return RIM_TEX.get(key);
  const S = 256, cx = 128, cy = 128;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d');
  const disc = (r, fill) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fillStyle = fill; x.fill(); };
  const P = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  x.clearRect(0, 0, S, S);
  disc(122, '#0d0e10');                       // tire/rim shadow gap
  disc(114, rgbShade(color, -0.4));           // rim barrel (dark inner)
  disc(106, rgbShade(color, 0.05));           // alloy face
  // spoke pockets (dark voids) — the pattern
  const specs = {
    '5spoke':  { n: 5,  hw: 0.30, rIn: 40, rOut: 98, kind: 'slot' },
    '5split':  { n: 10, hw: 0.10, rIn: 42, rOut: 98, kind: 'slot' },
    '6spoke':  { n: 6,  hw: 0.24, rIn: 40, rOut: 98, kind: 'slot' },
    'multi':   { n: 10, hw: 0.13, rIn: 44, rOut: 96, kind: 'slot' },
    'mesh':    { n: 12, hw: 0.00, rIn: 0,  rOut: 0,  kind: 'holes' },
    'turbine': { n: 8,  hw: 0.16, rIn: 40, rOut: 98, kind: 'skew' },
    'aero':    { n: 5,  hw: 0.09, rIn: 60, rOut: 96, kind: 'slot' },  // covered aero look
    'steel':   { n: 8,  hw: 0.00, rIn: 0,  rOut: 0,  kind: 'holes' },
  };
  const sp = specs[style] || specs['5spoke'];
  x.fillStyle = '#0b0c0e';
  if (sp.kind === 'holes') {
    const ringR = style === 'steel' ? 58 : 78, hole = style === 'steel' ? 9 : 12, n = sp.n;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const [hx, hy] = P(ringR, a);
      x.beginPath(); x.arc(hx, hy, hole, 0, Math.PI * 2); x.fill();
    }
  } else {
    for (let i = 0; i < sp.n; i++) {
      const a = (i / sp.n) * Math.PI * 2;
      const sk = sp.kind === 'skew' ? 0.14 : 0;          // turbine lean
      x.beginPath();
      x.moveTo(...P(sp.rIn, a - sp.hw + sk));
      x.lineTo(...P(sp.rOut, a - sp.hw - sk));
      x.lineTo(...P(sp.rOut, a + sp.hw - sk));
      x.lineTo(...P(sp.rIn, a + sp.hw + sk));
      x.closePath(); x.fill();
    }
  }
  disc(38, rgbShade(color, -0.05));           // hub boss
  x.fillStyle = '#0a0b0d';                     // lug nuts
  for (let i = 0; i < 5; i++) {
    const [lx, ly] = P(24, (i / 5) * Math.PI * 2 - Math.PI / 2);
    x.beginPath(); x.arc(lx, ly, 4.2, 0, Math.PI * 2); x.fill();
  }
  disc(11, '#cfd3d6');                        // center cap
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  RIM_TEX.set(key, tex);
  return tex;
}
// shared honeycomb-mesh grille texture — one canvas, reused by every 'mesh' and
// 'trapezoid-chrome' grille insert in the fleet (cached like rimTexture above).
let MESH_GRILLE_TEX = null;
function meshGrilleTexture() {
  if (MESH_GRILLE_TEX) return MESH_GRILLE_TEX;
  const S = 128;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const x = cv.getContext('2d');
  x.fillStyle = '#0c0d0f'; x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(70,74,80,0.9)'; x.lineWidth = 1.6;
  const hexR = 10;
  for (let row = -1; row <= S / (hexR * 1.5) + 1; row++) {
    for (let col = -1; col <= S / (hexR * 1.73) + 1; col++) {
      const cx = col * hexR * 1.73 + (row % 2 ? hexR * 0.87 : 0);
      const cy = row * hexR * 1.5;
      x.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k;
        const px = cx + hexR * Math.cos(a), py = cy + hexR * Math.sin(a);
        k === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
      }
      x.closePath(); x.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 1);
  MESH_GRILLE_TEX = tex;
  return tex;
}

// build one wheel Group (tire + outboard alloy disc) for side sz (+1/-1).
function makeWheel(c, sz) {
  const g = new THREE.Group();
  const { wheelR: r, tireW: tw } = c;
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, tw, 24), TIRE);
  tire.rotation.x = Math.PI / 2; tire.castShadow = true; g.add(tire);
  if (c.parts.sk) { g.add(foresterWheelDisc(c, sz)); return g; }   // R15: bespoke 3D alloy
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, tw * 0.9, 20), HUB);
  hub.rotation.x = Math.PI / 2; g.add(hub);
  const rs = c.parts.rim || { style: '5spoke', color: 0xb7bcc1 };
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 28),
    new THREE.MeshStandardMaterial({ map: rimTexture(rs.style, rs.color),
      metalness: 0.7, roughness: 0.38 }));
  const out = sz >= 0 ? 1 : -1;
  disc.position.z = out * (tw / 2 + 0.012);
  if (out < 0) disc.rotation.y = Math.PI;
  g.add(disc);
  return g;
}
function addWheels(g, c) {
  const hl = c.L / 2;
  for (const ax of [c.axleF * hl, c.axleR * hl]) for (const sz of [-1, 1]) {
    const w = makeWheel(c, sz);
    w.position.set(ax, c.wheelR, sz * c.wheelZ);
    g.add(w);
  }
}
// wheel-arch lips over each wheel (dark), thicker for flared/clad models.
function addFenders(g, c) {
  const hl = c.L / 2, r = c.wheelR, flare = c.parts.flare || 0;
  const mat = c.parts.cladding ? CLAD : DARK;
  const archG = new THREE.TorusGeometry(r * 1.05 + flare, 0.055 + flare * 0.4, 6, 16, Math.PI);  // R19: thinner arch lip per blueprint
  for (const ax of [c.axleF * hl, c.axleR * hl]) for (const sz of [-1, 1]) {
    const a = new THREE.Mesh(archG, mat);
    a.position.set(ax, r, sz * (c.wheelZ + c.tireW * 0.35));
    a.castShadow = true; g.add(a);
  }
}

// ---- crowned roof + panel-seam helpers (R11) --------------------------------
// crownedRoof: a body-color roof skin that DOMES side-to-side and arches gently
// front-to-back instead of a flat slab (real roofs are never flat — this is the
// #1 R11 complaint). Cheap: ONE segmented box, per-vertex y displacement, built
// once per template. yLo/yHi are the cap's underside/topside at the CENTERLINE;
// crown lowers the width edges, arch lowers the front/rear ends.
// `glass` renders the cap as dark glass (a panoramic glass roof) instead of a
// body-color panel — the mesh is then NOT paint-tagged so vehicles.js won't retint it.
function crownedRoof(g, x0, x1, capHW, yLo, yHi, crown, arch, glass) {
  const w = Math.max(Math.abs(x1 - x0), 0.02), midX = (x0 + x1) / 2, hw = w / 2;
  const geo = new THREE.BoxGeometry(w, yHi - yLo, capHW * 2, 8, 1, 10);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const zx = p.getZ(i) / capHW;                    // -1..1 across width
    const xx = p.getX(i) / hw;                        // -1..1 front..rear
    const drop = crown * zx * zx + arch * xx * xx;    // edges & ends dip below center
    p.setY(i, p.getY(i) - drop);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
  geo.translate(midX, (yLo + yHi) / 2, 0);
  const m = new THREE.Mesh(toCreasedNormals(geo, 0.9), glass ? GLASS : PAINT0);
  if (!glass) m.userData.paint = true;
  m.castShadow = true; m.receiveShadow = true; g.add(m);
  return m;
}
// a thin recessed dark seam box (panel gap) — explicit dims so it can lie on the
// hood top (dz across width), a rear face (dy vertical), or a deck edge. Reads as
// a real shut-line where panels meet, the fix for "panels float / no delineation".
function seamBox(g, cx, cy, cz, sx, sy, sz, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(sx, 0.012),
    Math.max(sy, 0.012), Math.max(sz, 0.012)), mat || DARK);
  m.position.set(cx, cy, cz); g.add(m); return m;
}

// normalize a spec -> full dimension object with sane defaults so a partial spec
// never crashes the builder. Guards keep proportions physical.
function dims(spec) {
  const s = spec || {}, p = s.parts || {};
  const d = {
    body: s.body || 'sedan',
    L: s.L ?? 7.6, W: s.W ?? 2.02,
    wheelR: s.wheelR ?? 0.60, tireW: s.tireW ?? 0.34,
    sillY: s.sillY ?? 0.42, beltY: s.beltY ?? 1.18, roofY: s.roofY ?? 1.70,
    noseY: s.noseY ?? 0.98, deckY: s.deckY ?? 1.06,
    // R7 proportion system: cab-forward. cowl sits JUST behind the front axle
    // (short dash-to-axle => short hood), the roof runs LONG and flat, and the
    // cabin (cowl->bb) spans > half the body so a 4-door/2-row greenhouse fits.
    // fractions are of hl (+1 nose .. -1 tail).
    cowlF: s.cowlF ?? 0.40, wsTopF: s.wsTopF ?? 0.14,
    roofRearF: s.roofRearF ?? -0.48, bbF: s.bbF ?? -0.66,
    axleF: s.axleF ?? 0.62, axleR: s.axleR ?? -0.64, wheelZ: s.wheelZ ?? 0.95,
    greenhouse: s.greenhouse ?? 0.86,
    quarter: s.quarter ?? false,            // add a rear-quarter side window (SUV/van/wagon)
    // R10: optional two-tier kammback backlight kink (0 = plain single-line
    // backlight, the default for every model that doesn't set it) — see
    // addGreenhouse's c.backlightKink handling.
    backlightKink: s.backlightKink ?? 0,
    // R11 feature params (per-model in car_specs.js; safe fallbacks here so a
    // partial spec never breaks) ------------------------------------------------
    roofCrown: s.roofCrown ?? 0.05,         // side-to-side roof dome depth (world units)
    roofArch:  s.roofArch  ?? 0.03,         // front-to-back roof arch depth
    quarterGap: s.quarterGap ?? 0.13,       // rear quarter window width (fraction of hl) — SMALL
    bumperDepth: s.bumperDepth ?? 0.26,     // how far the bumper band stands proud of the corner
    trunk: s.trunk || 'notch',              // 'notch' (sedan) | 'flush' (suv/hatch)
    parts: {
      grille: p.grille ?? 'mesh',           // R9: CAR_SPECS grille enum (see addGrilleAndBumpers)
      bumper: p.bumper ?? 'body',           // 'body' | 'dark' | 'chrome'
      mirror: p.mirror ?? 'body',           // 'body' | 'dark'
      cladding: !!p.cladding,               // black plastic lower body + arches
      roofRail: !!p.roofRail,
      headStyle: p.headStyle ?? 'swept-wrap', // R9: CAR_SPECS headlight enum (see addHeadlights)
      flare: p.flare ?? 0.0,
      rim: p.rim || { style: '5spoke', color: 0xb7bcc1 },
      blackoutPillar: !!p.blackoutPillar,   // R10: dark D-pillar/quarter-pillar (floating-roof cue)
      fog: p.fog ?? false,                   // R11: fog/flood lamps in the lower bumper corners
      taillightWrap: p.taillightWrap ?? false, // R11: tail lamps wrap up the D-pillar (SUV/wagon/van)
      glassRoof: !!p.glassRoof,             // R12: dark glass roof + blacked-out pillars (Tesla canopy)
      trimDark: !!p.trimDark,               // R12: chrome-delete — dark belt trim + door handles
      emblem: p.emblem ?? null,             // R13: brand mark on grille + tailgate (opt-in per model)
      headBuilder: p.headBuilder ?? null,   // R14: bespoke per-model headlamp builder (specificity hook)
      sk: !!p.sk,                           // R15: enable the full Forester SK bespoke part suite
      bodyBuilder: p.bodyBuilder ?? null,   // R17: bespoke lofted body (model-specific form)
      greenhouseLoft: !!p.greenhouseLoft,   // R17: lofted parametric glass canopy
      canopyN: p.canopyN ?? null,           // R17: greenhouse canopy boxiness (boxy SUV .. round EV)
    },
  };
  // physical guards (silhouette safety + the R7 proportion bar) -----------------
  d.beltY = Math.max(d.beltY, d.sillY + 0.45);
  d.roofY = Math.max(d.roofY, d.beltY + 0.30);
  d.deckY = Math.min(d.deckY, d.beltY);          // <== rear deck can NEVER rise above belt
  d.noseY = Math.min(Math.max(d.noseY, d.sillY + 0.4), d.beltY + 0.05);
  // PROPORTION BAR — reject the four rejected looks numerically:
  //  (1) no over-long front: the cowl (A-pillar base) must sit close behind the
  //      front axle, never way back under a long hood. The dash-to-axle cap is
  //      body-type-aware — pickups/SUVs legitimately run longer hoods than sedans.
  //      R8 tightened these caps (0.44/0.34/0.28 -> 0.38/0.28/0.22): the R7 bar
  //      was loose enough that several models (both sedans, bronco, f150,
  //      prius, model3) still built with a nose-to-cowl run of 0.60-0.68*hl —
  //      the "front still feels elongated" flag. Tightening is a floor-clamp,
  //      so it's a no-op for a model whose hood was already inside the cap
  //      (forester/crv/odyssey didn't move); it only shortens the offenders.
  //      R9 adds 'wagon' to the wider-hood group alongside suv/minivan (both
  //      body-on-frame-ish proportions with a real hood, unlike a sedan).
  const daCap = d.body === 'pickup' ? 0.38
    : (d.body === 'suv' || d.body === 'minivan' || d.body === 'wagon') ? 0.28 : 0.22;
  d.cowlF = Math.max(d.cowlF, d.axleF - daCap);
  //  (1b) short front OVERHANG: the nose can't float far ahead of the front axle
  //       (front overhang = 1 - axleF). R8: floor raised 0.60 -> 0.64 (overhang
  //       ceiling 0.40*hl -> 0.36*hl) alongside the daCap tightening above, so
  //       no model shows the "very long front" the user flagged.
  d.axleF = Math.max(d.axleF, 0.64);
  //  (2) roof keeps a real flat run, never collapsing to a steep triangular peak.
  d.roofRearF = Math.min(d.roofRearF, d.wsTopF - 0.28);
  //  (3) real 2-row cabin: cowl->bb (greenhouse footprint) must span >= 0.92*hl so
  //      it reads as a 4-door with two rows, never a stubby 2-seat coupe. (Pickups
  //      carry their own crew-cab length rule in assemblePickup.)
  if (d.body !== 'pickup' && d.cowlF - d.bbF < 0.92) d.bbF = d.cowlF - 0.92;
  //  (4) backlight can't out-rake the roof into an upturned wedge: keep the
  //      backlight base behind the roof rear.
  d.bbF = Math.min(d.bbF, d.roofRearF - 0.06);
  // R10: keep the optional kammback kink fraction in a sane 0..0.85 range so a
  // stray value can't collapse the kink point onto (or past) the backlight base.
  d.backlightKink = Math.min(Math.max(d.backlightKink, 0), 0.85);
  return d;
}

// body-side sculpt: turn the flat extruded slab into a rounded barrel with
// tumblehome (top tucked in, glasshouse-ward) + a soft rocker tuck + a faint
// mid-height bulge + a fender-arch bulge over each wheel. This is the geometric
// fix for "blocky slab sides". Cheap: a per-vertex z-scale, no extra polys.
function sculptLower(c) {
  const y0 = c.sillY, y1 = c.beltY, hl = c.L / 2;
  const axF = c.axleF * hl, axR = c.axleR * hl;
  // R9: a subtle outward bulge in the lower body right over each wheel opening
  // (real fender flare) — bigger on models with a cladding flare value, but
  // present on every car since even unflared sedans have SOME arch swell.
  const bulge = 0.022 + (c.parts.flare || 0) * 0.5;
  return (x, y, z) => {
    const t = (y - y0) / Math.max(y1 - y0, 0.01);        // 0 sill .. 1 belt(shoulder)
    const tuckTop = 0.155 * smooth(0.50, 1.05, t);       // tumblehome / rounded shoulder (R13: rounder)
    const tuckBot = 0.04 * (1 - smooth(0.0, 0.3, t));    // subtle rocker tuck
    const barrel = 0.026 * (1 - Math.abs(t - 0.5) * 2);  // mid bulge (R13: fuller convex door crown)
    // plan-view corner rounding: pinch the width toward the nose & tail so the
    // front/rear CORNERS round off in top view instead of reading as flat slab
    // ends (a major "blocky" tell). Cheap: a per-vertex z-scale keyed on |x|
    // over the last ~22% of the body — no extra polys.
    const ax = Math.abs(x) / hl;                         // 0 center .. 1 body end
    // R13: round the front/rear CORNERS more, and start the rounding earlier, so the
    // nose/tail read as curved fascia in top view instead of flat slab ends — the
    // "doesn't match the rounded reference" fix. Bigger magnitude + earlier onset.
    const endTuck = 0.28 * smooth(0.70, 1.0, ax);
    // fender-arch bulge: swells outward near the wheel X-stations, tapering to
    // nothing away from the arch and above mid-body height.
    const archDist = Math.min(Math.abs(x - axF), Math.abs(x - axR));
    const archProx = 1 - smooth(0, hl * 0.16, archDist);
    const wheelBulge = bulge * archProx * (1 - smooth(0.35, 0.75, t));
    return [x, y, z * (1 - tuckTop - tuckBot + barrel - endTuck + wheelBulge)];
  };
}
// ===== BODY (single extruded side profile; guaranteed good silhouette) =======
// nose at +X. Top edge runs front->rear; the rear deck is drawn strictly
// non-rising toward the tail (notch) or the beltline runs flat to a vertical tail
// (flush). Bottom edge is the sill. A curved beltline + a bigger bevel round the
// shoulders; sculptLower() adds tumblehome/barrel/fender curvature to the sides.
function addLowerBody(g, c) {
  const hl = c.L / 2, cowlX = c.cowlF * hl, bbX = c.bbF * hl;
  const s = new THREE.Shape();
  s.moveTo(hl, c.sillY + 0.16);
  s.lineTo(hl, c.noseY - 0.06);
  s.quadraticCurveTo(hl, c.noseY, hl - 0.14, c.noseY + 0.03);   // round front-top
  s.quadraticCurveTo(cowlX + (hl - cowlX) * 0.4, c.beltY - 0.02, cowlX, c.beltY); // curved hood->cowl
  if (c.trunk === 'notch') {
    s.lineTo(bbX, c.beltY);                                     // flat beltline under cabin
    s.quadraticCurveTo(bbX + (-hl - bbX) * 0.45, c.beltY - 0.01, -hl + 0.12, c.deckY); // curved trunk deck DOWN to tail
    s.quadraticCurveTo(-hl, c.deckY, -hl, c.deckY - 0.14);      // round rear-top
  } else {
    s.lineTo(-hl + 0.14, c.beltY);                             // beltline to near tail
    s.quadraticCurveTo(-hl, c.beltY, -hl, c.beltY - 0.16);      // round rear-top (flush)
  }
  s.lineTo(-hl, c.sillY + 0.16);
  s.quadraticCurveTo(-hl, c.sillY, -hl + 0.16, c.sillY);        // round rear-bottom
  s.lineTo(hl - 0.16, c.sillY);
  s.quadraticCurveTo(hl, c.sillY, hl, c.sillY + 0.16);          // round front-bottom
  // R13: a larger bevel on the tall SUV/minivan bodies rounds the roof/shoulder/
  // fascia edges more (the reference Forester is soft-edged, not a hard box); sedans
  // keep the tighter bevel so they don't read bloated.
  const bodyBevel = (c.body === 'suv' || c.body === 'minivan') ? 0.15 : 0.14;
  g.add(paintMesh(extrudeProfile(s, c.W, bodyBevel, sculptLower(c))));
  addDoorCuts(g, c);
}
// Shared cabin X-stations (A/B/C pillars) derived ONCE so the door SHUT-LINES on
// the body and the GLASS pillars in the greenhouse line up EXACTLY. This is the
// R7 fix for the "unrealistic second-row & doors" tell: R6 split the whole
// cowl->backlight footprint into two doors, giving ~1.6 m doors that ran all the
// way to the tail with no rear quarter. Now the two doors occupy only the cabin
// mid-section (~0.9 m each) and a real REAR QUARTER panel sits between the rear
// door and the backlight. Returns fraction-of-hl coords (nose +1 .. tail -1).
function cabinStations(c) {
  const aF = c.cowlF;                       // A-pillar base / front-door lead edge
  // R11 FIX: the C-pillar / rear-door trailing edge sits just quarterGap ahead of
  // the backlight base (bbF), so the rear QUARTER window (cF..bbF) is SMALL — the
  // smallest glass on the car, per real cars. The pre-R11 code keyed cF off the
  // rear axle (axleR+0.16), which on this fleet's real overhangs left cF far
  // forward of the backlight → a quarter window as big as (Odyssey: bigger than)
  // a door: the "quarter window too large" complaint. Building it straight off
  // bbF+quarterGap makes the quarter's size an explicit per-model number.
  const qg = c.quarterGap ?? 0.13;
  let cF = c.bbF + qg;                       // small rear quarter by construction
  cF = Math.min(cF, aF - 0.60);             // safety: never collapse the rear door
  const bF = (aF + cF) / 2;                 // B-pillar (front/rear door split)
  return { aF, bF, cF };
}

// door shut-lines: front-door + rear-door seams per side => reads as a 4-door.
// thin recessed dark bars from belt down to the sill at the A-pillar base, the
// B-pillar, and the rear-door trailing edge (shared cabinStations => aligned with
// the glass pillars; a rear quarter panel remains behind the rear door).
function addDoorCuts(g, c) {
  const hl = c.L / 2;
  const { aF, bF, cF } = cabinStations(c);
  const aX = aF * hl, bX = bF * hl, cX = cF * hl;
  const y0 = c.sillY + 0.16, y1 = c.beltY - 0.02, h = y1 - y0;
  for (const sz of [-1, 1]) {
    for (const cx of [aX - 0.02, bX, cX]) {       // front-door lead, B-pillar, rear-door trail
      const cut = new THREE.Mesh(new THREE.BoxGeometry(0.028, h, 0.05), DARK);
      cut.position.set(cx, (y0 + y1) / 2, sz * (c.W / 2 - 0.02));
      g.add(cut);
    }
    // two flush door handles on the beltline (front + rear door); chrome unless the
    // model is chrome-delete (trimDark) — Tesla-style flush body/dark handles.
    const handleMat = c.parts.trimDark ? DARK : CHROME;
    for (const hx of [(aX + bX) / 2, (bX + cX) / 2]) {
      const hd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.035), handleMat);
      hd.position.set(hx, c.beltY - 0.14, sz * (c.W / 2 - 0.01));
      g.add(hd);
    }
  }
}

// ===== GREENHOUSE (dark-glass prism + body roof cap + slim pillars) ==========
// A single inset glass volume (tumblehome) whose sloped faces ARE the raked
// windshield and backlight and whose end caps are the side glass — all dark.
// A body-color roof cap and slim A/B/C pillars are laid on top. This is the fix
// for body-colored windows AND the upturned-glass look.
// R17 Phase 2: the Forester greenhouse GLASS as a lofted parametric canopy (replaces
// the extruded prism). Near-vertical flat glass sides (n high) + a crowned glass roof
// that FOLLOWS the roofline (rises at the windshield, flat over the cabin, drops at the
// backlight) with tumblehome. A compound-curved canopy that marries the lofted body.
function foresterGlassCanopy(c) {
  const hl = c.L / 2;
  const cowlX = c.cowlF * hl, wsX = c.wsTopF * hl, rrX = c.roofRearF * hl, bbX = c.bbF * hl;
  const hw = c.W * c.greenhouse / 2, belt = c.beltY, roof = c.roofY, n = c.parts.canopyN || 4.5;
  // R19: eased windshield/backlight (the glass curves GRADUALLY into the roof — rounded
  // corners, not linear ramps) + a gentle front-to-back roof DOME (the SK's egg-shaped arc).
  const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const roofHAt = (x) => {
    if (x >= wsX) return roof + (belt - roof) * ease((x - wsX) / (cowlX - wsX));            // windshield eased
    if (x >= rrX) { const t = (x - rrX) / (wsX - rrX); return roof + (roof - belt) * 0.03 * Math.sin(Math.PI * t); }  // gentle dome
    return roof + (belt - roof) * ease((rrX - x) / (rrX - bbX));                            // backlight eased
  };
  return parametricSurface((u, v) => {
    const x = cowlX + (bbX - cowlX) * u, rH = roofHAt(x);
    const a = v * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
    const z = hw * Math.sign(ca) * Math.abs(ca) ** (2 / n);
    const y = belt + (rH - belt) * sa ** (2 / n);
    return [x, y, z * (1 - 0.16 * (y - belt) / Math.max(rH - belt, 0.01))];   // tumblehome
  }, 40, 20, GLASS);
}

function addGreenhouse(g, c) {
  const hl = c.L / 2;
  const cowlX = c.cowlF * hl, wsX = c.wsTopF * hl, rrX = c.roofRearF * hl, bbX = c.bbF * hl;
  const Wg = c.W * c.greenhouse;
  const gh = new THREE.Shape();
  gh.moveTo(cowlX, c.beltY);
  gh.lineTo(wsX, c.roofY);       // windshield
  gh.lineTo(rrX, c.roofY);       // roof
  // R10: optional two-tier "kammback" backlight (Prius XW50 cue — Toyota's own
  // description is a curved roofline ending in a sloped rear window with a
  // distinct two-tier look). c.backlightKink is a 0..1 fraction along the
  // rr->bb run where a spoiler-lip kink sits ABOVE the straight chord, so the
  // upper glass panel reads shallow and the lower panel drops in more steeply
  // after it — instead of one straight backlight line. Absent/0 (every other
  // model) is a no-op: falls straight through to the plain bbX line below.
  if (c.backlightKink) {
    const kt = c.backlightKink;
    const kinkX = rrX + (bbX - rrX) * kt;
    const yLin = c.roofY + (c.beltY - c.roofY) * kt;
    const kinkY = yLin + (c.roofY - c.beltY) * 0.12;   // shelf: above the straight chord
    gh.lineTo(kinkX, kinkY);
  }
  gh.lineTo(bbX, c.beltY);       // backlight
  gh.closePath();
  // tumblehome + crown: taper the glasshouse narrower toward the roof (the "not a
  // box" cue) AND dome the roof so its edges dip below the centerline — real cars
  // have a crowned roof, never a flat plate. Both are per-vertex, no extra polys.
  const yb = c.beltY, yr = c.roofY, halfWg = Wg / 2;
  const ghWarp = (x, y, z) => {
    const topT = smooth(yb, yr + 0.05, y);                 // 0 belt .. 1 roof
    const crown = (Math.abs(z) / halfWg) ** 2 * 0.07 * topT;  // edges lower than center
    return [x, y - crown, z * (1 - 0.20 * topT)];
  };
  const glass = c.parts.greenhouseLoft ? foresterGlassCanopy(c)
    : new THREE.Mesh(extrudeProfile(gh, Wg, 0.03, ghWarp), GLASS);   // R17: lofted canopy for the SK
  glass.castShadow = true; g.add(glass);
  // body-color roof cap over the glass top — narrowed to match the tumblehome.
  // R11: CROWNED, not a flat slab — domes side-to-side (roofCrown) and arches
  // front-to-back (roofArch) so the roof reads like real sheetmetal.
  const capHW = Wg / 2 * 0.86 + 0.02;
  crownedRoof(g, wsX, rrX, capHW, c.roofY - 0.02, c.roofY + 0.07,
    c.roofCrown ?? 0.05, c.roofArch ?? 0.03, c.parts.glassRoof);
  // side-glass DLO: split into front-door + rear-door glass + a rear quarter by
  // vertical body-color pillars => reads as a 4-door with two rows. The B and
  // quarter pillars use the SAME cabinStations as the door shut-lines so glass
  // and body seams align (R7 fix). qX (C-pillar base) sits ahead of the rear
  // wheel, leaving a real quarter window between it and the backlight.
  const st = cabinStations(c);
  const bX = st.bF * hl;                             // B-pillar (front/rear door split)
  // R10: qX (the quarter-glass divider) now only exists when the model's spec
  // actually has a rear quarter window (c.quarter). Previously this was
  // computed unconditionally, so every model got a quarter divider regardless
  // of its `quarter` flag — a dead-code bug: `quarter: false` (corolla/f150)
  // never removed anything. null skips the divider below so the rear-door
  // glass runs in one piece straight to the backlight instead.
  const qX = c.quarter ? st.cF * hl : null;           // rear-door / quarter split (C-pillar base)
  const pzTop = capHW;                               // pillars ride the tumblehome-narrowed roof edge
  const pzBelt = Wg / 2 + 0.012;
  // R12: on a glass-roof car (Tesla) the A/B/C pillars black out so the whole
  // greenhouse reads as one continuous glass canopy with a single visible pillar,
  // instead of body-color posts chopping it into separate windows.
  const blackout = c.parts.glassRoof;
  const pMat = blackout ? DARK : null, pPaint = !blackout;
  for (const sz of [-1, 1]) {
    bar(g, cowlX, c.beltY, wsX, c.roofY, sz * pzBelt, 0.11, 0.06, pMat, pPaint);   // A-pillar
    bar(g, bbX, c.beltY, rrX, c.roofY, sz * pzBelt, 0.12, 0.06, pMat, pPaint);     // C-pillar
    // R10: dark (blackout) option for the quarter/D-pillar — the Odyssey RC1's
    // "floating roof" look (Honda's own RC1 press kit: a partial D-pillar
    // black-out so the tapered roof reads as floating over the greenhouse).
    const vpillar = (px, w, dark) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, (c.roofY - c.beltY) * 0.96, 0.06), dark ? DARK : PAINT0);
      if (!dark) b.userData.paint = true;
      b.position.set(px, (c.beltY + c.roofY) / 2, sz * (pzBelt - 0.008)); b.castShadow = true; g.add(b);
    };
    vpillar(bX, 0.10, blackout);                      // B-pillar
    if (qX !== null) vpillar(qX, 0.08, blackout || !!c.parts.blackoutPillar);  // quarter/D-pillar divider
  }
  // belt-line trim strip covering the body/glass shoulder step: chrome, unless the
  // model has black cladding or is chrome-delete (trimDark) — then it's dark.
  const beltMat = c.parts.cladding ? CLAD : (c.parts.trimDark ? DARK : CHROME);
  const midX = (cowlX + bbX) / 2;
  for (const sz of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(cowlX - bbX) + 0.1, 0.05, 0.03), beltMat);
    t.position.set(midX, c.beltY - 0.02, sz * (c.W / 2 - 0.005)); g.add(t);
  }
  if (c.parts.roofRail && c.parts.sk) foresterRoofRails(g, c);   // R15: bespoke aero rails
  else if (c.parts.roofRail) {
    const len = Math.max(Math.abs(wsX - rrX) * 0.95, 0.6);
    for (const sz of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.06), DARK);
      rail.position.set((wsX + rrX) / 2, c.roofY + 0.08, sz * (capHW - 0.06));
      rail.castShadow = true; g.add(rail);
    }
  }
  if (c.parts.sk && !c.parts.greenhouseLoft) foresterWindshield(g, c);   // R15/R17: canopy already includes the windshield
}

// ===== BOLT-ONS: mirrors, lights, grille, bumpers, cladding ==================
function addMirrors(g, c) {
  if (c.parts.sk) { foresterMirror(g, c); return; }           // R15: bespoke aero mirror
  const hl = c.L / 2, x = c.cowlF * hl - 0.05;
  const capPaint = c.parts.mirror === 'body';
  for (const sz of [-1, 1]) {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.10), DARK);
    stalk.position.set(x, c.beltY - 0.03, sz * (c.W / 2 + 0.03));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), capPaint ? PAINT0 : DARK);
    if (capPaint) head.userData.paint = true;
    head.position.set(x - 0.03, c.beltY + 0.01, sz * (c.W / 2 + 0.11));
    // dark mirror glass on the trailing face
    const mg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.11, 0.06), GLASS);
    mg.position.set(x - 0.10, c.beltY + 0.01, sz * (c.W / 2 + 0.11));
    stalk.castShadow = head.castShadow = true; g.add(stalk, head, mg);
  }
}
// ===== HEADLIGHTS (spec.headlight) — model-appropriate shaped lens clusters =
// Front-corner cluster shape driven straight by CAR_SPECS: 'round' = circular
// lens(es), 'rect' = a hard-edged rectangular lamp, 'swept-wrap' = a lamp that
// sweeps back around the fender corner (two boxes at an angle), 'slim-led' = a
// thin horizontal LED strip, 'projector-cluster' = a dark housing with 3 small
// projector pods. Every style keeps the amber corner marker (cheap, universal
// real-car cue). Lenses use HEAD (bright, glossy, slightly emissive) so they
// read as lit glass rather than painted plastic.
function addHeadlights(g, c) {
  // R14/R16: a model can opt into a bespoke, compound-curved headlamp instead of the
  // shared enum styles below (the model-specificity hook).
  const bespoke = c.parts.headBuilder && HEAD_UNITS[c.parts.headBuilder];
  if (bespoke) { addBespokeHeadlights(g, c, bespoke); return; }
  const hl = c.L / 2, xF = hl, style = c.parts.headStyle;
  // R11: every lamp is SURFACE-MOUNTED — its lens face sits flush-to-proud of the
  // fascia (front face at ~xF + a hair) with a body-color surround bezel framing
  // it, so it reads as a mounted lamp unit rather than a hole punched into the
  // mass. `mount()` lays that body-color bezel behind a lens footprint.
  const faceX = xF + 0.005;                      // lens outer face, just proud of the nose
  const mount = (cx, cy, cz, h, w) => {          // body-color surround around a lamp
    const s = slab(g, xF - 0.06, xF + 0.02, cy - h / 2 - 0.03, cy + h / 2 + 0.03,
      cz - w / 2 - 0.03, cz + w / 2 + 0.03, null, true);
    s.receiveShadow = true;
  };
  for (const sz of [-1, 1]) {
    const cz = sz * (c.W * 0.40);
    if (style === 'round') {
      mount(faceX, c.noseY - 0.02, cz, 0.26, 0.26);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.12, 16), HEAD);
      lens.rotation.z = Math.PI / 2; lens.position.set(faceX - 0.05, c.noseY - 0.02, cz); g.add(lens);
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.022, 8, 18), CHROME);
      bezel.rotation.y = Math.PI / 2; bezel.position.set(faceX - 0.01, c.noseY - 0.02, cz); g.add(bezel);
    } else if (style === 'rect') {
      mount(faceX, c.noseY - 0.02, cz, 0.22, 0.34);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.19, 0.31), HEAD);
      lens.position.set(faceX - 0.045, c.noseY - 0.02, cz); g.add(lens);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.21, 0.33), CHROME);
      trim.position.set(faceX + 0.002, c.noseY - 0.02, cz); g.add(trim);
    } else if (style === 'slim-led') {
      mount(faceX, c.noseY - 0.09, sz * (c.W * 0.38), 0.10, 0.42);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.065, 0.40), HEAD);
      lens.position.set(faceX - 0.02, c.noseY - 0.09, sz * (c.W * 0.38)); g.add(lens);
    } else if (style === 'projector-cluster') {
      mount(faceX, c.noseY + 0.01, cz, 0.32, 0.34);
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.30), DARK);
      housing.position.set(faceX - 0.055, c.noseY - 0.01, cz); g.add(housing);
      for (let i = -1; i <= 1; i++) {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 12), HEAD);
        pod.rotation.z = Math.PI / 2;
        pod.position.set(faceX - 0.01, c.noseY - 0.04, cz + i * 0.09); g.add(pod);
      }
      // LED DRL signature: a slim bright strip along the cluster top + a short
      // outboard vertical hook, so the lamp reads as the SK Forester's swept
      // modular cluster with a C-shaped daytime running light — not three bare
      // projector pods floating in a black box.
      const drl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.30), HEAD);
      drl.position.set(faceX - 0.012, c.noseY + 0.09, cz); g.add(drl);
      const hook = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.035), HEAD);
      hook.position.set(faceX - 0.012, c.noseY + 0.03, cz + sz * 0.135); g.add(hook);
      // outer swept segment wrapping toward the fender corner — the SK's modular
      // cluster doesn't stop square, it sweeps back around the corner into the fender.
      const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.19, 0.06), HEAD);
      sweep.position.set(faceX - 0.115, c.noseY + 0.01, cz + sz * 0.17);
      sweep.rotation.y = -sz * 0.52; g.add(sweep);
    } else {   // 'swept-wrap' (default) — lamp sweeps back around the fender corner
      mount(faceX, c.noseY - 0.02, sz * (c.W * 0.34), 0.19, 0.30);
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.16, 0.28), HEAD);
      front.position.set(faceX - 0.045, c.noseY - 0.02, sz * (c.W * 0.34)); g.add(front);
      const wrap = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.14, 0.09), HEAD);
      wrap.position.set(xF - 0.13, c.noseY - 0.03, sz * (c.W * 0.47));
      wrap.rotation.y = -sz * 0.55; g.add(wrap);
    }
    // amber corner marker (universal real-car cue)
    const mk = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.07), AMBER);
    mk.position.set(xF - 0.05, c.noseY - 0.04, sz * (c.W * 0.49)); g.add(mk);
  }
}
// tail lamps + rear closure (decklid/liftgate/tailgate delineation) + plates.
// R11: tail lamps are SURFACE-MOUNTED (body-color surround + a red lens proud of
// the tail) not holes; taillightWrap climbs the D-pillar (SUV/wagon/van); and the
// rear closure now shows it OPENS — a decklid seam+handle (sedan) or a liftgate
// seam hinged from the roofline down to the bumper (suv/hatch/wagon/minivan).
function addTailAndPlates(g, c) {
  const hl = c.L / 2, xF = hl, xR = -hl;
  const faceX = xR - 0.005;                          // lens face just proud of the tail
  const mountR = (cy, cz, h, w) =>                    // body-color surround behind a tail lens
    slab(g, xR - 0.02, xR + 0.06, cy - h / 2 - 0.03, cy + h / 2 + 0.03,
      cz - w / 2 - 0.03, cz + w / 2 + 0.03, null, true);
  for (const sz of [-1, 1]) {
    if (c.parts.sk && c.trunk === 'flush') { foresterTailLamp(g, c, sz); continue; }  // R15: bespoke C-lamp
    if (c.trunk === 'flush') {
      const cy = c.beltY - 0.10, cz = sz * (c.W * 0.40);
      if (c.parts.taillightWrap && c.body !== 'pickup') {
        // C-shaped wrap lamp (SK Forester / CR-V signature): a tall outer vertical
        // bar with a top + bottom hook curling inward toward the tailgate, so it
        // reads as a bracketed "C" rather than one plain tall box.
        mountR(cy + 0.04, cz, 0.54, 0.15);
        const vert = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.52, 0.085), TAIL);
        vert.position.set(faceX - 0.03, cy + 0.06, cz + sz * 0.028); g.add(vert);  // outer vertical
        for (const dy of [0.20, -0.20]) {             // top + bottom inward hooks
          const hook = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.12), TAIL);
          hook.position.set(faceX - 0.03, cy + 0.06 + dy, cz - sz * 0.028); g.add(hook);
        }
      } else {
        mountR(cy, cz, 0.34, 0.17);
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.32, 0.16), TAIL);
        tl.position.set(faceX - 0.03, cy, cz); g.add(tl);
      }
    } else {
      const cy = c.deckY - 0.12, cz = sz * (c.W * 0.34);
      mountR(cy, cz, 0.18, 0.34);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.33), TAIL);
      tl.position.set(faceX - 0.03, cy, cz); g.add(tl);
    }
  }
  addRearClosure(g, c);
  for (const sx of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.2), PLATE);
    pl.position.set((sx > 0 ? xF : xR) + sx * 0.02, c.sillY + 0.32, 0);
    pl.rotation.y = sx * Math.PI / 2; g.add(pl);
  }
}
// rear closure delineation — makes the trunk/hatch read as an opening panel.
function addRearClosure(g, c) {
  const hl = c.L / 2, xR = -hl;
  if (c.body === 'pickup') {
    // tailgate already modeled as a wall in assemblePickup — add a top seam +
    // an inset handle so it reads as a drop-down tailgate.
    seamBox(g, xR + 0.10, c.beltY + 0.02, 0, 0.02, 0.04, c.W * 0.9, DARK);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.34), CHROME);
    hd.position.set(xR + 0.12, c.beltY - 0.12, 0); g.add(hd);
    return;
  }
  if (c.trunk === 'flush') {
    // LIFTGATE: hinges at the ROOFLINE and swings down the full upright rear panel
    // to the bumper (the tall rear mass is built by addFlushRear). Delineated by
    // two full-height side seams from the roof to the bumper + a top hinge line at
    // the roof + a bottom shut-line above the bumper + a grab handle. This is the
    // real Bronco-Sport/CR-V roof-hinged tailgate, not a stub above the beltline.
    const zSide = c.W * 0.42, yTop = c.roofY - 0.06, yBot = c.sillY + 0.30;
    for (const sz of [-1, 1])
      seamBox(g, xR + 0.05, (yTop + yBot) / 2, sz * zSide, 0.03, yTop - yBot, 0.05, DARK);
    seamBox(g, xR + 0.05, yBot, 0, 0.03, 0.05, zSide * 2, DARK);         // bottom shut-line
    seamBox(g, xR + 0.03, yTop, 0, 0.03, 0.05, zSide * 2, DARK);         // top hinge line at the roof
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.05, 0.30),
      c.parts.trimDark ? DARK : CHROME);
    hd.position.set(xR + 0.03, c.beltY - 0.12, 0); g.add(hd);            // liftgate handle
  } else {
    // DECKLID (sedan trunk): the lid runs from the backlight base (bbX, beltY) back
    // over the deck to the tail. Delineated by a transverse front shut-line at the
    // glass base + two seams following the deck's slope down to the tail + a rear
    // shut-line on the tail face and a chrome garnish/keyhole above the plate.
    const bbX = c.bbF * hl, zSide = c.W * 0.40;
    seamBox(g, bbX + 0.02, c.beltY - 0.03, 0, 0.03, 0.04, zSide * 2, DARK);  // front lid shut-line
    for (const sz of [-1, 1])   // deck side seams sloping belt(front) -> deck(tail)
      bar(g, bbX + 0.02, c.beltY - 0.03, xR + 0.12, c.deckY - 0.02, sz * zSide, 0.024, 0.04, DARK, false);
    seamBox(g, xR + 0.03, c.deckY - 0.12, 0, 0.03, 0.05, zSide * 1.5, DARK);  // rear-face shut-line
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.24), CHROME);
    hd.position.set(xR + 0.02, c.sillY + 0.5, 0); g.add(hd);                 // trunk garnish/keyhole
  }
}
// ===== FLUSH REAR (SUV / hatch / wagon / minivan upright liftgate) ===========
// The extruded body tops out at the BELTLINE and the greenhouse only fills the
// cabin glass, so the tall cargo volume ABOVE the beltline between the backlight
// base and the tail was left OPEN. That void is exactly why a flush model's rear
// read as "a gray box sticking out": the tail lamps + liftgate seams were mounted
// in empty air with no sheetmetal behind them. This builds the missing upright
// rear so the liftgate reads as flush body — the fix the Bronco Sport needed:
//   * the roof CONTINUES from the roof-rear back to the tail (a real roof overhang
//     capping the cargo area) instead of stopping short over open space;
//   * a body-color tailgate MASS closes belt->roof from the backlight base to the
//     tail, in-plane with the body sides, so the rear glass sets INTO sheetmetal
//     and the lamps/seams/bumper all mount on solid body.
// Rake still comes from each model's roofRearF/bbF (Bronco near-vertical & boxy,
// CR-V more sloped), so the shared builder keeps every flush model distinct.
function addFlushRear(g, c) {
  const hl = c.L / 2, xR = -hl;
  const rrX = c.roofRearF * hl, bbX = c.bbF * hl;
  const Wg = c.W * c.greenhouse, capHW = Wg / 2 * 0.86 + 0.02;
  // R19: on a lofted body the loft (sill->belt) + the canopy (belt->roof, incl. the
  // backlight = the rear window) ALREADY form the whole rear. The old tailgate mass +
  // 2nd punched window below just fought them (the doubled/boxy rear). Here we add only
  // the appendages: roof spoiler, plate tub, wiper. The rear glass is the canopy backlight.
  if (c.parts.greenhouseLoft) {
    if (c.parts.roofRail) {                                        // roof spoiler over the backlight
      const spY = c.roofY + 0.01, spHW = capHW * 0.9;
      slab(g, rrX + 0.02, rrX + 0.20, spY, spY + 0.05, -spHW, spHW, null, true);            // wing (body)
      slab(g, rrX + 0.03, rrX + 0.16, spY - 0.04, spY, -spHW + 0.02, spHW - 0.02, DARK, false); // under-lip
      for (const sz of [-1, 1])
        slab(g, rrX + 0.04, rrX + 0.10, c.roofY - 0.03, spY, sz * (spHW - 0.06), sz * (spHW - 0.02), DARK, false);
      const chmsl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.22), TAIL);
      chmsl.position.set(rrX + 0.19, spY + 0.02, 0); g.add(chmsl);
    }
    const plY = c.beltY - 0.18;                                    // recessed plate tub on the lower liftgate
    slab(g, xR + 0.0, xR + 0.05, plY - 0.10, plY + 0.10, -0.30, 0.30, DARK, false);
    const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.03), DARK);  // wiper across the backlight
    wiper.position.set((rrX + bbX) / 2 + 0.02, (c.roofY + c.beltY) / 2 - 0.02, -Wg * 0.15);
    wiper.rotation.x = 0.4; g.add(wiper);
    return;
  }
  // (1) rear roof header — continue the roof from the roof-rear to the tail so the
  // roof visibly reaches the back and caps the cargo box (crowned like the main cap).
  crownedRoof(g, rrX, xR + 0.02, capHW, c.roofY - 0.02, c.roofY + 0.06,
    (c.roofCrown ?? 0.05) * 0.85, 0.02);
  // (2) tailgate — a body-color panel with a real REAR WINDOW punched into its
  // upper half (dark glass set into a recessed cavity), NOT a solid body-color
  // wall. This is the fix for "the rear glass reads as body color": before, the
  // only glass on a flush model was the greenhouse backlight — a near-horizontal
  // sliver at the roofline, invisible from directly behind — so the whole upright
  // liftgate rendered as sheetmetal. Now the upright liftgate carries the big
  // near-vertical rear window real SUVs have, framed by a body-color surround.
  const yb = c.beltY - 0.03, yt = c.roofY - 0.02;
  const x0 = Math.max(bbX, xR + 0.06), hw = c.W / 2 * 0.94, xTail = xR + 0.04;
  const wYb = c.beltY + (yt - c.beltY) * 0.26;   // window sill (lower edge)
  const wYt = yt - 0.05;                          // window header (just under the roof)
  const wHw = hw * 0.80;                          // window narrower than the tailgate
  slab(g, x0, xTail, yb, wYb, -hw, hw, null, true);              // tailgate below the window
  slab(g, x0, xTail, wYt, yt, -hw, hw, null, true);              // header above the window
  for (const sz of [-1, 1])
    slab(g, x0, xTail, wYb, wYt, sz * wHw, sz * hw, null, true); // C-pillar frame beside the window
  slab(g, x0 + 0.02, xTail - 0.05, wYb + 0.02, wYt - 0.02, -wHw + 0.02, wHw - 0.02, DARK, false); // recess cavity
  const rearGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, wYt - wYb - 0.05, (wHw - 0.03) * 2), GLASS);
  rearGlass.position.set(xTail - 0.05, (wYb + wYt) / 2, 0);
  rearGlass.castShadow = true; g.add(rearGlass);
  // (3) quarter/D-pillar fillets tying that mass down onto the wider body flanks so
  // there's no step between the narrower rear header and the body sides.
  for (const sz of [-1, 1])
    slab(g, x0, xR + 0.04, yb, c.beltY + (yt - c.beltY) * 0.55,
      sz * (hw - 0.03), sz * (c.W / 2 - 0.02), null, true);
  // (4) roof spoiler over the rear window (Forester/CR-V/Bronco cue): a body-color
  // wing cantilevered off the roof-rear on two dark stand-offs, with a dark under-lip.
  if (c.parts.roofRail) {
    const spY = c.roofY + 0.03, spHW = capHW * 0.92;
    slab(g, xR - 0.05, xR + 0.19, spY, spY + 0.06, -spHW, spHW, null, true);                 // wing (body)
    slab(g, xR - 0.03, xR + 0.15, spY - 0.05, spY, -spHW + 0.02, spHW - 0.02, DARK, false);  // under-lip
    for (const sz of [-1, 1])
      slab(g, xR - 0.02, xR + 0.05, c.roofY - 0.03, spY, sz * (spHW - 0.06), sz * (spHW - 0.02), DARK, false); // stand-offs
    // high-mount brake light on the spoiler
    const chmsl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.24), TAIL);
    chmsl.position.set(xR + 0.18, spY + 0.02, 0); g.add(chmsl);
  }
  // (5) liftgate details — a recessed license-plate tub above the bumper + a rear
  // wiper arm across the window, so the tailgate reads as a real hatch, not a panel.
  const plX = xR + 0.02, plY = c.beltY - 0.24;
  slab(g, plX, xR + 0.05, plY - 0.11, plY + 0.11, -0.34, 0.34, DARK, false);          // plate recess
  const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.03), DARK);
  wiper.position.set(xTail - 0.045, (wYb + wYt) / 2 - 0.04, -wHw * 0.35);
  wiper.rotation.x = 0.5; g.add(wiper);                                                // rear wiper across the glass
}

// ===== GRILLE (spec.grille) + bumpers ========================================
// Front-end style comes straight from CAR_SPECS: 'horizontal-bars' = stacked
// chrome slats, 'mesh' = a honeycomb dark insert, 'closed-body' = a smooth
// painted nose with only a slim lower intake (Tesla), 'blocky-slot' = a big
// bold truck grille, 'trapezoid-chrome' = a chrome-framed trapezoid opening.
// Every style still gets front/rear bumpers + a dark lower bumper intake so the
// nose never reads bare.
function addGrilleAndBumpers(g, c) {
  const hl = c.L / 2, xF = hl, xR = -hl;
  // bumpers — R11: a distinct lower fascia BAND that WRAPS the corners (a face
  // panel plus two side returns curling back onto the body sides) rather than a
  // flat plate stuck across the nose/tail.
  const bmat = c.parts.bumper === 'chrome' ? CHROME : c.parts.bumper === 'dark' ? DARK : null;
  const bpaint = c.parts.bumper === 'body';
  const bmatOr = bmat || DARK, bd = c.bumperDepth ?? 0.26;
  const wrapBumper = (sign, y1) => {
    const xnose = sign > 0 ? xF : xR, inner = xnose - sign * bd;
    const y0 = c.sillY + 0.02, halfW = c.W * (sign > 0 ? 0.47 : 0.46);
    slab(g, xnose - sign * 0.02, inner, y0, y1, -halfW, halfW, bmatOr, bpaint);  // face band
    for (const sz of [-1, 1])   // corner returns wrapping onto the body sides
      slab(g, xnose, xnose - sign * (bd + 0.30), y0, y1,
        sz * halfW - 0.06, sz * halfW + 0.02, bmatOr, bpaint);
  };
  wrapBumper(1, c.sillY + 0.30);
  wrapBumper(-1, c.sillY + 0.28);
  // fog / flood lamps in the lower front-bumper corners (per spec)
  if (c.parts.fog && c.parts.sk) foresterFog(g, c);            // R15: bespoke fog assembly
  else if (c.parts.fog) {
    for (const sz of [-1, 1]) {
      const cz = sz * (c.W * 0.36);
      const bez = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 0.21), DARK);
      bez.position.set(xF - 0.10, c.sillY + 0.17, cz); g.add(bez);
      const fog = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), HEAD);
      fog.rotation.z = Math.PI / 2; fog.position.set(xF - 0.05, c.sillY + 0.17, cz); g.add(fog);
      // chrome accent bar under the fog pod (the SK's L-shaped fog-lamp garnish)
      const acc = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.21), CHROME);
      acc.position.set(xF - 0.05, c.sillY + 0.095, cz); g.add(acc);
    }
  }
  // lower air intake (dark) under the bumper — wider on the bold truck grille
  const gs = c.parts.grille;
  const intakeW = gs === 'blocky-slot' ? c.W * 0.38 : c.W * 0.30;
  slab(g, xF - 0.16, xF - 0.02, c.sillY + 0.30, c.noseY - 0.24, -intakeW, intakeW, DARK, false);

  if (c.parts.sk) { foresterGrille(g, c); return; }           // R15: bespoke SK grille
  const halfW = c.W * 0.30, gy0 = c.sillY + 0.32, gy1 = c.noseY - 0.08;
  const backX = xF - 0.03;
  if (gs === 'closed-body') {
    // Tesla-style: no dark opening at all — a smooth body-color nose panel (the
    // lower intake slab above is the only "grille" cue on the front fascia).
    slab(g, xF - 0.05, xF - 0.005, gy0, gy1, -halfW, halfW, null, true);
    return;
  }
  if (gs === 'horizontal-bars') {
    slab(g, backX - 0.035, backX, gy0, gy1, -halfW, halfW, DARK, false);      // recessed dark opening
    const bars = 4, bh = (gy1 - gy0) / bars;
    for (let i = 0; i < bars; i++) {
      const bslat = new THREE.Mesh(new THREE.BoxGeometry(0.045, bh * 0.5, halfW * 1.9), CHROME);
      bslat.position.set(backX + 0.02, gy0 + (i + 0.5) * bh, 0); g.add(bslat);
    }
    return;
  }
  if (gs === 'blocky-slot') {
    const w2 = halfW * 1.25;
    slab(g, backX - 0.05, backX, gy0 - 0.03, gy1 + 0.06, -w2, w2, DARK, false);   // bigger, bolder opening
    const slots = 3, bh = (gy1 - gy0 + 0.09) / slots;
    for (let i = 0; i < slots; i++) {
      const bslat = new THREE.Mesh(new THREE.BoxGeometry(0.07, bh * 0.55, w2 * 1.94), CHROME);
      bslat.position.set(backX + 0.03, gy0 - 0.03 + (i + 0.5) * bh, 0); g.add(bslat);
    }
    return;
  }
  if (gs === 'trapezoid-chrome') {
    // chrome-framed trapezoid opening, narrower at the top — built from 4 frame
    // edges (frameEdgeYZ, no extra polys beyond 4 thin boxes) + a dark
    // mesh-textured insert so the opening doesn't read as a flat hole.
    const topW = halfW * 0.68, botW = halfW * 1.15, fx = backX + 0.02;
    slab(g, backX - 0.035, backX, gy0, gy1, -botW, botW, DARK, false);
    const insert = new THREE.Mesh(new THREE.PlaneGeometry(botW * 1.7, (gy1 - gy0) * 0.85),
      new THREE.MeshStandardMaterial({ map: meshGrilleTexture(), color: 0x24272a, metalness: 0.3, roughness: 0.65 }));
    insert.rotation.y = Math.PI / 2; insert.position.set(backX + 0.019, (gy0 + gy1) / 2, 0); g.add(insert);
    frameEdgeYZ(g, gy1, -topW, gy1, topW, fx, 0.045, 0.05, CHROME);   // top
    frameEdgeYZ(g, gy0, -botW, gy0, botW, fx, 0.045, 0.05, CHROME);   // bottom
    frameEdgeYZ(g, gy1, -topW, gy0, -botW, fx, 0.045, 0.05, CHROME);  // left
    frameEdgeYZ(g, gy1, topW, gy0, botW, fx, 0.045, 0.05, CHROME);    // right
    return;
  }
  if (gs === 'hexagon') {
    // horizontal hexagon (Subaru SK): a 6-sided chrome frame widest at mid-height,
    // narrower top + bottom, over a dark mesh insert — the exact-shape upgrade from
    // the trapezoid approximation.
    const topW = halfW * 0.72, midW = halfW * 1.16, botW = halfW * 0.9;
    const gymid = (gy0 + gy1) / 2, fx = backX + 0.02;
    slab(g, backX - 0.035, backX, gy0, gy1, -midW, midW, DARK, false);          // opening
    const insert = new THREE.Mesh(new THREE.PlaneGeometry(midW * 1.9, (gy1 - gy0) * 0.9),
      new THREE.MeshStandardMaterial({ map: meshGrilleTexture(), color: 0x1c1f22, metalness: 0.3, roughness: 0.62 }));
    insert.rotation.y = Math.PI / 2; insert.position.set(backX + 0.019, gymid, 0); g.add(insert);
    const E = (y0, z0, y1, z1) => frameEdgeYZ(g, y0, z0, y1, z1, fx, 0.045, 0.05, CHROME);
    E(gy1, -topW, gy1, topW);       // top
    E(gy1, topW, gymid, midW);      // upper-right
    E(gymid, midW, gy0, botW);      // lower-right
    E(gy0, botW, gy0, -botW);       // bottom
    E(gy0, -botW, gymid, -midW);    // lower-left
    E(gymid, -midW, gy1, -topW);    // upper-left
    return;
  }
  // 'mesh' (default) — dark honeycomb insert behind a recessed opening.
  slab(g, backX - 0.035, backX, gy0, gy1, -halfW, halfW, DARK, false);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 1.85, (gy1 - gy0) * 0.9),
    new THREE.MeshStandardMaterial({ map: meshGrilleTexture(), color: 0x2a2d30, metalness: 0.3, roughness: 0.65 }));
  m.rotation.y = Math.PI / 2;
  m.position.set(backX + 0.021, (gy0 + gy1) / 2, 0); g.add(m);
}
// black plastic lower cladding + skid strip (Bronco Sport / rugged crossovers)
function addCladding(g, c) {
  if (!c.parts.cladding) return;
  const hl = c.L / 2;
  for (const sz of [-1, 1]) {
    slab(g, -hl + 0.3, hl - 0.3, c.sillY + 0.02, c.sillY + 0.26, sz * (c.W / 2 - 0.02), sz * (c.W / 2 + 0.02), CLAD, false);
  }
  // front + rear skid plates (silver)
  for (const sx of [1, -1]) {
    const sk = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, c.W * 0.4), HUB);
    sk.position.set(sx * (hl - 0.2), c.sillY + 0.04, 0); g.add(sk);
  }
  // small red rear reflectors low in the bumper corners (rugged-crossover cue —
  // the SK Forester's lower-fascia reflectors below the tail lamps).
  for (const sz of [-1, 1]) {
    const rfl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.12), TAIL);
    rfl.position.set(-hl + 0.05, c.sillY + 0.15, sz * (c.W * 0.36)); g.add(rfl);
  }
  // rear lower valance (matte-black bumper skirt squares off the bottom rear so it
  // stops reading as one bulbous body-color pod) + a chrome exhaust tip below it.
  // R15: skip the flat valance on the SK — foresterRearFascia builds a curved one.
  if (!c.parts.sk) slab(g, -hl - 0.03, -hl + 0.20, c.sillY + 0.02, c.sillY + 0.13, -c.W * 0.42, c.W * 0.42, CLAD, false);
  // R19: a small exhaust tip TUCKED under the rear valance (points down-and-back, not
  // poking straight out the back like a pipe). Short + inboard so the valance hides its root.
  const exh = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.09, 12), CHROME);
  exh.rotation.x = Math.PI / 2; exh.rotation.z = 0.5;
  exh.position.set(-hl + 0.10, c.sillY - 0.01, c.W * 0.26); g.add(exh);
}

// ===== BADGES / EMBLEMS ======================================================
// A small brand emblem on the grille centre (front) and the liftgate/decklid
// (rear). Only renders when the model's STYLE sets parts.emblem — scoped so
// giving one model a brand mark doesn't silently restyle the rest of the fleet.
// 'subaru' = the Pleiades mark: a dark oval + chrome rim + six stars.
const EMBLEM_NAVY = new THREE.MeshStandardMaterial({ color: 0x14213e, metalness: 0.5, roughness: 0.35 });
const STAR = new THREE.MeshStandardMaterial({ color: 0xe2e8f4, metalness: 0.9, roughness: 0.24,
  emissive: 0x2a3a63, emissiveIntensity: 0.3 });
// one emblem on a vertical face at world X, facing +X (sign 1) or -X (sign -1).
function oneEmblem(g, kind, x, y, sign) {
  const grp = new THREE.Group();
  // oval plate: a disc whose circular faces point along X (cylinder axis -> X)
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.04, 24), EMBLEM_NAVY);
  plate.rotation.z = Math.PI / 2; grp.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.14, 8, 24), CHROME);
  rim.rotation.y = Math.PI / 2; grp.add(rim);
  if (kind === 'subaru') {
    // six-star Pleiades cluster (one larger star + five smaller), proud of the
    // oval face; positions in the plate's Y(up)-Z(across) plane.
    const stars = [[0.02, -0.55, 0.22], [0.34, 0.20, 0.13], [0.14, 0.52, 0.13],
      [-0.16, 0.34, 0.12], [-0.26, 0.66, 0.11], [-0.02, 0.06, 0.13]];
    for (const [py, pz, sr] of stars) {
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(sr), STAR);
      st.scale.set(0.4, 1, 1);                 // flatten along X so it lies on the oval
      st.position.set(0.05, py, pz); grp.add(st);
    }
  }
  grp.scale.set(1, 0.075, 0.115);              // squash unit shapes to a wide oval
  grp.position.set(x, y, 0);
  if (sign < 0) grp.rotation.y = Math.PI;       // face the rear
  g.add(grp);
}
function addBadges(g, c) {
  const kind = c.parts.emblem;
  if (!kind) return;
  const hl = c.L / 2;
  const fy = (c.sillY + 0.32 + (c.noseY - 0.08)) / 2;   // grille centre
  oneEmblem(g, kind, hl + 0.05, fy, 1);
  const ry = c.trunk === 'flush' ? c.beltY - 0.16 : c.deckY - 0.05;   // lower liftgate/decklid
  oneEmblem(g, kind, -hl - 0.05, ry, -1);
}

// side-surface detail the extruded slab can't express on its own: a dark window
// drip-rail along the top of the DLO, a rising beltline character crease, and the
// Subaru "hockey-stick" kick-up at the rear quarter window. SUV/van only.
function addSideDetails(g, c) {
  if (c.body !== 'suv' && c.body !== 'minivan') return;
  const hl = c.L / 2, wsX = c.wsTopF * hl, rrX = c.roofRearF * hl;
  const cowlX = c.cowlF * hl, bbX = c.bbF * hl;
  const Wg = c.W * c.greenhouse, zside = Wg / 2 + 0.012;
  for (const sz of [-1, 1]) {
    // drip-rail: dark trim capping the top edge of the side glass
    const rail = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(wsX - rrX) + 0.08, 0.035, 0.05), DARK);
    rail.position.set((wsX + rrX) / 2, c.roofY - 0.03, sz * zside); rail.castShadow = true; g.add(rail);
    // R20: REMOVED the tilted "hockey-stick" quarter-window kick + its trim + the
    // bolt-on beltline crease. Those read as a fake triangular window and floating
    // lips/rectangles matching nothing on the real car. A clean DLO beats invented junk;
    // only the legitimate window drip-rail stays.
  }
}

// hood panel-gap delineation — a transverse cowl shut-line at the windshield base
// plus two longitudinal hood/fender seams, so the hood reads as a separate panel.
function addHoodSeams(g, c) {
  const hl = c.L / 2, xF = hl, cowlX = c.cowlF * hl;
  // transverse cowl shut-line at the windshield base
  seamBox(g, cowlX + 0.02, c.beltY - 0.03, 0, 0.03, 0.04, c.W * 0.78, DARK);
  // two hood/fender seams that FOLLOW the hood's rise (nose -> cowl) so they lie
  // on the surface instead of floating above a straight line.
  for (const sz of [-1, 1])
    bar(g, xF - 0.22, c.noseY + 0.06, cowlX, c.beltY - 0.05, sz * (c.W * 0.42),
      0.024, 0.04, DARK, false);
}

// ===== ASSEMBLERS ============================================================
// R18: bodyKey -> lofted body builder (model-specific FORM dispatch)
const BODY_UNITS = {
  'forester-sk': buildForesterBody, 'bronco': buildBroncoBody, 'crv': buildCrvBody,
  'accord': buildAccordBody, 'camry': buildCamryBody, 'corolla': buildCorollaBody,
  'prius': buildPriusBody, 'odyssey': buildOdysseyBody, 'model3': buildModel3Body,
  'f150': buildF150Body,
};
function assembleClosed(c) {
  const g = new THREE.Group();
  const bodyFn = c.parts.bodyBuilder && BODY_UNITS[c.parts.bodyBuilder];
  if (bodyFn) { bodyFn(g, c); addDoorCuts(g, c); }  // R17/R18: model-specific lofted body
  else addLowerBody(g, c);
  addGreenhouse(g, c);
  if (c.trunk === 'flush') addFlushRear(g, c);   // upright liftgate + rear roof (SUV/hatch/van)
  addWheels(g, c);
  addFenders(g, c);
  addGrilleAndBumpers(g, c);
  addHoodSeams(g, c);
  addCladding(g, c);
  addSideDetails(g, c);
  addMirrors(g, c);
  addHeadlights(g, c);
  addTailAndPlates(g, c);
  addBadges(g, c);
  if (c.parts.sk) { foresterHood(g, c); foresterFrontFascia(g, c); foresterRearFascia(g, c); }  // windshield/rails hooked in addGreenhouse
  return g;
}

// pickup: solid cab+hood block, CREW-CAB greenhouse (4 doors / 2 rows), then a
// correctly-proportioned separate open bed (F-150 / Rivian R1T style).
function assemblePickup(c) {
  const g = new THREE.Group();
  const hl = c.L / 2, xF = hl, xR = -hl;
  const cowlX = c.cowlF * hl, bbX = c.bbF * hl;   // bbX = cab rear (crew cab => well aft)
  const wsX = c.wsTopF * hl, rrX = c.roofRearF * hl;
  const Wg = c.W * c.greenhouse;
  const bedFloorY = c.sillY + 0.46, bedTopY = c.beltY + 0.04;
  // cab+hood block (nose -> cab rear), curved shoulders + body sculpt
  const s = new THREE.Shape();
  s.moveTo(xF, c.sillY + 0.16);
  s.lineTo(xF, c.noseY - 0.06);
  s.quadraticCurveTo(xF, c.noseY, xF - 0.14, c.noseY + 0.03);
  s.quadraticCurveTo(cowlX + (xF - cowlX) * 0.4, c.beltY - 0.02, cowlX, c.beltY);
  s.lineTo(bbX, c.beltY);
  s.lineTo(bbX, c.sillY);
  s.lineTo(xF - 0.16, c.sillY);
  s.quadraticCurveTo(xF, c.sillY, xF, c.sillY + 0.16);
  const pbFn = c.parts.bodyBuilder && BODY_UNITS[c.parts.bodyBuilder];
  if (pbFn) pbFn(g, c);                            // R18: lofted cab body (nose->cab-rear); bed added below
  else g.add(paintMesh(extrudeProfile(s, c.W, 0.12, sculptLower(c))));
  addDoorCuts(g, c);                               // 4-door crew-cab shut lines
  // crew-cab greenhouse (dark-glass prism + narrow roof cap + A/B/C pillars)
  const gh = new THREE.Shape();
  gh.moveTo(cowlX, c.beltY);
  gh.lineTo(wsX, c.roofY);
  gh.lineTo(rrX, c.roofY);
  gh.lineTo(bbX, c.beltY);
  gh.closePath();
  const yb = c.beltY, yr = c.roofY;
  const ghWarp = (x, y, z) => [x, y, z * (1 - 0.14 * smooth(yb, yr + 0.05, y))];
  const glass = new THREE.Mesh(extrudeProfile(gh, Wg, 0.03, ghWarp), GLASS);
  glass.castShadow = true; g.add(glass);
  const capHW = Wg / 2 * 0.88 + 0.02;
  crownedRoof(g, wsX, rrX, capHW, c.roofY - 0.02, c.roofY + 0.07,
    c.roofCrown ?? 0.045, c.roofArch ?? 0.02);   // R11: crowned crew-cab roof
  const pzBelt = Wg / 2 + 0.012, bX = cowlX * 0.46 + bbX * 0.54;
  for (const sz of [-1, 1]) {
    bar(g, cowlX, c.beltY, wsX, c.roofY, sz * pzBelt, 0.12, 0.06, null, true);   // A-pillar
    bar(g, bbX, c.beltY, rrX, c.roofY, sz * pzBelt, 0.13, 0.06, null, true);     // C-pillar
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.11, (c.roofY - c.beltY) * 0.96, 0.06), PAINT0);
    b.userData.paint = true;
    b.position.set(bX, (c.beltY + c.roofY) / 2, sz * (pzBelt - 0.008)); b.castShadow = true; g.add(b); // B-pillar
  }
  // bed: floor block, tall side walls, front/tailgate walls, dark liner floor
  slab(g, bbX, xR, c.sillY, bedFloorY, -c.W / 2, c.W / 2, null, true);
  for (const sz of [-1, 1])
    slab(g, bbX, xR, bedFloorY, bedTopY, sz * (c.W / 2 - 0.07), sz * (c.W / 2), null, true);
  slab(g, bbX - 0.07, bbX + 0.07, bedFloorY, bedTopY + 0.04, -c.W / 2, c.W / 2, null, true);   // front bed wall
  slab(g, xR - 0.07, xR + 0.07, bedFloorY, bedTopY, -c.W / 2, c.W / 2, null, true);            // tailgate
  slab(g, bbX + 0.07, xR - 0.07, bedFloorY, bedFloorY + 0.05, -c.W / 2 + 0.1, c.W / 2 - 0.1, DARK, false); // liner
  addWheels(g, c);
  addFenders(g, c);
  addGrilleAndBumpers(g, c);
  addHoodSeams(g, c);
  addCladding(g, c);
  addMirrors(g, c);
  addHeadlights(g, c);
  addTailAndPlates(g, c);
  addBadges(g, c);
  return g;
}

export function assembleCar(spec) {
  const c = dims(spec);
  const g = c.body === 'pickup' ? assemblePickup(c) : assembleClosed(c);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// ===== SCALE ==================================================================
// R9: one mm -> world-unit factor for the WHOLE fleet. Anchored so the mid-size
// sedan (Camry) keeps the world length the pre-R9 hardcoded fleet already used
// (7.9) — so the parking bays / driveway cuts / curb layout tuned in ground.js
// against the OLD car lengths don't need to move. Every other model's
// L/W/H/wheelbase/track/overhangs is multiplied by this SAME factor, so relative
// sizes come out physically correct fleet-wide (an F-150 or Odyssey reads as
// clearly longer/taller than a Corolla) instead of each model being
// independently fudged, which is the R6-R8 bug this rework fixes (width was
// barely scaled up while length was — a Camry ran width/length = 0.26 instead
// of a real car's ~0.38, the root of the "skinny" complaint).
const CAMRY_WORLD_LENGTH = 7.9;

// ===== FALLBACK SPECS =========================================================
// Real-world mm dimensions + front-end cues, schema-matched to car_specs.js's
// CAR_SPECS (a sibling module owned by a parallel agent). Used only when
// CAR_SPECS is missing a key (or hasn't loaded yet) — see specLookup() below —
// so this file keeps building/rendering on its own. Numbers are approximate
// production specs for the CAR_LIBRARY year/trim; car_specs.js is authoritative
// once present.
const FALLBACK_SPECS = {
  // glTF-only additions — real dimensions drive modelLen (relative sizing) for the glTF model.
  jeep: { bodyType: 'suv', lengthMM: 4223, widthMM: 1873, heightMM: 1800, wheelbaseMM: 2424,
    trackFMM: 1572, trackRMM: 1572, frontOverhangMM: 720, rearOverhangMM: 1079,
    headlight: 'round', grille: 'blocky-slot', notes: '2007 Jeep Wrangler Rubicon (JK 2-door)' },
  porsche: { bodyType: 'sedan', lengthMM: 4291, widthMM: 1775, heightMM: 1310, wheelbaseMM: 2272,
    trackFMM: 1438, trackRMM: 1511, frontOverhangMM: 1000, rearOverhangMM: 1019,
    headlight: 'round', grille: 'closed-body', notes: '1975 Porsche 911 (930) Turbo' },
  forester: { bodyType: 'suv', lengthMM: 4625, widthMM: 1815, heightMM: 1730, wheelbaseMM: 2670,
    trackFMM: 1585, trackRMM: 1595, frontOverhangMM: 930, rearOverhangMM: 1025,
    headlight: 'swept-wrap', grille: 'horizontal-bars', notes: '2019 Subaru Forester (SK)' },
  bronco: { bodyType: 'suv', lengthMM: 4384, widthMM: 1886, heightMM: 1848, wheelbaseMM: 2600,
    trackFMM: 1631, trackRMM: 1626, frontOverhangMM: 855, rearOverhangMM: 929,
    headlight: 'round', grille: 'blocky-slot', notes: '2021 Ford Bronco Sport' },
  crv: { bodyType: 'suv', lengthMM: 4586, widthMM: 1855, heightMM: 1679, wheelbaseMM: 2660,
    trackFMM: 1605, trackRMM: 1620, frontOverhangMM: 915, rearOverhangMM: 1011,
    headlight: 'swept-wrap', grille: 'horizontal-bars', notes: '2017 Honda CR-V (5th gen)' },
  accord: { bodyType: 'sedan', lengthMM: 4862, widthMM: 1849, heightMM: 1466, wheelbaseMM: 2775,
    trackFMM: 1610, trackRMM: 1620, frontOverhangMM: 955, rearOverhangMM: 1132,
    headlight: 'swept-wrap', grille: 'horizontal-bars', notes: '2013 Honda Accord (9th gen)' },
  camry: { bodyType: 'sedan', lengthMM: 4850, widthMM: 1825, heightMM: 1445, wheelbaseMM: 2775,
    trackFMM: 1605, trackRMM: 1615, frontOverhangMM: 945, rearOverhangMM: 1130,
    headlight: 'swept-wrap', grille: 'trapezoid-chrome', notes: '2015 Toyota Camry (XV50 facelift)' },
  corolla: { bodyType: 'sedan', lengthMM: 4630, widthMM: 1775, heightMM: 1465, wheelbaseMM: 2700,
    trackFMM: 1590, trackRMM: 1600, frontOverhangMM: 900, rearOverhangMM: 1030,
    headlight: 'rect', grille: 'mesh', notes: '2014 Toyota Corolla (E170)' },
  prius: { bodyType: 'hatchback', lengthMM: 4540, widthMM: 1760, heightMM: 1470, wheelbaseMM: 2700,
    trackFMM: 1530, trackRMM: 1520, frontOverhangMM: 930, rearOverhangMM: 910,
    headlight: 'slim-led', grille: 'mesh', notes: '2016 Toyota Prius liftback (XW50)' },
  odyssey: { bodyType: 'minivan', lengthMM: 5150, widthMM: 1994, heightMM: 1747, wheelbaseMM: 3000,
    trackFMM: 1735, trackRMM: 1730, frontOverhangMM: 970, rearOverhangMM: 1180,
    headlight: 'swept-wrap', grille: 'horizontal-bars', notes: '2018 Honda Odyssey (5th gen)' },
  f150: { bodyType: 'pickup', lengthMM: 5890, widthMM: 2029, heightMM: 1985, wheelbaseMM: 3689,
    trackFMM: 1730, trackRMM: 1730, frontOverhangMM: 1050, rearOverhangMM: 1151,
    headlight: 'projector-cluster', grille: 'blocky-slot', notes: '2015 Ford F-150 SuperCrew (5.5ft box)' },
  model3: { bodyType: 'sedan', lengthMM: 4694, widthMM: 1849, heightMM: 1443, wheelbaseMM: 2875,
    trackFMM: 1580, trackRMM: 1580, frontOverhangMM: 930, rearOverhangMM: 889,
    headlight: 'slim-led', grille: 'closed-body', glassRoof: true, trimDark: true,
    notes: '2019 Tesla Model 3' },
};
// merged spec lookup: prefer the live CAR_SPECS (car_specs.js) for a key, fall
// back to FALLBACK_SPECS above if that module hasn't defined it (or hasn't
// loaded a given key yet).
function specLookup(key) {
  return (CAR_SPECS && CAR_SPECS[key]) || FALLBACK_SPECS[key];
}
// mm -> world-unit factor, computed once against whichever Camry spec is live
// (CAR_SPECS if present, else the fallback above) — see the SCALE comment.
const MM = CAMRY_WORLD_LENGTH / specLookup('camry').lengthMM;

// ===== BODY-TYPE HEIGHT PROFILE ===============================================
// CAR_SPECS gives overall heightMM but not the beltline/hood/deck breakdown the
// builder needs (that's a stylistic silhouette choice, not a "real dimension").
// These fractions-of-height are re-derived from the R6-R8 fleet's own tuned
// proportions (averaged per body type against THAT fleet's own height), so the
// silhouette shape carries over even though the absolute numbers now come from
// real mm. wheelR is also a fraction of height (real wheel radius / vehicle
// height runs ~0.21-0.27 depending on class — taller minivans have relatively
// smaller-looking wheels, trucks relatively bigger).
const BODY_PROFILE = {
  sedan:     { sill: 0.250, belt: 0.667, nose: 0.548, deck: 0.606, wheelR: 0.253 },
  wagon:     { sill: 0.260, belt: 0.640, nose: 0.550, deck: 0.640, wheelR: 0.250 },
  hatchback: { sill: 0.253, belt: 0.674, nose: 0.516, deck: 0.674, wheelR: 0.250 },
  suv:       { sill: 0.267, belt: 0.635, nose: 0.586, deck: 0.635, wheelR: 0.215 },
  minivan:   { sill: 0.221, belt: 0.574, nose: 0.492, deck: 0.574, wheelR: 0.213 },
  pickup:    { sill: 0.349, belt: 0.714, nose: 0.643, deck: 0.714, wheelR: 0.270 },
};
// spec (CAR_SPECS/FALLBACK_SPECS entry, real mm) -> the geometric envelope dims()
// needs (world units): L/W, ride height stack, wheel size, and axle/track
// placement. FO/RO (front/rear overhang) drive axleF/axleR directly since that's
// what actually determines hood/deck length; wheelbaseMM is only used to split
// the overhang when a spec omits FO/RO outright.
function envelopeFromSpec(spec) {
  const bt = spec.bodyType || 'sedan';
  const prof = BODY_PROFILE[bt] || BODY_PROFILE.sedan;
  const L = spec.lengthMM * MM, W = spec.widthMM * MM, H = spec.heightMM * MM;
  const hl = L / 2;
  const remMM = Math.max(spec.lengthMM - (spec.wheelbaseMM ?? spec.lengthMM * 0.62), 200);
  const frontShare = bt === 'pickup' ? 0.60 : 0.48;   // pickups carry more overhang up front (engine bay)
  const FO = (spec.frontOverhangMM ?? remMM * frontShare) * MM;
  const RO = (spec.rearOverhangMM ?? remMM * (1 - frontShare)) * MM;
  const wheelZ = ((spec.trackFMM + spec.trackRMM) / 4) * MM;   // half of the average track
  const wheelR = H * prof.wheelR;
  return {
    body: bt, L, W, wheelR,
    tireW: wheelR * (bt === 'pickup' ? 0.70 : 0.65),
    sillY: H * prof.sill, beltY: H * prof.belt, roofY: H,
    noseY: H * prof.nose, deckY: H * prof.deck,
    axleF: (hl - FO) / hl, axleR: (-hl + RO) / hl,
    wheelZ,
  };
}

// ===== STYLE ==================================================================
// Cabin/greenhouse shape + cosmetic trim per model. NOT part of CAR_SPECS (the
// specs agent's schema covers the physical envelope + front-end cues only) — this
// is the R7/R8 hand-tuned-from-reference-photos silhouette data (cowl position,
// roofline, backlight rake, rear-quarter glass) plus per-model trim finish
// (bumper/mirror color, cladding, roof rails, fender flare, wheel art). Kept
// exactly as R7/R8 tuned it; only the geometric envelope moved to CAR_SPECS.
// R10 NOTE — the cowlF floor interaction: dims()'s proportion-bar guard forces
// cowlF up to (axleF - daCap) when the STYLE value sits below that floor. For
// this fleet's real overhangs, axleF itself floors to 0.64 for every sedan AND
// every current SUV (their real front-overhang fractions all sit just under
// that guard), so the *effective* floor is a FIXED 0.42 for sedans (daCap .22)
// and 0.36 for SUVs (daCap .28) regardless of each model's own numbers. A
// STYLE cowlF below that floor is silently pulled up to it — so cowlF values
// below the floor (accord/camry/corolla/prius here) end up IDENTICAL at
// runtime; only values placed ABOVE the floor (corolla/model3 below) actually
// shorten that model's hood relative to the rest. Hood-length differentiation
// beyond the guard's cap has to come from elsewhere, so the roofline/backlight
// fields below (wsTopF/roofRearF/bbF — the actual greenhouse rake + length)
// carry most of the per-model silhouette distinction in this pass.
const STYLE = {
  // glTF-only additions (the scene renders their real glTF model; these STYLE
  // entries just keep buildSpecFor/the parametric FALLBACK from throwing — the
  // parametric body is never shown while the lite .glb loads).
  jeep:    { beltFrac: 0.66, cowlF: 0.40, wsTopF: 0.24, roofRearF: -0.85, bbF: -0.92, greenhouse: 0.90, quarter: true,
    parts: { bumper: 'body', mirror: 'body', cladding: true, flare: 0.06, rim: { style: '5spoke', color: 0x6b7075 } } },
  porsche: { beltFrac: 0.70, cowlF: 0.46, wsTopF: 0.0, roofRearF: -0.55, bbF: -0.80, greenhouse: 0.88, quarter: true,
    parts: { bumper: 'body', mirror: 'body', rim: { style: '5spoke', color: 0xb7bcc1 } } },
  // SUVs (suv daCap .28 -> effective cowlF floor .36; all three sit above it,
  // so cowlF differences below DO take effect). Spread built to a consistent
  // "how upright vs how sloped is the tailgate glass" story from most boxy to
  // most sloped: bronco (.06 gap) < forester (.14) < crv (.22).
  forester: { cowlF: 0.44, wsTopF: 0.16, roofRearF: -0.74, bbF: -0.90, greenhouse: 0.90, quarter: true,
    beltFrac: 0.68,   // R17: SK beltline — glass ~40% of body (glass ≈ 0.77× the lower-body band); 0.53 was way too much
    greenhouseLoft: true,   // R17: lofted parametric glass canopy instead of the extruded prism
    // Subaru SK: boxy-but-rounded wagon-like SUV, roof runs long+flat then a
    // moderately raked liftgate — between Bronco Sport's very upright tail and
    // the CR-V's more sloped one (drawingdatabase/vector-templates SK profile).
    // roofRearF/bbF pushed near the tail so the backlight reaches the rear and
    // addFlushRear closes it into a real upright liftgate (no open cargo notch).
    // R13: cladding true — the SK is a rugged crossover with black-plastic
    // wheel-arch + rocker cladding and silver front/rear skid garnish (that's
    // what addCladding builds); emblem 'subaru' puts the Pleiades mark on the
    // grille + liftgate. flare bumped .06->.08 so the clad arches read.
    parts: { bumper: 'body', mirror: 'body', roofRail: true, cladding: true, emblem: 'subaru',
      headBuilder: 'forester-sk', bodyBuilder: 'forester-sk', sk: true, flare: 0.04, rim: { style: '5split', color: 0x9aa0a6 } } },
  bronco: { beltFrac: 0.67, cowlF: 0.40, wsTopF: 0.22, roofRearF: -0.82, bbF: -0.90, greenhouse: 0.92, quarter: true,
    // Bronco Sport: "boxy, upright, unapologetically rugged" (per Ford/press
    // coverage) — the most upright windshield (smallest cowl->ws gap) and the
    // squarest, most VERTICAL tailgate: the roof runs long+flat to -0.82 then the
    // rear glass drops near-vertically (bbF -0.90, only .08 of rake) to the tail,
    // where addFlushRear builds the flush roof-hinged liftgate + rear bumper. This
    // replaces the old protruding stub with a proper tall squared-off SUV rear.
    parts: { bumper: 'dark', mirror: 'dark', cladding: true, roofRail: true, flare: 0.13, headBuilder: 'bronco-sport', bodyBuilder: 'bronco', greenhouseLoft: true, canopyN: 4.5, rim: { style: '5spoke', color: 0x868b90 } } },
  crv: { beltFrac: 0.67, cowlF: 0.38, wsTopF: 0.12, roofRearF: -0.60, bbF: -0.86, greenhouse: 0.90, quarter: true,
    // 5th-gen CR-V: the smoothest/most coupe-like liftgate of the three — roof
    // ends earlier (rrX -0.60) into a longer, more sloped tailgate glass run down
    // to near the tail, vs Forester/Bronco's boxier, near-vertical tails.
    parts: { bumper: 'body', mirror: 'body', roofRail: true, flare: 0.05, headBuilder: 'crv', bodyBuilder: 'crv', greenhouseLoft: true, canopyN: 3.8, rim: { style: 'multi', color: 0xb2b7bc } } },
  // Sedans (sedan daCap .22 -> effective cowlF floor .42; accord/camry sit at
  // or below it so both land on the SAME hood length — differentiated instead
  // by windshield rake + roof/backlight length below, per the R10 note above).
  accord: { beltFrac: 0.7, cowlF: 0.36, wsTopF: 0.08, roofRearF: -0.50, bbF: -0.70, greenhouse: 0.86, quarter: true,
    // 9th-gen Accord's sportier "one-motion" roofline: the most raked
    // windshield of the sedans (cowl->ws gap .34) and the longest, most
    // continuously-sloped roof/backlight run into the trunk of the three.
    parts: { bumper: 'body', mirror: 'body', headBuilder: 'accord', bodyBuilder: 'accord', greenhouseLoft: true, canopyN: 3.2, rim: { style: 'multi', color: 0x4a4e52 } } },   // machined dark alloy
  camry: { beltFrac: 0.7, cowlF: 0.42, wsTopF: 0.16, roofRearF: -0.40, bbF: -0.60, greenhouse: 0.86, quarter: true,
    // 2015 XV50 (pre-2018 redesign): a deliberately more formal, upright
    // greenhouse than the Accord — flatter/shorter roof, less-raked windshield,
    // a shorter three-box trunk deck (chrome-garnish "formal sedan" read).
    parts: { bumper: 'body', mirror: 'body', headBuilder: 'camry', bodyBuilder: 'camry', greenhouseLoft: true, canopyN: 3.5, rim: { style: '5split', color: 0xb7bcc1 } } },
  corolla: { beltFrac: 0.7, cowlF: 0.44, wsTopF: 0.18, roofRearF: -0.36, bbF: -0.56, greenhouse: 0.85, quarter: true,
    // E170 compact: shortest, most upright greenhouse of the sedans (cowlF
    // .44 clears the .42 floor so its hood genuinely reads shorter/cab-forward
    // vs Accord/Camry). quarter:true — Toyota's own '14 Corolla design notes
    // call out a distinctive rear quarter-window kick-up + C-pillar crease.
    parts: { bumper: 'body', mirror: 'body', headBuilder: 'corolla', bodyBuilder: 'corolla', greenhouseLoft: true, canopyN: 3.2, rim: { style: '5spoke', color: 0xaab0b6 } } },
  prius: { beltFrac: 0.66, cowlF: 0.40, wsTopF: 0.10, roofRearF: -0.34, bbF: -0.80, greenhouse: 0.86, quarter: true,
    // XW50 liftback: Toyota's own copy describes a curved roofline into a
    // sloped, two-tier rear window (Cd 0.24 kammback) — backlightKink adds
    // the spoiler-lip break between the shallow upper glass and the steeper
    // lower panel that a plain single-line backlight can't express.
    backlightKink: 0.50,
    parts: { bumper: 'body', mirror: 'body', headBuilder: 'prius', bodyBuilder: 'prius', greenhouseLoft: true, canopyN: 2.7, rim: { style: 'aero', color: 0xc0c4c8 } } },
  odyssey: { beltFrac: 0.65, cowlF: 0.44, wsTopF: 0.18, roofRearF: -0.84, bbF: -0.94, greenhouse: 0.92, quarter: true,
    // RC1: long, low, nearly full-length roof (minivan one-box read) with the
    // "floating roof" D-pillar black-out Honda's own RC1 press kit calls out
    // (blackoutPillar) instead of a body-color quarter pillar.
    parts: { bumper: 'body', mirror: 'body', headBuilder: 'odyssey', bodyBuilder: 'odyssey', greenhouseLoft: true, canopyN: 4.2, rim: { style: 'multi', color: 0xb0b5ba }, blackoutPillar: true } },
  f150: { beltFrac: 0.715, cowlF: 0.32, wsTopF: 0.12, roofRearF: -0.26, bbF: -0.34, greenhouse: 0.88, quarter: false,
    // SuperCrew: short, tall, upright crew-cab greenhouse (near-vertical rear
    // glass, gap .08) — real crew cabs don't rake the back glass much.
    parts: { bumper: 'chrome', mirror: 'dark', flare: 0.10, headBuilder: 'f150', bodyBuilder: 'f150', rim: { style: '6spoke', color: 0x8f9499 } } },
  model3: { beltFrac: 0.72, cowlF: 0.46, wsTopF: -0.02, roofRearF: -0.30, bbF: -0.78, greenhouse: 0.90, quarter: true, deckLift: 0.82,
    // Tesla Model 3 — rebuilt to read as the "softly sculpted fastback" it is, not
    // a generic notchback: shortest hood of the fleet (cowlF .46 clears the .42
    // floor) + the STEEPEST windshield (cowl->ws gap .48, top swept just PAST the
    // roof centre) flowing into a SHORT flat roof (rr -0.30) and then ONE long,
    // gentle backlight arc (bb -0.78) onto a short HIGH decklid (deckLift .82 lifts
    // the deck almost to the beltline) + spoiler lip. Combined with the panoramic
    // glass roof + blacked-out pillars + chrome-delete trim (car_specs.js
    // glassRoof/trimDark), the whole greenhouse reads as one continuous glass canopy
    // — the clean, low, one-arc EV silhouette, clearly distinct from Camry/Accord/
    // Corolla's upright body-color notchback cabins.
    parts: { bumper: 'body', mirror: 'body', headBuilder: 'model3', bodyBuilder: 'model3', greenhouseLoft: true, canopyN: 2.8, rim: { style: 'turbine', color: 0x585c60 } } },
};
// Generic low-poly pack cars (split from Comrade1280's CC-BY "Generic passenger car
// pack" by scripts/split-pack.mjs). glTF-only: the real lite .glb renders; STYLE reuses
// a valid minimal entry so the never-shown parametric fallback can't throw, and
// FALLBACK_SPECS carries real-ish dims so relative sizing (modelLen) is right.
// [L, W, H mm, human label]. Injected before MODEL_UNION_KEYS so they join the fleet.
const PACK_DIMS = {
  pack_compact:[3800,1740,1500,'Compact'],  pack_coupe:[4400,1810,1370,'Coupe'],
  pack_hatchback:[4000,1770,1490,'Hatchback'], pack_minivan:[4900,1900,1760,'Minivan'],
  pack_offroad:[4200,1880,1820,'Off-roader'], pack_pickup:[5400,1960,1880,'Pickup'],
  pack_sedan:[4700,1820,1450,'Sedan'],      pack_sport:[4300,1850,1300,'Sports car'],
  pack_suv:[4600,1850,1700,'SUV'],          pack_wagon:[4700,1800,1490,'Wagon'],
};
for (const [k, [L, W, H, label]] of Object.entries(PACK_DIMS)) {
  const bt = /pickup/.test(k) ? 'pickup' : /suv|offroad/.test(k) ? 'suv'
           : /minivan/.test(k) ? 'minivan' : /hatchback/.test(k) ? 'hatchback' : 'sedan';
  FALLBACK_SPECS[k] = { bodyType: bt, lengthMM: L, widthMM: W, heightMM: H, wheelbaseMM: Math.round(L * 0.6),
    trackFMM: Math.round(W * 0.85), trackRMM: Math.round(W * 0.85),
    frontOverhangMM: Math.round(L * 0.18), rearOverhangMM: Math.round(L * 0.2),
    headlight: 'rect', grille: 'mesh', notes: 'generic ' + label + ' (low-poly pack)' };
  STYLE[k] = STYLE.jeep;                                   // valid minimal style (fallback only)
  CAR_LIBRARY[k] = { id: k, name: 'Generic ' + label, model: 'Generic ' + label, year: null };
}
const MODEL_UNION_KEYS = Object.keys(STYLE);
const DEFAULT_KEY = 'camry';

// key -> the full spec object dims()/assembleCar() expect: the physical
// envelope from CAR_SPECS (via envelopeFromSpec) merged with this model's STYLE
// entry, with the front-end cues (spec.headlight/spec.grille) feeding
// parts.headStyle/parts.grille directly (see addHeadlights/addGrilleAndBumpers).
function buildSpecFor(key) {
  const raw = specLookup(key) || FALLBACK_SPECS[DEFAULT_KEY];
  const env = envelopeFromSpec(raw);
  const style = STYLE[key] || STYLE[DEFAULT_KEY];
  const sp = style.parts || {};
  const bt = env.body;
  // R11 feature-param defaults per body type — car_specs.js overrides any of them.
  const wrapDefault = bt === 'suv' || bt === 'wagon' || bt === 'minivan' || bt === 'hatchback';
  return {
    body: env.body, L: env.L, W: env.W,
    wheelR: env.wheelR, tireW: env.tireW,
    // deckLift (STYLE, 0..1) raises the rear-deck height toward the beltline for a
    // short/high decklid (Model 3's near-fastback tail); 0/absent = stock deck.
    sillY: env.sillY, beltY: style.beltFrac ? env.roofY * style.beltFrac : env.beltY, roofY: env.roofY, noseY: env.noseY,
    deckY: env.deckY + (env.beltY - env.deckY) * (style.deckLift || 0),
    cowlF: style.cowlF, wsTopF: style.wsTopF, roofRearF: style.roofRearF, bbF: style.bbF,
    axleF: env.axleF, axleR: env.axleR, wheelZ: env.wheelZ,
    greenhouse: style.greenhouse, quarter: !!style.quarter,
    backlightKink: style.backlightKink || 0,
    // R11 feature params: prefer car_specs.js value, else a body-type default.
    roofCrown: raw.roofCrown ?? (bt === 'pickup' ? 0.045 : bt === 'suv' || bt === 'minivan' ? 0.06 : 0.05),
    roofArch: raw.roofArch ?? (bt === 'pickup' ? 0.02 : 0.03),
    quarterGap: raw.quarterGap ?? 0.13,
    bumperDepth: raw.bumperDepth ?? (bt === 'pickup' ? 0.30 : 0.26),   // R13: de-bulb SUV bumpers
    trunk: env.body === 'sedan' ? 'notch' : 'flush',
    parts: {
      grille: raw.grille || 'mesh',
      bumper: sp.bumper || 'body',
      mirror: sp.mirror || 'body',
      cladding: !!sp.cladding,
      roofRail: !!sp.roofRail,
      headStyle: raw.headlight || 'swept-wrap',
      flare: sp.flare || 0,
      rim: sp.rim || { style: '5spoke', color: 0xb7bcc1 },
      blackoutPillar: !!sp.blackoutPillar,
      fog: raw.fogLights ?? (bt === 'suv' || bt === 'pickup' || bt === 'minivan'),
      taillightWrap: raw.taillightWrap ?? wrapDefault,
      glassRoof: !!raw.glassRoof,   // R12: dark panoramic glass roof + blacked-out pillars
      trimDark: !!raw.trimDark,     // R12: chrome-delete belt trim + door handles
      emblem: sp.emblem || null,    // R13: brand mark on grille + tailgate (STYLE opt-in)
      headBuilder: sp.headBuilder || null,   // R14: bespoke per-model headlamp (STYLE opt-in)
      sk: !!sp.sk,                           // R15: full Forester SK bespoke part suite (STYLE opt-in)
      bodyBuilder: sp.bodyBuilder || null,   // R17: bespoke lofted body (STYLE opt-in)
      greenhouseLoft: !!sp.greenhouseLoft,   // R17: lofted glass canopy (STYLE opt-in)
      canopyN: sp.canopyN ?? null,           // R17: greenhouse canopy boxiness (STYLE opt-in)
    },
  };
}
function keyOrDefault(key) { return MODEL_UNION_KEYS.includes(key) ? key : DEFAULT_KEY; }

// kept exported (was a plain literal pre-R9) for any external consumer that
// looks up a model's full builder spec by key — now computed from CAR_SPECS.
export const MODELS = Object.fromEntries(MODEL_UNION_KEYS.map(k => [k, buildSpecFor(k)]));

export const MODEL_KEYS = () => MODEL_UNION_KEYS;
export function buildModel(key) { return assembleCar(buildSpecFor(keyOrDefault(key))); }
export function modelLen(key) { return buildSpecFor(keyOrDefault(key)).L; }
export function modelWidth(key) { return buildSpecFor(keyOrDefault(key)).W; }   // spec body width (scene units, no mirrors)
