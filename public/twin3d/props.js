// twin3d/props.js — bay-adjacent props keyed off live bay data, alongside (not
// replacing) vehicles.js's car truth-match. First prop: a trash bin/dumpster
// placed beside a bay's parked car when that bay is flagged as having one out
// for pickup ("trash day"). NEW module — does not edit vehicles.js/scene.js's
// owned logic; scene.js only imports + calls the two exports below.
//
// ---- provenance -------------------------------------------------------------
// Model: models_lite/dumpster.glb, converted from the raw download
// (~/Downloads/dumpster.zip -> models/dumpster/scene.gltf) with the SAME
// pipeline scripts/build-lite.sh uses for the car fleet (gltf-transform weld ->
// simplify -> optimize --compress draco --texture-compress webp). Source:
// Sketchfab "Dumpster" by Sargone, CC-BY-4.0 (models/dumpster/license.txt).
//
// ---- truth-match signal (what's real vs. stubbed) ---------------------------
// /api/parking's spot objects are {occupied, side} only today — sidewalk-watch's
// YOLO pipeline has no bin/dumpster class and the DB carries no per-bay item-type
// field (checked watch/detector + the parking_state schema; car TYPE itself isn't
// truth-matched from real detections either — vehicles.js assigns a deterministic
// hash-based model per bay, not a detected one). So there is no live bin signal to
// consume yet. hasBinAt()/binConfig() below are the ONE pair of functions to swap
// when sidewalk-watch adds one — they already check several plausible future shapes
// on the live pk.spots[i] object (bin/has_bin/classes[]/item_type) before falling
// back to DEMO_BINS. Until then DEMO_BINS hardcodes bay index 2 (N3), matching the
// blue dumpster visible beside the N3 car in the live camera capture on 2026-07-20
// (sidewalk-watch/data/latest.jpg) — real trash day, not a synthetic example.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/DRACOLoader.js';

// bay index -> bin config. Index matches /api/geometry's parking_spots order
// (0-2 near = N1-N3, 3-6 far = F1-F4; see vehicles.js's syncParked label loop).
// side: +1 sits the bin past the car on the block's open/outboard end (matches
// the real photo — the dumpster sits beyond N3, away from N2); -1 is the mirror.
const DEMO_BINS = { 2: { side: 1, color: 0x1f5fa8 } };   // N3, blue

function hasBinAt(i, pkSpot) {
  if (pkSpot) {
    if (pkSpot.bin === true || Number(pkSpot.bin) > 0) return true;
    if (pkSpot.has_bin === true) return true;
    if (Array.isArray(pkSpot.classes) && pkSpot.classes.some(c => /bin|dumpster|trash/i.test(c))) return true;
    if (pkSpot.item_type && /bin|dumpster|trash/i.test(pkSpot.item_type)) return true;
  }
  return !!DEMO_BINS[i];
}
function binConfig(i, pkSpot) {
  const demo = DEMO_BINS[i] || { side: 1, color: 0x1f5fa8 };
  if (pkSpot && pkSpot.bin_color) return { side: demo.side, color: pkSpot.bin_color };
  return demo;
}

// ---- glTF load (own loader instance — mirrors vehicles.js's pattern; the
// draco decoder is vendored by sidewalk-watch and shared across modules) -----
const _gltfLoader = new GLTFLoader();
const _draco = new DRACOLoader();
_draco.setDecoderPath('/vendor/draco/');
_gltfLoader.setDRACOLoader(_draco);

let binTemplate = null;    // built once; clones share geometry
const BIN_LEN = 3.0;       // scene-unit footprint (~1.8m real, same units/metre the car fleet uses)

