// twin3d/vehicles.js — fleet placement, cloning/tinting, and parked-bay sync
// with F/N labels. Car GEOMETRY now lives in car_parts.js (the modular panel
// library); this file consumes it and owns packing/occupancy/labels only.
// OWNED BY car assets agent — other agents must not edit.
//
// R6 consistent-renderer pass — the R5 parts-by-committee assembler is gone.
// car_parts.js now draws every car through ONE parametric builder; ten real-model
// specs (forester, bronco, crv, accord, camry, corolla, prius, odyssey, f150,
// model3) are just numbers fed to it — recognizable, consistent, with dark-glass
// greenhouses, swept lamps, mirrors, and model-specific alloy wheels. Geometry is
// built ONCE per model at template time and clones share it — only the paint
// material is per-car — so the whole fleet stays cheap (watch polycount).
//
// This file additionally adds PROPORTIONAL AMBIENT FILLERS: decorative parked
// cars on the untracked curb whose density scales with tracked occupancy (see the
// filler block below). The 7 tracked bays remain the honest live signal.
//
// Every spawned/parked/filler car is tagged mesh.userData.car = {id, name,
// model, year, color} from car_parts.CAR_LIBRARY (see tagCar()/makeBoxCar()
// below) so a specific car can be referenced by name/model/year in feedback.
//
// Exports (unchanged signatures):
//   initCarTemplate()                        async; build the modular fleet templates
//   tintedCar(colorHex)                      sedan clone (or box fallback) — movers use this
//   CARCOLORS                                per-bay paint palette (from car_parts.PAINTS)
//   syncParked(pk, geo, parkedGroup, setLabel)  reconcile parked meshes with live bays
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/DRACOLoader.js';
import { camXZ, hash } from './shared.js';
import { mkPaint, GLASS, TIRE, PAINTS, MODEL_KEYS, buildModel, modelLen, modelWidth, CAR_LIBRARY } from './car_parts.js';

const parked = new Map();   // spot index -> mesh

// ambient FILLER cars (decorative, not live data): rebuilt when tracked
// occupancy changes so their density stays proportional to the real curb.
let fillerGroup = null;     // persistent sub-group under parkedGroup
let fillerOccKey = -1;      // last occupied-count the fillers were built for

// per-bay paint, drawn from car_parts.js PAINTS (saturated so the color reads —
// the R4 desaturated set went ghost-white under the sky). Ordered so adjacent
// bays never repeat a hue: white, silver, blue, black, red, teal, gold.
export const CARCOLORS = [PAINTS[4], PAINTS[3], PAINTS[1], PAINTS[5], PAINTS[0], PAINTS[7], PAINTS[9]];

// ---- fleet from the modular panel library (car_parts.js) --------------------
// A car is assembled from named body panels (Hood, Trunk, Fender, Bumper, Roof,
// Door, Grille, Mirrors, RockerPanel, QuarterPanel) — see car_parts.js. Ten
// distinct models live in MODELS; geometry is built ONCE per model (buildModel)
// and clones share it — only the paint material is per-car (retinted on clone),
// so the whole fleet stays cheap (watch polycount). FLEET keeps the {key, len}
// shape the packer (bayLenFor) reads; `len` is the model's overall length.
const FLEET = MODEL_KEYS().map(key => ({ key, len: modelLen(key) }));
const templates = new Map();  // key -> Group (built once; clones share geometry)

// ---- real glTF HERO models (Phase 1) ----------------------------------------
// The tracked bays + movers render the decimated real car models (models_lite/,
// Draco-compressed, built by scripts/build-lite.sh). Ambient FILLER cars stay on
// the cheap parametric templates above. glTF paint is BAKED into the textures, so
// hero cars keep the model's real color — variety comes from the MODEL MIX across
// bays, not from per-instance retinting (the "model-mix variety" decision).
const _gltfLoader = new GLTFLoader();
const _draco = new DRACOLoader();
_draco.setDecoderPath('/vendor/draco/');            // decoder vendored in sidewalk-watch
_gltfLoader.setDRACOLoader(_draco);
const gltfTemplates = new Map();   // key -> oriented outer Group (its rotation.y is left
                                   // free for syncParked/filler placement to set per-side)

// Per-model extra yaw (radians) applied so every model ends up nose->+X, matching
// the parametric "nose->+X" convention the placement code assumes. The loader
// already auto-rotates a model whose length runs along Z; these entries are the
// front/back (and fine) corrections tuned against the live scene. Default 0.
// Some glbs bake their nose toward -X (opposite the +X convention the rest land on
// after bestYaw's 180°-ambiguous straighten). Those parked/drove backwards. Every
// entry below was verified model-by-model in the live render (each cloned at
// rotation 0 and rotated nose->camera; f150's named front/rear nodes anchored the
// calibration). All OTHER fleet models — detailed bays and pack_* fillers alike —
// read nose->+X already and need no entry.
const HERO_YAW = {
  // Verified empirically (force each template to rot 0, compare nose to the +X convention
  // that odyssey/jeep/etc already satisfy): prius + the two pack fillers face -X and need
  // the flip; camry's glb already faces +X, so an earlier camry:π entry was over-rotating
  // it (F4 read backwards vs its far-row neighbours) and is removed.
  prius: Math.PI,          // N1 (near bay) pointed left on the curb; reversed glb
  pack_offroad: Math.PI,   // ambient filler: 4x4 tailgate/spare led instead of the grille
  pack_wagon: Math.PI,     // ambient filler (the "light blue wagon"): drove/parked tail-first
  model3: Math.PI,         // F1 parked nose-RIGHT while F2/F3/F4 all faced left; glb bakes nose->-X
};

