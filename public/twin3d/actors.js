// twin3d/actors.js — moving objects: articulated person/dog/bicycle + vehicle
// mover meshes, live-track reconciliation, and per-frame glide + gait + heading.
// OWNED BY moving assets agent — other agents must not edit.
//
// Exports:
//   syncMovers(lv, movingGroup)   reconcile mover meshes with /api/live tracks
//   updateMovers()                per-frame lerp, walk/gait animation, facing
//
// All actor models are built facing +X (rotation.y = 0 moves toward +X), matching
// the vehicle convention. Heading lerps along the travel direction and holds the
// last heading when stationary; spawn/despawn use a short scale ease so tracks
// blinking in and out of /api/live never pop.
import * as THREE from 'three';
import { camXZ, hash } from './shared.js';
import { tintedCar, CARCOLORS, moverModelKeys } from './vehicles.js';

const movers = new Map();   // track id -> rec
const dying = new Map();    // track id -> rec (scale-out, then removed)
// light -> deep, so pedestrians/riders read as a real crowd rather than one tone
const SKINTONES = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x4a2c17];
const SHIRTS = [0x6b4f8a, 0x8e2620, 0x33475a, 0xb0803a, 0x4a6b4f, 0x777d85, 0xa8574a];
const PANTS = [0x33373f, 0x4a4438, 0x2e3a4a, 0x3d3d3d];

const std = (color, rough = 0.9) => new THREE.MeshStandardMaterial({ color, roughness: rough });
// deterministic per-person skin tone (own hash offset so it doesn't correlate
// with the shirt/pants/fur picks, which each use their own offset already)
const skinFor = seed => SKINTONES[Math.floor(hash(seed + 13) * SKINTONES.length)];

function limb(mat, r, len, px, py, pz) {
  // capsule hanging from a pivot group at (px,py,pz); swing = pivot.rotation.z/x
  const pivot = new THREE.Group(); pivot.position.set(px, py, pz);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), mat);
  m.position.y = -(len / 2 + r); m.castShadow = true;
  pivot.add(m);
  return pivot;
}

function makePerson(seed) {
  const g = new THREE.Group();
  const shirt = std(SHIRTS[Math.floor(hash(seed) * SHIRTS.length)]);
  const pants = std(PANTS[Math.floor(hash(seed + 7) * PANTS.length)]);
  const skin = std(skinFor(seed), 0.8);
  const body = new THREE.Group(); g.add(body);          // bobs as one unit
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.85, 4, 10), shirt);
  torso.position.y = 1.82; torso.castShadow = true; body.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.30, 14, 14), skin);
  head.position.y = 2.62; head.castShadow = true; body.add(head);
  const armL = limb(shirt, 0.115, 0.62, 0, 2.18, 0.46);
  const armR = limb(shirt, 0.115, 0.62, 0, 2.18, -0.46);
  const legL = limb(pants, 0.155, 0.95, 0, 1.28, 0.20);
  const legR = limb(pants, 0.155, 0.95, 0, 1.28, -0.20);
  body.add(armL, armR); g.add(legL, legR);
  g.userData.anim = { kind: 'person', body, armL, armR, legL, legR, baseY: 0 };
  return g;
}

function makeDog(seed, scale = 1) {
  const g = new THREE.Group();
  const fur = std([0x8a6f4d, 0x5a4a38, 0x9c9488, 0x3f3f3f][Math.floor(hash(seed + 3) * 4)]);
  const body = new THREE.Group(); g.add(body);
  const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.55, 4, 8), fur);
  trunk.rotation.z = Math.PI / 2; trunk.position.y = 0.55; trunk.castShadow = true; body.add(trunk);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), fur);
  head.position.set(0.48, 0.78, 0); head.castShadow = true; body.add(head);
  const snout = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.12, 3, 6), fur);
  snout.rotation.z = Math.PI / 2; snout.position.set(0.64, 0.74, 0); body.add(snout);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.25, 3, 6), fur);
  tail.position.set(-0.48, 0.72, 0); tail.rotation.z = -0.7; body.add(tail);
  const legs = [];
  for (const [lx, lz] of [[0.30, 0.12], [0.30, -0.12], [-0.28, 0.12], [-0.28, -0.12]]) {
    const l = limb(fur, 0.05, 0.38, lx, 0.52, lz); legs.push(l); g.add(l);
  }
  g.scale.setScalar(scale);
  g.userData.anim = { kind: 'dog', body, legs, tail, baseY: 0 };
  return g;
}

