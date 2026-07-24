// twin3d/shrubs.js — non-palm flora, reference-matched to Kelton Ave street
// view: LARGE drooping pepper/jacaranda canopy trees are the street's heroes
// (dense willowy masses that half-hide the buildings and dapple the road),
// plus continuous trimmed hedge rows along both building frontages, and one
// subtle bougainvillea accent. Foliage uses tinted alpha-card masses with
// matching customDepthMaterial so cast shadows follow the leaf cutout.
// OWNED BY shrubs agent — other agents must not edit.
//
// Exports:
//   buildShrubs(scene)
import * as THREE from 'three';
import { hash } from './shared.js';

// foliage-mass alpha texture: center-weighted scatter of fine leaflets with a
// ragged edge and a few dangling wisps at the bottom (pepper-tree droop).
// Drawn near-white so material.color tints it — one texture, many greens.
function foliageTexture(seed) {
  const w = 256, h = 256;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  // BIPINNATE jacaranda: instead of a flat scatter of leaflets, draw many fine
  // FRONDS radiating from the crown center. Each frond is a curved rachis carrying
  // PAIRED leaflets that shrink toward the tip — the true bipinnate (fern-like)
  // signature. Fronds vary in length + curve so the silhouette is broken and lacy,
  // and light filters through the gaps between fronds (dappled, not a gumdrop).
  const fronds = 52;
  for (let fI = 0; fI < fronds; fI++) {
    const a = hash(seed + fI * 1.3) * Math.PI * 2;
    // reach: mostly mid, some long (ragged edge); vertical squashed for crown shape
    const reach = (0.26 + Math.pow(hash(seed + fI + 17), 0.72) * 0.66) * (w * 0.5);
    const curve = (hash(seed + fI + 29) - 0.5) * 1.0;          // gentle sideways bow
    const leaflets = 8 + Math.floor(hash(seed + fI + 41) * 9);
    const baseLum = 196 + Math.floor(hash(seed + fI + 53) * 54);
    const dirx = Math.cos(a), diry = Math.sin(a) * 0.86;
    const px = -diry, py = dirx;                               // rachis perpendicular
    for (let s = 1; s <= leaflets; s++) {
      const t = s / leaflets;
      const bow = Math.sin(t * Math.PI) * curve * reach * 0.16;
      const rx = cx + dirx * reach * t + px * bow;
      const ry = cy + diry * reach * t + py * bow;
      // lacy edge: probabilistically drop outer leaflets -> broken silhouette
      if (t > 0.55 && hash(seed + fI * 3 + s) < (t - 0.55) / 0.45 * 0.6) continue;
      const lum = baseLum + Math.floor((hash(seed + fI + s * 1.7) - 0.5) * 24);
      const op = 0.30 + hash(seed + fI + s) * 0.5;
      const leafLen = (2.7 - t * 1.7) * (0.8 + hash(seed + fI + s + 3) * 0.6);
      const leafW = leafLen * 0.4;
      // paired leaflets on both sides of the rachis (the bipinnate look)
      for (let sgn = -1; sgn <= 1; sgn += 2) {
        const off = (1.3 + t * 2.4) * (0.7 + hash(seed + fI + s + 7) * 0.6);
        g.fillStyle = `rgba(${lum - 10},${lum},${lum - 20},${op})`;
        g.save();
        g.translate(rx + px * sgn * off, ry + py * sgn * off);
        g.rotate(a + sgn * 0.6);                               // leaflet angled off rachis
        g.beginPath();
        g.ellipse(0, 0, leafLen, leafW, 0, 0, 7);
        g.fill();
        g.restore();
      }
    }
  }
  // jacaranda lavender bloom: sparse purple flecks threaded through the canopy
  // (drawn opaque so the green material tint can't fully wash them out)
  for (let i = 0; i < 90; i++) {
    const a = hash(seed + i + 555) * Math.PI * 2;
    const r = Math.pow(hash(seed + i + 611), 0.6) * 0.44;
    const x = w / 2 + Math.cos(a) * r * w;
    const y = h / 2 + Math.sin(a) * r * h * 0.86;
    const pv = 150 + Math.floor(hash(seed + i + 733) * 40);
    // lavender-blue flecks (blue-leaning, matches real jacaranda; was magenta-ish)
    g.fillStyle = `rgba(${pv - 22},${pv - 32},${pv + 55},${0.55 + hash(i + seed + 3) * 0.35})`;
    g.beginPath();
    g.ellipse(x, y, 2 + hash(seed + i + 21) * 3, 1.5 + hash(seed + i + 27) * 2.5,
              hash(seed + i) * 3, 0, 7);
    g.fill();
  }
  // dangling leaf strands off the lower edge — the willowy pepper signature
  for (let i = 0; i < 26; i++) {
    const x = w * (0.18 + hash(seed + i + 51) * 0.64);
    const y0 = h * (0.62 + hash(seed + i + 63) * 0.18);
    const len = h * (0.10 + hash(seed + i + 71) * 0.16);
    const lum = 200 + Math.floor(hash(seed + i + 83) * 45);
    g.strokeStyle = `rgba(${lum - 10},${lum},${lum - 20},0.85)`;
    g.lineWidth = 1.6 + hash(seed + i + 97) * 1.6;
    g.beginPath();
    g.moveTo(x, y0);
    g.quadraticCurveTo(x + (hash(seed + i) - 0.5) * 14, y0 + len * 0.6, x + (hash(seed + i + 3) - 0.5) * 10, y0 + len);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// lumpy organic blob: an icosahedron with per-vertex radial noise so the
// silhouette reads as an uneven leaf clump, not a smooth ball. Paired with a
// flatShading material this gives naturalized foliage instead of stacked geometry.
// `detail` (icosahedron subdivision level) defaults to 1 — the coarse facets are
// fine for the small VISIBLE bush/tuft blobs, where a card shell + flat shading
// sells the leafy read anyway. The shadow-caster clusters below (tree()/fgJac())
// pass a higher detail: at detail 1 (42 verts/80 tris) the caster's silhouette
// from the light's POV is a handful of big flat triangles, and even PCFSoft
// blur couldn't round that into a believable canopy shadow — it read as sharp
// geometric facets ("geometric jangle"). A denser mesh has no single facet big
// enough to survive as a visible hard edge once blurred.
function displacedBlob(radius, seed, detail = 1) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const f = 0.68 + hash(seed + i * 1.7) * 0.6;
    pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f);
  }
  geo.computeVertexNormals();
  return geo;
}