// Models the user asked to DEPRIORITIZE — they read "super fake" (heavy black panel lines /
// over-shiny paint): the orange Accord and the blue F-150 Raptor. Kept out of the random
// mover pool and remapped out of the tracked bays so they don't recur prominently. Not
// deleted — still valid parametric/fallback keys, just never the featured pick.
const DEPRIORITIZED = new Set(['accord', 'f150']);
// The porsche is a "hero" car the user only wants on the NEAR curb (N1-N3), never stranded in
// the far corner (F1) or out in traffic. BAY_FORCE pins it to a specific bay; NON_FEATURED
// keeps it (plus the deprioritized pair) out of every RANDOM pick — movers and non-forced bays.
const BAY_FORCE = { 0: 'porsche' };                              // spot index 0 = N1 (near, prominent)
const NON_FEATURED = new Set([...DEPRIORITIZED, 'porsche']);     // never a random mover / non-forced bay
// mover models allowed in random traffic (excludes the non-featured hero/fake cars)
const moverKeys = () => detailedKeys().filter(k => !NON_FEATURED.has(k));

// Turn a loaded glTF into a placement-ready template: length along X (scene
// units == modelLen), width along Z, wheels at y=0, centered at the origin, with
// the orientation baked onto a CHILD so the outer group's rotation.y stays free.
// Yaw (three's rotation.y) that best aligns a car's LENGTH to +X and its WIDTH to Z,
// for any source orientation. Brute-forces the narrowest-footprint angle over a
// sampled XZ point cloud (robust where PCA's ±90° ambiguity failed — the split pack
// cars sit at arbitrary grid rotations that leave a plain bbox test near-square).
function bestYaw(root) {
  root.updateWorldMatrix(true, true);
  const v = new THREE.Vector3(); const xs = [], zs = [];
  root.traverse(o => {
    const p = o.isMesh && o.geometry && o.geometry.attributes.position;
    if (!p) return;
    const step = Math.max(1, Math.floor(p.count / 1500));
    for (let i = 0; i < p.count; i += step) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); xs.push(v.x); zs.push(v.z); }
  });
  if (xs.length < 3) return 0;
  let best = 0, bestScore = -Infinity;
  for (let k = 0; k < 90; k++) {                 // every 2° over 180°
    const th = k * Math.PI / 90, c = Math.cos(th), s = Math.sin(th);
    let xmin = 1e9, xmax = -1e9, zmin = 1e9, zmax = -1e9;
    for (let i = 0; i < xs.length; i++) {        // three's Y-rotation maps (x,z)->(xc+zs, -xs+zc)
      const xr = xs[i] * c + zs[i] * s, zr = -xs[i] * s + zs[i] * c;
      if (xr < xmin) xmin = xr; if (xr > xmax) xmax = xr; if (zr < zmin) zmin = zr; if (zr > zmax) zmax = zr;
    }
    const score = (xmax - xmin) - (zmax - zmin); // length on X, narrow on Z
    if (score > bestScore) { bestScore = score; best = th; }
  }
  return best;
}

// Some Sketchfab exports ship a flat "display base" quad under the car — the pedestal the
// model was presented on. porsche.glb has one (node Object_140: 4 verts, zero height,
// 7.04 x 3.60 in scene units — LARGER in both axes than the car body's 5.37 x 2.50). It is
// a real, visible mesh, so it silently broke three things at once:
//   - step 3 below scales the model so its BOUNDING BOX matches modelLen(key); the base
//     being ~31% longer than the car meant the car itself rendered ~24% undersized
//     (the "porsche looks tiny" report — and the reason the width allowance below was
//     nudged 1.14 -> 1.28, which was compensating for this rather than fixing it),
//   - the blanket `castShadow = true` traverse below hit it too, and a horizontal quad
//     floating at mid-car height casts a big hard-edged RECTANGLE that doesn't match the
//     car's silhouette,
//   - it inflated bodyHalfWidth(), so syncParked seated the car ~0.7 further off the curb
//     than its neighbours.
// Strip any zero-thickness quad whose footprint rivals the whole model. The size gate is
// what keeps this safe: a display base spans the model, while flat body decals (plates,
// stickers, badges) are a fraction of it, so they're never touched. Runs FIRST — bestYaw
// samples every mesh's point cloud, so leaving the base in also skewed the yaw search.
function stripDisplayBase(root, key) {
  root.updateWorldMatrix(true, true);
  const rb = new THREE.Box3().setFromObject(root, true);
  const span = Math.max(rb.max.x - rb.min.x, rb.max.z - rb.min.z);
  const kill = [];
  root.traverse(o => {
    const pos = o.isMesh && o.geometry && o.geometry.attributes.position;
    if (!pos || pos.count > 8) return;                       // a base is a quad, not a panel
    const b = new THREE.Box3().setFromObject(o, true);
    const d = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z];
    if (Math.min(...d) > 1e-3) return;                       // has thickness -> real geometry
    if (Math.max(d[0], d[2]) < span * 0.6) return;           // decal-sized -> keep
    kill.push(o);
  });
  kill.forEach(o => o.parent && o.parent.remove(o));
  if (kill.length) { try { console.info(`stripped display base from ${key}`); } catch (_) {} }
}