function makeBike(seed) {
  const g = new THREE.Group();
  const frame = std([0x1baf7a, 0xb03a2a, 0x33475a][Math.floor(hash(seed + 11) * 3)], 0.5);
  const dark = std(0x24262a, 0.7);
  for (const wx of [-0.55, 0.55]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 20), dark);
    w.position.set(wx, 0.42, 0); w.castShadow = true; g.add(w);
  }
  const bar = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 6), frame);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
    m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2; m.castShadow = true;
    return m;
  };
  g.add(bar(-0.55, 0.42, -0.1, 1.0), bar(-0.1, 1.0, 0.45, 0.95), bar(0.45, 0.95, 0.55, 0.42),
        bar(-0.1, 1.0, 0.1, 0.45), bar(0.1, 0.45, 0.55, 0.42));
  // rider: leaned-forward torso + head + legs (pedaling bob)
  const shirt = std(SHIRTS[Math.floor(hash(seed) * SHIRTS.length)]);
  const rider = new THREE.Group(); rider.position.set(-0.15, 1.05, 0); g.add(rider);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.55, 4, 8), shirt);
  torso.rotation.z = -0.55; torso.position.y = 0.42; torso.castShadow = true; rider.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 12), std(skinFor(seed), 0.8));
  head.position.set(0.28, 0.82, 0); head.castShadow = true; rider.add(head);
  const legL = limb(std(PANTS[0]), 0.08, 0.42, 0.02, 0.12, 0.14);
  const legR = limb(std(PANTS[0]), 0.08, 0.42, 0.02, 0.12, -0.14);
  rider.add(legL, legR);
  g.userData.anim = { kind: 'bike', legL, legR, baseY: 0 };
  return g;
}

// a leashed dog-walker: the person rig + a small dog trotting ahead-and-aside on a leash.
// The pair animates as the PERSON (its gait rig is lifted onto the group) — the dog rides
// along statically, which reads fine at street scale. Used when a person track has a dog
// track next to it (see the pairing pass in syncMovers).
function makeDogWalker(seed) {
  const g = new THREE.Group();
  const person = makePerson(seed);
  g.add(person);
  const dog = makeDog(seed + 3, 0.72);
  dog.position.set(1.05, 0, 0.45);        // ahead + to the leash side of the walker
  dog.rotation.y = 0.25;
  g.add(dog);
  const leashMat = new THREE.LineBasicMaterial({ color: 0x2b2b2b });
  const leash = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
    [new THREE.Vector3(0.22, 1.25, 0.08), new THREE.Vector3(0.98, 0.78, 0.4)]), leashMat);
  g.add(leash);
  g.userData.anim = person.userData.anim;  // drive the walker's stride; dog rides along
  return g;
}

function makeMover(t, opts = {}) {
  const seed = (t.i % 977) + 1;
  if (t.c === 'person') return opts.dogWalker ? makeDogWalker(seed) : makePerson(seed);
  if (t.c === 'dog') return makeDog(seed);
  if (t.c === 'cat') return makeDog(seed, 0.55);
  if (t.c === 'bicycle') return makeBike(seed);
  const car = tintedCar(CARCOLORS[Math.floor(hash(seed + 5) * CARCOLORS.length)], seed, opts.forceKey);
  car.userData.anim = { kind: 'car' };
  return car;
}

// vehicle track sitting inside an occupied bay = the parked car itself, already
// drawn by syncParked — drop it (mirrors the 2D twin's inOccupiedBay filter)
function inOccupiedBay(t, geo, parking) {
  if (!geo || !parking || !parking.spots) return false;
  if (['car', 'truck', 'bus'].indexOf(t.c) < 0) return false;
  const px = t.x * 1920, py = t.y * 1080;
  return (geo.parking_spots || []).some((sp, i) => {
    if (!parking.spots[i] || !parking.spots[i].occupied) return false;
    const xs = sp.poly.map(p => p[0]), ys = sp.poly.map(p => p[1]);
    return px >= Math.min(...xs) && px <= Math.max(...xs)
        && py >= Math.min(...ys) && py <= Math.max(...ys);
  });
}