// fine GREEN leaf alpha texture for hedge/bush surfaces — a dense center scatter
// of small leaves with a ragged edge, drawn near-white so material.color tints
// it. No purple flecks (that's the jacaranda texture); this reads as clean
// broadleaf foliage for the near-frontage shrubs.
function bushLeafTexture(seed) {
  const w = 128, h = 128;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.clearRect(0, 0, w, h);
  for (let i = 0; i < 560; i++) {
    const a = hash(seed + i) * Math.PI * 2;
    const r = Math.pow(hash(seed + i + 31), 0.5) * 0.48;
    // ragged probabilistic edge so the alphaTest cutout isn't a hard disc
    if (r > 0.34 && hash(seed + i + 90) < (r - 0.34) / 0.16 * 0.85) continue;
    const x = w / 2 + Math.cos(a) * r * w, y = h / 2 + Math.sin(a) * r * h;
    const lum = 188 + Math.floor(hash(seed + i + 7) * 55);
    const op = 0.42 + hash(i + seed) * 0.5;
    g.fillStyle = `rgba(${lum - 34},${lum},${lum - 44},${op})`;
    g.save();
    g.translate(x, y); g.rotate(hash(seed + i + 3) * Math.PI);
    g.beginPath();
    g.ellipse(0, 0, 1.4 + hash(seed + i + 5) * 2.2, 0.9 + hash(seed + i + 9) * 1.4, 0, 0, 7);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildShrubs(scene) {
  const foliageTexA = foliageTexture(11), foliageTexB = foliageTexture(47);
  // night-aware foliage: the translucency-fake emissive reads daylight-green at
  // midnight. scene/backdrop key night off the ?sun= param — mirror the simple
  // check here (sun=now night-elevation is scene.js's domain; noted limitation).
  const NIGHT = new URLSearchParams(location.search).get('sun') === 'night';
  // building-clearance plane (derived from houses.js: every facade front sits at
  // world z=-38 after the Phase A far-side shift, block tops y~12.2). Foliage
  // cards whose bottom edge is below the rooftop band must stay in FRONT of the
  // facades; only high cards may overhang roofs. Screen-space overlap (trees
  // half-hiding buildings) survives because the camera looks down-street —
  // geometry piercing does not.
  const BLDG_FRONT_CLEAR = -35.0;   // low-band card-center floor (2.5+ margin to -38)
  const ROOF_CLEAR = -40;           // rooftop-band card-center floor
  const ROOF_Y = 14;                // above this a card counts as rooftop-band
  // tinted card material + matching depth material (alpha-tested cards cast
  // full-rectangle shadows without the depth override — the classic gotcha).
  // TRANSLUCENCY FAKE (cycle-7 black-cutout fix): the sun sits behind the scene
  // (-z) so the camera sees the unlit side of most cards, and N8AO treats the
  // stacked quads as a cave — together they read as black paper. Real leaves
  // transmit light; fake it with an emissive skylight fill driven by the same
  // foliage texture so shade sides stay green with per-leaflet variation.
  // SHADOW-CUTOUT ALPHA GAP: the color material keeps a low alphaTest (0.34) so
  // the card reads as a full leafy mass, but its customDepthMaterial uses a
  // HIGHER alphaTest — only the denser leaflet clusters cast a shadow, not every
  // thin/sparse wisp on the card. At low, oblique sun angles a whole canopy of
  // these cards stacked+overlapping was casting dozens of full hard-edged
  // rectangular cutouts (the "funky"/blocky shadow); trimming each card's
  // shadow-casting silhouette to its opaque core made the combined canopy
  // shadow read as one soft dappled mass instead of a shattered blocky one —
  // but 0.55 trimmed too hard and the result now reads SKIMPY/thin. Backed off
  // to 0.4 so more of each card's leaflet mass casts, and the tree() /fgJac()
  // crowns below add a solid invisible shadow-caster proxy (see "SHADOW-CASTER
  // PROXY" comments) so the combined shadow reads as one full dappled pool
  // instead of relying on the alpha-cutout cards alone.
  const cardMat = (tex, color, fill = 0.34, depthAlphaTest = 0.4) => {
    const m = new THREE.MeshStandardMaterial({ map: tex, color, alphaTest: 0.34,
      side: THREE.DoubleSide, roughness: 0.85,
      emissive: new THREE.Color(color).multiplyScalar(fill),
      emissiveMap: tex, emissiveIntensity: NIGHT ? 0.06 : 1.0 });
    m.userData.depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: depthAlphaTest });
    return m;
  };
  // pepper-tree palette: fine yellowish greens; jacaranda: deeper cool greens
  // (both brightened one step for the backlit camera side; jacs get a stronger
  // fill — the foreground trees sit closest to the camera on its shade side)
  const pepperMats = [0x7fa054, 0x8fb060, 0x6d8a48, 0x9cba6e]
    .map((c, i) => cardMat(i % 2 ? foliageTexA : foliageTexB, c));
  const jacMats = [0x5d8347, 0x6b9350, 0x527a3e]
    .map((c, i) => cardMat(i % 2 ? foliageTexB : foliageTexA, c, 0.46));
  // thick gray-brown jacaranda bark (per brief) — used for trunk + all limbs
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x6b5d4c, roughness: 1 });

  // --- jacaranda BLOOM: lavender flower-cluster cards layered into the canopy.
  // The real Kelton jacarandas' signature; drawn as its own purple card set so the
  // green foliage material can't wash it out.
  function bloomTexture(seed) {
    const s = 128, cv = document.createElement('canvas'); cv.width = cv.height = s;
    const g = cv.getContext('2d'); g.clearRect(0, 0, s, s);
    // PANICLE clusters: real jacaranda flowers gather in upright trumpet-flower
    // panicles, NOT an even speckle. Draw a handful of dense cluster cores with
    // trumpet florets packed around each (density falling off outward + a taller
    // panicle profile), so each card reads as a believable bloom cluster. Drawn
    // near-white so the material color tints it the true lavender-blue.
    const cores = 4 + Math.floor(hash(seed) * 3);
    for (let ci = 0; ci < cores; ci++) {
      const ca = hash(seed + ci * 2.1) * Math.PI * 2;
      const cr = Math.pow(hash(seed + ci + 5), 0.5) * 0.32;
      const ccx = s / 2 + Math.cos(ca) * cr * s;
      const ccy = s / 2 + Math.sin(ca) * cr * s * 0.9;
      const florets = 24 + Math.floor(hash(seed + ci + 9) * 20);
      const spread = s * (0.10 + hash(seed + ci + 13) * 0.09);
      for (let i = 0; i < florets; i++) {
        const a = hash(seed + ci * 40 + i) * Math.PI * 2;
        const rr = Math.pow(hash(seed + ci * 40 + i + 3), 0.8);     // packed toward center
        const x = ccx + Math.cos(a) * rr * spread;
        const y = ccy + Math.sin(a) * rr * spread * 1.2;           // panicles hang taller
        const l = 208 + Math.floor(hash(seed + ci + i) * 46);
        const op = 0.5 + hash(seed + ci * 3 + i) * 0.45;
        const fw = 1.4 + hash(seed + ci + i + 7) * 2.3;
        const fh = fw * (1.15 + hash(seed + ci + i + 11) * 0.55);   // bell taller than wide
        g.save(); g.translate(x, y); g.rotate(a * 0.3 + rr);
        // trumpet floret: a small bell with a slightly darker throat (the mouth)
        g.fillStyle = `rgba(${l},${l - 14},${l},${op})`;
        g.beginPath(); g.ellipse(0, 0, fw, fh, 0, 0, 7); g.fill();
        g.fillStyle = `rgba(${l - 42},${l - 46},${l - 18},${op * 0.8})`;
        g.beginPath(); g.ellipse(0, fh * 0.32, fw * 0.4, fh * 0.34, 0, 0, 7); g.fill();
        g.restore();
      }
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const bloomTex = bloomTexture(200);
  // R5 P9 — MULTI-SHADE jacaranda bloom. Real jacaranda canopies are not one flat
  // purple: they range across a cool, blue-leaning band (NOT magenta) — pale
  // lavender → periwinkle lavender-blue → violet → blue-purple, with a FEW deeper
  // violet-purple clusters. Six distinct tints tile that range so the crowns read
  // as natural color variation. One shared texture (all six tints reuse bloomTex)
  // keeps material/texture count flat — only the color/emissive differ.
  const bloomPalette = [
    0xb0a4e8,   // 0 pale lavender (lightest, coolest)
    0x9f93de,   // 1 periwinkle lavender-blue
    0x8f83cf,   // 2 blue-lavender (the classic ref hue)
    0x8175c6,   // 3 violet
    0x6f62bc,   // 4 blue-purple
    0x5d4fa4,   // 5 deep violet-purple (rarest)
  ];
  const bloomMats = bloomPalette.map(c => {
    const m = new THREE.MeshStandardMaterial({ map: bloomTex, color: c, alphaTest: 0.30,
      side: THREE.DoubleSide, roughness: 0.9,
      emissive: new THREE.Color(c).multiplyScalar(0.42), emissiveMap: bloomTex,
      emissiveIntensity: NIGHT ? 0.05 : 1.05 });
    m.userData.depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking, map: bloomTex, alphaTest: 0.30 });
    return m;
  });
  // weighted pick order over the palette: lavender/violet common, blue-purple
  // occasional, deep violet-purple rare (appears once). Distributing per bloom
  // card — offset by the tree seed — spreads the shades across clusters AND
  // trees, so no canopy is one uniform tone. (Index into bloomMats.)
  const bloomPick = [0, 2, 1, 3, 0, 2, 4, 1, 3, 0, 2, 5, 1, 4, 3];
  const pickBloom = (n) => bloomMats[bloomPick[((n % bloomPick.length) + bloomPick.length) % bloomPick.length]];

  // --- BROAD VOLUMETRIC JACARANDA (rebuilt for VOLUME) ------------------------
  // Reference (twin_comparison/reference/trees/jacaranda_1.png & _2.png): a real LA
  // jacaranda crown is a DENSE, BILLOWING CLOUD that FILLS its whole envelope — many
  // overlapping rounded masses of fine green bipinnate foliage with lavender bloom
  // layered over/through the outer & upper canopy. You see the thick trunk and a
  // couple of major limbs at the BASE, but the sub-branches are CLOTHED and hidden
  // inside the foliage — NOT bare tentacles ending in tip-tufts.
  //
  // APPROACH: don't hang foliage off a branch scaffold. Instead define the crown
  // ENVELOPE (a broad rounded umbrella, WIDER than tall, z-compressed for facade
  // clearance) and FILL it with a cloud of ~7-11 overlapping "lobes". Each lobe is
  // an ellipsoid packed with dozens of overlapping foliage cards (base green volume)
  // plus bloom cards layered through it — bloom weighted denser on the outer & upper
  // lobes but present everywhere, so the whole crown reads as a solid billowing mass
  // (a few hundred cards/tree, heavy overdraw → occludes to a cloud, not a scaffold).
  // The trunk + 2-3 short major limbs stay INSIDE the envelope so nothing pokes out.
  const UP = new THREE.Vector3(0, 1, 0);
  const TAU = Math.PI * 2;

  // shared 3-TIER gnarled branch builder — used by BOTH the parkway trees and the
  // foreground jacarandas. Adds tapered bark cylinders to group `g` (material `mat`)
  // from `p` heading `dir`, length `L`, base radius `r`. Children fork at STAGGERED
  // heights (not one shared node — the user's note), every sub-segment bends + radius-
  // jitters so limbs read gnarled and keep thickness (low taper), never smooth cones.
  // Three thickness tiers: bole(0) -> major limb(1) -> branch(2). `clampFn` (optional)
  // constrains each node (parkway trees pass clampZ to stay in front of the facades).
  const growWood = (g, mat, p, dir, L, r, tier, s, opts = {}) => {
    const { clampFn = null, stats = null, streetZ = 0 } = opts;
    const steps = tier === 0 ? 4 : (tier === 1 ? 3 : 2);   // more segments = more knuckles
    let cur = p.clone(), d = dir.clone().normalize(), rr = r;
    const nodes = [];
    for (let i = 0; i < steps; i++) {
      const u = (i + 1) / steps;
      const bend = tier === 0 ? 0.34 : 0.85;               // trunk sways less than crooked limbs
      d = d.clone().add(new THREE.Vector3(
        (hash(s + i * 3 + 1) - 0.5) * bend,
        tier === 0 ? 0.10 + (hash(s + i * 3 + 2) - 0.5) * 0.2 : (hash(s + i * 3 + 2) - 0.32) * 0.5,
        (hash(s + i * 3 + 3) - 0.5) * bend)).normalize();
      let next = cur.clone().addScaledVector(d, L / steps);
      if (clampFn) next = clampFn(next);
      // thinner TIPS: outer tiers taper harder so branch ends are fine, not tubular
      const taperK = tier === 0 ? 0.26 : (tier === 1 ? 0.40 : (tier === 2 ? 0.55 : 0.7));
      const rNext = r * (1 - u * taperK) * (0.9 + hash(s + i * 3 + 4) * 0.22);   // + knuckle jitter
      const seg = new THREE.Vector3().subVectors(next, cur);
      const len = seg.length() || 0.01;
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(rNext, rr, len * 1.04, tier === 0 ? 9 : (tier === 1 ? 6 : 5)), mat);
      m.position.copy(cur).addScaledVector(seg, 0.5);
      m.quaternion.setFromUnitVectors(UP, seg.multiplyScalar(1 / len));
      m.castShadow = true; g.add(m);
      if (stats && next.y > stats.maxY) stats.maxY = next.y;   // track branch-tip height
      nodes.push({ p: next.clone(), d: d.clone(), r: rNext });
      cur = next; rr = rNext;
    }
    if (tier >= 3 || r < 0.07) return { top: cur };           // 4 tiers → fine twigs at the tips
    const nChild = tier === 0 ? 2 + Math.floor(hash(s + 4) * 2) : 2;   // trunk 2-3 limbs, else 2
    for (let c = 0; c < nChild; c++) {
      const node = nodes[Math.max(0, nodes.length - 1 - (nChild - 1 - c))];   // staggered origin height
      const az = (c / nChild) * TAU + hash(s + c * 5 + 7) * 1.6;
      const outward = new THREE.Vector3(Math.cos(az), 0, Math.sin(az) * 0.7);
      // limbs reach UP (into the canopy — grows into the light) and lean toward the
      // STREET so the crown arches over the road instead of only spreading sideways.
      const childDir = node.d.clone().multiplyScalar(0.4)
        .add(outward.multiplyScalar(0.62))
        .add(new THREE.Vector3(0, 0.66, streetZ * 0.42)).normalize();
      const childL = L * (0.62 + hash(s + c * 5 + 11) * 0.22);
      growWood(g, mat, node.p, childDir, childL, node.r * 0.7, tier + 1, s + c * 29 + 60, opts);
    }
    return { top: cur };
  };

  const tree = (x, z, spread, hgt, seed, mats, bloom = false) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    // small y-jitter only — a full spin would swing the crown's local z-extent into
    // unknown world directions and defeat the facade clearance clamp below
    g.rotation.y = (hash(seed) - 0.5) * 0.5;
    const lean = (hash(seed + 1) - 0.5) * 0.28;
    const crownR = spread * 0.5;                        // half-width of the crown

    // facade clearance: keep a LOCAL point in front of the far walls. Low points
    // must clear the walls; high/rooftop points may drift a little further back.
    const clampZ = (p, half = 0, sd = 0) => {
      const band = (p.y - half) < ROOF_Y ? BLDG_FRONT_CLEAR : ROOF_CLEAR;
      const floorZ = band - z;                          // local-z floor for this group
      if (p.z < floorZ) p.z = floorZ + hash(sd) * 0.7;
      return p;
    };
    // one tapered bark cylinder between two local points, aligned via quaternion
    const segMesh = (p0, p1, rA, rB) => {
      const dir = new THREE.Vector3().subVectors(p1, p0);
      const len = dir.length() || 0.01;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rB, rA, len * 1.05, 6), barkMat);
      m.position.copy(p0).addScaledVector(dir, 0.5);
      m.quaternion.setFromUnitVectors(UP, dir.multiplyScalar(1 / len));
      m.castShadow = true; g.add(m);
    };

    // crown ENVELOPE: broad rounded umbrella, WIDER than tall (jacaranda habit),
    // z-compressed so it stays in front of the far facades after clampZ.
    const forkY = hgt * 0.30;                           // low fork, thick short bole
    const RV = Math.max(2, (hgt * 1.02 - forkY) / 2);   // vertical crown radius
    const RH = crownR;                                  // horizontal radius (= spread/2)
    const RD = crownR * 0.72;                           // depth radius (z-compressed)
    const cyc = forkY + RV;                             // crown center y (bottom ≈ forkY)

    // TRUNK + LIMBS: gnarled 3-tier woody structure (shared growWood) rising from the
    // ground up into the LOWER crown. Kept mostly inside the envelope (trunk L ≈ ½·hgt,
    // limbs fork upward) so the foliage cloud still swallows the tips — no bare far-tree
    // sticks — while the visible bole/lower limbs read crooked + tapering like the
    // reference. clampZ holds every node in front of the far facades.
    // Slimmed ~40% (was spread*0.028 + 0.55): the old base bole overhung the
    // narrow parkway grass strip and bled past the curb — real jacaranda trunks
    // fit inside their planting strip. Taper below still thins the tips.
    const trunkR = spread * 0.016 + 0.34;
    // streetZ points toward the road (parkway trees sit at z<0, so the street is +z);
    // limbs lean this way so the crown arches OVER the road, like the reference canopy.
    const streetZ = -Math.sign(z) || 1;
    const baseDir = new THREE.Vector3(lean * 0.5, 1, streetZ * 0.12).normalize();
    growWood(g, barkMat, new THREE.Vector3(lean * hgt * 0.02, 0, 0),
      baseDir, hgt * 0.5, trunkR, 0, seed + 500, { clampFn: clampZ, streetZ });

    // ---- CLOUD OF LOBES: distribute rounded foliage masses through the envelope,
    // upward-biased (dome-heavy top) with a big central core lobe so no gap shows
    // through. Lobe centers are held within (R - lobeRadius) on every axis so the
    // billowing crown never exceeds the crownR footprint (streetlight clearance).
    const lobes = [];
    const nLobe = 6 + Math.floor(spread / 7);                    // ~7-10 outer lobes
    for (let i = 0; i < nLobe; i++) {
      const a = (i / nLobe) * TAU + (hash(seed + i + 200) - 0.5) * 0.9;
      const rad = 0.45 + Math.pow(hash(seed + i + 210), 0.6) * 0.5;   // 0.45..0.95 outward
      const up = Math.pow(hash(seed + i + 220), 0.7);                 // upward-biased 0..1
      const lr = crownR * (0.30 + hash(seed + i + 250) * 0.16);       // lobe radius
      const cx = Math.cos(a) * rad * Math.max(0.1, RH - lr);
      // shift each lobe toward the street (+streetZ) so the canopy mass overhangs the
      // road rather than sitting centred over the sidewalk/parkway
      const cz = Math.sin(a) * rad * Math.max(0.1, RD - lr) + streetZ * RD * 0.35;
      let cyL = cyc + (up - 0.4) * 1.3 * RV;                          // dome-heavy top
      cyL = Math.max(forkY + lr * 0.45, Math.min(cyc + RV - lr * 0.5, cyL));
      lobes.push({ c: new THREE.Vector3(cx, cyL, cz), r: lr, outer: rad, up });
    }
    // central core lobe fills the interior so the cloud is solid, not a hollow shell
    lobes.push({ c: new THREE.Vector3(0, cyc + RV * 0.08, streetZ * RD * 0.25), r: crownR * 0.5,
      outer: 0.2, up: 0.5 });

    const nMat = mats.length;
    // fill each lobe with a dense pack of overlapping foliage cards (∝ lobe volume);
    // sampled with a mild outward bias so lobe shells overlap into a billowing edge.
    lobes.forEach((lo, li) => {
      const nCards = Math.max(6, Math.round(lo.r * lo.r * 0.9));      // dozens per lobe
      for (let k = 0; k < nCards; k++) {
        const a = hash(seed + li * 31 + k) * TAU;
        const cz0 = hash(seed + li * 31 + k + 1) * 2 - 1;             // -1..1 (sphere z)
        const rxy = Math.sqrt(Math.max(0, 1 - cz0 * cz0));
        const rr = Math.pow(hash(seed + li * 31 + k + 2), 0.45);      // fill + outer bias
        const px = lo.c.x + Math.cos(a) * rxy * rr * lo.r;
        const py = lo.c.y + cz0 * rr * lo.r * 0.9;
        const pz = lo.c.z + Math.sin(a) * rxy * rr * lo.r * 0.85;
        const cs = spread * (0.13 + hash(seed + li + k + 3) * 0.09);  // overlapping cards
        const f = new THREE.Mesh(new THREE.PlaneGeometry(cs, cs * 0.82),
          mats[(li + k + seed) % nMat]);
        const pos = clampZ(new THREE.Vector3(px, py, pz), cs * 0.5, seed + li + k);
        f.position.copy(pos);
        f.rotation.set((hash(seed + li + k + 4) - 0.5) * 0.9,
          (li + k) * (Math.PI / 3) + hash(seed + li + k + 5) * 0.7,
          (hash(seed + li + k + 6) - 0.5) * 0.5);
        f.castShadow = true;
        f.customDepthMaterial = f.material.userData.depth;
        g.add(f);
      }
      // BLOOM layered over/through this lobe — denser on outer & upper lobes (where
      // jacaranda flowers mass on the sunlit canopy) but present on every lobe, so
      // purple threads the WHOLE crown, not just the tips. Multi-shade via pickBloom.
      if (bloom) {
        const bloomFrac = 0.22 + lo.outer * 0.28 + lo.up * 0.30;      // 0.22..0.80
        const nB = Math.round(nCards * bloomFrac);
        for (let k = 0; k < nB; k++) {
          const a = hash(seed + li * 37 + k + 7) * TAU;
          const cz0 = hash(seed + li * 37 + k + 8) * 2 - 1;
          const rxy = Math.sqrt(Math.max(0, 1 - cz0 * cz0));
          const rr = Math.pow(hash(seed + li * 37 + k + 9), 0.5);
          const bx = lo.c.x + Math.cos(a) * rxy * rr * lo.r * 1.02;
          const by = lo.c.y + cz0 * rr * lo.r * 0.92 + lo.r * 0.06;   // panicles ride high
          const bz = lo.c.z + Math.sin(a) * rxy * rr * lo.r * 0.85;
          const bs = spread * (0.12 + hash(seed + li + k + 10) * 0.08);
          const f = new THREE.Mesh(new THREE.PlaneGeometry(bs, bs * 0.8),
            pickBloom(li * 5 + k + seed));
          const pos = clampZ(new THREE.Vector3(bx, by, bz), bs * 0.5, seed + li + k + 11);
          f.position.copy(pos);
          f.rotation.set((hash(seed + li + k + 12) - 0.5) * 0.6,
            hash(seed + li + k + 13) * Math.PI, 0);
          // bloom is a thin accent layer over the canopy, not a structural foliage
          // mass — let the denser leaf lobes above cast the shadow. Casting from
          // BOTH layers doubled up the overlapping hard-edged alpha cutouts that
          // made the canopy shadow read as shattered/blocky at low sun angles.
          f.castShadow = false;
          g.add(f);
        }
      }
    });

    // SHADOW-CASTER CLUSTER (cycle-8 dappling fix): the alpha-cutout foliage
    // cards alone leave gappy holes in the cast shadow (thin streaks, not a
    // full canopy pool) — a prior pass filled that gap with ONE solid smooth
    // ellipsoid, but a single smooth ellipsoid casts a clean, geometric-edged
    // blob with none of a real canopy's broken, dappled edge. Swap to a
    // CLUSTER of the same lumpy displacedBlob() shapes the foliage lobes
    // already use — one invisible caster per lobe, sized/positioned to match
    // that lobe (colorWrite/depthWrite off so nothing shows in the beauty
    // pass, castShadow on so it only exists in the shadow map). The lobes
    // already tile the crown irregularly (see the "CLOUD OF LOBES" block
    // above), so their overlapping lumpy casters combine into one full but
    // naturally broken-edged, dappled pool instead of one clean ellipse.
    // SHARP-TRIANGLE fix: at the default detail(1) these casters threw a hard
    // faceted, triangular-edged shadow ("geometric jangle") — each caster only
    // had ~80 tris, so individual flat faces were big enough to read as clean
    // hard edges even through the sun rig's PCFSoft blur. detail(2) (~320 tris,
    // same per-vertex noise so it's still an irregular lump, just finer-grained)
    // keeps no single facet large enough to survive as a visible hard edge —
    // paired with the much larger shadow.radius blur in lighting.js, the
    // cluster now reads as one soft, gently-irregular gradient pool.
    const shadowCasterMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    lobes.forEach((lo, li) => {
      const sc = clampZ(lo.c.clone(), lo.r, seed + li + 900);
      const caster = new THREE.Mesh(displacedBlob(lo.r * 0.92, seed + li + 950, 2), shadowCasterMat);
      caster.position.copy(sc);
      caster.castShadow = true;
      g.add(caster);
    });

    scene.add(g);
  };

  // far (east) parkway heroes — canopies half-hide the buildings, as in the
  // reference; trunks sit behind the far sidewalk so parked cars stay clear
  // REPLANTED onto the far PARKWAY strip (Phase A: shifted +26 toward camera to
  // −33.5..−30 with the far frontage) — real street trees stand in the parkway,
  // not against the −38 facades. At z≈−31.5 they sit ~6.5u in front of the walls,
  // so the clearance clamp above has ample margin and the canopies still
  // half-hide the buildings in screen space.
  // Kelton is a JACARANDA street — the heroes bloom lavender. Make the two big
  // far-parkway masses blooming jacarandas (was plain pepper); keep one pepper
  // (x=100) for species variety so they don't all read identical.
  tree(-44, -31.5, 28, 19, 5, jacMats, true);   // big blooming jacaranda, left
  tree(-6, -31.5, 30, 21, 12, jacMats, true);   // the big drooping center hero, blooming
  // x=26 spread22: canopy right edge ~35 clears the streetlight/diamond at x≈41.5
  tree(26, -31, 22, 17, 23, jacMats, true);
  tree(100, -31.5, 26, 18, 31, pepperMats);
  // near (west) PARKWAY strip (z −11..−5.5): frame-edge placements only, so
  // bays/labels stay legible
  tree(-98, -8, 18, 12, 44, jacMats, true);
  tree(96, -8, 16, 11, 57, pepperMats);

  // --- FOREGROUND jacarandas: the real webcam's #1 identity feature — the view
  // is shot THROUGH 2-3 dark multi-trunk jacarandas rooted in the near parkway
  // (see data/reference.jpg + reference/BRIEF.md). Trunks rise through the frame
  // edges; fine bipinnate foliage hangs into the top band (sky/buildings), so
  // bays, labels and road markers stay legible. Bark per brief: gray-brown.
  const jacBark = new THREE.MeshStandardMaterial({ color: 0x6b6258, roughness: 1 });
  // folDrop 0 = foliage held high above the crown (frame-top band only);
  // folDrop 1 = foliage hugs/hangs from the crown (for trees whose high masses
  // fell above the canvas top and left a bare stick — cycle-6 defect #2)
  const fgJac = (x, z, hgt, seed, trunks, folDrop = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    for (let tI = 0; tI < trunks; tI++) {
      const base = new THREE.Vector3((hash(seed + tI) - 0.5) * 0.8, 0, (hash(seed + tI + 5) - 0.5) * 0.8);
      const lean = new THREE.Vector3((hash(seed + tI * 7) - 0.5) * 0.55, 1,
        (hash(seed + tI * 7 + 3) - 0.5) * 0.4).normalize();
      // streetZ points toward the road centre (foreground trees sit street-side, z>0,
      // so the canopy should arch back over the road at −z). stats tracks how high the
      // branches actually reach so the crown SITS ON them (fixes the detached, floating
      // canopy the user flagged — it used to anchor at 0.9·hgt while branches ended ~0.5).
      const streetZ = -Math.sign(z) || -1;
      const stats = { maxY: 0 };
      // Slimmed ~40% (was 0.62 - tI*0.08): foreground jacaranda boles were too
      // fat for their grass patch and overhung the curb; keep them slim but
      // still substantial enough to read as mature trees. Taper handled inside.
      const trunkTop = growWood(g, jacBark, base, lean, hgt * 0.62, 0.38 - tI * 0.05, 0,
        seed + tI * 100, { stats, streetZ }).top;
      const cR = hgt * 0.50;                             // crown horizontal radius
      const RVc = hgt * 0.42, RHc = cR, RDc = hgt * 0.46;
      // crown centre sits DOWN ON the upper branches (~0.8·tip height) so the foliage
      // clothes the limbs instead of floating as a pom-pom on a bare trunk, and shifts
      // only slightly toward the street so it still overhangs the road without pulling
      // off the front-facing branches (which read as a bare gap when over-shifted).
      const px = trunkTop.x + streetZ * cR * 0.10;
      const pz = trunkTop.z + streetZ * cR * 0.2;
      const cyc = stats.maxY * 0.82 - hgt * 0.5 * folDrop;
      // cloud of lobes, dome-biased (mass rides high), each held within the footprint
      const lobes = [];
      const nLobe = 4 + Math.floor(hash(seed + tI * 9 + 200) * 2);   // 4-5 outer lobes
      for (let i = 0; i < nLobe; i++) {
        const a = (i / nLobe) * TAU + (hash(seed + tI * 9 + i + 210) - 0.5) * 0.9;
        const rad = 0.42 + Math.pow(hash(seed + tI * 9 + i + 220), 0.6) * 0.5;   // outward 0.42..0.92
        const up = Math.pow(hash(seed + tI * 9 + i + 230), 0.7);                 // upward-biased 0..1
        const lr = cR * (0.34 + hash(seed + tI * 9 + i + 240) * 0.16);           // lobe radius
        const lx = px + Math.cos(a) * rad * Math.max(0.1, RHc - lr);
        const lz = pz + Math.sin(a) * rad * Math.max(0.1, RDc - lr);
        let ly = cyc + (up - 0.30) * 1.15 * RVc;                                 // dome-heavy top
        ly = Math.max(cyc - RVc * 0.4, ly);                                      // never sag below band
        lobes.push({ c: new THREE.Vector3(lx, ly, lz), r: lr, outer: rad, up });
      }
      // central core lobe fills the interior so the mass is solid, not a hollow shell
      lobes.push({ c: new THREE.Vector3(px, cyc + RVc * 0.06, pz), r: cR * 0.5,
        outer: 0.2, up: 0.5 });
      const nJ = jacMats.length;
      lobes.forEach((lo, li) => {
        // dense pack of overlapping foliage cards, count ∝ lobe volume (as in tree())
        const nCards = Math.max(5, Math.round(lo.r * lo.r * 0.85));
        for (let k = 0; k < nCards; k++) {
          const a = hash(seed + tI * 3 + li * 31 + k) * TAU;
          const cz0 = hash(seed + tI * 3 + li * 31 + k + 1) * 2 - 1;             // -1..1 (sphere z)
          const rxy = Math.sqrt(Math.max(0, 1 - cz0 * cz0));
          const rr = Math.pow(hash(seed + tI * 3 + li * 31 + k + 2), 0.45);      // fill + outer bias
          const fx = lo.c.x + Math.cos(a) * rxy * rr * lo.r;
          const fy = lo.c.y + cz0 * rr * lo.r * 0.9;
          const fz = lo.c.z + Math.sin(a) * rxy * rr * lo.r * 0.85;
          const cs = hgt * (0.20 + hash(seed + tI + li + k + 3) * 0.12);         // overlapping cards
          const f = new THREE.Mesh(new THREE.PlaneGeometry(cs, cs * 0.82),
            jacMats[(tI + li + k + seed) % nJ]);
          f.position.set(fx, fy, fz);
          f.rotation.set((hash(seed + tI + li + k + 4) - 0.5) * 0.9,
            (li + k) * (Math.PI / 3) + hash(seed + tI + li + k + 5) * 0.7,
            (hash(seed + tI + li + k + 6) - 0.5) * 0.5);
          f.castShadow = true;
          f.customDepthMaterial = f.material.userData.depth;
          g.add(f);
        }
        // bloom threaded over/through the lobe — denser on outer & upper lobes but
        // present on every lobe, multi-shade via pickBloom (same as tree()).
        const bloomFrac = 0.24 + lo.outer * 0.26 + lo.up * 0.28;                 // 0.24..0.78
        const nB = Math.round(nCards * bloomFrac);
        for (let k = 0; k < nB; k++) {
          const a = hash(seed + tI * 3 + li * 37 + k + 7) * TAU;
          const cz0 = hash(seed + tI * 3 + li * 37 + k + 8) * 2 - 1;
          const rxy = Math.sqrt(Math.max(0, 1 - cz0 * cz0));
          const rr = Math.pow(hash(seed + tI * 3 + li * 37 + k + 9), 0.5);
          const bx = lo.c.x + Math.cos(a) * rxy * rr * lo.r * 1.02;
          const by = lo.c.y + cz0 * rr * lo.r * 0.92 + lo.r * 0.06;              // panicles ride high
          const bz = lo.c.z + Math.sin(a) * rxy * rr * lo.r * 0.85;
          const bs = hgt * (0.16 + hash(seed + tI + li + k + 10) * 0.10);
          const f = new THREE.Mesh(new THREE.PlaneGeometry(bs, bs * 0.8),
            pickBloom(tI * 5 + li * 3 + k + seed));
          f.position.set(bx, by, bz);
          f.rotation.set((hash(seed + tI + li + k + 12) - 0.5) * 0.6,
            hash(seed + tI + li + k + 13) * Math.PI, 0);
          // bloom is a thin accent layer over the canopy, not a structural foliage
          // mass — let the denser leaf lobes above cast the shadow (see the tree()
          // bloom loop above for why: avoids doubled-up hard-edged cutout shadows).
          f.castShadow = false;
          g.add(f);
        }
      });

      // SHADOW-CASTER CLUSTER (see tree()'s matching comment above): one lumpy
      // displacedBlob() caster per lobe, matching this trunk's lobe layout,
      // instead of one solid smooth ellipsoid — the overlapping lumpy casters
      // combine into a full but naturally dappled/broken-edged shadow pool.
      // detail(2) — see the matching SHARP-TRIANGLE fix note in tree() above —
      // so no single facet is large enough to read as a hard triangular edge.
      const shadowCasterMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
      lobes.forEach((lo, li) => {
        const caster = new THREE.Mesh(displacedBlob(lo.r * 0.92, seed + tI * 3 + li + 950, 2),
          shadowCasterMat);
        caster.position.copy(lo.c);
        caster.castShadow = true;
        g.add(caster);
      });
    }
    scene.add(g);
  };
  // placements tuned against the default camera (0,30,26)->(0,0,-30): trunks
  // cross the frame like data/reference.jpg — left edge, right-of-center, right.
  // x chosen between bay-label sightlines; x=-30 fell outside the h-FOV at z=7.
  fgJac(-22, 12, 15, 71, 2);  // left leaning pair (between N1 and N2 sightlines);
                              // closer + shorter so its foliage shows top-left
  // x 18->28: the streetlight/diamond sightline passes (x~12, y~24.6) at z=5 —
  // at x=18 this tree's high foliage sat right on it (cycle-6 gap #5); at x=28
  // the foliage left edge (~x 20) clears it while staying right-of-center.
  fgJac(28, 5, 19, 83, 2);
  // hgt 16->12 + folDrop 1: the old high masses sat above the frustum top at
  // z=14, leaving a bare stick near N3 (cycle-6 gap #2). Crown foliage at
  // y~10-15 here occludes only the empty near-row band beyond x~91 (ray math:
  // rays through x=52,z=14 reach the near row at x≥91, the far row off-frame).
  fgJac(52, 14, 12, 92, 1, 1);

  // --- naturalized hedge rows (the Kelton frontage signature) -----------------
  // User fix: the old scaled-box + sphere-cap hedges read as stacked geometry.
  // Two-tone leaf material carries the same emissive translucency-fill as the
  // trees (so shade sides aren't black) and is night-aware.
  const leafMat = (color) => new THREE.MeshStandardMaterial({
    color, roughness: 1, flatShading: true,
    emissive: new THREE.Color(color).multiplyScalar(0.30),
    emissiveIntensity: NIGHT ? 0.06 : 1.0 });
  const hedgeLeaf = [0x4e6b34, 0x5c7c3e, 0x445f2d, 0x688a45].map(leafMat);
  // CLIPPED hedge, REWORKED (cycle-8 "Minecraft cube" fix): a prior pass built
  // this run from bare BoxGeometry + a bumpMap, which read as hard grey-green
  // CUBES — the bumpMap only perturbs shading, it never breaks the silhouette,
  // so every segment kept dead-flat top faces and knife-edge corners. Two fixes:
  //   1. the CORE geometry (hedgeBlockGeometry below) is still a box — the
  //      clipped/trimmed silhouette (flat-ish top, straight run) is the whole
  //      point, distinct from the rounded displacedBlob() mounds used by
  //      bush()/borderRow() — but its top rim is now per-vertex NOISED (a real
  //      trim job is uneven, not a machined plane) and the top EDGES are pulled
  //      down + inward (a soft bevel) so corners no longer read as knife-edges.
  //   2. the core is clad in an actual LEAF-CARD SHELL (reusing bushLeafTexture()
  //      the same way bush() does for its mounds) instead of relying on a bump-
  //      only surface — small alpha-tested leaf cards scattered over the top and
  //      street face give the hedge a genuinely leafy silhouette, not a flat
  //      plastic box with a fake-textured shading pass.
  // subtle per-vertex noised + top-beveled box: keeps the trimmed/flat-ish
  // silhouette (unlike the rounded bush blobs) but drops the razor top rim.
  // MANICURED fix: the top-noise + rim-bevel magnitudes below used to be large
  // enough (h*0.16 trim noise, h*0.18 rim droop) that neighboring segments —
  // each seeded independently — read as an uneven, lumpy top line instead of a
  // level, professionally-trimmed hedge. Toned both down substantially so the
  // top still carries a FINE leaf-surface texture (not a machined plane) but
  // the overall trim line reads flat and level from segment to segment; the
  // rim bevel is now just enough to avoid a knife-edge corner, not a visible
  // sag at the seams.
  const hedgeBlockGeometry = (w, h, d, seed) => {
    const geo = new THREE.BoxGeometry(w, h, d, 4, 2, 3);
    const pos = geo.attributes.position;
    const halfH = h / 2, halfW = w / 2, halfD = d / 2;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (y > halfH - 1e-4) {                                     // top-face verts only
        y += (hash(seed + x * 3.1 + z * 2.7 + i) - 0.5) * h * 0.045;  // fine trim texture (was 0.16)
        const edge = Math.max(Math.abs(x) / halfW, Math.abs(z) / halfD);
        if (edge > 0.55) {                                        // near the rim -> soften it
          const t = (edge - 0.55) / 0.45;
          y -= t * h * 0.08;                                       // soft bevel only (was 0.18)
          x *= 1 - t * 0.06; z *= 1 - t * 0.06;                    // slight pull-in (was 0.12)
        }
        pos.setXYZ(i, x, y, z);
      }
    }
    geo.computeVertexNormals();
    return geo;
  };
  // core material: muted, LOW bump (most of the leafy read now comes from the
  // card shell below) so bare patches between cards don't look flat/plastic.
  const hedgeBoxTex = bushLeafTexture(325);
  hedgeBoxTex.colorSpace = THREE.NoColorSpace;       // height data, not color — no sRGB decode
  hedgeBoxTex.wrapS = hedgeBoxTex.wrapT = THREE.RepeatWrapping;
  hedgeBoxTex.repeat.set(2, 1);
  hedgeBoxTex.needsUpdate = true;
  const hedgeBoxMat = (color) => new THREE.MeshStandardMaterial({
    color, roughness: 0.97,
    bumpMap: hedgeBoxTex, bumpScale: 0.28,
    emissive: new THREE.Color(color).multiplyScalar(0.30),
    emissiveIntensity: NIGHT ? 0.06 : 1.0 });
  const hedgeBoxMats = [0x4e6b34, 0x5c7c3e, 0x445f2d, 0x688a45].map(hedgeBoxMat);
  // leaf-card cladding: same alpha-tested card approach as the tree canopies /
  // bush() shell, just a SEPARATE texture instance (bushLeafTexture keeps its
  // default sRGB color space — hedgeBoxTex above was mutated to NoColorSpace
  // for bump use, so the color-map cards need their own instance).
  const hedgeCardTex = bushLeafTexture(326);
  const hedgeCardMats = [0x4e6b34, 0x5c7c3e, 0x445f2d, 0x688a45]
    .map(c => cardMat(hedgeCardTex, c, 0.28));
  // scatter a shell of small leaf cards over one hedge segment's top + street
  // face (mirrors bush()'s leaf shell, adapted to a rectangular footprint) so
  // the box reads as clipped FOLIAGE, not a bare textured cube.
  const hedgeFoliageShell = (x, z, w, top, depth, seed) => {
    const nc = 7 + Math.floor(w * 1.7);
    for (let k = 0; k < nc; k++) {
      const a = hash(seed + k + 1) * Math.PI * 2;
      const rr = Math.pow(hash(seed + k + 2), 0.5);
      const cs = Math.min(w, Math.max(top, 0.5)) * (0.34 - rr * 0.10);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(cs, cs * 0.8),
        hedgeCardMats[(seed + k) % hedgeCardMats.length]);
      f.position.set(
        x + Math.cos(a) * rr * w * 0.48,
        top * (0.32 + hash(seed + k + 4) * 0.66),                  // mid-to-top: hides the rim
        z + Math.sin(a) * rr * depth * 0.55 + depth * 0.15);       // slight forward (street) bias
      f.rotation.set((hash(seed + k + 5) - 0.5) * 0.7, hash(seed + k + 6) * Math.PI,
        (hash(seed + k + 7) - 0.5) * 0.4);
      f.castShadow = true;
      f.customDepthMaterial = f.material.userData.depth;
      scene.add(f);
    }
  };
  // gaps = [[center, halfWidth], ...] spans to leave OPEN (entrances/driveways) so
  // hedges never sit in front of a building entrance (user: plants blocking entries
  // is unreal). Coord is x for hedgeRun, z for hedgeRunZ.
  //
  // DEFAULT CUBE HEDGE (user rework): a hedge is now built from ONE uniform cube
  // unit — same width = height = depth everywhere — so the row reads as clipped
  // boxwood cubes, not a skinny wide green "wall" (the old segW 2.6 × depth 0.45
  // was 6:1, a wall). Uniform cubes are also self-symmetric, so placement/clearance
  // is one number to reason about instead of a jittered box per segment.
  const CUBE_SIZE = 1.1;   // hedge cube edge (w = h = d); street face sits CUBE_SIZE/2 off the run line
  // CORNER-FIRST SPAN FILL (user rework): seat a cube flush at BOTH endpoints of a
  // run first (the "corners"), then fill the interior at an even sub-cube spacing.
  // ceil(L/CUBE) guarantees the step never exceeds a cube edge, so cubes always
  // touch/overlap — the run is continuous end-to-end with no gap and, crucially,
  // never stops SHORT of its endpoint the way the old `for(x=x0; x<x1; x+=segW)`
  // did (it dropped the final partial segment, leaving the ragged incomplete runs
  // in the reference shot). `place(center, i)` drops one cube at `center`.
  const spanFillCubes = (a, b, place) => {
    const L = b - a;
    if (L <= 0.02) return;
    if (L <= CUBE_SIZE) { place((a + b) / 2, 0); return; }        // short span: one cube fills the corner
    const n = Math.ceil(L / CUBE_SIZE);                           // >=2; ceil => step<=CUBE => overlap, never a gap
    const step = (L - CUBE_SIZE) / (n - 1);
    for (let i = 0; i < n; i++) place(a + CUBE_SIZE / 2 + i * step, i);   // i=0 edge at a, i=n-1 edge at b (flush corners)
  };
  // split a run [lo,hi] into the clear sub-runs left between the gap spans, so each
  // opening's two sides are themselves flush-filled corner-to-corner (an entrance /
  // driveway edge is a valid "end point" to fill toward, per the user).
  const clearSubRuns = (lo, hi, gaps) => {
    const cuts = gaps.map(([g, gw]) => [g - gw, g + gw]).sort((p, q) => p[0] - q[0]);
    const out = []; let a = lo;
    for (const [c0, c1] of cuts) {
      if (c1 <= lo || c0 >= hi) continue;
      if (c0 > a) out.push([a, Math.min(c0, hi)]);
      a = Math.max(a, c1);
    }
    if (a < hi) out.push([a, hi]);
    return out;
  };
  // HORIZONTAL run: fixed z (frontage line), cubes march along x. `z` is the CUBE
  // CENTER line — the caller sets it so the street-facing face (z ∓ CUBE_SIZE/2)
  // lands flush on the sidewalk edge (no bleed past it).
  const hedgeRun = (x0, x1, z, seed, gaps = []) => {
    let idx = 0;
    for (const [a, b] of clearSubRuns(x0, x1, gaps))
      spanFillCubes(a, b, (cx) => {
        const box = new THREE.Mesh(hedgeBlockGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, seed + idx * 17),
          hedgeBoxMats[(idx + seed) % hedgeBoxMats.length]);
        box.position.set(cx, CUBE_SIZE * 0.5, z);
        box.castShadow = box.receiveShadow = true; scene.add(box);
        hedgeFoliageShell(cx, z, CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, seed + idx * 17 + 400);
        idx++;
      });
  };
  // VERTICAL run: fixed x, cubes march along z — same cube unit, used to frame each
  // driveway/entry-walk flank back toward the building. `x` is the cube center line;
  // z0 is the sidewalk-side end (its first cube's near face lands flush at z0).
  const hedgeRunZ = (x, z0, z1, seed, gaps = []) => {
    let idx = 0;
    for (const [a, b] of clearSubRuns(z0, z1, gaps))
      spanFillCubes(a, b, (cz) => {
        const box = new THREE.Mesh(hedgeBlockGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, seed + idx * 17),
          hedgeBoxMats[(idx + seed) % hedgeBoxMats.length]);
        box.position.set(x, CUBE_SIZE * 0.5, cz);
        box.castShadow = box.receiveShadow = true; scene.add(box);
        hedgeFoliageShell(x, cz, CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, seed + idx * 17 + 400);
        idx++;
      });
  };
  // far frontages (Phase A: z −36.8, in front of the −38 facades after the far
  // side shifted +26 toward camera; gaps at walkways/driveway) + near frontage
  // line (z 14, per BAND SPEC near frontage 0.5..30).
  // Ranges realigned to the tightened houses.js frontage (sage −67..−27,
  // cottage −9..17, warm-white 24..66) with the driveway break left open.
  // Building-entrance x-positions (world, from houses.js) are held OPEN so no
  // hedge sits in front of a doorway: sage block entry ≈ -47, cottage door ≈ 7.3,
  // warm-white block entry ≈ 45. (Brick edge block entry ≈ 93 is past every run.)
  // HEIGHT (cycle-8 fix): houses.js puts every ground-floor window opening's
  // sill/bottom edge at world y≈0.5-0.75 (sage punchTrim wy=2.15,OH=2.8 ->
  // ~0.47; cottage wyv=2.3,cwH=3.2 -> ~0.55) — the old hgt 2.3-2.8 (box top
  // ~2.1-2.9) climbed well past that, burying the lower half of every window.
  // Dropped to ~1.0-1.05 (box top ~0.9-1.15): a real waist-high trimmed
  // frontage hedge, sitting at/just above the sill line instead of covering
  // the glass above it.
  // FAR FRONTAGE = ROUNDED BUSHES, not clipped hedges (user: "hedges are only on the near
  // side ... previously these were all bush assets"). The far bushRow() calls live further
  // down, AFTER bushRow is defined (see "FAR-SIDE foundation bushes" below) — calling it
  // here would hit its const temporal-dead-zone.
  // NEAR-side (z 14) clipped-hedge runs REMOVED — per the user's Street View
  // photos the camera-side frontage is just grass parkway + curbside parking,
  // not a hedge line. Far-side runs above (z −36.8) stay.
  // hedgeRun(-118, -12, 14, 2.6, 21, [[-47, 3.5]]);
  // hedgeRun(4, 118, 14, 2.4, 29, [[7.3, 3.5], [45, 3.5], [93, 3.5]]);

  // --- NEAR-SIDE foundation shrubs (user: "near side greenery is missing
  // hedges/bushes"). Real Kelton has hedges + mounding foundation planting along
  // 1414's near frontage. This adds a softer, leaf-textured shrub layer set a
  // little CAMERA-SIDE of the trimmed box-hedge line (z 14), so the two read as
  // layered greenery (clipped hedge behind, rounded bushes in front).
  // CLARITY: kept LOW (tops < ~3.2u). Sightline check — a card/blob top at z≈9
  // must clear rays from the camera (0,30,26) to the near parked-car tops
  // (y≈1.5, z=−11): that ray sits at y≈17 as it crosses z=9, so ~3u shrubs
  // never occlude the cars, bays, or labels.
  const bushTex = bushLeafTexture(300);
  const bushCardMats = [0x4e6b34, 0x5c7c3e, 0x688a45].map(c => cardMat(bushTex, c, 0.30));
  // seasonal foundation-flower cards (reuse the panicle bloom texture, tinted to
  // soft garden colors — warm cream, soft rose, pale gold). LOW accents only, so
  // the near planting reads as living foundation beds, not a green wall.
  const foundFlowerMats = [0xe9e2d0, 0xd68fae, 0xe6cd76].map(c => {
    const m = new THREE.MeshStandardMaterial({ map: bloomTex, color: c, alphaTest: 0.30,
      side: THREE.DoubleSide, roughness: 0.9,
      emissive: new THREE.Color(c).multiplyScalar(0.34), emissiveMap: bloomTex,
      emissiveIntensity: NIGHT ? 0.05 : 1.0 });
    m.userData.depth = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking, map: bloomTex, alphaTest: 0.30 });
    return m;
  });
  // one mounding shrub: an opaque displaced-blob body for solidity + a fuller
  // shell of fine leaf cards over the top for real foliage texture (not a bare
  // blob), plus an optional seasonal flowering accent. Kept LOW + wide.
  const bush = (x, z, rad, seed, flower = false) => {
    const body = new THREE.Mesh(displacedBlob(rad, seed),
      hedgeLeaf[(seed | 0) % hedgeLeaf.length]);
    body.position.set(x, rad * 0.5, z);
    body.scale.set(1.2, 0.68, 1.1);                            // low + wide mound
    body.castShadow = body.receiveShadow = true; scene.add(body);
    const nc = 5 + Math.floor(rad * 1.9);                      // fuller leaf shell
    for (let k = 0; k < nc; k++) {
      const a = hash(seed + k + 1) * Math.PI * 2;
      const rr = Math.pow(hash(seed + k + 2), 0.5);
      const cs = rad * (1.05 - rr * 0.32);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(cs, cs * 0.8),
        bushCardMats[(seed + k) % bushCardMats.length]);
      f.position.set(
        x + Math.cos(a) * rr * rad * 0.98,
        rad * 0.6 + (hash(seed + k + 5) - 0.35) * rad * 0.55,
        z + Math.sin(a) * rr * rad * 0.78);
      f.rotation.set((hash(seed + k + 7) - 0.5) * 0.8,
        hash(seed + k + 9) * Math.PI, (hash(seed + k + 11) - 0.5) * 0.5);
      f.castShadow = true;
      f.customDepthMaterial = f.material.userData.depth;
      scene.add(f);
    }
    // seasonal flowering accent nestled on the crown of some shrubs (still LOW —
    // the cards sit within the mound's ~rad height, never rising into the car row)
    if (flower) {
      const nf = 3 + Math.floor(hash(seed + 30) * 3);
      for (let k = 0; k < nf; k++) {
        const a = hash(seed + k + 21) * Math.PI * 2;
        const rr = Math.pow(hash(seed + k + 22), 0.6);
        const fs = rad * (0.5 - rr * 0.14);
        const f = new THREE.Mesh(new THREE.PlaneGeometry(fs, fs * 0.85),
          foundFlowerMats[(seed + k) % foundFlowerMats.length]);
        f.position.set(
          x + Math.cos(a) * rr * rad * 0.8,
          rad * 0.72 + hash(seed + k + 25) * rad * 0.3,
          z + Math.sin(a) * rr * rad * 0.6);
        f.rotation.set((hash(seed + k + 27) - 0.5) * 0.7,
          hash(seed + k + 29) * Math.PI, (hash(seed + k + 31) - 0.5) * 0.5);
        f.castShadow = true;
        f.customDepthMaterial = f.material.userData.depth;
        scene.add(f);
      }
    }
  };
  // a continuous-but-natural low shrub run (gaps for driveways / walk breaks);
  // ~40% of mounds carry a seasonal flowering accent
  const bushRow = (x0, x1, z, seed, gaps = []) => {
    const inGap = (x) => gaps.some(([gx, gw]) => Math.abs(x - gx) < gw);
    for (let x = x0, i = 0; x < x1; x += 3.2, i++) {
      if (hash(seed + i + 50) < 0.16) continue;                 // natural gaps
      if (inGap(x)) continue;                                   // keep building entrances clear
      const rad = 1.25 + hash(seed + i) * 0.95;
      const flower = hash(seed + i + 80) < 0.4;
      bush(x + (hash(seed + i + 3) - 0.5) * 1.6,
        z + (hash(seed + i + 7) - 0.5) * 1.4, rad, seed + i * 9, flower);
    }
  };
  // frontmost LOW border tier, street-side of the mounds: a fine run of small
  // leaf clumps with occasional seasonal bloom. This is the third greenery layer
  // (trimmed hedge behind → rounded mounds → low flowering border in front) and
  // stays very low (~1.3u tops). Sightline: at z≈7 the camera→near-car-top ray
  // sits at y≈15, so this border never occludes the cars, bays, or labels.
  const borderRow = (x0, x1, z, seed, gaps = []) => {
    const inGap = (x) => gaps.some(([gx, gw]) => Math.abs(x - gx) < gw);
    for (let x = x0, i = 0; x < x1; x += 2.2, i++) {
      if (hash(seed + i + 60) < 0.14) continue;                 // natural gaps
      if (inGap(x)) continue;                                   // keep building entrances clear
      const r = 0.7 + hash(seed + i) * 0.55;
      const blob = new THREE.Mesh(displacedBlob(r, seed + i * 5),
        hedgeLeaf[(i + seed) % hedgeLeaf.length]);
      blob.position.set(x + (hash(seed + i + 2) - 0.5) * 1.4,
        r * 0.5, z + (hash(seed + i + 4) - 0.5) * 1.1);
      blob.scale.set(1.2, 0.66, 1.0);
      blob.castShadow = blob.receiveShadow = true; scene.add(blob);
      if (hash(seed + i + 90) < 0.35) {                         // seasonal color dab
        const fs = r * 1.0;
        const f = new THREE.Mesh(new THREE.PlaneGeometry(fs, fs * 0.8),
          foundFlowerMats[(seed + i) % foundFlowerMats.length]);
        f.position.set(blob.position.x, r * 0.85, blob.position.z);
        f.rotation.set((hash(seed + i + 6) - 0.5) * 0.6, hash(seed + i + 8) * Math.PI, 0);
        f.castShadow = true; f.customDepthMaterial = f.material.userData.depth;
        scene.add(f);
      }
    }
  };
  // NEAR-side foundation greenery: TWO-LAYER stack — a frontage-border hedge
  // OFF the sidewalk, with the foundation bushes (z≈9.5) behind it.
  // USER FIX (blocking-hedge bug): the run used to sit at z≈0.75 — right on the
  // near sidewalk's frontage edge (BAND SPEC ground.js: near sidewalk z
  // −5.5..0.5) — and the old hedgeRunZ flank spurs crossed the sidewalk band
  // outright (z −5.3..0.7), so the hedge physically blocked the pedestrian
  // walkway. Moved the whole hedge onto the BUILDING side of the walk, into
  // the near frontage grass (z 0.5..30): main run at z2.0 (with box+jitter every
  // segment still lands z>1.0, comfortably clear of the z0.5 sidewalk edge).
  // Real clipped hedges border driveways + entry walks from the LAWN side, not
  // the walk itself — so the driveway/entry spurs below now run through the
  // frontage (z 0.7..21 / 0.7..14), never crossing into the sidewalk z-span.
  // Gaps in the main run: the two driveway mouths (−16 LEFT cut / 33 RIGHT cut,
  // gap half-width 4.2 ⊇ the −20..−12 / 29..37 curb cuts) and the entry walk
  // (7.3, narrower — the walk itself is only 2.86 wide). Dropped the old −47/45
  // gaps: those are the FAR-side sage/warm-white building entries (see the far
  // hedgeRuns above) — 1414 (this near building, houses.js K_W=140) has no
  // opening there, so punching gaps at −47/45 here was an unintentional hole
  // in an otherwise continuous run. 1414's own openings (entry 7.3, garages at
  // −16/33) already have gaps, so the run is now continuous except at real
  // openings only, per the "no random gaps" fix in hedgeRun() above.
  // z = 1.1 centers the CUBE so its street-facing (-z) face lands at 0.55, just
  // clear of the near sidewalk edge (BAND SPEC z 0.5) — flush, no bleed.
  hedgeRun(-52, 48, 1.1, 341, [[-16, 4.2], [7.3, 2.2], [33, 4.2]]);
  // DRIVEWAY-FRAMING hedge: borders each near driveway along its FRONTAGE run
  // toward the building (ground.js driveStrip: x−16/x33, z 0.5..22, width 6.5)
  // — not the sidewalk crossing the old version used. Flank x positions sit
  // just outside the drive's curb-cut edges (−20/−12, 29/37) so each drive
  // reads as bordered by clipped hedge on both sides as it runs back to the
  // garage door (K_GARAGE1_LX/K_GARAGE2_LX in houses.js land at world x −16/33,
  // i.e. right behind these same driveways). Stops at z21, just short of the
  // z22 drive end/garage face.
  hedgeRunZ(-20.2, 0.6, 21, 344, []);   // left cut (1414's), west flank
  hedgeRunZ(-11.8, 0.6, 21, 347, []);   // left cut, east flank
  hedgeRunZ(28.8, 0.6, 21, 351, []);    // right cut, west flank
  hedgeRunZ(37.2, 0.6, 21, 354, []);    // right cut, east flank
  // ENTRY-PATHWAY hedge: lines 1414's front walk (ground.js nearWalk: x7.3,
  // width 2.86, z −5.5..8) from the frontage edge up toward the stoop/door,
  // stopping at z14 — short of the entry apron/stairs (houses.js: apron ≈z15.3,
  // stoop/door ≈z17-18) so the hedge frames the walk without crossing it or
  // blocking the entrance. Flank x sits just outside the walk's edges (7.3 ±
  // half-width 1.43) plus hedge clearance.
  hedgeRunZ(5.2, 0.6, 14, 357, []);     // entry walk, west flank
  hedgeRunZ(9.4, 0.6, 14, 360, []);     // entry walk, east flank
  // NEAR foundation mounding bushes (z 9.5, the tier closest to the building).
  bushRow(-52, -26, 9.5, 340, [[-47, 3.5]]);
  bushRow(-6, 48, 9.5, 372, [[7.3, 3.5], [33, 5], [45, 3.5]]);   // [33,5] = keep the RIGHT near driveway (cut x29..37) clear — a bush was landing in the apron

  // FAR-SIDE foundation bushes (z -37.3) — REPLACES the far cube-hedge run (user: far side is
  // bushes, hedges are near-side only). Each run stops before its building's driveway/garage so
  // nothing overlays an apron (the driveway is the natural break between runs):
  //   sage       -66..-33  (before the cream driveway -32..-27; F1 parks there), entry gap -47
  //   cottage     -8..16   (before the cottage side-access cut 17..24),          door  gap 7.3
  //   warm-white  25..48   (before the Building-B garage 49.5..58.5),            entry gap 45
  //   warm-white  60..66   (resumes right of that garage)
  bushRow(-66, -33, -37.3, 503, [[-47, 4]]);
  bushRow(-8, 16, -37.3, 517, [[7.3, 3.5]]);
  bushRow(25, 48, -37.3, 531, [[45, 3.5]]);
  bushRow(60, 66, -37.3, 545, []);
  // borderRow(-50, -27, 7, 360, [[-47, 3.5]]);   // 2nd tier — kept OFF (no stack)
  // borderRow(-5, 47, 7, 392, [[7.3, 3.5], [45, 3.5]]);   // 2nd tier — kept OFF

  // --- one subtle bougainvillea accent (barely-there in the reference): a low
  // spilling green mound with a few magenta bloom clumps threaded through
  const bougGreen = leafMat(0x4a6533), bloomMat = leafMat(0xb03580);
  for (let i = 0; i < 7; i++) {
    const bloom = i >= 4;
    const r = (bloom ? 0.5 : 0.9) + hash(i + 201) * 0.6;
    const m = new THREE.Mesh(displacedBlob(r, i + 250), bloom ? bloomMat : bougGreen);
    // base x 20 -> 3: x20 sat squarely on the cottage side-access DRIVEWAY apron (cut x17..24)
    // — the "random bush in the driveway". x3 (±2.25 jitter) is clear cottage frontage grass,
    // left of that cut and right of the cream driveway, and clear of the x7.3 door.
    m.position.set(3 + (hash(i + 210) - 0.5) * 4.5,
      r * 0.6 + hash(i + 220) * 1.3, -36.8 + (hash(i + 230) - 0.5) * 1.6);
    m.scale.y = 0.8; m.castShadow = true; scene.add(m);
  }
}