function buildGltfTemplate(gltf, key) {
  const car = gltf.scene;
  // EVERY Box3 below passes precise=true. Box3.setFromObject's DEFAULT (fast) path takes each
  // geometry's LOCAL axis-aligned box and transforms its 8 corners — which over-reports badly
  // for any glb whose child nodes carry rotations, because an AABB around a rotated AABB is
  // strictly larger than the real geometry. Several of these models do (Sketchfab exports keep
  // per-part node rotations), and the inflated numbers fed every step here:
  //   - step 3 divides by size.x, so an inflated length scaled the car DOWN (porsche),
  //   - step 4 subtracts box.min.y, and an inflated min.y sits BELOW the real wheels, so the
  //     car got lifted by the error and FLOATED — porsche hovered 1.55 and F1's model 2.90
  //     above the road, which from the high camera reads as "parked in the wrong space"
  //     (the car projects further up the frame, looking set back into the street),
  //   - the width correction below and bodyHalfWidth() both over-measured, over-narrowing the
  //     body and seating it off the curb.
  // precise=true walks the actual vertices instead. It costs a full vertex pass, but this runs
  // once per model at load, not per frame.
  // 0) drop any display-base pedestal before ANY measurement is taken off this model
  stripDisplayBase(car, key);
  // 1) straighten the car so length runs along +X (down the street), for any source yaw
  car.rotation.y = bestYaw(car); car.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(car, true);
  let size = box.getSize(new THREE.Vector3());
  // 2) per-model front/back correction (nose -> +X)
  if (HERO_YAW[key]) { car.rotation.y += HERO_YAW[key]; car.updateMatrixWorld(true); }
  // 3) scale so the X-length matches the packer's modelLen(key) (scene units, NOT metres)
  box = new THREE.Box3().setFromObject(car, true); size = box.getSize(new THREE.Vector3());
  car.scale.multiplyScalar(modelLen(key) / (size.x || 1)); car.updateMatrixWorld(true);
  // 4) center in X/Z, drop wheels to the ground plane (y=0)
  box = new THREE.Box3().setFromObject(car, true);
  const c = box.getCenter(new THREE.Vector3());
  car.position.x -= c.x; car.position.z -= c.z; car.position.y -= box.min.y;
  // Tame the "blinding / over-chromed paint" look: many Sketchfab car paints ship
  // near-metal with low roughness, so under the bright HDRI they mirror the sky and
  // blow out. We can't recolor (paint is a baked texture, not a factor) but we CAN
  // calm the finish — drop reflection strength, cap metalness, add a matte floor —
  // which keeps the real color while making it read like car paint, not a mirror.
  // Glass (transmission/transparent) is left clear. Materials are shared across
  // clones, so tuning the template retints the whole fleet of that model at once.
  car.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (!m || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) continue;
      m.envMapIntensity = 0.3;                                    // tame HDRI-sky reflection (was 0.6 — white cars blew out at midday)
      const glassy = m.transmission > 0 || m.transparent === true || (m.opacity !== undefined && m.opacity < 1);
      if (glassy) continue;                                       // keep windows clear
      if (m.metalness > 0.35) m.metalness = 0.35;                 // de-chrome the paint harder (was 0.6)
      if (m.roughness < 0.55) m.roughness = 0.55;                 // higher matte floor (was 0.32) spreads the specular so bright paint doesn't glare
      m.needsUpdate = true;
    }
  });
  const outer = new THREE.Group();   // placement sets outer.rotation.y; car keeps its orientation
  outer.add(car);
  // WIDTH CORRECTION (on the OUTER group, which is unrotated here — the inner car may be yawed
  // 90° by bestYaw, so scaling IT would hit the wrong axis). Some glbs (porsche's fat arches,
  // accord, f150…) render far wider than the real car, bloating their footprint + cast shadow
  // and making them overhang the curb. Narrow world-Z to the model's SPEC width + a mirror
  // allowance — only ever NARROWING an over-wide glb, never widening a correct one. Placement
  // only ever yaws the outer group by 0 or π, under which world-Z stays the car's width.
  const wbox = new THREE.Box3().setFromObject(outer, true);
  const wNow = wbox.max.z - wbox.min.z, wTarget = modelWidth(key) * 1.28;   // spec width + generous mirror/arch allowance (1.28, softened from 1.14 — 1.14 left the porsche looking tiny)
  if (wTarget > 0 && wNow > wTarget * 1.06) outer.scale.z = wTarget / wNow;
  return outer;
}

function loadGltfTemplate(key) {
  return new Promise(resolve => {
    _gltfLoader.load(`/twin3d/models_lite/${key}.glb`,
      gltf => { try { gltfTemplates.set(key, buildGltfTemplate(gltf, key)); }
                catch (e) { try { console.warn(`gltf template ${key} failed`, e); } catch (_) {} }
                resolve(); },
      undefined,
      err => { try { console.warn(`gltf load ${key} failed`, err); } catch (_) {} resolve(); });
  });
}

// defensive fallback if a procedural build throws — a simple rounded three-box
// sedan so a bay is never empty when it should be occupied. `key` (optional) is
// the CAR_LIBRARY id this box car was STANDING IN for (the real build failed),
// so the tag still traces to the intended model where known.
function makeBoxCar(color, key) {
  const g = new THREE.Group();
  const paint = mkPaint(color);
  const L = 7.0, W = 2.0;
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, 0.7, W), paint);
  body.position.y = 0.85; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(L * 0.5, 0.6, W * 0.86), paint);
  cabin.position.set(-0.4, 1.5, 0); cabin.castShadow = true; g.add(cabin);
  const glassB = new THREE.Mesh(new THREE.BoxGeometry(L * 0.46, 0.4, W * 0.88), GLASS);
  glassB.position.set(-0.4, 1.55, 0); g.add(glassB);
  const wg = new THREE.CylinderGeometry(0.62, 0.62, 0.34, 20);
  for (const sx of [2.0, -2.0]) for (const sz of [-0.95, 0.95]) {
    const w = new THREE.Mesh(wg, TIRE); w.rotation.x = Math.PI / 2;
    w.position.set(sx, 0.62, sz); w.castShadow = true; g.add(w);
  }
  return tagCar(g, key, color);
}

// ---- CAR LIBRARY tagging (traceability) -------------------------------------
// generic entry used when a body has no known CAR_LIBRARY id (the fleet build
// failed entirely, or a bay drew a box car with no assigned type at all).
const UNKNOWN_CAR = { id: 'unknown', name: 'Unidentified sedan (fallback box car)', model: null, year: null };
// stamp every spawned/parked car with its library entry + the paint actually
// used (paint is randomized per instance — CARCOLORS/FILLER_PALETTE — so it
// isn't part of CAR_LIBRARY itself) so any car in the scene is traceable back
// to a human name/model/year for future feedback (e.g. "the '15 Camry, N2").
function tagCar(mesh, key, colorHex) {
  const entry = (key && CAR_LIBRARY[key]) || UNKNOWN_CAR;
  mesh.userData.car = { ...entry, color: colorHex };
  return mesh;
}