// nearest parked-car world-x within CAR_NEAR of a first detection, or null — lets
// a spawning pedestrian anchor to "emerging from between parked cars" instead of
// the sidewalk edge. Reuses the same pixel-space poly data inOccupiedBay already
// reads; only the occupied bays count as an anchor since an empty bay has no car
// to walk out from behind.
function nearestParkedCarX(px, geo, parking) {
  if (!geo || !parking || !parking.spots) return null;
  let best = null, bestD = CAR_NEAR;
  (geo.parking_spots || []).forEach((sp, i) => {
    if (!parking.spots[i] || !parking.spots[i].occupied) return;
    const xs = sp.poly.map(pt => pt[0]);
    const cx = camXZ((Math.min(...xs) + Math.max(...xs)) / 2, 0).x;
    const d = Math.abs(px - cx);
    if (d < bestD) { bestD = d; best = cx; }
  });
  return best;
}

// where a NEW pedestrian's mesh should visually start: prefer a believable
// anchor (building door, or from behind a parked car) over the plain frame-edge
// snap every other EDGE_SPAWN class uses, since a walker popping out of a
// doorway or from between cars reads as real while a person materializing at
// the far frame edge every time reads as repetitive/robotic. Falls back to the
// same edge snap as vehicles when no anchor is close enough.
function spawnAnchorX(t, p, geo, parking) {
  if (t.c === 'person') {
    let door = null, doorD = DOOR_NEAR;
    for (const dx of DOOR_X) {
      const d = Math.abs(p.x - dx);
      if (d < doorD) { doorD = d; door = dx; }
    }
    if (door != null) return door;
    const carX = nearestParkedCarX(p.x, geo, parking);
    if (carX != null) return carX;
  }
  return p.x >= 0 ? SPAWN_EDGE : -SPAWN_EDGE;
}

// ---- live-track motion model ------------------------------------------------
// /api/live tracks only carry the current detected point (id/class/x/y) and the
// tracker fragments a single pass into short-lived ids as the object slips
// behind tree trunks — so a raw track blinks on and scale-outs in place ("a
// random car that disappears"). To read as a full traversal we derive a
// per-track velocity from successive detections, glide a live actor toward a
// forward-projected target so it keeps flowing, and — once a track ends — keep
// the actor moving in its observed direction until it leaves the frame, then
// despawn. An object entering the camera's field of view is first detected near
// the frame edge, so it already grows in at the edge and glides across; only its
// exit needed the extrapolation. Travel is dominated by world-x (screen-
// horizontal: road lanes + sidewalk); z (depth = lane/sidewalk band) is carried
// from the detection. Nothing is fabricated: direction and speed both come from
// real detected motion, and an actor that never established a direction just
// scale-outs in place as before.
const X_EDGE = 62;     // |world-x| past which an actor has left the scene (frame ~±55)
const SPAWN_EDGE = 55; // |world-x| of the visible frame edge — new movers spawn here
const EDGE_SPAWN = { car: 1, truck: 1, bus: 1, motorcycle: 1, bicycle: 1, person: 1 };
                       // classes that visibly traverse frame-edge to frame-edge (road
                       // lanes + sidewalk); dog/cat are usually on-leash with a person
                       // already doing the edge entry, so left as a plain scale-in
// world-x of every real building entry a pedestrian can plausibly step out of
// instead of the bare sidewalk edge (ground.js/shrubs.js/houses.js's hedge-gap +
// entry-apron x-positions — the sage block door, the cottage door at the near
// sidewalk, the warm-white block door, and the brick-edge block door out past
// the far end of the run). Doors, not driveways, so a spawned person reads as
// leaving a home, not stepping out of a curb cut.
const DOOR_X = [-47, 7.3, 45, 93];
const DOOR_NEAR = 5;   // world-x radius: a first detection this close to a door anchors there
const CAR_NEAR = 4;    // world-x radius: a first detection this close to a parked car anchors there
const LEAD_T = 0.5;    // s of velocity look-ahead for the live glide target
const CORR = 0.12;     // per-frame (@60fps) glide gain toward the lead target
const V_SMOOTH = 0.35; // EMA weight for each new velocity sample
const DIR_LOCK = 1.6;  // world-x travel (u) accumulated before a direction is trusted
const EXIT_MAX_T = 4;  // s of post-track extrapolation before a force-despawn
const EXIT_FLOOR = { car: 14, bike: 8, person: 3.4, dog: 3.4 };  // min exit cruise, u/s

