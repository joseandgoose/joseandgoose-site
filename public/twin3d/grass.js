// twin3d/grass.js — the lawn strips (far lawn + near parkway). Split from
// ground.js so grass gets dedicated ownership.
// OWNED BY grass agent — other agents must not edit.
//
// World bands (from ground.js BAND SPEC — curb→parkway→sidewalk→frontage):
//   far parkway  z −33.5..−30   (grass against far curb; trees/streetlight here)
//   far frontage z −150..−36.5  (deep lawn to the buildings)
//   near parkway z −11..−5.5    (grass against near curb; foreground trees)
//   near frontage z 0.5..30     (1414 frontage to frame bottom)
// strips are 240 wide, receiveShadow, rotated flat.
//
// Round-2 pass: multi-octave canvas texture (repeat 1,1), scorch patches, mow
// stripes, curb dirt wear-line.
// (user feedback) — the instanced alpha-card grass TUFTS were removed: at the
// camera's angle/distance the scattered clumps read as leaf debris / ground
// clutter rather than nice grass, especially near the curb/road edge. The lawn
// now relies on the PBR grass set + anti-tiling multiply overlay alone, which
// keeps a clean, solid-green textured surface. clumpTexture/cardGeo/tuft helpers
// were dropped with them.
// Wave-A (9.5 push): base surface is now a real CC0 PBR grass set —
// ambientCG Grass001 2K JPG (color/normal/roughness/AO), CC0, in
// assets/textures/grass/. The round-2 multi-octave canvas SURVIVES as a
// full-strip MULTIPLY overlay at repeat 1,1 (white base + translucent tonal
// blotches/scorch/wear), so the tiled PBR set never reads as a repeat.
// Recolored toward the Kelton Street View references: irrigated medium green
// with worn dirt edges, not desert tan.
//
// Exports:
//   buildLawns(scene, renderer)
import * as THREE from 'three';
import { makeCanvasTex, noiseFill, hash } from './shared.js';