export async function initCarTemplate() {
  for (const { key } of FLEET) {
    try { templates.set(key, buildModel(key)); }
    catch (e) { try { console.warn(`car build ${key} failed`, e); } catch (_) {} }
  }
  if (!templates.size) console.warn('modular car fleet failed, using box cars');
  // load the real glTF hero models in parallel (bays + movers use these; a failed
  // load just falls back to the parametric template for that key in cloneBody)
  await Promise.all(FLEET.map(({ key }) => loadGltfTemplate(key)));
}

// clone a template (shared geometry) and give it a fresh per-car body paint
// (car_parts.mkPaint — MeshStandardMaterial, low env so real colors read); the
// non-paint materials (glass/chrome/tire/trim) stay shared across the fleet.
// EVERY car — tracked bays, movers, AND ambient fillers — uses the real glTF model
// now (the parametric builder cheapened the fillers). glTF paint is baked, so no
// retint: the car wears the model's real color and variety comes from the MODEL MIX
// across the fleet. The parametric template is a fallback only if a model failed to
// load; the box car is the last resort. colorHex is used only by those fallbacks
// (paint) and the traceability tag.
function cloneBody(key, colorHex) {
  const gt = gltfTemplates.get(key);
  if (gt) return tagCar(gt.clone(true), key, 'baked (glTF)');     // shared geo+materials
  const t = templates.get(key);
  if (!t) return makeBoxCar(colorHex, key);
  const c = t.clone(true);
  const paintMat = mkPaint(colorHex);
  c.traverse(o => { if (o.isMesh && o.userData.paint) o.material = paintMat; });
  return tagCar(c, key, colorHex);
}

// movers (actors.js) call this per car. Pick a RANDOM model from the detailed hero
// fleet so traffic is varied instead of a stream of identical Camrys (user). glTF paint
// is baked, so colorHex only matters for the parametric/box fallback. `seed` (the track
// id) makes the pick deterministic per car but different across cars.
export function tintedCar(colorHex, seed = 0, forceKey = null) {
  const keys = moverKeys();   // varied traffic; excludes fake (accord/f150) + hero (porsche) cars
  const key = (forceKey && keys.includes(forceKey)) ? forceKey
            : (keys.length ? keys[Math.floor(hash(seed * 2.7 + 1.3) * keys.length)] : 'camry');
  return cloneBody(key, colorHex);
}
// the pool actors.js draws mover models from (so it can avoid two-in-a-row in a lane)
export function moverModelKeys() { return moverKeys(); }

function bayCentroid(sp) {
  const xs = sp.poly.map(p => p[0]), ys = sp.poly.map(p => p[1]);
  return camXZ(xs.reduce((a, b) => a + b) / xs.length, ys.reduce((a, b) => a + b) / ys.length);
}

// ---- contiguous cluster packing (user ground truth): the tracked bays are
// nose-to-tail blocks in reality — N1-N3 one block in front of the window,
// F2-F4 one block separated from F1 by the far driveway. Raw camXZ centroids
// smear the perspective (N1 -37 .. N3 +41), creating fake gaps that the ambient
// pass then wrongly fills. So: centroids only anchor each CLUSTER's center;
// cars pack bumper-to-bumper inside it. An empty tracked bay keeps its slot
// vacant — the honest live signal in an otherwise packed row.
//
// Keep-clear curb spans mirror ground.js's segmented curbs (apron mouths +
// red-paint flanks). NEAR now has TWO driveways flanking the 3 parking bays (SV
// 1400–1414): LEFT cut x -26..-6 (1414's, mouth -20..-12 + red flanks), RIGHT cut
// x 23..43 (1400-side, mouth 29..37 + red flanks). FAR x -32..-6 (east cut).
// If ground.js re-bands these, update here (values verified this pass).
// far: THREE per-property driveway mouths + red flanks (cream -34..-25, cottage
// 11..30, garage 49.5..58.5) — RESTORED (R9): a prior pass had removed the
// cottage's side-access cut here to let F2/F3/F4 span past it, but ground.js has
// re-added that driveway (the curb has enough open span LEFT of it — cream to
// cottage, roughly -19..11 — to seat all 3 bays without removing the cut). No
// parked/filler car may straddle any of the three driveways.
const KEEPCLEAR = { near: [[-26, -6], [23, 43]], far: [[-37, -19], [11, 30], [43.6, 64.5]] };  // cream left edge -40 -> -37 so F1 can pack RIGHT up to its red curb (starts x-38) instead of being clamped a car-length out
// Driveways that actually SPLIT a curbside run into two blocks (a real bay parks
// on EACH side of the cut). User ground truth: the FAR/cream driveway has F1 to
// its left and F2-F4 to its right, so it splits. The cottage's driveway cut is
// RESTORED (R9) too — it sits to the RIGHT of F2/F3/F4's real bay centroids (all
// left of x11, in the cream→cottage span), so it doesn't split the F2-F4 block;
// it just guards against anything parking right of it, where there's no tracked
// bay anyway ([F1] | [F2,F3,F4] | nothing).
// The NEAR run (N1-N3) sits as ONE block BETWEEN the two 1400–1414 driveways —
// nothing parks left of the LEFT cut or right of the RIGHT cut — so neither NEAR
// cut splits it; they only BOUND the run's edges, and N1-N3 pack as one block in
// the -6..23 gap between them.
// KEEPCLEAR still guards straddling for all cuts (both near mouths + the far ones).
const SPLIT_DRIVEWAYS = { near: [], far: [[-34, -25], [17, 24], [49.5, 58.5]] };  // cottage split restored (x17..24)
const CROSSWALK = [96, 120];
const LABEL_Z = { near: -13.2, far: -27.8 };   // packed curb row (for empty-slot labels; far re-anchored to Phase A -30 curb)