// The two DRIVING LANES between the parked rows: +x traffic hugs the near lane, -x the
// far lane. Both sit a full lane clear of the parked rows (near bays end ~z -13.3, far
// begin ~z -27.7), so a moving car never touches a parked car or a bay, and opposing
// traffic is separated instead of piling into one curbside spot.
const NEAR_MOVE_Z = -18, FAR_MOVE_Z = -23;
const LANE_Z = d => (d > 0 ? NEAR_MOVE_Z : FAR_MOVE_Z);
// A vehicle is CLEAN ONE-WAY LANE TRAFFIC: once spawned it holds its lane + heading and
// cruises steadily forward off the far edge, decoupled from the noisy per-frame detection
// (which is mostly stationary parked cars and made movers face/backtrack randomly). This
// guarantees same-lane cars share a direction, never reverse, and never sit in a bay.
const CRUISE_MIN = 9, CRUISE_MAX = 16;          // world units/s, varied per car
const STACK_GAP = 8;                            // min spacing between cars entering the same lane
const vehRetired = new Set();                   // track ids whose mover already crossed — don't respawn a phantom
// PEDESTRIAN ZONING: people/dogs/cats belong on a SIDEWALK, never the road. The camera
// sees the far walk up top and the near walk at the bottom, so a ped's frame-half (t.y)
// picks which walk. z bands: far sidewalk -36.5..-33.5, near sidewalk -5.5..0.5 (ground.js).
const FAR_WALK_Z = -34.8, NEAR_WALK_Z = -3.0;   // centers of the two sidewalks
const isPed = c => c === 'person' || c === 'dog' || c === 'cat';