export function buildLawns(scene, renderer) {
  const canvasTex = (draw, w, h, rep) => makeCanvasTex(THREE, renderer, draw, w, h, rep);

  // ---- PBR grass set (ambientCG Grass001, CC0), tiled square-texel per strip
  const tl = new THREE.TextureLoader();
  const pbrSet = (rx, ry) => {
    const t = (file, srgb) => {
      const tex = tl.load('/assets/textures/grass/' + file);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(rx, ry);
      tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };
    return { map: t('color.jpg', true), normalMap: t('normal.jpg'),
             roughnessMap: t('roughness.jpg'), aoMap: t('ao.jpg') };
  };

  const strip = (z0, z1, mat) => {
    const geo = new THREE.PlaneGeometry(240, z1 - z0);
    geo.setAttribute('uv2', geo.attributes.uv);   // aoMap reads the 2nd UV channel
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0, (z0 + z1) / 2);
    m.receiveShadow = true;
    scene.add(m); return m;
  };

  // the round-2 anti-tiling canvas, as a multiply overlay hovering on the strip.
  // Canvas is fully painted (alpha 1 everywhere) — multiply blending with any
  // transparent texel would slam to black.
  const overlay = (z0, z1, tex) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(240, z1 - z0),
      new THREE.MeshBasicMaterial({ map: tex, blending: THREE.MultiplyBlending,
        depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.015, (z0 + z1) / 2);
    m.renderOrder = 1;
    scene.add(m); return m;
  };

  // ---- multi-octave lawn texture, drawn once per strip at repeat 1,1 so there
  // is no tiling repetition at all. Octaves: large tonal drift -> mid blotches
  // -> small blotches -> per-pixel grain (low amplitude).
  const lawnTex = (seed, base, lush, dry, patchCount, wearLine, mow = true) =>
    canvasTex((c, w, h) => {
      noiseFill(c, w, h, base, 14);                       // octave 4: fine grain
      // octave 1: large tonal drift (few huge soft ellipses, alternating tone)
      for (let i = 0; i < 7; i++) {
        c.globalAlpha = 0.10 + hash(seed + i) * 0.06;
        c.fillStyle = i % 2 ? lush : dry;
        c.beginPath();
        c.ellipse(hash(seed + i + 11) * w, hash(seed + i + 23) * h,
                  w * (0.18 + hash(seed + i + 5) * 0.22), h * (0.14 + hash(seed + i + 7) * 0.18),
                  hash(seed + i + 3) * 3, 0, 7);
        c.fill();
      }
      // octave 2: mid blotches
      for (let i = 0; i < 90; i++) {
        c.globalAlpha = 0.05 + hash(seed + i + 41) * 0.07;
        c.fillStyle = i % 3 ? (i % 2 ? lush : dry) : base;
        c.beginPath();
        c.ellipse(hash(seed + i + 53) * w, hash(seed + i + 67) * h,
                  8 + hash(seed + i + 71) * 26, 5 + hash(seed + i + 83) * 14,
                  hash(seed + i + 89) * 3, 0, 7);
        c.fill();
      }
      // octave 3: small clumps
      for (let i = 0; i < 700; i++) {
        c.globalAlpha = 0.06 + hash(seed + i + 101) * 0.08;
        c.fillStyle = i % 2 ? lush : dry;
        c.fillRect(hash(seed + i + 113) * w, hash(seed + i + 127) * h,
                   1.5 + hash(seed + i + 131) * 4, 1 + hash(seed + i + 137) * 2.5);
      }
      // faint mow stripes (subtler than before, angled slightly); (cycle-7)
      // feather them out toward the canvas bottom — v=0 there maps to the
      // camera-near strip edge, where a full stripe read as a bright band.
      // Alpha dropped 0.06 -> 0.03: on the THIN parkway strips these full-width
      // bands read as distinct horizontal lines (over the warm base they looked
      // yellowish); keeping them barely-there removes the "line" read.
      if (mow) for (let y = -h * 0.2; y < h * 1.2; y += h / 7) {
        c.globalAlpha = 0.03 * Math.max(0, 1 - Math.max(0, y / h - 0.6) / 0.4);
        if (c.globalAlpha <= 0.004) continue;
        c.fillStyle = lush;
        c.save(); c.translate(0, y); c.rotate(0.02); c.fillRect(0, 0, w, h / 16); c.restore();
      }
      c.globalAlpha = 0.06;
      // sun-scorched patches with irregular edges (clusters of overlapping ellipses)
      for (let p = 0; p < patchCount; p++) {
        const px = hash(seed + p + 151) * w, py = hash(seed + p + 163) * h;
        for (let i = 0; i < 6; i++) {
          c.globalAlpha = 0.10 + hash(seed + p * 7 + i) * 0.10;
          c.fillStyle = dry;
          c.beginPath();
          c.ellipse(px + (hash(seed + p + i + 31) - 0.5) * 34,
                    py + (hash(seed + p + i + 43) - 0.5) * 18,
                    7 + hash(seed + p + i + 47) * 16, 4 + hash(seed + p + i + 59) * 8,
                    hash(seed + p + i + 61) * 3, 0, 7);
          c.fill();
        }
      }
      // worn dirt line where feet leave the curb (near parkway only): irregular
      // brown band along the curb-side edge, broken into segments
      if (wearLine) {
        c.fillStyle = '#8a744e';
        for (let x = 0; x < w; x += 18) {
          if (hash(seed + x) < 0.72) {
            c.globalAlpha = 0.18 + hash(seed + x + 7) * 0.22;
            const bw = 12 + hash(seed + x + 13) * 18;
            c.beginPath();
            c.ellipse(x + bw / 2, h * 0.035, bw, 2.5 + hash(seed + x + 17) * 3.5,
                      0, 0, 7);
            c.fill();
          }
        }
      }
      c.globalAlpha = 1;
    }, 1024, 320, 1);

  // PBR base strips (square-texel: one tile ≈ 12 world units), Kelton tones.
  // Four bands now: far frontage lawn + far parkway (against far curb), near
  // parkway (against near curb) + near frontage lawn.
  const lushMat = () => new THREE.MeshStandardMaterial({ roughness: 1,
    color: 0xd6e8b4, ...pbrSet(20, 7.33) });   // lush LA-green tint (was pale cream)
  const parkMat = () => new THREE.MeshStandardMaterial({ roughness: 1,
    color: 0xcfe0a0, ...pbrSet(20, 1.9) });   // ~3-unit parkway; ry 0.29->1.9 so the PBR
    // grass isn't stretched into a horizontal band (that stretch was the persistent
    // "yellow line" — a light slice of the source texture smeared across the thin strip)
  strip(-150, -36.5, lushMat());                       // far frontage lawn
  strip(-33.5, -30, parkMat());                        // far parkway (at far curb)
  strip(-11, -5.5, parkMat());                         // near parkway (at near curb)
  strip(0.5, 30, lushMat());                           // near frontage lawn

  // anti-tiling multiply overlays: white base + translucent tonal drift, scorch
  // patches, mow stripes, and (parkway) the curb-edge dirt wear line
  // 'dry' tone greened from warm khaki (#c4b479 / #c9b981) to a muted OLIVE-GREEN
  // (#a6bd7e / #aec287): the yellow horizontal band the user still saw on the
  // parkway grass came from the warm 'dry' tonal-drift/blotch octaves reading as
  // a tan stripe on the thin strip. A green 'dry' keeps the mottling but kills the
  // yellow. wearLine also stays OFF on the near parkway.
  // mow stripes OFF on the two thin PARKWAY strips (last arg false): at their
  // depth the fixed full-width bands read as horizontal lines (the persistent
  // "yellow line"); a 3-foot parkway shows no mowing pattern anyway. Frontage
  // lawns keep subtle mow stripes.
  overlay(-150, -36.5, lawnTex(3, '#ffffff', '#b8d09a', '#aec287', 4, false));
  overlay(-33.5, -30, lawnTex(15, '#ffffff', '#b2cc92', '#a6bd7e', 2, false, false));
  overlay(-11, -5.5, lawnTex(9, '#ffffff', '#b2cc92', '#a6bd7e', 2, false, false));
  overlay(0.5, 30, lawnTex(21, '#ffffff', '#b8d09a', '#aec287', 4, false));

  // ---- instanced grass clumps: REMOVED (user feedback) -----------------------
  // The crossed alpha-card tufts (near parkway, near frontage, far parkway, far
  // frontage, + the two near/far curb fringes) read as scattered leaf debris /
  // ground clutter at the monitoring camera's angle — especially the ones along
  // the visible curb/road edge. Dropped entirely for a clean grass surface; the
  // PBR grass set + anti-tiling multiply overlay above keep the parkways/lawns
  // reading as solid textured green without the clutter.
}