const bayKeyFor = (i, keys) => {
  if (!keys.length) return null;
  if (BAY_FORCE[i] && keys.includes(BAY_FORCE[i])) return BAY_FORCE[i];   // N1 = porsche (hero, near)
  let k = keys[Math.floor(hash(i * 13.7 + 0.5) * keys.length)];
  if (NON_FEATURED.has(k)) {                  // f150/accord (fake) or a stray porsche in the far corner —
    const pool = keys.filter(x => !NON_FEATURED.has(x));    // swap for a clean model, reshuffling ONLY this bay
    if (pool.length) k = pool[Math.floor(hash(i * 7.3 + 2.1) * pool.length)];
  }
  return k;
};
const bayLenFor = (i, keys) => {
  const k = bayKeyFor(i, keys);
  return k ? FLEET.find(f => f.key === k).len : 7.6;
};

let LAYOUT = null;   // computed once: geometry is static; occupancy only toggles presence

function packLayout(spots) {
  const keys = detailedKeys();   // bays use the detailed hero models
  const slots = new Map();                    // spot index -> {x} packed car center
  const clusterSpans = { near: [], far: [] }; // ambient exclusion spans
  for (const side of ['near', 'far']) {
    const idx = [];
    spots.forEach((sp, i) => { if (sp.side === side) idx.push(i); });
    idx.sort((a, b) => bayCentroid(spots[a]).x - bayCentroid(spots[b]).x);
    // EFFECTIVE X (R10 fix — F2/F3/F4 kept refusing to sit together): the FROZEN
    // camXZ smears the far detections across the whole curb (F1≈-45, F2≈+2, F3≈+24,
    // F4≈+45), so F2/F3/F4's cluster MEAN (~+24) lands inside the cottage driveway's
    // keep-clear zone and the corridor-fit jams them into the wrong 13.6u gap right
    // of that drive. Override the FAR bay x by RANK to a sane, contiguous layout —
    // F1 isolated far-left (so the cream driveway still splits it off), F2/F3/F4
    // packed in the open cream→cottage span (-19..11), left of the cottage drive
    // which stays clear. Near side keeps its real camXZ centroids.
    const FAR_X_BY_RANK = [-40, -12, -5, 2];   // F1 -45 -> -40: pull it RIGHT so it parks flush against the cream driveway's red curb (starts x-38) instead of floating a car-length out to the left
    const EX = new Map();
    idx.forEach((i, rank) => EX.set(i,
      side === 'far' ? (FAR_X_BY_RANK[rank] ?? bayCentroid(spots[i]).x)
                     : bayCentroid(spots[i]).x));
    // Ground truth (user): the tracked bays are ONE contiguous curbside run per
    // side — N1-N3 nose-to-tail, and F1-F2-F3-F4 nose-to-tail (F1<->F2 is only a
    // curb, NOT a driveway; the big F1->F2 camXZ centroid gap is a perspective
    // artifact of F1 sitting at the foreshortened frame edge). So we never split
    // tracked bays into separate blocks — real driveways are handled as KEEPCLEAR
    // exclusion zones, not by opening a gap that ambient parking then fills.
    // split the contiguous run only at a SPLIT_DRIVEWAYS cut that sits strictly
    // between two consecutive bays — cars can't span a driveway, so each side of
    // it packs at its own centroid (fixes F1 being squished right of the far
    // driveway; F1 now packs at its true far-left bay, LEFT of the driveway). The
    // near/1414 cut is NOT a split (it only bounds the near run's left edge), so
    // N1-N3 stay one block — N1 no longer strands left of it.
    const zones = KEEPCLEAR[side];
    const clusters = [];
    let cur = [];
    for (const i of idx) {
      if (cur.length) {
        const prevX = EX.get(cur[cur.length - 1]);
        const cx = EX.get(i);
        if (SPLIT_DRIVEWAYS[side].some(z => prevX < z[0] && cx > z[1])) {
          clusters.push(cur); cur = [];
        }
      }
      cur.push(i);
    }
    if (cur.length) clusters.push(cur);
    for (const cl of clusters) {
      const lens = cl.map(i => bayLenFor(i, keys));
      const lenTotal = lens.reduce((a, b) => a + b, 0);
      const mean = cl.reduce((a, i) => a + EX.get(i), 0) / cl.length;
      const gaps = cl.map(i => 1.6 + hash(i * 4.7) * 1.6);     // realistic parallel-park gaps (user)
      // CORRIDOR FIT (fixes N1/N2 landing on top of each other): the block's
      // raw gaps can push its total length past the ACTUAL curbside run
      // between the zones flanking this cluster (e.g. near N1-N3 pack
      // between the two driveways, a 29-wide -6..23 gap). When that happened,
      // the clearance shove below had to jam the whole overflowing block
      // sideways to clear one zone, and syncParked's per-car straddle guard
      // then piled a SECOND, neighbor-unaware shove onto just the edge car —
      // which is exactly how N1 (odyssey, 8.6 long) ended up shoved into N2
      // (f150, 9.2 long): the 3-car block's nominal length (~30.5 incl.
      // gaps) didn't fit the 29-wide gap, so N1 got pushed clear of the left
      // driveway and landed overlapping N2 instead. Shrinking the gaps toward
      // a tight-but-real 0.8 floor — only enough to make the block fit the
      // corridor bounded by the nearest zone on each side of the cluster mean
      // — keeps every car in the block inside its real curbside run, so
      // neither shove below nor the per-car guard ever needs to move a car
      // into its neighbor.
      let lo = -Infinity, hi = Infinity;
      for (const z of zones) {
        if (z[1] <= mean) lo = Math.max(lo, z[1]);
        else if (z[0] >= mean) hi = Math.min(hi, z[0]);
        else {
          // the CLUSTER MEAN sits INSIDE this zone (a perspective-smeared far
          // centroid landing squarely on a driveway/red-flank span). Bound
          // whichever side is nearer instead of silently skipping the zone: an
          // ignored zone used to make lo/hi "see past" it to a farther zone as
          // the nearest bound, which is how the driveway-attach step below
          // used to weld an unrelated block onto that farther bound (see next
          // comment) instead of clearing the zone it actually straddles.
          if (mean - z[0] < z[1] - mean) hi = Math.min(hi, z[0]);
          else lo = Math.max(lo, z[1]);
        }
      }
      const MIN_GAP = 0.8, nGaps = cl.length - 1;
      if (isFinite(hi - lo) && nGaps > 0) {
        const gapSum = gaps.slice(0, nGaps).reduce((a, b) => a + b, 0);
        const room = (hi - lo) - 1.6 - lenTotal;          // keep the existing 0.8-per-side margin
        const shrinkCap = gapSum - MIN_GAP * nGaps;
        const over = gapSum - Math.max(room, MIN_GAP * nGaps);
        if (over > 0 && shrinkCap > 0) {
          const frac = Math.min(1, over / shrinkCap);
          for (let k = 0; k < nGaps; k++) gaps[k] = MIN_GAP + (gaps[k] - MIN_GAP) * (1 - frac);
        }
      }
      const total = lenTotal + gaps.slice(0, nGaps).reduce((a, b) => a + b, 0);
      let start = mean - total / 2;
      // driveway attach + clearance: clamp directly against the nearest
      // bounding zone edges (lo, hi — computed above, already zone-aware of a
      // mean that lands INSIDE a zone) instead of re-scanning every KEEPCLEAR
      // zone in array order and correcting against whichever one matched
      // first. That old scan attached to ANY zone whose midpoint sat left of
      // the block's mean, regardless of distance — for the far side's lone F2
      // bay and its F3-F4 neighbor block, both picked up the same far-off cream
      // driveway zone (the nearest actual bound was a DIFFERENT, closer zone
      // in each case) and got welded to the identical start x, rendering F2
      // directly under F3. Using lo/hi (the real nearest bounds) fixes that.
      if (isFinite(lo) && isFinite(hi) && total + 1.6 > hi - lo) {
        // CORRIDOR TOO TIGHT: even after shrinking every gap to the MIN_GAP
        // floor above, this block's cars don't collectively fit the gap
        // between the two zones flanking it (e.g. two full-size cars can't
        // both clear a 13.6-wide gap between two driveways). No placement
        // avoids overlapping a zone entirely — center the block in the
        // corridor so the unavoidable overflow spreads evenly across BOTH
        // flanking zones instead of one car eating the whole shortfall.
        start = lo + (hi - lo - total) / 2;
      } else {
        if (isFinite(lo)) start = Math.max(start, lo + 0.8);
        if (isFinite(hi)) start = Math.min(start, hi - total - 0.8);
      }
      // crosswalk is a standalone exclusion (not a KEEPCLEAR zone, so it isn't
      // part of lo/hi) — still guard a block from landing on top of it
      if (start < CROSSWALK[1] && start + total > CROSSWALK[0])
        start = (CROSSWALK[0] + CROSSWALK[1]) / 2 < mean ? CROSSWALK[1] + 0.8 : CROSSWALK[0] - total - 0.8;
      let x = start;
      cl.forEach((i, k) => {
        slots.set(i, { x: x + lens[k] / 2 });
        x += lens[k] + (k < cl.length - 1 ? gaps[k] : 0);
      });
      clusterSpans[side].push([start - 0.6, start + total + 0.6]);
    }
  }
  return { slots, clusterSpans };
}

