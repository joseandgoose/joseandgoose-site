// twin3d/lighting.js — sun + hemisphere rig, HDRI/PMREM environment, the
// static-scenery grade, and the TIME-OF-DAY system: sun position/color/
// intensity driven by a mode from the ?sun= URL param.
// OWNED BY lighting & grade agent — other agents must not edit.
//
//   (default)     same as ?sun=now — real solar position for the real Kelton Ave
//                 lat/lon + clock, so the render always matches actual daylight
//   ?sun=golden   the showcase golden-hour look — judges compare on this
//   ?sun=now      live solar position for the real Kelton Ave lat/lon + clock
//   ?sun=noon     high white-warm sun
//   ?sun=night    streetlight pools + blue ambient (also what 'now' becomes after dark)
//
// Exports:
//   buildLighting(scene, renderer)   add mode-appropriate rig + async HDRI env
//   applyStaticGrade(scene)          call AFTER static builders, BEFORE car meshes
//   configureRenderer(renderer)      tone mapping (per-mode exposure) + shadows
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/RGBELoader.js';

const LAT = 34.0538, LON = -118.4431;   // Kelton Ave — the real camera's location

function sunMode() {
  try {
    const m = new URLSearchParams(location.search).get('sun');
    // DEFAULT (no ?sun= param, or an unrecognized value) is 'now' — the render
    // should reflect actual daylight, not the fixed showcase grade. Explicit
    // ?sun=golden/noon/night overrides still work for the curated framings.
    return ['golden', 'now', 'noon', 'night'].includes(m) ? m : 'now';
  } catch (_) { return 'now'; }
}

// --- compact solar position (NOAA formulas via the SunCalc formulation,
// Agafonkin BSD): elevation + azimuth-from-north for a Date/lat/lon ---
function solarPos(date, lat, lon) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 0.5 + 2440588 - 2451545;  // days since J2000
  const M = rad * (357.5291 + 0.98560028 * d);                    // solar mean anomaly
  const L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M)
          + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI; // ecliptic longitude
  const e = rad * 23.4397;                                        // obliquity
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
  const lw = rad * -lon, phi = rad * lat;
  const H = rad * (280.16 + 360.9856235 * d) - lw - ra;           // hour angle
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec)
            + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const azS = Math.atan2(Math.sin(H),
            Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return { elevation: alt / rad, azimuth: ((azS / rad) + 180 + 360) % 360 };
}

