// twin3d/ground.js — road / sidewalk / curb surfaces on real CC0 PBR texture
// sets (ambientCG Asphalt031 + Concrete034, assets/textures/road/), with the
// wear story (tire bands, tar snakes, oil stains, repave patches), world-space
// slab joints, red no-parking curb paint, XING road paint, and driveway apron
// layered on top as decals.
// OWNED BY street & sidewalk agent — other agents must not edit.
//
// Exports:
//   buildGround(scene, renderer)   all ground strips + markings + curbs
//
// ================== WORLD BAND SPEC (z-spans, both sides) ==================
// R5 P3 REBUILD: the road was 45u deep (−56..−11) and read like ~10 car-widths.
// Narrowed to a true 2-travel-lane + one parked lane at each curb street by
// pulling the FAR side toward the camera by +26 in z (far curb −56 → −30).
// The NEAR side is UNCHANGED (near curb still z=−11). Road is now 19u deep.
//   ---- FAR-SIDE SHIFT for the Phase-B agents = OLD_Z + 26 ----
//   Every far-side element (grass.js far parkway/frontage, shrubs.js hedges,
//   houses.js facades, backdrop.js treeline/towers, palms.js east palms,
//   street_furniture.js streetlight/poles/wires, vehicles.js far curb constant)
//   must add +26 to its old z to sit against the new far curb. Old far curb −56.
//   NOTE: shared.js camXZ (FROZEN) still maps far detections to z≈−50 (20u
//   past the new far curb) — moving-actor placement in actors.js needs a
//   z-compression remap (orchestrator hand-off; see agent report).
// FROZEN in shared.js: camXZ pixel→world map (NOT updated for this narrowing).
//   FAR side (z increasing toward camera):
//     far frontage (grass, grass.js) −150..−36.5  hedges −36.8, buildings −38
//     far sidewalk (concrete, here)  −36.5..−33.5 joints at z=−35
//     far parkway  (grass, grass.js) −33.5..−30   trees + streetlight + poles
//     FAR CURB face .................. z=−30
//   ROAD (asphalt, here) −30..−11 (19u): far parked lane, 2 travel lanes,
//     near parked lane. Parked rows (vehicles.js, curb-relative): far ≈ −27.8,
//     near ≈ −13.2. Road crown/center seam z=−20.5.
//     NEAR CURB face ................. z=−11
//   NEAR side (z increasing toward camera) — UNCHANGED:
//     near parkway (grass, grass.js) −11..−5.5    foreground trees + wear line
//     near sidewalk(concrete, here)  −5.5..0.5    joints at z=−2.5
//     near frontage(grass, grass.js) 0.5..30      1414 frontage to frame bottom
//   Aprons/driveways cut through parkway+sidewalk. Apron flare stays on the
//   parkway/sidewalk side of the curb and its mouth fits INSIDE the curb-cut gap
//   (never over the curb segments or the red no-parking paint):
//     near = TWO driveways flanking 3 parking bays (SV: 1400–1414 Kelton). LEFT
//       cut (1414's) x −20..−12; RIGHT cut x 29..37; both apron mouths 7.6 wide
//       (−19.8..−12.2 / 29.2..36.8), drive width 6.5, z −11..0.5. The 3 near bays
//       (N1–N3) pack together BETWEEN the two cuts at x ≈ −1..+17 (oil-stains here,
//       car packing in vehicles.js)
//     R7: a separate NEAR pedestrian walkway (concrete, 4.4 wide) runs x=7.3,
//       z −11..8 — 1414's entry-gap x-position (shrubs.js hedge gap) — carrying
//       the building's short entry apron (houses.js, stops at the lot line) the
//       rest of the way across parkway+sidewalk so it actually reaches the curb
//       instead of dead-ending in bare grass.
//     far: ONE driveway PER PROPERTY — cream, cottage, AND Building B garage. R9:
//       a prior pass had removed the cottage's side-access driveway so F2/F3/F4
//       could pack contiguous — RESTORED here (user ask: there's enough open curb
//       to seat all 3 bays WITHOUT deleting the driveway). F2/F3/F4 now pack as
//       one contiguous row in the OPEN curb span to the LEFT of the cottage
//       driveway, between the cream flank and the cottage flank (vehicles.js):
//         cream mid-rise: cut x −32..−27 (R7: narrowed to match the 5-wide corner
//           garage door, houses.js garageW:5 — was 9-wide −34..−25, wider than the
//           door), apron x−29.5 (mouth 5.5/back 5), z −30..−38.5 — leads straight
//           into the corner garage at the building face (houses.js garage
//           ~x−29.5, front z≈−38; apron overlaps 0.5 past it).
//         cottage: side-access cut x 17..24 (RESTORED, R9), apron x20.5 (mouth
//           6.5/back 5.5), z −30..−38.5, THEN a deep driveStrip x20.5 continuing
//           z −38.5..−50 alongside the cottage's right-side stairs (houses.js
//           sideX≈17.9) as a side-access drive — same as it was before the R8 pass
//           removed it. F2/F3/F4 pack in the OPEN curb between the cream flank
//           (x−21) and the cottage flank (x11) — the ~30-wide span fits all 3 cars
//           nose-to-tail without touching either driveway mouth.
//         Building B garage: cut x 49.5..58.5, apron x54 (mouth 9/back 8),
//           z −30..−40 — reaches the garage door.
// ===========================================================================
import * as THREE from 'three';
import { hash, makeCanvasTex, noiseFill } from './shared.js';