// ---- PROPORTIONAL AMBIENT FILLERS -------------------------------------------
// The 7 tracked bays (N1-N3, F1-F4) are the honest live signal — an empty
// tracked bay always shows no car. But a real block has parked cars on the rest
// of the curb too, so the street reads as populated. R6 adds DECORATIVE fillers
// on the UNTRACKED curb sections with a count PROPORTIONAL to how full the
// tracked bays are: parkedFraction = occupiedTrackedBays / totalTrackedBays.
// A given filler slot is deterministically "parked" iff hash(slotX) < fraction,
// so raising occupancy only ADDS cars (never reshuffles the block), and the
// ambient curb visually tracks the real one. Fillers never sit on a red zone,
// driveway mouth, the crosswalk, or a tracked cluster — those are exclusion
// spans subtracted from the parkable curb. They reuse the same real models
// (shared geometry) and hug the curb exactly like the tracked cars.
//
// visible frame is camXZ x in [-55,55]; keep fillers just inside that so they
// aren't clipped in half. Curb no-park zones mirror KEEPCLEAR (driveway mouths +
// red flanks). CROSSWALK is off-frame right but excluded for correctness.
const FILL_X = [-54, 54];
// parallel-park spacing buffer: fillers must keep a real gap from any tracked
// car or driveway mouth, never tuck right up against one. Applied to every
// cluster span and to the inter-cluster envelope (see buildFillers).
const FILLER_BUF = 2.4;
// realistic curb mix: heavily white/silver/gray/black with a few colors (PAINTS:
// 0 white,1 silver,2 gray,3 black,4 navy,5 olive,6 red,7 charcoal,8 champagne,9 burgundy)
const FILLER_PALETTE = [PAINTS[0], PAINTS[1], PAINTS[1], PAINTS[2], PAINTS[3],
  PAINTS[7], PAINTS[0], PAINTS[4], PAINTS[5], PAINTS[9], PAINTS[6], PAINTS[8]];

// subtract exclusion zones from a base [lo,hi] -> array of free [lo,hi] gaps.
function subtractSpans(base, zones) {
  let free = [base.slice()];
  for (const z of zones) {
    const next = [];
    for (const [lo, hi] of free) {
      if (z[1] <= lo || z[0] >= hi) { next.push([lo, hi]); continue; }  // no overlap
      if (z[0] > lo) next.push([lo, z[0]]);                            // left remnant
      if (z[1] < hi) next.push([z[1], hi]);                            // right remnant
    }
    free = next;
  }
  return free.filter(([lo, hi]) => hi - lo > 3.0);   // too small to park in
}