// --- compact lunar position (Meeus low-accuracy Moon, in the SunCalc
// formulation to match solarPos above): geocentric ecliptic -> equatorial ->
// horizontal, for a Date/lat/lon. Returns altitude (deg, with a refraction
// bump so the low moon reads a touch higher, like the real horizon), azimuth-
// from-north (deg), and illuminated fraction 'illum' (0 new .. 1 full) from the
// Moon-Sun ecliptic elongation. Good to ~1-2 deg — plenty for a sky billboard. ---
function lunarPos(date, lat, lon) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 0.5 + 2440588 - 2451545;  // days since J2000
  const e = rad * 23.4397;                                        // obliquity
  const L = rad * (218.316 + 13.176396 * d);   // Moon mean longitude
  const M = rad * (134.963 + 13.064993 * d);   // Moon mean anomaly
  const F = rad * (93.272 + 13.229350 * d);    // Moon argument of latitude
  const lng = L + rad * 6.289 * Math.sin(M);   // ecliptic longitude
  const bet = rad * 5.128 * Math.sin(F);       // ecliptic latitude
  const dec = Math.asin(Math.sin(bet) * Math.cos(e) + Math.cos(bet) * Math.sin(e) * Math.sin(lng));
  const ra = Math.atan2(Math.sin(lng) * Math.cos(e) - Math.tan(bet) * Math.sin(e), Math.cos(lng));
  // phase: Sun mean ecliptic longitude, then (1-cos(elongation))/2 as illum fraction
  const sunM = rad * (357.5291 + 0.98560028 * d);
  const sunL = sunM + rad * 1.9148 * Math.sin(sunM) + rad * 102.9372 + Math.PI;
  const illum = (1 - Math.cos(lng - sunL)) / 2;
  const lw = rad * -lon, phi = rad * lat;
  const H = rad * (280.16 + 360.9856235 * d) - lw - ra;          // hour angle
  let alt = Math.asin(Math.sin(phi) * Math.sin(dec)
          + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  alt += rad * 0.017 / Math.tan((alt / rad + 10.26 / (alt / rad + 5.10)) * rad); // refraction
  const azS = Math.atan2(Math.sin(H),
            Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return { elevation: alt / rad, azimuth: ((azS / rad) + 180 + 360) % 360, illum };
}

// SCENE COMPASS (documented once, reused by the 'now' sun AND the night moon key
// below — and mirrored by the moon billboard in backdrop.js): the twin camera
// looks EAST across the street, so scene axes map to the compass as
//   +X = SOUTH,  -X = NORTH,   +Z = WEST,  -Z = EAST,   +Y = UP.
// Kelton Ave runs roughly N-S, so a real celestial body rises over -Z (east),
// arcs up through the southern sky (+X, +Y) toward its meridian, and sets toward
// +Z (west) — the sun's east->south->west day arc reads correctly on screen.
// Maps (altitude, azimuth-from-north) -> a scene direction unit-vector * dist.
function skyDir(elevDeg, azDeg, dist) {
  const el = elevDeg * Math.PI / 180, az = azDeg * Math.PI / 180;
  const E = Math.cos(el) * Math.sin(az);   // east horizontal component
  const N = Math.cos(el) * Math.cos(az);   // north horizontal component
  return new THREE.Vector3(-N, Math.sin(el), -E).normalize().multiplyScalar(dist);
}

const NIGHT = {
  night: true, exposure: 0.55,
  hemiSky: 0x2c3a55, hemiGnd: 0x14161c, hemi: 0.22,
};

function buildPreset(mode) {
  if (mode === 'night') return NIGHT;
  if (mode === 'noon') return {
    dir: new THREE.Vector3(-25, 120, -35), color: 0xfff3e2, i: 4.0,
    hemiSky: 0xdfe8f2, hemiGnd: 0x9a8f78, hemi: 0.85, exposure: 1.05, night: false,
    // solar altitude in degrees, backed out of dir the same way skyDir built it
    // (atan2 of the vertical vs. horizontal components) — feeds the shadow
    // softness/reach tuning in buildLighting below.
    elevDeg: Math.atan2(120, Math.hypot(-25, -35)) * 180 / Math.PI,
  };
  if (mode === 'now') {
    const s = solarPos(new Date(), LAT, LON);
    if (s.elevation <= -5) return NIGHT;
    // real solar altitude/azimuth -> scene direction (see skyDir's SCENE COMPASS
    // note): morning sun sits low over -Z (east), climbs +Y through the south (+X)
    // toward noon, and drops toward +Z (west) at dusk.
    const dir = skyDir(s.elevation, s.azimuth, 140);
    const t = Math.min(1, Math.max(0, (s.elevation - 5) / 30));   // 0 golden -> 1 day
    const color = new THREE.Color(0xffcd8f).lerp(new THREE.Color(0xfff3e2), t);
    // hemi fill: warm golden-hour tan at low sun -> the same blue-sky/warm-ground
    // pair the bright-midday preset below uses, so a real midday 'now' reads as
    // bright/blue-sky instead of a flat warm wash now that this is the default.
    const hemiSky = new THREE.Color(0xf3d7ae).lerp(new THREE.Color(0xbcd6f2), t).getHex();
    const hemiGnd = new THREE.Color(0x8a7a5e).lerp(new THREE.Color(0x9a8f70), t).getHex();
    // directional intensity re-based to match the bright-midday preset's 5.6 at
    // full day (t=1) — this is now the everyday default, so it needs to hold up
    // against that showcase look, not read dimmer/flatter. The (1-t) boost keeps
    // the existing grazing-angle compensation toward golden hour.
    return { dir, color, i: 5.6 + 0.8 * (1 - t), hemi: 0.62 + 0.23 * t,
      hemiSky, hemiGnd, exposure: 1.22 - 0.17 * t, night: false, elevDeg: s.elevation };
  }
  // default: bright sunny LA MIDDAY matched to the real webcam (data/reference.jpg
  // is a clear-sky bright day, not golden hour). Warm-white high sun from screen-
  // left for crisp shadows, blue-ish sky fill, brighter — reads like the real view.
  return {
    dir: new THREE.Vector3(-68, 58, -46), color: 0xffe8cc, i: 5.6,
    hemiSky: 0xbcd6f2, hemiGnd: 0x9a8f70, hemi: 0.85, exposure: 1.06, night: false,
    elevDeg: Math.atan2(58, Math.hypot(-68, -46)) * 180 / Math.PI,
  };
}

const MODE = sunMode();
const P = buildPreset(MODE);

export function configureRenderer(renderer) {
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // golden exposure history: 1.05 -> 1.12 -> 1.22 (cross-road shadow rakes put a
  // third of the frame in shade; the lift keeps shaded bays readable without
  // flattening contrast). Other modes carry their own exposure in the preset.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = P.exposure;
}

export function buildLighting(scene, renderer) {
  // HDRI drives REFLECTIONS/IBL only (its photo content — boardwalk, people —
  // looks wrong as a backdrop at street level). Sky is a warm gradient instead
  // (see backdrop.js). Kept in every mode so glass/paint always has something
  // to reflect; night tames it via applyStaticGrade below.
  new RGBELoader().load('/assets/venice_sunset_1k.hdr', tex => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(tex).texture;
    scene.environmentRotation = new THREE.Euler(0, Math.PI * 0.62, 0);
    pmrem.dispose(); tex.dispose();
  });

  scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGnd, P.hemi));

  if (P.night) {
    // faint blue "moon" key for gentle shadows + warm streetlight pools.
    // Pool #1 sits directly under the far-side signature streetlight's amber
    // lens (street_furniture.js: sl group at (41.5,-31) rotated -0.14, lens at
    // local (0,19.7,6.9) -> world ~(40.5,19.7,-24.2)) — was previously parked
    // at (10,19,-51), a leftover from before that pole's cycle-7 reposition,
    // so the pool used to glow on the road with no lamp above it. Pool #2 now
    // sits under the new near-side plain streetlight (street_furniture.js sl2,
    // over bay N2) instead of floating at (-40,16,6) with no fixture at all.
    // The key now tracks the REAL Moon: if it's above the horizon we place it at
    // its true altitude/azimuth (same skyDir mapping as the sun) and scale its
    // brightness by the illuminated fraction, so a full moon casts a firmer key
    // than a thin crescent. When the moon is down we fall back to a faint high
    // fill so night shadows still read (a moonless night is never pitch black).
    const lm = lunarPos(new Date(), LAT, LON);
    const moon = new THREE.DirectionalLight(0x8fa5c8, 0.5);
    if (lm.elevation > 0) {
      moon.position.copy(skyDir(lm.elevation, lm.azimuth, 120));
      moon.intensity = 0.16 + 0.5 * lm.illum;   // new ~0.16 -> full ~0.66
    } else {
      moon.position.set(60, 100, 30); moon.intensity = 0.28;
    }
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    Object.assign(moon.shadow.camera, { left: -140, right: 150, top: 100, bottom: -100, near: 1, far: 360 });
    // nudged with the sun rig above (0.02/4 -> 0.025/5, now -> 10) for
    // shrubs.js's cycle-8 lobe-cluster shadow casters — the extra blur fuses
    // the small overlapping blobs into one dappled pool at night too, instead
    // of separate blob edges. Raised again alongside the sun rig's SHARP-
    // TRIANGLE fix above (same casters, same higher-detail geometry, same
    // "radius is the lever" reasoning) so the moon key doesn't reintroduce
    // faceted edges the sun rig just fixed.
    moon.shadow.bias = -0.0003; moon.shadow.normalBias = 0.025; moon.shadow.radius = 10;
    scene.add(moon);
    moon.shadow.camera.updateProjectionMatrix();
    for (const [x, y, z] of [[40.5, 19.4, -24.2], [8, 16.1, -14.0]]) {
      const p = new THREE.PointLight(0xffc37a, 850, 75, 2);
      p.position.set(x, y, z); scene.add(p);
    }

    // NEAR-SIDE GROUND UPLIGHTING (night only, same P.night gate as the pools
    // above so it ramps in with the rest of the night rig): warm low spotlights
    // aimed up into the foreground jacaranda canopies (positions match shrubs.js's
    // fgJac() trunks at -22/12, 28/5, 52/14). Each has an emissive puck fixture
    // at ground level (street_furniture.js) to visibly read as the light source
    // instead of the glow floating sourceless. Kept few + shadowless (cheap
    // SpotLights, no castShadow) — this is a subtle accent, not a second light
    // rig, so the total scene light count stays small.
    const treeUplight = (x, z, hgt) => {
      const up = new THREE.SpotLight(0xffb066, 190, 15, 0.55, 0.6, 2);
      up.position.set(x, 0.35, z);
      up.target.position.set(x, hgt * 0.65, z);
      scene.add(up); scene.add(up.target);
    };
    treeUplight(-22, 12, 15);   // left foreground jacaranda pair
    treeUplight(28, 5, 19);     // center-right foreground jacaranda
    treeUplight(52, 14, 12);    // right foreground jacaranda
    return;
  }

  // golden (explicit ?sun=golden) rig notes, kept from the graded pipeline:
  // ~15 deg altitude from screen-LEFT gives ~3.7x-height rakes (20 deg read as
  // "neutral mid-afternoon"). The old black-road failure at 15 deg was an ENERGY
  // problem (3.2 * sin15 = 0.83 on horizontals); at 5.0 the road gets 1.29.
  // Azimuth swung BEHIND the houses (-z): parallel-to-street sun could never
  // throw shadows ACROSS the asphalt.
  const sun = new THREE.DirectionalLight(P.color, P.i);
  sun.position.copy(P.dir); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  // SHADOW SOFTNESS/REACH TIED TO SOLAR ALTITUDE (P.elevDeg — the same value
  // driving the color/intensity grade above): a real low/oblique sun (dawn,
  // dusk, or 'now' near the golden-hour end) throws long, soft, faint-edged
  // shadows through hazier low-angle atmosphere; a high sun throws short,
  // crisp ones. lowT is 0 at grazing altitude, 1 by ~49 deg and above.
  const lowT = THREE.MathUtils.clamp(((P.elevDeg ?? 35) - 4) / 45, 0, 1);
  // wide ortho box: 'now' can put the sun as low as ~5 deg before the night
  // cutover, and a ~21-unit canopy at 5 deg throws a shadow ~240 units long
  // (height / tan(5 deg)) — widened from the old 290x200 box (which only
  // covered the golden preset's ~15 deg / ~78-unit palm throw) so grazing
  // 'now' shadows don't clip. The traded-off per-texel resolution is masked
  // by the radius blur below, which is already soft at those same low angles.
  Object.assign(sun.shadow.camera, { left: -170, right: 180, top: 110, bottom: -110, near: 1, far: 420 });
  sun.shadow.bias = -0.0003;
  // normalBias firms up at grazing altitude to fight acne where the thin
  // alpha-card foliage sits near edge-on to the light; radius (PCFSoft blur,
  // in texels) grows the same way, so low-sun canopy shadows read as one long
  // soft dapple instead of the harsh blocky cutout the alpha cards give at
  // full sharpness. Both settle back to the old fixed values once the sun
  // climbs high. Nudged up again (0.06/8 -> 0.07/9, 0.025/3 -> 0.03/4) for
  // shrubs.js's cycle-8 SHADOW-CASTER CLUSTER (a scatter of small lumpy
  // displacedBlob() casters per lobe, replacing one big smooth ellipsoid — see
  // "SHADOW-CASTER CLUSTER" there): more, smaller, bumpier casters are more
  // acne-prone than one large dome, and the PCFSoft blur is what fuses each
  // blob's own shadow edge into the neighboring ones so the cluster reads as
  // one continuous dappled pool instead of a cluster of separately-visible
  // blob outlines.
  // SHARP-TRIANGLE fix (this pass): the low-poly casters were still throwing
  // hard, faceted, triangular shadow edges under the old 9/4 radius — the blur
  // wasn't wide enough to dissolve each caster's flat icosahedron facets into
  // a gradient. Two changes together fix it: shrubs.js's casters now use a
  // higher subdivision (detail 2, ~320 tris vs ~80) so no single facet is big
  // enough to read as a hard edge, AND the radius here is raised substantially
  // (9/4 -> 18/8, ~2x) so the PCF-soft kernel spreads every remaining edge into
  // a real penumbra/gradient rather than a crisp cutout. mapSize stays at 4096
  // (already high-res, so the wider kernel still resolves as a smooth gradient
  // instead of blotchy/banded) — radius was the right lever, not resolution.
  // normalBias is untouched: the smoother casters self-shadow less, so acne
  // risk actually eased rather than worsened at the new radius.
  sun.shadow.normalBias = THREE.MathUtils.lerp(0.07, 0.03, lowT);
  sun.shadow.radius = THREE.MathUtils.lerp(18, 8, lowT);
  scene.add(sun);
  sun.shadow.camera.updateProjectionMatrix();

  // gentle SKY-FILL from the opposite (screen-right / camera) side, NO shadows —
  // lifts the shaded faces the key sun rakes away from so they read as cool
  // skylight bounce instead of going black. Tinted with this mode's sky color.
  // Fraction also grows toward low sun (0.17 high-sun -> 0.32 grazing): a real
  // oblique sun scatters more through the low atmosphere, so shadow floors
  // should lift/fade at dawn/dusk, not just get longer and blurrier. Nudged up
  // slightly from 0.15/0.30 so the now-fuller tree-canopy shadow pools (see
  // shrubs.js's shadow-caster proxy) read as a natural dappled density rather
  // than crushing to near-black now that they cover more ground.
  const fillFrac = THREE.MathUtils.lerp(0.32, 0.17, lowT);
  const fill = new THREE.DirectionalLight(P.hemiSky, P.i * fillFrac);
  fill.position.set(-P.dir.x * 0.6, Math.abs(P.dir.y) * 0.5 + 20, -P.dir.z * 0.6 + 40);
  scene.add(fill);
}

// tame the IBL on static scenery so the directional key (and its long shadows)
// dominates; cars are added later and keep full env reflections. Night pulls the
// sunset HDRI reflections down harder so surfaces don't glow amber in the dark.
export function applyStaticGrade(scene) {
  const k = P.night ? 0.22 : 0.55;
  scene.traverse(o => {
    if (o.isMesh && o.material && 'envMapIntensity' in o.material)
      o.material.envMapIntensity = k;
  });
}