export function buildGround(scene, renderer) {
  // canvasTex remains for decal/wear textures; base surfaces are real PBR now
  const canvasTex = (draw, w, h, rep) => makeCanvasTex(THREE, renderer, draw, w, h, rep);

  // PBR texture loader for assets/textures/road/ — color maps are SRGB, data
  // maps (normal/roughness/AO) stay linear; aoMap.channel forced to 0 so it
  // rides the base UVs (three r152+ defaults aoMap to uv channel 1)
  const loader = new THREE.TextureLoader();
  const pbrTex = (file, srgb, rx, ry) => {
    const t = loader.load('/assets/textures/road/' + file);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.channel = 0;
    return t;
  };

  // ground strips, far (-z) to near (+z); near side must be fully visible
  const strip = (z0, z1, mat, rx, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(240, z1 - z0), mat);
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0, (z0 + z1) / 2);
    m.receiveShadow = true;
    if (rx && mat.map) mat.map.repeat.set(rx, ry);   // per-strip aspect-true tiling
    scene.add(m); return m;
  };
  // translucent flat decal (wear bands, patches, stains) — draws over the strip
  let ord = 1;
  const decal = (w, d, x, z, opts) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...opts }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02 + ord * 0.004, z);
    m.renderOrder = ord++; scene.add(m); return m;
  };

  // ---- lawns moved to grass.js (dedicated grass agent); this file keeps
  // road/sidewalk/curb surfaces only
  // ---- concrete: real PBR set (ambientCG Concrete034, CC0), tinted warm-light
  // to match the reference slabs (~#c9c4b6 lit)
  const concreteMat = (rx, ry) => new THREE.MeshStandardMaterial({
    color: 0xe4ddcd,
    map: pbrTex('concrete_col.jpg', true, rx, ry),
    normalMap: pbrTex('concrete_nrm.jpg', false, rx, ry),
    roughnessMap: pbrTex('concrete_rgh.jpg', false, rx, ry),
    roughness: 1.0,
  });
  // ---- asphalt: real PBR set (ambientCG Asphalt031, CC0). Reference brief:
  // Kelton is cooler mid-gray (~#77787a) than typical game asphalt — the cool
  // tint below shifts the mid-grey scan; bleached patches ride on top as decals
  const aRx = 13, aRy = 1.03;                                  // square texels on 240x19 (R5 narrowed road)
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0xc6c9cd,
    map: pbrTex('asphalt_col.jpg', true, aRx, aRy),
    normalMap: pbrTex('asphalt_nrm.jpg', false, aRx, aRy),
    roughnessMap: pbrTex('asphalt_rgh.jpg', false, aRx, aRy),
    aoMap: pbrTex('asphalt_ao.jpg', false, aRx, aRy),
    aoMapIntensity: 0.7,
    roughness: 1.0,
  });

  // BAND SPEC: parkway grass sits against each curb (grass.js), sidewalks are
  // set back one band. R5 P3: road narrowed to −30..−11 (19u), far side pulled
  // +26 toward the camera; near side unchanged.
  strip(-36.5, -33.5, concreteMat(40, 1));                                 // far sidewalk (was −62.5..−59.5)
  strip(-30, -11, asphaltMat);                                             // road (was −56..−11)
  strip(-5.5, 0.5, concreteMat(30, 1));                                    // near sidewalk (unchanged)

  // ---- road wear story (world-space decals) --------------------------------
  // tire-polished bands in each travel lane (cool-neutral, not warm)
  for (const z of [-25, -22, -19, -16])                       // 2 travel lanes on the narrowed road
    decal(240, 2.6, 0, z, { color: 0x3a3c3e, opacity: 0.12 });
  // sun-bleached patches (reference: ~#8a8b8d): soft-edged radial fade so they
  // read as worn asphalt, not pasted rectangles
  // (cycle-7) tighter falloff + smaller/weaker patches — the old wide soft
  // radial read as a fog smear hovering on the road, not worn asphalt
  const bleachTex = canvasTex((c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, w * 0.12, w / 2, h / 2, w * 0.44);
    g.addColorStop(0, 'rgba(140,141,144,0.5)');
    g.addColorStop(0.55, 'rgba(140,141,144,0.32)');
    g.addColorStop(0.85, 'rgba(140,141,144,0.08)');
    g.addColorStop(1, 'rgba(140,141,144,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }, 128, 128, 1);
  decal(15, 8, -16, -20, { map: bleachTex, opacity: 0.38 });
  decal(20, 6, 55, -24, { map: bleachTex, opacity: 0.32 });
  decal(12, 6, -70, -17, { map: bleachTex, opacity: 0.28 });
  decal(16, 11, 30, -22, { color: 0x515254, opacity: 0.22 });   // fresher repave, cool-dark
  // tar-snake crack clusters (shared alpha texture, varied rotation/scale)
  const tarTex = canvasTex((c, w, h) => {
    c.strokeStyle = 'rgba(63,64,66,0.9)'; c.lineWidth = 3; c.lineCap = 'round';  // cool tar (#4f5052 family)
    for (let i = 0; i < 2; i++) {
      c.beginPath(); c.moveTo(10, h * (0.3 + i * 0.4));
      for (let x = 10; x < w - 10; x += 24)
        c.quadraticCurveTo(x + 12, h * (0.3 + i * 0.4) + (hash(x + i * 7) - 0.5) * 52,
                           x + 24, h * (0.3 + i * 0.4) + (hash(x + i * 13) - 0.5) * 30);
      c.stroke();
    }
  }, 256, 128, 1);
  for (const [x, z, r, s] of [[-55, -16, 0.2, 1], [14, -24, -0.3, 1.2], [82, -20, 0.55, 0.9]]) {
    const m = decal(26 * s, 12 * s, x, z, { map: tarTex, opacity: 0.8 });
    m.rotation.z = r;
  }
  // oil stains where cars park (radial-gradient blot; front + rear axle drips)
  const oilTex = canvasTex((c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(28,26,22,0.65)'); g.addColorStop(1, 'rgba(28,26,22,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }, 64, 64, 1);
  // F4 (was x=45) pulled to x=36 so it clears Building B's new garage-driveway cut
  // (x 47..61) — no car parked across the driveway mouth (user ask).
  // NEAR bays (last 3) clustered BETWEEN the two near driveways (left cut −20..−12,
  // right cut 29..37): the 3 spots pack at x ≈ −1..+17, so their oil stains sit in
  // that curbside run and never under a driveway mouth (SV: 1400–1414 Kelton).
  // FAR bays (z-28) sit in the curbside runs BETWEEN the per-property driveway cuts.
  // R7 fix: a prior pass had merged two far bays into one (F3=30/F4=40 → a single
  // x=36.5), silently dropping the far side to 3 bays instead of 4 — restored here
  // to FOUR (F1-F4). R9: the cottage's side-access cut (x 17..24) is RESTORED (a
  // prior R8 pass had deleted it to make F2/F3/F4 contiguous — unnecessary, per
  // the user: there's enough open curb LEFT of the cottage driveway to seat all 3
  // bays without removing it). F2/F3/F4 now pack as ONE contiguous row in the open
  // span between the cream flank (x-19) and the cottage flank (x11) instead of
  // spreading past the cottage cut (vehicles.js KEEPCLEAR.far / SPLIT_DRIVEWAYS.far
  // updated to match, see that file's cluster-packing logic):
  //   F1 = -45   (x<-40 run, left of the cream flank)
  //   F2 = -13   (cream→cottage run -19..11, left slot — clears the cream flank by 6)
  //   F3 =  -4   (cream→cottage run, middle slot — 9 from F2, 9 from F4, bumper-to-
  //               bumper spacing, none of the three overlapping)
  //   F4 =   5   (cream→cottage run, right slot — clears the cottage flank by 6)
  const bays = [[-45, -28], [-13, -28], [-4, -28], [5, -28], [-1, -13.5], [8, -13.5], [17, -13.5]];
  // ORCHESTRATOR NOTE (vehicles.js, not edited here): KEEPCLEAR.far[0] (cream) is
  // unchanged at [-40, -19] — still a safe/correct no-park zone. The cottage entry
  // ([11,30] in KEEPCLEAR.far, [17,24] in SPLIT_DRIVEWAYS.far) is RESTORED to match
  // the driveway cut re-added below, so F2/F3/F4 (all left of x11) still fall in
  // ONE cluster in vehicles.js's packLayout (nothing straddles or sits right of the
  // cottage cut), and the split zone simply has nothing to split there.
  bays.forEach(([bx, bz], i) => {
    decal(4.5, 3, bx - 2 + hash(i) * 1.5, bz + (hash(i + 5) - 0.5) * 2, { map: oilTex, opacity: 0.8 });
    decal(3, 2, bx + 2.5 + hash(i + 11), bz + (hash(i + 17) - 0.5) * 2, { map: oilTex, opacity: 0.6 });
  });

  // utility-cut repave patches: rectangular trench-cuts with a darker fill + a
  // crisp saw-cut border, the giveaway of a residential street that's been dug up
  // for water/gas work. Subtle enough not to fight the monitoring read.
  const patchTex = canvasTex((c, w, h) => {
    noiseFill(c, w, h, '#5a5c5e', 16);                       // cooler-dark fresh asphalt
    c.strokeStyle = 'rgba(38,39,41,0.75)'; c.lineWidth = 4;  // saw-cut edge
    c.strokeRect(2, 2, w - 4, h - 4);
    c.strokeStyle = 'rgba(30,31,33,0.5)'; c.lineWidth = 2;   // sealant seam just inside
    c.strokeRect(6, 6, w - 12, h - 12);
  }, 128, 96, 1);
  decal(9, 5, -62, -24, { map: patchTex, opacity: 0.6 });   // far-lane trench patch
  decal(7, 4, 48, -16, { map: patchTex, opacity: 0.55 });   // near-lane patch

  // ---- faint CENTER-LANE hint: Kelton stays unpainted (reference brief delta #4
  // — the double-yellow was invented and is gone), but a real 2-way residential
  // street still reads down the middle: the crown seam where the two travel
  // directions meet collects a faint darker oil/debris line and the paving joint
  // between the two lane pours. Drawn as a soft worn seam at road-center z=-33.5,
  // NOT paint — just enough to say "two lanes" without a marking. (road center
  // moved to z=−20.5 with the R5 narrowing)
  const centerSeamTex = canvasTex((c, w, h) => {
    c.clearRect(0, 0, w, h);
    // soft central darkening band (oil/grit collects along the crown)
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(40,41,43,0)');
    g.addColorStop(0.5, 'rgba(40,41,43,0.55)');
    g.addColorStop(1, 'rgba(40,41,43,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // wandering hairline paving joint threaded down the seam
    c.strokeStyle = 'rgba(30,31,33,0.6)'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, h * 0.5);
    for (let x = 0; x <= w; x += 20)
      c.lineTo(x, h * 0.5 + (hash(x * 0.13) - 0.5) * h * 0.4);
    c.stroke();
  }, 512, 24, 1);
  decal(240, 1.3, 0, -20.5, { map: centerSeamTex, opacity: 0.5 });

  // ---- mid-block crosswalk at the RIGHT edge of the camera frame (brief delta
  // #5 — pairs with the count lines): white ladder bars + XING approach paint,
  // both worn/faded like real road paint
  const barTex = canvasTex((c, w, h) => {
    noiseFill(c, w, h, '#e8e6df', 10);
    c.globalAlpha = 0.35; c.fillStyle = '#9a9a96';            // tire-path wear
    for (let i = 0; i < 5; i++) { c.beginPath();
      c.ellipse(hash(i + 3) * w, hash(i + 9) * h, w * 0.2, h * 0.4, 0, 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }, 128, 32, 1);
  for (let z = -29; z <= -12; z += 3.4) {                     // ladder bars span the narrowed road, long axis = travel
    const b = decal(7.5, 1.15, 106, z, { map: barTex, opacity: 0.82 });
    b.receiveShadow = true;
  }
  const xingTex = canvasTex((c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(235,233,226,0.95)';
    c.font = `700 ${h * 0.78}px Arial Narrow, system-ui`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('XING', w / 2, h * 0.54);
  }, 256, 96, 1);
  // approach lettering in each lane before the bars (readable along travel)
  const xn = decal(10, 4.2, 88, -16, { map: xingTex, opacity: 0.75 });
  xn.rotation.z = Math.PI;                                     // near lane reads for its direction
  decal(10, 4.2, 88, -24, { map: xingTex, opacity: 0.75 });    // far lane

  // ---- sidewalks: world-space expansion joints + a couple of unique blemishes
  const jointMat = new THREE.MeshBasicMaterial({ color: 0x6f6654, transparent: true,
    opacity: 0.5, depthWrite: false });
  for (let x = -116; x <= 116; x += 7.7) {                    // far walk joints (z −35, was −61)
    const j = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 3.0), jointMat);
    j.rotation.x = -Math.PI / 2; j.position.set(x, 0.02, -35); j.renderOrder = ord++; scene.add(j);
  }
  for (let x = -118; x <= 118; x += 8.4) {                    // near walk joints (z −2.5)
    const j = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 6.0), jointMat);
    j.rotation.x = -Math.PI / 2; j.position.set(x, 0.02, -2.5); j.renderOrder = ord++; scene.add(j);
  }
  const crackTex = canvasTex((c, w, h) => {
    c.strokeStyle = 'rgba(70,64,52,0.8)'; c.lineWidth = 2.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(w * 0.5, 2);
    for (let y = 2; y < h; y += 18)
      c.lineTo(w * 0.5 + (hash(y) - 0.5) * w * 0.7, y + 9);
    c.stroke();
  }, 64, 128, 1);
  decal(2.2, 5.5, 27, -2.5, { map: crackTex, opacity: 0.9 });  // cracked near slab
  decal(1.8, 2.6, -58, -35, { map: crackTex, opacity: 0.8 });  // cracked far slab (z −35, was −61)
  decal(6, 3.0, -33, -2.5, { color: 0x7c7259, opacity: 0.18 }); // sidewalk stain
  // (REMOVED) the warm-tan "worn dirt line" decal at z-8.0 across the near parkway:
  // it was a 240-wide unsegmented plane (#8a7a4e) riding over grass AND both driveway
  // aprons — the persistent "yellow line" the user kept flagging. Dropped entirely
  // (the near parkway reads as clean grass; no faux foot-wear band).

  // ---- curbs (SEGMENTED at the apron mouths — a driveway cut means the curb
  // actually stops), red no-parking paint on the flanking segments, dropped
  // ramp lips + flared wings, and flared clean-concrete aprons (per the SV refs:
  // 1414's wide sloping garage apron near-side, the east-side cut far-side) ----
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xb7ad96, roughness: 0.9 });
  const curbSeg = (x0, x1, z) => {
    const cb = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.5, 0.6), curbMat);
    cb.position.set((x0 + x1) / 2, 0.25, z);
    cb.receiveShadow = cb.castShadow = true; scene.add(cb);
  };
  // near curb (z -11): TWO cuts flanking the 3 parking bays (SV 1400–1414) —
  // LEFT gap x -20..-12 = 1414's apron mouth (P10: narrowed from -23.5..-8.5 so the
  // driveway fits ~2 cars), RIGHT gap x 29..37 = the second (1400-side) driveway.
  // The 3 near bays park in the -12..29 curbside run between the cuts.
  curbSeg(-120, -20, -11); curbSeg(-12, 29, -11); curbSeg(37, 120, -11);
  // far curb (z -30): ONE driveway per front-row property (user):
  //   cream mid-rise (x-47) → RIGHT-corner cut x -32..-27 (R7: narrowed to match
  //     the 5-wide corner garage door, was 9-wide -34..-25)
  //   orange cottage (x4, doors/stairs on the right) → SIDE-ACCESS cut x 17..24,
  //     between the cottage's right edge (x17) and Building B's left edge (x24) —
  //     RESTORED (R9): a prior R8 pass deleted this cut so F2/F3/F4 could run
  //     continuous, but the user says there's enough open curb LEFT of this cut
  //     to seat all 3 bays without removing it (see the bays comment above)
  //   grey Building B (x45) garage → cut x 49.5..58.5 (narrowed to ~garage width)
  curbSeg(-120, -32, -30); curbSeg(-27, 17, -30); curbSeg(24, 49.5, -30); curbSeg(58.5, 120, -30);

  const redMat = new THREE.MeshStandardMaterial({ color: 0xa33427, roughness: 0.85 });
  // paint shell hugging a curb segment by a hair — never across a mouth
  const redCurb = (x0, x1, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.505, 0.615), redMat);
    m.position.set((x0 + x1) / 2, 0.253, z);
    m.castShadow = false; m.receiveShadow = true; scene.add(m);
  };
  redCurb(-26, -20.1, -11); redCurb(-11.9, -6, -11);  // flanking 1414's LEFT cut (-20..-12)
  redCurb(23, 28.9, -11); redCurb(37.1, 43, -11);     // flanking the RIGHT cut (29..37)
  redCurb(-38, -32.1, -30); redCurb(-26.9, -21, -30); // flanking cream's right-corner cut (-32..-27, R7-narrowed)
  redCurb(11, 16.9, -30); redCurb(24.1, 30, -30);     // flanking cottage's side-access cut (17..24, RESTORED R9)
  redCurb(43.6, 49.4, -30); redCurb(58.6, 64.5, -30); // flanking Building B's garage cut (49.5..58.5)

  // dropped ramp lip filling each mouth (the actual curb cut) + flared wings
  // stepping the full curb down to the lip
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xd6cdb8, roughness: 0.95 });
  const lip = (x0, x1, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.14, 0.72), lipMat);
    m.position.set((x0 + x1) / 2, 0.07, z); m.receiveShadow = true; scene.add(m);
  };
  lip(-20, -12, -11); lip(29, 37, -11);      // near lips: LEFT cut (P10-narrowed) + RIGHT cut
  lip(-32, -27, -30); lip(17, 24, -30); lip(49.5, 58.5, -30);  // far lips: cream (R7-narrowed) / cottage (RESTORED R9) / garage
  const wing = (x, z, dir) => {                       // dir: +1 descends rightward
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.42, 0.62), curbMat);
    m.position.set(x, 0.14, z);
    m.rotation.z = dir * 0.30;
    m.receiveShadow = m.castShadow = true; scene.add(m);
  };
  // Wings are 2.0-wide tilted (±0.30 rad) curb-colored ramp boxes → x half-extent
  // ≈1.02. They MUST sit strictly inside the curb-cut gap, clear of the red-paint
  // inner edges, or the curb-colored ramp rides over the red no-parking segment.
  // BUG (R6 fix): wings were centred 0.8u OUTSIDE each gap edge (near -20.8/-11.2,
  // far -26.8/-11.2), so each spread ~1.7u onto the flanking curb segment — right
  // over the red paint (near red inner -20.1/-11.9; far red inner -26.1/-11.9),
  // and the y-0..0.35 ramp poked through the y-0..0.505 red box. Pulled inward so
  // every wing's outer extent stays inside the gap and off the red:
  //   near gap -20..-12: L -18.9 → [-19.92,-17.88], R -13.1 → [-14.12,-12.08]
  //   far  gap -26..-12: L -24.9 → [-25.92,-23.88], R -13.1 → [-14.12,-12.08]
  wing(-18.9, -11, -0.9); wing(-13.1, -11, 0.9);   // near LEFT wings inside the narrowed mouth (-20..-12)
  // near RIGHT cut 29..37: L 30.1 → [29.08,31.12], R 35.9 → [34.88,36.92], both inside
  // the gap and clear of the red inner edges (28.9 / 37.1)
  wing(30.1, -11, -0.9); wing(35.9, -11, 0.9);     // near RIGHT wings inside the mouth (29..37)
  // R7: cream cut narrowed to -32..-27 (5 wide) — wings keep the same 1.1-in-from-
  // edge offset as every other cut (L -32+1.1, R -27-1.1); at this narrower width
  // the two wings sit closer together (0.76 clear between them) but still don't
  // touch, and each stays 0.08 inside its gap edge, matching the margin pattern.
  wing(-30.9, -30, -0.9); wing(-28.1, -30, 0.9);   // cream cut wings (-32..-27, R7-narrowed)
  // cottage cut RESTORED (R9) at 17..24 (gap between cottage x17 and Building B
  // x24): wings at 18.1 → [17.08,19.12] and 22.9 → [21.88,23.92], each clearing
  // the red inner edges (16.9 / 24.1) by 0.18, same margin pattern as the other cuts
  wing(18.1, -30, -0.9); wing(22.9, -30, 0.9);     // cottage cut wings (17..24, RESTORED R9)
  wing(50.6, -30, -0.9); wing(57.4, -30, 0.9);     // garage cut wings (49.5..58.5)

  // ---- concrete GUTTER PAN: the drainage channel every LA street has between
  // the asphalt and the curb face — a ~0.9-wide light-concrete strip hugging the
  // road side of each curb, segmented around the apron mouths like the curb, with
  // a thin grime line where debris collects against the lip.
  // concrete pan texture: warm-light cast concrete with a continuous damp flow
  // stain down the channel centre (where runoff tracks) + faint transverse
  // trowel joints — so the pan reads as a poured drainage channel, not a flat bar
  const gutterTex = canvasTex((c, w, h) => {
    noiseFill(c, w, h, '#cabfa6', 12);
    const g = c.createLinearGradient(0, 0, 0, h);            // damp flow-line, channel centre
    g.addColorStop(0, 'rgba(120,112,92,0)');
    g.addColorStop(0.5, 'rgba(108,100,80,0.34)');
    g.addColorStop(1, 'rgba(120,112,92,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(120,112,94,0.4)'; c.lineWidth = 2; // transverse trowel joints
    for (let x = 24; x < w; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  }, 256, 24, 1);
  const gutterMat = new THREE.MeshStandardMaterial({ color: 0xd0c6ad, roughness: 0.92,
    map: gutterTex });
  const gutterPan = (x0, x1, zCurb, roadSide) => {   // roadSide: +1 = road at +z of curb, -1 = -z
    const gw = 0.9;
    const zc = zCurb + roadSide * (gw / 2 + 0.05);
    const len = x1 - x0;
    const gmat = gutterMat.clone();
    gmat.map = gutterTex.clone();
    gmat.map.needsUpdate = true;
    gmat.map.repeat.set(Math.max(1, Math.round(len / 6)), 1);  // square-ish texels along run
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, gw), gmat);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.006, zc);
    m.renderOrder = ord++; m.receiveShadow = true; scene.add(m);
    // grime line pooled against the curb lip
    decal(len, 0.22, (x0 + x1) / 2, zCurb + roadSide * 0.12,
          { color: 0x4a4638, opacity: 0.32 });
    // CLEAR asphalt→gutter joint: the dark paving seam where the road meets the
    // concrete pan (the "curb & gutter line" the street drains to)
    decal(len, 0.14, (x0 + x1) / 2, zCurb + roadSide * (gw - 0.02),
          { color: 0x26272a, opacity: 0.5 });
  };
  // near curb z=-11, road is on the -z side (road spans -30..-11); TWO mouths break
  // the pan: LEFT -20..-12, RIGHT 29..37 (the pan/gutter actually stops at each cut)
  gutterPan(-120, -20, -11, -1); gutterPan(-12, 29, -11, -1); gutterPan(37, 120, -11, -1);
  // far curb z=-30 (pulled +26), road is on the +z side; gaps at all three cuts
  // (cream — R7-narrowed -34..-25 → -32..-27 to match the garage door width —
  // cottage's gap 17..24 RESTORED R9, and Building B's garage)
  gutterPan(-120, -32, -30, 1); gutterPan(-27, 17, -30, 1); gutterPan(24, 49.5, -30, 1); gutterPan(58.5, 120, -30, 1);

  // flared apron: trapezoid plane, wider at the curb mouth than at the back
  const apronGeo = (backW, frontW, depth) => {
    const g = new THREE.PlaneGeometry(1, depth, 1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      // plane +y maps to world -z after rotation.x=-PI/2 (the far side)
      const w = p.getY(i) > 0 ? backW : frontW;
      p.setX(i, Math.sign(p.getX(i)) * w / 2);
    }
    g.computeVertexNormals(); return g;
  };
  // clean bright concrete, joint grid, edge darkening, slope gradient toward the
  // mouth, twin tire scuffs — clearly cleaner + lighter than the sidewalk slabs
  // clean bright concrete, joint grid, edge darkening, slope gradient toward the
  // mouth, twin tire scuffs — clearly cleaner + lighter than the sidewalk slabs
  const apronTex = (mouthAtTop) => canvasTex((c, w, h) => {
    noiseFill(c, w, h, '#cdc4ae', 12);               // warmer/darker concrete (was blown-white #ded6c2)
    const gr = c.createLinearGradient(0, mouthAtTop ? 0 : h, 0, mouthAtTop ? h : 0);
    gr.addColorStop(0, 'rgba(88,80,64,0.30)');       // darker at the mouth = slope cue
    gr.addColorStop(0.55, 'rgba(88,80,64,0.07)');
    gr.addColorStop(1, 'rgba(232,226,212,0.08)');    // subtly lighter at the back (not white glare)
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(104,96,78,0.55)'; c.lineWidth = 2;
    for (const fx of [1 / 3, 2 / 3]) {               // joint grid: 3 cols x 2 rows
      c.beginPath(); c.moveTo(w * fx, 0); c.lineTo(w * fx, h); c.stroke();
    }
    c.beginPath(); c.moveTo(0, h * 0.5); c.lineTo(w, h * 0.5); c.stroke();
    c.strokeStyle = 'rgba(90,82,66,0.7)'; c.lineWidth = 3;   // darker edges
    c.strokeRect(1.5, 1.5, w - 3, h - 3);
    c.strokeStyle = 'rgba(52,50,48,0.30)'; c.lineWidth = 5;  // twin tire scuffs
    for (const fx of [0.32, 0.68]) {
      c.beginPath(); c.moveTo(w * fx, 0);
      c.quadraticCurveTo(w * (fx + 0.02), h * 0.5, w * fx, h); c.stroke();
    }
  }, 256, 200, 1);
  const apronMk = (x, z, backW, frontW, depth, mouthAtTop) => {
    const m = new THREE.Mesh(apronGeo(backW, frontW, depth),
      new THREE.MeshStandardMaterial({ roughness: 0.93, map: apronTex(mouthAtTop) }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z);
    m.renderOrder = ord++; m.receiveShadow = true; scene.add(m);
  };
  // near apron (1414's): cuts the full near band — flared mouth at the near curb
  // (z-11, −z side = wider backW), running across parkway+sidewalk to the
  // frontage (z+0.5). Slope darkens toward the curb mouth (mouthAtTop true).
  // R5 apron-fit: mouth backW=7.6 sits WITHIN the -20..-12 curb-cut gap (mouth
  // spans -19.8..-12.2), clearing the red flanks (-26..-20.1 / -11.9..-6) by 0.3u
  // each side so the flare stays on the parkway side and never rides the red curb.
  apronMk(-16, -5.25, 7.6, 6.5, 11.5, true);   // LEFT: mouth 7.6 (in-gap) / back 6.5 = ~2-car drive
  // RIGHT near driveway (1400-side): mirror of the left apron, mouth at the near curb
  // (z-11) inside the 29..37 curb-cut gap. mouth backW=7.6 spans 29.2..36.8 (centred
  // x=33), clearing the red flanks (23..28.9 / 37.1..43) by 0.3u each side.
  apronMk(33, -5.25, 7.6, 6.5, 11.5, true);    // RIGHT: mouth 7.6 (in-gap) / back 6.5 = ~2-car drive
  // FAR aprons — one per property, mouth inside each curb-cut gap, running back
  // across the parkway+sidewalk to the building:
  // cream mid-rise: R7 fix — this apron was WIDER than the corner garage door it
  // feeds (houses.js garageW:5, ~5-wide door centered x-29.5), the same bug fixed
  // for Building B's garage driveway above. Narrowed to roughly the garage width:
  // mouth 5.5 / back 5 (was mouth 8.4 / back 7), matching the curb-cut gap narrowed
  // to -32..-27 above. Depth/z unchanged (curb -30 → depth 8.5 → back edge z-38.5,
  // a hair PAST the building's front wall z-38, per houses.js block x-47/d18 →
  // front = -47+9 = -38) so the apron still guarantees reaching the garage face.
  apronMk(-29.5, -34.25, 5, 5.5, 8.5, false);   // cream mid-rise, right-corner driveway (curb -30 → bldg -38.5)
  // orange cottage: side-access driveway RESTORED (R9) — a prior R8 pass removed
  // this apron so F2/F3/F4 could pack continuous across its footprint; the user
  // says that wasn't necessary (enough open curb left of the cut to seat all 3
  // bays), so it's back at its pre-R8 position: side-access cut in the gap between
  // the cottage's right edge (x17) and Building B's left edge (x24). Apron centred
  // x20.5, mouth 6.5 (in the 17..24 gap, clearing the red flanks 11..16.9/24.1..30
  // by 0.25u each side). Same curb→wall depth as the cream apron (z-30 → z-38.5);
  // the drive then CONTINUES past the building line as a deep driveStrip below.
  apronMk(20.5, -34.25, 5.5, 6.5, 8.5, false);  // cottage, side-access driveway (curb -30 → wall -38.5, RESTORED R9)
  // ORCHESTRATOR NOTE (shrubs.js, not edited here): the cottage driveway is back at
  // x20.5. shrubs.js's hedgeRun(-8, 16, -36.8, 2.8, 8, [[7.3,3.5],[13.5,4]]) has a
  // gap at [13.5,4] for an EARLIER driveway position (stale even before this pass);
  // the current x20.5 cut already falls inside the natural unhedged break between
  // that hedgeRun (ends x16) and the next one, hedgeRun(25, 65, -36.8, ...) (starts
  // x25) — the x16..25 gap already clears the x17..24 curb cut, so no shrubs.js
  // change looks necessary (not verified here — out of this agent's file scope).
  // Building B garage driveway: NARROWED to ~garage width (mouth 9 / back 8 — was 13.6/11,
  // wider than the 8.5-wide garage door, the user's flag). Runs the full way from the far
  // curb cut (49.5..58.5) up to the garage door (z≈-40), drawn on top of the lawn so it
  // covers the grass; the below-grade opening (houses.js) reads as the descent.
  apronMk(54, -35, 8, 9, 10, false);

  // ---- driveways EXTEND into the property-lot depth (user ask) ----
  // Concrete strips running from each apron back toward the buildings/garages,
  // so a driveway reads as a real path into the lot, not just a curb cut.
  // Far strip threads the building GAP (x -27..-9, drive centred x-19) to an
  // interior parking court behind the front row (see the far driveStrip call);
  // near strip continues 1414's driveway toward the frame-bottom garage.
  // clean drive-slab texture: warm cast concrete + a soft slope gradient only —
  // deliberately no baked joint grid or scuff strokes (those stretched on the
  // long strip into an overlapping-line scribble). Panel scoring is added as
  // clean, evenly-spaced transverse decals in driveStrip instead.
  const driveSlabTex = (mouthAtTop) => canvasTex((c, w, h) => {
    noiseFill(c, w, h, '#cdc4ae', 12);
    const gr = c.createLinearGradient(0, mouthAtTop ? 0 : h, 0, mouthAtTop ? h : 0);
    gr.addColorStop(0, 'rgba(88,80,64,0.26)');         // darker at the mouth = slope cue
    gr.addColorStop(0.6, 'rgba(88,80,64,0.06)');
    gr.addColorStop(1, 'rgba(232,226,212,0.06)');      // subtly lighter toward the lot
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(90,82,66,0.55)'; c.lineWidth = 3;   // edge darkening only
    c.strokeRect(1.5, 1.5, w - 3, h - 3);
  }, 256, 200, 1);
  const driveStrip = (x, zNear, zFar, w, mouthAtTop, padW) => {
    const depth = Math.abs(zFar - zNear);
    const mid = (zNear + zFar) / 2;
    // CLEAN drive slab: plain cast concrete + a soft slope gradient, but NO baked
    // joint grid (the apron texture's 3-col grid + tire-scuff strokes stretched
    // across the long strip and piled onto the transverse joint decals — the
    // "penciled control lines stacking into a scribble" the user flagged). The
    // only score lines are the evenly-spaced transverse panel joints below.
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, depth),
      new THREE.MeshStandardMaterial({ roughness: 0.93, map: driveSlabTex(mouthAtTop) }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.028, mid);
    m.renderOrder = ord++; m.receiveShadow = true; scene.add(m);
    // low concrete side-lips so the drive reads slightly recessed/edged in the lawn
    const lipM = new THREE.MeshStandardMaterial({ color: 0xcabfa6, roughness: 0.95 });
    for (const sx of [-w / 2, w / 2]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, depth), lipM);
      e.position.set(x + sx, 0.07, mid);
      e.receiveShadow = true; scene.add(e);
    }
    // transverse control joints: one clean line per poured panel, spaced to divide
    // the depth EVENLY into whole panels (~5u each) so no two lines crowd/overlap.
    const zLo = Math.min(zNear, zFar), zHi = Math.max(zNear, zFar);
    const nPanel = Math.max(2, Math.round(depth / 5));
    for (let p = 1; p < nPanel; p++)
      decal(w - 0.6, 0.12, x, zLo + depth * p / nPanel, { color: 0x6f6654, opacity: 0.35 });
    // twin tire-path stains tracking the wheels down the drive toward the garage
    for (const sx of [-w * 0.2, w * 0.2])
      decal(0.9, depth * 0.9, x + sx, mid, { color: 0x453f30, opacity: 0.13 });
    // parking pad / court where the drive reaches the garage at the lot end —
    // a wider slab so the driveway ARRIVES somewhere in the property depth
    if (padW) {
      const pz = zFar + (zFar > zNear ? 2.6 : -2.6);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(padW, 5.5),
        new THREE.MeshStandardMaterial({ roughness: 0.94, map: driveSlabTex(mouthAtTop) }));
      pad.rotation.x = -Math.PI / 2; pad.position.set(x, 0.026, pz);
      pad.renderOrder = ord++; pad.receiveShadow = true; scene.add(pad);
      // faint dark garage-mouth shadow line at the very back of the pad
      decal(padW * 0.7, 1.0, x, pz + (zFar > zNear ? 2.4 : -2.4),
            { color: 0x1c1a16, opacity: 0.3 });
    }
  };
  // far side: one driveway PER PROPERTY at the correct side (cream x-29.5, cottage
  // x20.5, garage x54) — each a curb-to-building apron above; only the cottage
  // continues past its building line as a deep driveStrip (no shared rear court —
  // that old shared gap-drive at x-19 was removed).
  // cottage SIDE-ACCESS drive: RESTORED (R9) — continues the x20.5 apron from the
  // building line (z-38.5) DEEPER into the lot (z-50) alongside the cottage's
  // right-side stairs (houses.js sideX≈17.9, walkway spans roughly z-39..-53) —
  // reads as a real access drive to the side doors/stairs, not a stub. Width
  // matches the apron's back width (5.5) so there's no visible step at the
  // handoff. Ends in a 6-wide pad centred z≈-52.6 (spans -49.85..-55.35) as the
  // arrival/turnaround point, clear of the rear property wall (z-64) by ~9u and
  // clear of both flanking buildings in x (cottage ends x17, Building B starts
  // x24; pad 6-wide at x20.5 spans 17.5..23.5, 0.5 clearance each side). F2/F3/F4
  // (vehicles.js) now pack in the OPEN curb LEFT of this driveway instead.
  driveStrip(20.5, -38.5, -50, 5.5, false, 6);
  // near driveways (P10: narrowed to ~2 cars each): from the near frontage edge
  // (z+0.5) toward the near garages (z+22), width 6.5, pad 8. TWO of them now — the
  // LEFT (1414's, x-16) and the RIGHT (1400-side, x33) — flanking the 3 parking bays.
  driveStrip(-16, 0.5, 22, 6.5, true, 8);
  driveStrip(33, 0.5, 22, 6.5, true, 8);

  // ---- R7: NEAR-SIDE PEDESTRIAN WALKWAY (1414's front-door entry, not a car
  // driveway) — shrubs.js's near trimmed-hedge row leaves an unhedged entry gap
  // at x=7.3 (hedgeRun(-52, 48, 4, ..., [[-47,3.5],[-16,4],[7.3,3.5],[33,4],[45,3.5]]))
  // for 1414's lobby door, and every building's block() (houses.js) builds a short
  // "entry apron" from its stoop out to the lot line — but that apron only reaches
  // the lot line, well short of the actual public sidewalk. Nothing paved carried
  // the walk the rest of the way, so it visually dead-ended in bare parkway/frontage
  // grass before ever touching the sidewalk band (the user's flag: "doesn't
  // connect"). This strip closes that gap: same concrete as the sidewalk itself
  // (a pedestrian walk, not a flared car apron), width 2.86 (trimmed 35% narrower,
  // stays aligned to x=7.3 entry), running from the near sidewalk's street edge
  // (z-5.5) through the sidewalk band (z -5.5..0.5) and on into the frontage to z8 —
  // comfortably overlapping wherever 1414's own entry apron lands, so the two pieces
  // read as one continuous walk with no bare-grass gap. Does NOT cross the parkway
  // to the curb (z-11) as it did before.
  const walkMat = concreteMat(2, 8);
  const nearWalk = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 13.5), walkMat);
  nearWalk.rotation.x = -Math.PI / 2;
  nearWalk.position.set(7.3, 0.025, 1.25);
  nearWalk.receiveShadow = true; nearWalk.renderOrder = ord++; scene.add(nearWalk);

  // ---- R5 P8: the jacaranda LEAF LITTER scatter (R4's instanced petal/leaf
  // InstancedMesh under the canopies) has been REMOVED per user feedback —
  // it cluttered the sidewalks and the monitoring read. Bloom color now lives
  // only in the tree canopies (shrubs.js). No ground-scatter is drawn here.
}