// (re)build the ambient fillers for the current occupied fraction.
function buildFillers(parkedGroup, keys, fraction) {
  if (!fillerGroup) { fillerGroup = new THREE.Group(); parkedGroup.add(fillerGroup); }
  // clear previous (dispose per-car paint materials; geometry is shared, keep it)
  const seen = new Set();
  fillerGroup.traverse(o => { if (o.isMesh && o.userData.paint && o.material && !seen.has(o.material)) {
    seen.add(o.material); o.material.dispose(); } });
  while (fillerGroup.children.length) fillerGroup.remove(fillerGroup.children[0]);
  if (!keys.length || !LAYOUT) return;

  for (const side of ['near', 'far']) {
    // sorted tracked-cluster spans for this side (near: one N1-N3 block;
    // far: TWO blocks — F1 alone, then F2-F4, split by the far driveway).
    const spans = (LAYOUT.clusterSpans[side] || []).slice().sort((a, b) => a[0] - b[0]);
    // no-park = driveway/red flanks + crosswalk + every tracked cluster, each
    // PADDED by FILLER_BUF so a filler can't hug a tracked car with no real gap.
    const zones = KEEPCLEAR[side]
      .map(z => [z[0] - FILLER_BUF, z[1] + FILLER_BUF])   // widen driveway mouths
      .concat([CROSSWALK]);
    for (const s of spans) zones.push([s[0] - FILLER_BUF, s[1] + FILLER_BUF]);
    // EXCLUDE THE INTER-CLUSTER ENVELOPE. On the far side the F1 cluster sits
    // LEFT of the driveway and F2-F4 sit RIGHT of it, leaving a wide gap (F1's
    // right edge ~-42 .. driveway start -32) that subtractSpans would otherwise
    // fill with a surplus car — sitting in the far DRIVEWAY / curb-cut, inside a
    // tracked bay's camera view. Subtracting the whole envelope from the first
    // cluster's left edge to the last cluster's right edge (plus buffer) makes
    // the entire F1<->F2 gap (driveway + both flanks) unreachable, so fillers
    // only ever populate curb BEYOND the tracked run (left of F1, right of F4).
    if (spans.length > 1) {
      zones.push([spans[0][0] - FILLER_BUF, spans[spans.length - 1][1] + FILLER_BUF]);
    }
    const gaps = subtractSpans(FILL_X, zones);
    for (const [lo, hi] of gaps) {
      let x = lo + 0.6, guard = 0;
      while (x + 6.5 < hi && guard++ < 24) {
        const seed = (side === 'near' ? 3.1 : 61.7) + x * 0.163;
        const key = keys[Math.floor(hash(seed) * keys.length)];
        const len = FLEET.find(f => f.key === key).len;
        if (x + len > hi) break;
        const g2 = 1.3 + hash(x * 0.71) * 1.5;               // parallel-park gap
        // proportional occupancy: this slot parks iff its hash is under fraction
        if (hash(x * 0.37 + (side === 'near' ? 0 : 100)) < fraction) {
          const colorHex = FILLER_PALETTE[Math.floor(hash(x * 0.29 + 7) * FILLER_PALETTE.length)];
          const mesh = cloneBody(key, colorHex);
          const hw = bodyHalfWidth(mesh);
          // flush to the curb, same as tracked bays (see syncParked's `gap`) —
          // hw alone is the real clearance; only a hairline per-car jitter on top
          const off = (hash(x * 5) - 0.5) * 0.06;   // hairline jitter
          const pz = side === 'near' ? (CURB_FACE.near + CURB_OVERHANG) - hw + off
                                     : (CURB_FACE.far - CURB_OVERHANG) + hw + off;
          mesh.position.set(x + len / 2, 0, pz);
          mesh.rotation.y = (side === 'far' ? Math.PI : 0) + (hash(x * 11) - 0.5) * 0.03;
          fillerGroup.add(mesh);
        }
        x += len + g2;
      }
    }
  }
}

// parked-pool bodies: every built body type is parkable (all are proper closed
// cars now — no open-top model to exclude)
const parkedKeys = () => FLEET.filter(f => templates.has(f.key)).map(f => f.key);
// Coverage split (user): the 7 tracked bays are the prominent, honest signal, so
// they get the DETAILED hero models (worth showing off — a Porsche belongs in a bay,
// not the screen edge). Ambient FILLER cars use the cheap generic pack_* models.
const detailedKeys = () => parkedKeys().filter(k => !k.startsWith('pack_'));
const fillerKeys   = () => { const p = parkedKeys().filter(k => k.startsWith('pack_')); return p.length ? p : parkedKeys(); };

// cars are ~2.0-2.1 wide (half-width incl. mirrors ~1.1). Cap the bbox-derived
// half-width so an outlier body can't shove itself a car-width off the curb —
// this was the N2-floats-mid-road bug.
const HW_CAP = 1.8;
// ROAD-FACING FACE of each curb — the surface a parked car actually pulls up against.
// ground.js builds curbs as curbSeg() boxes 0.6 deep CENTRED on z -11 (near) / -30 (far),
// so each curb occupies -11.3..-10.7 and -30.3..-29.7. The placement code used to reference
// those CENTRELINES (-11 / -30), which is half a curb's depth back from the face — so a car
// seated "at the curb" was really seated 0.3 INTO it, and any overhang stacked on top of
// that. With bodyHalfWidth() also over-reading (see the precise=true note above) the two
// errors cancelled well enough to look plausible; once the widths were measured honestly the
// cars visibly climbed onto the curb. Reference the FACE and the number means what it says.
const CURB_FACE = { near: -11.3, far: -29.7 };
// how far the widest body point sits PAST the curb face, toward the sidewalk. Real parallel
// parking puts the tyres a few inches off the face with the body roughly flush, so this stays
// hairline — it is a kiss, not a mount. Applied with the correct sign per side (the two curbs
// face opposite directions), unlike the old single-signed constant.
const CURB_OVERHANG = 0.05;

function bodyHalfWidth(mesh) {
  const bb = new THREE.Box3().setFromObject(mesh, true);
  return Math.min((bb.max.z - bb.min.z) / 2, HW_CAP);
}

