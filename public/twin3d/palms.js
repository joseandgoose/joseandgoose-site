// twin3d/palms.js — LA Washingtonia fan palms (Mexican/California fan palm, the
// Beverly Hills / Coliseum silhouette): VERY TALL slender ringed-fibrous trunks
// carrying a MODEST rounded crown — a neat green fan-burst of ~34 alpha-card fan
// blades radiating up/out/down from one apex (reference-matched to real LA palms:
// a rounded fan, not an overcrowded pom-pom), plus a modest brown dead-frond skirt. Dappled frond shadows via customDepthMaterial so the
// shadow follows the alpha cutout. The tall bare trunk keeps the sightline open.
// Reference-matched to Kelton Ave: only TWO palms (sparse on this street) —
// the big pepper/jacaranda canopy trees are the heroes, in shrubs.js.
// OWNED BY palms agent — other agents must not edit.
//
// Exports:
//   buildPalms(scene)
import * as THREE from 'three';
import { hash } from './shared.js';

// trunk texture (this module's signature has no renderer, so build the
// CanvasTexture directly — default anisotropy is fine on a trunk a few px wide).
// Washingtonia robusta trunk: grey-brown weathered column with CLOSELY-SET ringed
// leaf scars (a shadowed groove + a lighter lip below each) and a faint diamond
// cross-hatch from the old leaf-base fibers — the self-cleaned-trunk signature.
function trunkTexture() {
  const w = 48, h = 160;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#786c53'; g.fillRect(0, 0, w, h);       // weathered grey-brown base
  for (let x = 0; x < w; x += 3) {                        // faint vertical weather streaks
    g.fillStyle = `rgba(${88 + ((x * 37) % 28)},${78 + ((x * 17) % 20)},${58 + ((x * 11) % 16)},0.22)`;
    g.fillRect(x, 0, 2, h);
  }
  for (let y = 0; y < h; y += 6) {                        // closely-set ring leaf scars
    const j = hash(y * 1.7);                              // per-ring variation (not a uniform stack)
    g.fillStyle = `rgba(46,37,23,${(0.46 + j * 0.18).toFixed(3)})`; g.fillRect(0, y, w, 2);        // shadow groove
    g.fillStyle = `rgba(${150 + (j * 14 | 0)},${130 + (j * 12 | 0)},96,0.40)`; g.fillRect(0, y + 2, w, 1.4); // lit lip below
  }
  for (let x = 1; x < w; x += 4) {                        // fine vertical leaf-base fibers
    g.fillStyle = `rgba(58,46,29,${(0.10 + hash(x * 2.3) * 0.10).toFixed(3)})`;
    g.fillRect(x, 0, 1, h);
  }
  g.strokeStyle = 'rgba(58,46,29,0.26)'; g.lineWidth = 1; // diamond cross-hatch of leaf bases
  for (let d = -h; d < w + h; d += 11) {
    g.beginPath(); g.moveTo(d, 0); g.lineTo(d + h, h); g.stroke();
    g.beginPath(); g.moveTo(d, 0); g.lineTo(d - h, h); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 7);  // more rings up a taller trunk
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// fan-frond alpha texture: a costapalmate Washingtonia fan — a hinge petiole
// opening into ~35 stiff segments, each a curved tapering blade that FORKS at
// the tip (the split-leaflet signature of an LA fan palm) with a bright midrib
// (costa) and threadlike fibers hanging between the segment tips. Drawn near-
// white so material.color tints it — one texture serves every green (and the
// brown skirt) variant.
function frondTexture() {
  const w = 256, h = 176;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  const ox = w * 0.15, oy = h / 2;                  // fan origin (hinge / end of petiole)
  // petiole: a tapered stalk, thicker at the cut base, narrowing into the hinge
  g.lineCap = 'round'; g.strokeStyle = 'rgba(214,210,182,1)';
  g.lineWidth = 6.5; g.beginPath(); g.moveTo(0, oy); g.lineTo(ox * 0.55, oy); g.stroke();
  g.lineWidth = 4.2; g.beginPath(); g.moveTo(ox * 0.55, oy); g.lineTo(ox, oy); g.stroke();

  const blades = 35;
  const tips = [];                                  // tip points, for the hanging fibers
  for (let i = 0; i < blades; i++) {
    const tN = i / (blades - 1);
    const a = (tN - 0.5) * 2.3;                      // fan arc angle (radians)
    // center segments longest, edge segments shorter -> rounded palmate silhouette
    const len = w * (0.86 - 0.26 * a * a) * (0.9 + hash(i + 40) * 0.16);
    const lum = 204 + Math.floor(hash(i + 2) * 42); // keep BRIGHT so material.color tints
    // subtle per-segment hue drift: some blades lean yellow-green, some cooler
    // blue-green, so the fan isn't one flat tint once material.color multiplies in
    const warm = (hash(i + 91) - 0.5) * 22;
    const rC = lum - 22 + warm, gC = lum - 8, bC = lum - 34 - warm;
    // costapalmate hinge: segments insert along a SHORT costa (deeper for the center
    // blades), so their bases fan from a small wedge, not one pinpoint
    const hingeR = w * 0.045 + w * 0.05 * (1 - Math.min(1, a * a));
    // curved centerline: outer segments droop more (gravity on a stiff fan blade)
    const steps = 7, cl = [];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps, rr = hingeR + len * u;
      const droop = (Math.abs(a) * 9 + len * 0.09) * u * u;
      cl.push([ox + Math.cos(a) * rr, oy + Math.sin(a) * rr * 0.66 + droop]);
    }
    // blade body: a tapering ribbon offset left/right of the centerline whose tip
    // FORKS into two prongs around a central notch — the split-leaflet Washingtonia
    // signature baked into the alpha so alphaTest cuts a forked, not blunt, tip
    const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
    const bwBase = 4.4, bwTip = 0.85;
    const halfW = u => bwBase * (1 - u) + bwTip * u;
    const [pxb, pyb] = cl[steps - 1], [qx, qy] = cl[steps];   // tip forward direction
    let fx = qx - pxb, fy = qy - pyb; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
    const prong = 3.4 + hash(i + 63) * 1.6, notch = 1.8;
    g.beginPath();
    for (let s = 0; s <= steps; s++) { const b = halfW(s / steps), [x, y] = cl[s];
      s === 0 ? g.moveTo(x + nx * b, y + ny * b) : g.lineTo(x + nx * b, y + ny * b); }
    g.lineTo(qx + nx * bwTip + fx * prong, qy + ny * bwTip + fy * prong);   // + prong tip
    g.lineTo(qx - fx * notch, qy - fy * notch);                            // fork notch (pulled back)
    g.lineTo(qx - nx * bwTip + fx * prong, qy - ny * bwTip + fy * prong);   // - prong tip
    for (let s = steps; s >= 0; s--) { const b = halfW(s / steps), [x, y] = cl[s];
      g.lineTo(x - nx * b, y - ny * b); }
    g.closePath();
    g.fillStyle = `rgba(${rC},${gC},${bC},1)`;      // blade body (subtle hue drift)
    g.fill();
    // bright midrib (costa) running the length of the segment down into the notch
    g.strokeStyle = `rgba(${Math.min(255, lum + 26)},${Math.min(255, lum + 34)},${lum - 6},0.95)`;
    g.lineWidth = 1.4; g.beginPath();
    for (let s = 0; s <= steps; s++) { const [x, y] = cl[s]; s === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.lineTo(qx - fx * notch, qy - fy * notch);
    g.stroke();
    // shaded pleat down each prong, defining the split leaflet
    g.strokeStyle = `rgba(${lum - 30},${lum - 16},${lum - 42},0.8)`; g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(qx - fx * notch, qy - fy * notch);
    g.lineTo(qx + nx * bwTip * 0.5 + fx * prong, qy + ny * bwTip * 0.5 + fy * prong);
    g.moveTo(qx - fx * notch, qy - fy * notch);
    g.lineTo(qx - nx * bwTip * 0.5 + fx * prong, qy - ny * bwTip * 0.5 + fy * prong);
    g.stroke();
    tips.push([qx, qy]);
  }
  // threadlike fibers sagging between neighboring segment tips (the "beard")
  g.strokeStyle = 'rgba(208,198,152,0.55)'; g.lineWidth = 0.8;
  for (let i = 0; i < tips.length - 1; i += 2) {
    const [x0, y0] = tips[i], [x1, y1] = tips[i + 1];
    g.beginPath(); g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 7 + hash(i) * 6, x1, y1);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// frond card: plane whose x-axis carries the texture length, bent for droop AND
// folded along its midrib (costa) so the blade isn't papery-flat — the center
// rides up while the edges hang, a taco fold that deepens toward the tip so the
// frond catches sun on its spine and shades in its trough (real fan-frond form).
function cardGeo(len, wid, droop) {
  const geo = new THREE.PlaneGeometry(len, wid, 8, 2);   // width row=2 -> a center spine
  const pos = geo.attributes.position;
  for (let v = 0; v < pos.count; v++) {
    // clamp: float32 rounding of the plane's edge x (-len/2) leaves u a hair
    // negative, and Math.pow(negative, 2.2) below is NaN -> NaN vertex -> NaN
    // bounding sphere -> broken frustum culling (a black fill over the frame).
    const u = Math.min(1, Math.max(0, (pos.getX(v) + len / 2) / len)); // 0 base -> 1 tip
    const fold = (1 - Math.abs(pos.getY(v)) / (wid / 2)) * wid * 0.18; // center up, edges 0
    pos.setZ(v, -Math.pow(u, 2.2) * droop + fold * (0.35 + u * 0.65)); // stiff base, tip arches over
    pos.setX(v, pos.getX(v) + len / 2);                   // pivot at the base
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildPalms(scene) {
  const trunkMat = new THREE.MeshStandardMaterial({ map: trunkTexture(), roughness: 0.95 });
  const frondTex = frondTexture();
  // tinted card material + matching depth material (without the depth override,
  // alpha-tested cards cast full-rectangle shadows — the classic gotcha)
  const cardMat = (color) => {
    // emissiveMap = the frond alpha texture at a fraction of the color: a cheap
    // leaf-translucency fake so backlit fronds (sun from left) don't read black
    const c = new THREE.Color(color);
    const m = new THREE.MeshStandardMaterial({ map: frondTex, color, alphaTest: 0.45,
      side: THREE.DoubleSide, roughness: 0.9,
      emissive: c.clone().multiplyScalar(0.35), emissiveMap: frondTex });
    m.userData.depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking, map: frondTex, alphaTest: 0.45 });
    return m;
  };
  // ordered sunlit -> shade: top-of-crown fronds catch sun (yellow-green), fronds
  // deeper/lower in the crown read cooler and darker (blue-green in the shadow)
  const greens = [0x7ba650, 0x6a9646, 0x57833c, 0x477232, 0x386028, 0x2c4d21].map(cardMat);
  const brown = cardMat(0x8f7648);
  // full-size fan cards, sparsely placed — a modest rounded crown of a few dozen
  // fronds atop the very tall trunk (correct real-palm proportion, not a dense ball)
  const liveGeo = cardGeo(8.8, 4.6, 3.2), skirtGeo = cardGeo(4.0, 2.8, 2.2);
  const card = (geo, mat) => {
    const f = new THREE.Mesh(geo, mat);
    f.castShadow = true;
    f.customDepthMaterial = mat.userData.depth;
    return f;
  };

  // --- LA fan palms: slender curved trunk built from stacked segments along a
  // per-palm lean, a rounded 5-ring parasol crown of fan cards + spear cluster,
  // modest dead-frond skirt below
  const palm = (x, z, hgt, seed) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    g.rotation.y = hash(seed + 4) * Math.PI * 2;          // face each palm differently
    const lean = (hash(seed) - 0.5) * 0.9;                // signed curve amount
    const segs = 8, pts = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      pts.push(new THREE.Vector3(lean * u * u * hgt * 0.30, u * hgt, 0));
    }
    // slender near-columnar trunk with a swollen base then a slight taper toward
    // the crown — real Washingtonia proportions (a thin trunk keeps the sightline
    // clear, which is the whole reason palms are the good tree here)
    const rad = u => 0.22 - 0.08 * u + 0.20 * Math.exp(-u * 9);
    for (let i = 0; i < segs; i++) {
      const a = pts[i], b = pts[i + 1], mid = a.clone().lerp(b, 0.5);
      const r0 = rad(i / segs), r1 = rad((i + 1) / segs);
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(r1, r0, a.distanceTo(b) * 1.08, 10), trunkMat);
      seg.position.copy(mid);
      seg.rotation.z = -Math.atan2(b.x - a.x, b.y - a.y);
      seg.castShadow = true; g.add(seg);
    }
    const top = pts[segs];
    // SINGLE CROWN APEX (R5 P2 fix): every frond radiates from ONE central origin
    // point at the top of the trunk, so the crown reads as a proper radial ball/fan
    // instead of an oblong column of stacked origins. The trunk connects to this one
    // apex; the crown's vertical spread comes purely from each frond's tilt + built-in
    // card droop, NOT from staggering the bases up the trunk.
    const apex = new THREE.Vector3(top.x, top.y + 0.4, 0);
    // tiny near-apex jitter keeps coincident cards from z-fighting without breaking
    // the single-origin read (all bases sit within a few cm of the apex)
    const atApex = (f, s) =>
      f.position.set(apex.x, apex.y + (hash(s) - 0.5) * 0.14, apex.z + (hash(s + 5) - 0.5) * 0.14);
    // Rounded parasol crown (real Washingtonia): a hemispherical fan of fronds that
    // ARCH — newest fronds tilt up-and-out, mid fronds spread near-horizontal, the
    // lowest hang. `tilt` is the base angle applied to rotation.z: POSITIVE = tip
    // lifted above horizontal, negative = tip hangs. The card's own built-in droop
    // then curves each blade over, so an up-tilted frond arches up then bends down —
    // the open-parasol read. Because all bases share the apex, tilt alone builds the
    // dome. Sun/shade is baked in by brighter greens up top, cooler-darker lower (`gi`).
    // Moderate rounded crown (reference-matched to reference/trees/palm_1.png &
    // palm_2.png — the Coliseum Washingtonia): a real LA fan palm carries a NEAT
    // rounded fan-burst of only ~25-40 fronds, NOT a dense green ball. A prior pass
    // over-corrected to ~158 blades and read as a crowded pom-pom. EIGHT tilt bands
    // from a near-vertical center spear down to a heavy droop, each a FULL azimuth
    // ring but SPARSELY populated, so the crown reads as a believable rounded fan
    // (~34 live blades) atop the very tall slim trunk. Sun/shade baked in — bright
    // greens up top, cooler-darker deeper/lower (`gb`).
    // ring: [count, tilt, tiltJitter, scale, greenBase]
    const rings = [
      [3,  1.12, 0.18, 0.60, 0],  // center spear: fresh upright growth (pointed top)
      [5,  0.74, 0.22, 0.84, 0],  // steep up-and-in
      [6,  0.42, 0.26, 0.98, 0],  // crown cap: young fronds up & out
      [6,  0.12, 0.28, 1.00, 1],  // upper: near-horizontal parasol spread
      [5, -0.20, 0.30, 1.00, 2],  // mid: arch begins
      [4, -0.52, 0.30, 0.98, 3],  // lower: arching down
      [3, -0.84, 0.28, 0.92, 4],  // drooping
      [2, -1.12, 0.26, 0.82, 5],  // skirt-adjacent: heavy hang
    ];
    rings.forEach(([count, tilt, tj, sc, gb], ri) => {
      for (let i = 0; i < count; i++) {
        const gi = Math.min(greens.length - 1, gb + (i % 2));   // two-tone within ring
        const f = card(liveGeo, greens[gi]);
        atApex(f, seed + i + ri * 53);
        // large golden-ish azimuth offset per ring so blades interleave between
        // rings and never stack into visible gaps — a seamless radial burst
        f.rotation.y = i * (Math.PI * 2 / count) + ri * 1.7 + hash(seed + i + ri * 17) * 0.34;
        f.rotation.z = tilt + (hash(seed + i + ri * 31) - 0.5) * tj;
        if (sc !== 1) f.scale.setScalar(sc);
        g.add(f);
      }
    });
    // inner filler: a few short upward fronds masking the bare apex at the crown
    // center — just enough to hide the hub, NOT to pack a dense dome
    for (let i = 0; i < 4; i++) {
      const f = card(liveGeo, greens[2]);
      atApex(f, seed + i + 137);
      f.rotation.y = i * (Math.PI * 2 / 4) + hash(seed + i + 20) * 0.5;
      f.rotation.z = 0.30 + hash(seed + i + 41) * 0.26;
      f.scale.setScalar(0.58);
      g.add(f);
    }
    // dead-frond skirt: a modest brown collar hanging from the same apex (LA street
    // palms are trimmed, so a shag not a full hula skirt) — steep downward tilt keeps
    // it HIGH under the crown so it never drops into the street sightline
    for (let i = 0; i < 7; i++) {
      const f = card(skirtGeo, brown);
      atApex(f, seed + i + 163);
      f.rotation.y = i * (Math.PI * 2 / 7) + 0.3;
      f.rotation.z = -(1.16 + hash(seed + i + 57) * 0.24);
      g.add(f);
    }
    scene.add(g);
  };
  // reference-matched (Kelton Ave street view): palms are SPARSE here — one hero
  // trunk on the east (far) side right of frame, one smaller in the distance.
  // The dominant canopy trees live in shrubs.js.
  // TALL Washingtonia proportion — same +26/R5 positions, raised height so the
  // slender trunk dominates and the dense crown reads modest atop it.
  palm(74, -37, 28, 3); palm(-106, -33, 19, 4);
}