function buildBinTemplate(gltf) {
  const root = gltf.scene;
  root.updateWorldMatrix(true, true);
  let box = new THREE.Box3().setFromObject(root);
  let size = box.getSize(new THREE.Vector3());
  // longest horizontal axis -> +X (matches the car convention: length along X)
  if (size.z > size.x) { root.rotation.y = Math.PI / 2; root.updateMatrixWorld(true); }
  box = new THREE.Box3().setFromObject(root);
  size = box.getSize(new THREE.Vector3());
  root.scale.multiplyScalar(BIN_LEN / (size.x || 1));
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  root.position.x -= c.x; root.position.z -= c.z; root.position.y -= box.min.y;
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (!m) continue;
      // source glTF ships NO explicit metallic/roughness factors, so GLTFLoader
      // defaults both to 1.0 (spec default) — full-metal + full-rough reads as a
      // near-black mirror under this scene's soft HDRI (same issue vehicles.js
      // calls out for hot car paint). De-chrome it so the baked texture / tint
      // actually reads instead of going flat black.
      m.envMapIntensity = 0.55;
      if (m.metalness > 0.5) m.metalness = 0.5;
      if (m.roughness < 0.55) m.roughness = 0.55;
      m.needsUpdate = true;
    }
  });
  const outer = new THREE.Group();
  outer.add(root);
  return outer;
}

export async function initBinTemplate() {
  await new Promise(resolve => {
    _gltfLoader.load('/twin3d/models_lite/dumpster.glb',
      gltf => { try { binTemplate = buildBinTemplate(gltf); }
                catch (e) { try { console.warn('bin template failed', e); } catch (_) {} }
                resolve(); },
      undefined,
      err => { try { console.warn('dumpster.glb load failed', err); } catch (_) {} resolve(); });
  });
}

// The source asset's baked baseColor texture for the "dumpster" body material is
// very dark (near-black with a faint green cast — confirmed by rendering it unlit:
// still reads black). Standard/PBR base color is map*color, so tinting via
// material.color alone can only ever darken further, never brighten a near-black
// texture into a visible blue. Fix: drop the albedo map on this one material and
// paint it flat — keeps the normal map (surface dents/ridges still read) but the
// body color becomes the real, visible blue from the live photo. Tires/hardware
// ("tire"/"material") keep their baked textures untouched.
function tintBin(root, colorHex) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m, idx) => {
      if (!m || m.name !== 'dumpster') return;
      const t = m.clone();
      t.map = null; t.color.set(colorHex);
      t.metalness = 0.15; t.roughness = 0.55;   // painted-steel/plastic bin, not chrome
      t.needsUpdate = true;
      if (Array.isArray(o.material)) o.material[idx] = t; else o.material = t;
    });
  });
}

function cloneBin(colorHex) {
  const g = binTemplate.clone(true);
  tintBin(g, colorHex);
  return g;
}

const placed = new Map();   // bay index -> mesh

// syncBins(pk, geo, binGroup, labels) — called from scene.js's pull(), right
// after syncParked/syncMovers. `labels` is scene.js's label Map (key 'bay'+i ->
// DOM el with a world-position `_w` Vector3, already used by projectLabels());
// reading it gives the ACTUAL packed car x for a bay without duplicating
// vehicles.js's clustering/corridor-fit math or reaching into its internals.
export function syncBins(pk, geo, binGroup, labels) {
  if (!binTemplate || !binGroup) return;
  const st = pk.spots || [], spots = geo.parking_spots || [];
  spots.forEach((sp, i) => {
    const want = hasBinAt(i, st[i]);
    let mesh = placed.get(i);
    if (want && !mesh) {
      const cfg = binConfig(i, st[i]);
      mesh = cloneBin(cfg.color);
      const lbl = labels && labels.get('bay' + i);
      const anchorX = (lbl && lbl._w) ? lbl._w.x : 0;
      // curb-hugging depth, mirroring vehicles.js's near/far curb faces (z=-11 / -30);
      // pulled slightly toward the sidewalk side of the car (a bin sits at the curb
      // line, not out in the lane with the car).
      const z = sp.side === 'near' ? -10.3 : -30.7;
      const dirX = cfg.side >= 0 ? 1 : -1;
      const carHalfLen = 4.0, gap = 0.9, binHalfLen = BIN_LEN / 2;
      const x = anchorX + dirX * (carHalfLen + gap + binHalfLen);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = (sp.side === 'far' ? -1 : 1) * Math.PI / 2 + (dirX > 0 ? 0 : Math.PI);
      binGroup.add(mesh);
      placed.set(i, mesh);
    } else if (!want && mesh) {
      binGroup.remove(mesh);
      placed.delete(i);
    }
  });
}