export function syncParked(pk, geo, parkedGroup, setLabel) {
  const spots = geo.parking_spots || [], st = pk.spots || [];
  // FLEET order, not Map-insertion order (async loads finish nondeterministically)
  const keys = detailedKeys();   // tracked bays get the detailed hero models
  if (!LAYOUT && spots.length) LAYOUT = packLayout(spots);
  let fN = 0, nN = 0;
  spots.forEach((sp, i) => {
    const lbl = sp.side === 'far' ? 'F' + (++fN) : 'N' + (++nN);
    // OCCUPANCY GATE (the honest live signal): a tracked bay renders a car ONLY
    // when its live PSTATE says occupied. parking_state.json / the /api/parking
    // feed carry occupied as 0|1, but coerce strictly so a non-numeric truthy
    // value (e.g. the string "0") can never fill an EMPTY bay — an empty bay must
    // stay empty. This is what keeps the twin at the real "1/7", not "7/7".
    const occ = !!st[i] && Number(st[i].occupied) > 0;
    const slot = LAYOUT && LAYOUT.slots.get(i);
    const sx = slot ? slot.x : bayCentroid(sp).x;   // packed cluster position
    let mesh = parked.get(i);
    if (occ && !mesh) {
      // deterministic per-bay body type + paint: a given bay keeps its car.
      // seed 13.7 spreads all five body types across the 7 bays (the old
      // i*5+1 seed clustered on a couple of types)
      const key = bayKeyFor(i, keys);
      mesh = key ? cloneBody(key, CARCOLORS[i % CARCOLORS.length])
                 : makeBoxCar(CARCOLORS[i % CARCOLORS.length]);
      // X = packed slot (contiguous cluster), Z = hug the curb. Bodies are
      // normalized nose->+X: near lane flows screen-right (nose +X), far lane
      // screen-left (nose -X). half-width from the bbox (bodies vary, +18%).
      const hw = bodyHalfWidth(mesh);                  // capped: see HW_CAP note
      // FLUSH TO THE CURB: this used to add a 0.30-0.58 "slight per-bay
      // variance" buffer on top of hw, which is what left every parked car
      // (F1 most visibly, since it's an isolated singleton with nothing
      // beside it to hide the offset against) floating a visible gap off the
      // curb line toward the road. hw alone is already the real clearance a
      // body needs to not clip through the curb geometry — no extra buffer is
      // needed on top of it. Keep a hairline per-bay jitter (not a full gap)
      // so the row doesn't look laser-ruled.
      const jit = (hash(i * 7) - 0.5) * 0.06;   // hairline per-bay jitter so the row isn't laser-ruled
      // Seat the car's curb-side edge a hair past the curb's ROAD-FACING FACE (CURB_FACE —
      // NOT the -11/-30 centrelines this used to use, which sat 0.3 back inside the curb and
      // is what put the near row visibly up on top of it). The straddle guard below still
      // keeps it off driveways.
      const pz = sp.side === 'near' ? (CURB_FACE.near + CURB_OVERHANG) - hw + jit
                                    : (CURB_FACE.far - CURB_OVERHANG) + hw + jit;
      // driveway/red-zone straddle guard: the curb is physically CUT at the
      // apron mouths (KEEPCLEAR), so a car centered there would float with no
      // curb behind it. If the body span overlaps a cut, shove it to the nearer
      // clear side. Fixes the "N1 on the wrong side of the curb" flag. This is a
      // per-CAR safety net only, blind to neighbors — packLayout is the one with
      // whole-cluster knowledge, so it already keeps every feasible car clear of
      // every zone with room to spare. Cap the shove this guard is allowed to
      // make: a large correction here means either packLayout deliberately
      // centered an infeasible corridor-squeeze pair across both flanking zones
      // (see packLayout's CORRIDOR TOO TIGHT case), or a box-car fallback's
      // length differs a lot from the estimate packLayout packed against —
      // either way, blindly "fully clearing" one zone risks shoving this car
      // past its packed neighbor's position and colliding with IT instead
      // (exactly the N1-into-N2 failure mode this guard used to cause). A small
      // nudge is still safe; a big one is left to packLayout's placement.
      const bb = new THREE.Box3().setFromObject(mesh, true);
      const halfLen = (bb.max.x - bb.min.x) / 2;
      const SHOVE_CAP = 1.2;
      let px = sx;
      for (const z of KEEPCLEAR[sp.side]) {
        if (px + halfLen > z[0] && px - halfLen < z[1]) {
          const candidate = (z[0] + z[1]) / 2 < sx ? z[1] + halfLen + 0.4 : z[0] - halfLen - 0.4;
          if (Math.abs(candidate - sx) <= SHOVE_CAP) px = candidate;
        }
      }
      mesh.position.set(px, 0, pz);
      mesh.rotation.y = (sp.side === 'far' ? Math.PI : 0) + (hash(i * 13) - 0.5) * 0.03;
      parkedGroup.add(mesh); parked.set(i, mesh);
    } else if (!occ && mesh) { parkedGroup.remove(mesh); parked.delete(i); }
    // label rides the car's true X when parked (post straddle-guard), else the
    // packed slot for the vacant gap
    const labelX = (occ && mesh) ? mesh.position.x : sx;
    setLabel('bay' + i, lbl, labelX, occ ? 3.6 : 0.3, LABEL_Z[sp.side],
      occ ? '#f3c04a' : 'rgba(255,255,255,.75)');
  });
  // proportional ambient fillers on the untracked curb: rebuild only when the
  // tracked occupied-count changes (keeps the ambient density tracking reality
  // without rebuilding meshes every poll)
  const occCount = spots.reduce((n, _sp, i) => n + (st[i] && Number(st[i].occupied) > 0 ? 1 : 0), 0);
  if (spots.length && occCount !== fillerOccKey) {
    fillerOccKey = occCount;
    buildFillers(parkedGroup, fillerKeys(), occCount / spots.length);   // fillers = cheap pack cars
  }
}