export function syncMovers(lv, movingGroup, geo, parking) {
  const tnow = performance.now();
  const seen = new Set();
  const presentIds = new Set((lv.tracks || []).map(t => t.i));   // every id in frame (incl. retired/bay)
  // DOG-WALKER PAIRING: a person track with a dog track right next to it renders as ONE
  // leashed dog-walker (person + dog + leash); that dog's own track is then consumed so it
  // isn't also drawn as a separate loose dog.
  const dogTracks = (lv.tracks || []).filter(t => t.c === 'dog');
  const walkerPersons = new Set(), consumedDogs = new Set();
  for (const t of (lv.tracks || [])) {
    if (t.c !== 'person') continue;
    for (const d of dogTracks) {
      if (consumedDogs.has(d.i)) continue;
      if (Math.hypot((d.x - t.x) * 1920, (d.y - t.y) * 1080) < 130) {
        walkerPersons.add(t.i); consumedDogs.add(d.i); break;
      }
    }
  }
  for (const t of (lv.tracks || [])) {
    if (['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'person', 'dog', 'cat'].indexOf(t.c) < 0) continue;
    if (inOccupiedBay(t, geo, parking)) continue;
    if (t.c === 'dog' && consumedDogs.has(t.i)) continue;   // this dog is walked on a leash by a person mover
    const isVeh = ['car', 'truck', 'bus', 'motorcycle'].indexOf(t.c) >= 0;
    if (isVeh && vehRetired.has(t.i)) continue;   // its one lane-pass already crossed — don't respawn a phantom
    seen.add(t.i);
    const p = camXZ(t.x * 1920, t.y * 1080);
    p.z = -11 + (p.z + 11) * (19 / 45);  // R5: compress old road -56..-11 onto the narrowed -30..-11
    let rec = movers.get(t.i);
    // ZONE PEDS TO A SIDEWALK: the road compress above would otherwise strand a person/dog
    // in the middle of the street. Snap them onto the near or far walk by frame-half (t.y),
    // LOCKED at spawn (rec.walkZ) so a t.y that jitters across 0.5 can't teleport them.
    if (isPed(t.c)) p.z = (rec && rec.walkZ != null) ? rec.walkZ
                        : (t.y < 0.5 ? FAR_WALK_Z : NEAR_WALK_Z) + (hash(t.i * 3.3) - 0.5) * 2.4;
    // Vehicles drive in a fixed LANE (LANE_Z) chosen by travel direction, NOT at their raw
    // projected z. This keeps a moving car (a) off BOTH parked rows / out of the bays (near
    // bays z ~ -11..-13.3, far ~ -27.7..-30 per vehicles.js syncParked), (b) street-aligned
    // (its z never changes frame-to-frame, so it can't glide diagonally), and (c) in one of
    // two opposing lanes so cars don't pile up in one spot near the curb. Pedestrians/dogs
    // keep their projected z (they belong on the sidewalk, not a lane).
    if (isVeh && rec) p.z = LANE_Z(rec.laneDir);
    if (!rec && dying.has(t.i)) {           // track blipped: resurrect, no pop
      rec = dying.get(t.i); dying.delete(t.i); movers.set(t.i, rec);
      rec.spawn = Math.max(rec.spawn, 0.2);
    }
    if (!rec) {
      // Snap the INITIAL position to a believable entry point (frame edge for cars/bikes; a
      // door or parked car for a person) — the mesh then glides to the real detection so it
      // reads as entering, not materializing mid-street. Compute the entry + (for vehicles)
      // lane/heading/model BEFORE building the mesh.
      let spawnX = EDGE_SPAWN[t.c] ? spawnAnchorX(t, p, geo, parking) : p.x;
      let laneDir = 0, cruiseV = 0, moverKey = null;
      if (isVeh) {
        laneDir = Math.sign(p.x - spawnX) || 1;
        p.z = LANE_Z(laneDir);
        cruiseV = CRUISE_MIN + hash(t.i * 1.7 + 2) * (CRUISE_MAX - CRUISE_MIN);
        // NO TWO-IN-A-ROW (user): pick a model NOT already used by another car in this lane,
        // so same-direction traffic never shows a duplicate pair.
        const pool = moverModelKeys();
        const usedInLane = new Set([...movers.values(), ...dying.values()]
          .filter(r => r.isVeh && r.laneDir === laneDir && r.modelKey).map(r => r.modelKey));
        const avail = pool.filter(k => !usedInLane.has(k));
        const pick = avail.length ? avail : pool;
        moverKey = pick.length ? pick[Math.floor(hash(t.i * 2.7 + 1.3) * pick.length)] : null;
        // ANTI-STACK: if a car is already entering this lane near the edge, start this one
        // further back (off-screen) so they queue nose-to-tail instead of stacking on top.
        for (let guard = 0; guard < 12; guard++) {
          const clash = [...movers.values(), ...dying.values()].some(r =>
            r.isVeh && r.laneDir === laneDir && Math.abs(r.mesh.position.x - spawnX) < STACK_GAP);
          if (!clash) break;
          spawnX -= laneDir * STACK_GAP;
        }
      }
      const mesh = makeMover(t, { forceKey: moverKey, dogWalker: walkerPersons.has(t.i) });
      mesh.position.set(spawnX, 0, p.z);
      if (isVeh) mesh.rotation.y = laneDir > 0 ? 0 : Math.PI;   // aligned from frame 1, never diagonal
      const baseScale = mesh.scale.clone();  // may be non-1 (glTF cars, cats)
      mesh.scale.multiplyScalar(0.001);      // grows in via spawn ease
      movingGroup.add(mesh);
      rec = { mesh, detX: p.x, detZ: p.z, lastSeen: tnow, vx: 0, vz: 0, netx: 0,
              dir: 0, exitT: 0, isVeh, laneDir, cruiseV, modelKey, id: t.i,
              walkZ: isPed(t.c) ? p.z : null,   // locked sidewalk for peds (near/far), see zoning above
              heading: laneDir > 0 ? 0 : Math.PI, phase: hash(t.i) * 6, spawn: 0, baseScale };
      movers.set(t.i, rec);
    } else {
      // estimate velocity from the step since the previous detection (EMA), and
      // accumulate signed x-travel to lock in a trusted direction of travel
      const dtd = (tnow - rec.lastSeen) / 1000;
      if (dtd > 0.01) {
        const ivx = (p.x - rec.detX) / dtd, ivz = (p.z - rec.detZ) / dtd;
        if (Math.hypot(ivx, ivz) < 120) {   // guard against id-reuse teleports
          rec.vx = rec.vx * (1 - V_SMOOTH) + ivx * V_SMOOTH;
          rec.vz = rec.vz * (1 - V_SMOOTH) + ivz * V_SMOOTH;
        }
        rec.netx += p.x - rec.detX;
        if (rec.dir === 0 && Math.abs(rec.netx) > DIR_LOCK) rec.dir = Math.sign(rec.netx);
      }
      rec.detX = p.x; rec.detZ = p.z; rec.lastSeen = tnow; rec.exitT = 0;
    }
  }
  for (const [id, rec] of movers)
    if (!seen.has(id)) { movers.delete(id); dying.set(id, rec); }
  // let a retired id spawn again only once its track has actually disappeared (a genuine
  // new pass reuses a fresh id) — a still-present (parked) id stays retired, no phantom.
  for (const id of vehRetired) if (!presentIds.has(id)) vehRetired.delete(id);
}

const wrapPI = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
let lastT = 0;

// heading (face travel direction, +X convention; hold when stationary) + gait,
// both driven by the actor's ACTUAL per-frame displacement so it animates the
// same whether it is gliding toward a live detection or extrapolating off-frame
function driveAnim(rec, dx, dz, dt) {
  const m = rec.mesh;
  const speed = Math.hypot(dx, dz) / dt;                 // world units/s
  const a = m.userData.anim;
  // CARS are street-aligned only — a vehicle on this straight street faces +x or -x,
  // never a diagonal (the old atan2(-dz,dx) let cross-street glide skew them). Flip to
  // the travel direction on real x-motion; hold the last heading when momentarily still.
  if (a && a.kind === 'car') {
    if (Math.abs(dx) > 0.003) m.rotation.y = dx > 0 ? 0 : Math.PI;
    return;
  }
  if (speed > 0.4) {
    const target = Math.atan2(-dz, dx);
    rec.heading += wrapPI(target - rec.heading) * Math.min(1, dt * 7);
    m.rotation.y = rec.heading;
  }
  if (!a) return;
  rec.phase += Math.min(speed, 8) * dt * 2.4;             // faster walkers stride faster
  const sw = Math.sin(rec.phase), amp = Math.min(speed / 4, 1);
  if (a.kind === 'person') {
    a.legL.rotation.z = sw * 0.55 * amp;  a.legR.rotation.z = -sw * 0.55 * amp;
    a.armL.rotation.z = -sw * 0.40 * amp; a.armR.rotation.z = sw * 0.40 * amp;
    a.body.position.y = Math.abs(Math.cos(rec.phase)) * 0.06 * amp;
  } else if (a.kind === 'dog') {
    a.legs[0].rotation.z = sw * 0.6 * amp;  a.legs[3].rotation.z = sw * 0.6 * amp;
    a.legs[1].rotation.z = -sw * 0.6 * amp; a.legs[2].rotation.z = -sw * 0.6 * amp;
    a.body.position.y = Math.abs(Math.sin(rec.phase)) * 0.05 * amp;
    a.tail.rotation.x = Math.sin(rec.phase * 2.3) * 0.35;
  } else if (a.kind === 'bike') {
    a.legL.rotation.z = sw * 0.8 * amp; a.legR.rotation.z = -sw * 0.8 * amp;
  }
}

const spawnEase = s => 0.25 + 0.75 * s * (2 - s);
const DOOR_REACH = 1.5;  // world-x proximity that counts as "arrived" at a door mid-exit

export function updateMovers() {
  const now = performance.now();
  // dt clamp: clocks that barely advance per frame (virtual time, throttled
  // tabs) must not starve spawn/gait — floor at a 240fps step, cap at 100ms
  const dt = lastT ? Math.min(Math.max((now - lastT) / 1000, 1 / 240), 0.1) : 0.016;
  lastT = now;
  const g = 1 - Math.pow(1 - CORR, dt * 60);   // frame-rate-independent glide gain

  // live actors. VEHICLES: steady one-way lane cruise (fixed lane/heading, forward only —
  // NOT detection-tracking, which made them backtrack, face wrong, and stack). When a car
  // reaches the far edge it retires (removed + its id blocked from respawning as a phantom).
  // Everything else glides toward the detected point projected forward along its velocity.
  for (const [id, rec] of movers) {
    const m = rec.mesh;
    if (rec.isVeh) {
      m.position.x += rec.laneDir * rec.cruiseV * dt;
      m.position.z = LANE_Z(rec.laneDir);
      m.rotation.y = rec.laneDir > 0 ? 0 : Math.PI;
      if (rec.spawn < 1) { rec.spawn = Math.min(1, rec.spawn + dt / 0.4); m.scale.copy(rec.baseScale).multiplyScalar(spawnEase(rec.spawn)); }
      if (Math.abs(m.position.x) > X_EDGE) { if (m.parent) m.parent.remove(m); movers.delete(id); vehRetired.add(id); }
      continue;
    }
    const ox = m.position.x, oz = m.position.z;
    const targetX = rec.detX + rec.vx * LEAD_T;
    const targetZ = rec.detZ + rec.vz * LEAD_T;
    m.position.x = ox + (targetX - ox) * g;
    m.position.z = oz + (targetZ - oz) * g;

    if (rec.spawn < 1) {                       // spawn ease-in (also resurrected blips)
      rec.spawn = Math.min(1, rec.spawn + dt / 0.4);
      m.scale.copy(rec.baseScale).multiplyScalar(spawnEase(rec.spawn));
    }
    driveAnim(rec, m.position.x - ox, m.position.z - oz, dt);
  }

  // exit: a track that ended keeps moving in its observed direction until it
  // clears the frame edge, then despawns — a full pass, not a scale-out in
  // place. Actors that never locked a direction (stationary blips) fall back to
  // the original quick scale-out so we never invent motion we didn't observe. A
  // walking person additionally exits early if their exit carries them right up
  // to a building door (DOOR_X) — they shrink away there like stepping inside
  // rather than being forced on to the far frame edge every time.
  for (const [id, rec] of dying) {
    const m = rec.mesh;
    const kind = (m.userData.anim && m.userData.anim.kind) || 'car';
    if (rec.isVeh) {                            // a departed car just keeps cruising out its lane
      m.position.x += rec.laneDir * rec.cruiseV * dt;
      m.position.z = LANE_Z(rec.laneDir);
      m.rotation.y = rec.laneDir > 0 ? 0 : Math.PI;
      if (rec.spawn < 1) { rec.spawn = Math.min(1, rec.spawn + dt / 0.4); m.scale.copy(rec.baseScale).multiplyScalar(spawnEase(rec.spawn)); }
      if (Math.abs(m.position.x) > X_EDGE) { if (m.parent) m.parent.remove(m); dying.delete(id); vehRetired.add(id); }
      continue;
    }
    if (rec.dir !== 0 && kind === 'person'
        && DOOR_X.some(dx => Math.abs(m.position.x - dx) < DOOR_REACH)) {
      rec.spawn -= dt / 0.35;
      if (rec.spawn <= 0) {
        if (m.parent) m.parent.remove(m);
        dying.delete(id);
      } else {
        m.scale.copy(rec.baseScale).multiplyScalar(Math.max(0.001, rec.spawn));
      }
      continue;
    }
    if (rec.dir !== 0) {
      const floor = EXIT_FLOOR[kind] || 6;
      let vx = rec.vx;                         // enforce a min cruise so it exits
      vx = rec.dir > 0 ? Math.max(vx, floor) : Math.min(vx, -floor);
      const ox = m.position.x, oz = m.position.z;
      m.position.x = ox + vx * dt;
      m.position.z = oz + rec.vz * dt;
      rec.exitT += dt;
      if (rec.spawn < 1) rec.spawn = Math.min(1, rec.spawn + dt / 0.4);
      m.scale.copy(rec.baseScale).multiplyScalar(spawnEase(rec.spawn));
      driveAnim(rec, m.position.x - ox, m.position.z - oz, dt);
      if (Math.abs(m.position.x) > X_EDGE || rec.exitT > EXIT_MAX_T) {
        if (m.parent) m.parent.remove(m);
        dying.delete(id);
      }
    } else {                                   // no direction: quick scale-out
      rec.spawn -= dt / 0.35;
      if (rec.spawn <= 0) {
        if (m.parent) m.parent.remove(m);
        dying.delete(id);
      } else {
        m.scale.copy(rec.baseScale).multiplyScalar(Math.max(0.001, rec.spawn));
      }
    }
  }
}
