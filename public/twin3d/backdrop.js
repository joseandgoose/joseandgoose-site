// twin3d/backdrop.js — gradient sky dome, fog, layered hazy vista: distant ground
// fill, mid rooflines + treeline, downtown tower silhouettes. The depth story
// behind the street: near = clear, far = progressively hazed (GTA-vista style).
// OWNED BY depth & backdrop agent — other agents must not edit.
//
// Exports:
//   buildBackdrop(scene, night=false)   fog + sky dome + distant ground +
//     rooflines/treeline + towers. night=true swaps the whole backdrop to a
//     night palette (deep-blue dome + stars, city-glow horizon, lit tower
//     windows, cool haze) — called by scene.js from the ?sun= mode/solar clock.
import * as THREE from 'three';
import { hash } from './shared.js';

const HAZE_DAY = new THREE.Color(0xd6e0ea);      // cool LA daytime haze (fog + layers)
const HAZE_NIGHT = new THREE.Color(0x232b3a);    // cool urban night haze
let HAZE = HAZE_DAY;                             // set per-mode in buildBackdrop

// pre-mix a layer color toward the haze — manual per-layer aerial perspective, so
// each depth band keeps a *predictable* amount of contrast instead of letting the
// fog equation wash the far layers to invisibility
const haze = (hex, f) => new THREE.Color(hex).lerp(HAZE, f);
// unlit, fogged, flat: silhouettes must not pick up sun/hemisphere shading
const flat = (color, extra) => new THREE.MeshBasicMaterial(
  Object.assign({ color, fog: true }, extra || {}));

// aerial perspective as a pure function of DEPTH: one haze curve drives every far
// band (towers + the aircraft flybys below) so nearer things stay crisp and
// distance monotonically washes out. Hoisted to module scope (was local to
// buildBackdrop) — it's pure (no closure over locals) and the aircraft flyby
// code needs the same depth->haze curve the downtown towers use.
const hazeForZ = z => THREE.MathUtils.clamp(0.045 + ((-z) - 120) * 0.0057, 0.30, 0.72);

const MOON_LAT = 34.0538, MOON_LON = -118.4431;   // Kelton Ave — for the sky moon

// --- compact lunar position (Meeus low-accuracy Moon, SunCalc formulation).
// Backdrop owns its OWN copy of the celestial math + scene mapping — the same
// deliberate duplication scene.js uses for its solar elevation, so module
// ownership stays clean (lighting.js has the matching sun/moon rig). Returns
// altitude (deg, +refraction), azimuth-from-north (deg), and illuminated
// fraction 'illum' (0 new .. 1 full) from the Moon-Sun ecliptic elongation. ---
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
  const sunM = rad * (357.5291 + 0.98560028 * d);
  const sunL = sunM + rad * 1.9148 * Math.sin(sunM) + rad * 102.9372 + Math.PI;
  const illum = (1 - Math.cos(lng - sunL)) / 2;
  const lw = rad * -lon, phi = rad * lat;
  const H = rad * (280.16 + 360.9856235 * d) - lw - ra;
  let alt = Math.asin(Math.sin(phi) * Math.sin(dec)
          + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  alt += rad * 0.017 / Math.tan((alt / rad + 10.26 / (alt / rad + 5.10)) * rad); // refraction
  const azS = Math.atan2(Math.sin(H),
            Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return { elevation: alt / rad, azimuth: ((azS / rad) + 180 + 360) % 360, illum };
}

// (altitude, azimuth-from-north) -> a point on a sphere of radius r, in the twin's
// SCENE COMPASS (matches lighting.js's skyDir): +X=SOUTH, -X=NORTH, +Z=WEST,
// -Z=EAST, +Y=UP. So the moon sits in the sky exactly where it really is.
function skyPoint(elevDeg, azDeg, r) {
  const el = elevDeg * Math.PI / 180, az = azDeg * Math.PI / 180;
  const E = Math.cos(el) * Math.sin(az), N = Math.cos(el) * Math.cos(az);
  return new THREE.Vector3(-N, Math.sin(el), -E).multiplyScalar(r);
}

// which ?sun= mode is live — the moon only joins the LIVE 'now' sky and the
// 'night' sky; the golden/noon showcase keeps its curated (moonless) sky.
function moonAllowed() {
  try {
    const m = new URLSearchParams(location.search).get('sun');
    return m === 'now' || m === 'night';
  } catch (_) { return false; }
}

// subtle window-grid texture shared by all towers (multiplies with material color;
// white base -> color shows through, dark lines hint at floors/columns)
// style 0 = punched-window masonry (even grid; used by the near depth homes + towers);
// style 1 = glass curtain-wall (strong horizontal spandrel bands, faint mullions) so
// downtown towers don't all share one facade -> believable skyline variety.
// style 0 = punched-window MASONRY: real rows of recessed dark window rectangles on a
//   light wall (reads as windows at distance, not just floor lines).
// style 1 = GLASS curtain-wall: reflective blue panes in strong spandrel bands.
// style 2 = BRICK: warm masonry courses + punched windows (material variety).
// Multiplies with the material color; the base stays light so the wall tone shows and
// the dark window panes/mortar read through the distance haze.
function windowGridTex(style = 0) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  if (style === 1) {                                                // GLASS curtain-wall
    // Pitch and contrast are deliberately COARSE. This facade is only ever used on the
    // LAYER 2 towers (z -212..-262) and the camera orbit is clamped to 25..130, so it is
    // always viewed from ~200+ units. The original 8px bands (low-contrast alpha panes +
    // 8px vertical mullions) landed sub-pixel there, and mipmap minification averaged the
    // whole pattern to a flat pale slab — those towers rendered as blank cutouts while the
    // masonry facade beside them kept its grid. Pitch is set from MEASURED on-screen size,
    // not from realistic floor heights: a tower spans ~135px tall at ~13 tile repeats, so
    // 4 bands per tile lands ~2.6px per band — above Nyquist, so it stays put instead of
    // shimmering as the camera orbits. (16px/8-band pitch was tried first and measured
    // ~1.3px — legible in a still, but right on the aliasing edge.) The solid ~130-level
    // value gap matches the masonry panes that already survive the same filtering.
    // Horizontal-only: wide spandrel stripes vs the masonry dot grid is what keeps the two
    // facades telling apart once both are only a few pixels wide.
    g.fillStyle = '#dfe6ee'; g.fillRect(0, 0, 64, 128);            // pale spandrel/slab band
    for (let y = 0; y < 128; y += 32) {
      g.fillStyle = '#5f6e82';                                     // dark glazing band (solid)
      g.fillRect(0, y + 8, 64, 18);
      g.fillStyle = 'rgba(206,222,238,0.5)';                       // sky glint on the top edge
      g.fillRect(0, y + 8, 64, 2);
    }
  } else if (style === 2) {                                         // BRICK masonry
    g.fillStyle = '#b07053'; g.fillRect(0, 0, 64, 128);            // warm brick base
    g.strokeStyle = 'rgba(70,40,28,0.35)'; g.lineWidth = 1;         // mortar courses
    for (let y = 3; y < 128; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); }
    for (let y = 8; y < 122; y += 18) for (let x = 6; x < 58; x += 12) {
      g.fillStyle = 'rgba(28,30,38,0.7)'; g.fillRect(x, y, 7, 11);  // punched windows
      g.fillStyle = 'rgba(150,170,190,0.35)'; g.fillRect(x, y, 7, 3);
    }
  } else {                                                          // MASONRY punched windows
    g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, 64, 128);           // light stucco/stone base
    for (let y = 6; y < 122; y += 12) for (let x = 5; x < 58; x += 11) {
      g.fillStyle = 'rgba(34,40,52,0.66)'; g.fillRect(x, y, 7, 8); // recessed dark pane
      g.fillStyle = 'rgba(160,180,200,0.4)'; g.fillRect(x, y, 7, 2.4); // top sky-glint
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// night variant: dark facade with sparse warm lit windows. Used as the map on a
// near-WHITE material (maps multiply with material color, and multiply can't
// brighten — so the texture carries the facade darkness and the lit windows
// render at their authored warmth).
function nightWindowTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#161b24'; g.fillRect(0, 0, 64, 128);            // dark facade
  for (let y = 4; y < 124; y += 5) {
    for (let x = 3; x < 60; x += 6) {
      const r = hash(x * 131 + y * 7);
      if (r > 0.82) {                                            // ~18% windows lit
        g.fillStyle = r > 0.94 ? '#e8c98a' : '#b09668';          // a few brighter
        g.fillRect(x, y, 4, 3);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// soft cumulus puff: overlapping radial-gradient white blobs -> alpha billboard
function cloudTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 128);
  for (let i = 0; i < 16; i++) {
    const x = 46 + hash(i * 5.1) * 164;
    const y = 74 + (hash(i * 3.3) - 0.5) * 40;
    const r = 20 + hash(i * 7.7) * 36;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.92)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// soft lunar disc: a bright core with a gentle halo falloff -> alpha billboard.
// A slight highlight offset gives it a touch of sphere-shading; the phase is
// carried by the sprite's brightness/opacity (not a carved terminator) so a thin
// crescent simply reads fainter than a full moon — cheap and legible at distance.
function moonTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const cx = 64, cy = 64;
  const halo = g.createRadialGradient(cx, cy, 6, cx, cy, 64);   // soft outer glow
  halo.addColorStop(0.0, 'rgba(255,255,255,0.55)');
  halo.addColorStop(0.45, 'rgba(232,238,250,0.12)');
  halo.addColorStop(1.0, 'rgba(232,238,250,0)');
  g.fillStyle = halo; g.fillRect(0, 0, 128, 128);
  const disc = g.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 30);  // lit disc
  disc.addColorStop(0.0, 'rgba(255,255,255,1)');
  disc.addColorStop(0.7, 'rgba(246,244,235,0.97)');
  disc.addColorStop(1.0, 'rgba(246,244,235,0)');
  g.fillStyle = disc; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// thin wispy cirrus streaks -> alpha billboard (high, thin clouds; wider + fainter
// than the cumulus puffs so the sky reads layered, not one cloud type stamped)
function cirrusTexture() {
  const c = document.createElement('canvas'); c.width = 320; c.height = 96;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 320, 96);
  for (let i = 0; i < 11; i++) {
    const y = 18 + hash(i * 4.2) * 60;
    const x0 = 10 + hash(i * 2.7) * 70;
    const len = 110 + hash(i * 5.5) * 150;
    const th = 1.5 + hash(i * 3.1) * 5;
    const grad = g.createLinearGradient(x0, y, x0 + len, y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.42)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = grad; g.lineWidth = th; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y);
    for (let s = 0; s <= 1.001; s += 0.2) g.lineTo(x0 + len * s, y + Math.sin(s * 5 + i) * th * 1.3);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// vertical HAZE-colored gradient for the distance scrims: clear at the top so
// building tops emerge, dense at the base so their feet dissolve into ground haze
// (aerial perspective). Reads current module HAZE, so day/night both work.
function hazeBandTex() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 128;
  const g = c.getContext('2d');
  const rgb = `${Math.round(HAZE.r * 255)},${Math.round(HAZE.g * 255)},${Math.round(HAZE.b * 255)}`;
  const grad = g.createLinearGradient(0, 0, 0, 128);   // y0 -> plane TOP, y128 -> plane BASE
  grad.addColorStop(0.0, `rgba(${rgb},0)`);            // top: clear
  grad.addColorStop(0.55, `rgba(${rgb},0.5)`);
  grad.addColorStop(1.0, `rgba(${rgb},1)`);            // base: dense ground haze
  g.fillStyle = grad; g.fillRect(0, 0, 8, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ONE white block letter on a transparent background — the sign is built from 9 of
// these as SEPARATE letter boards standing on the hillside (real Mt. Lee sign), NOT
// one banner plane on a dark backing panel (the prior version, which the user
// rejected: "every individual letter needs to get placed on the mountain and not in
// front of a black banner"). Each letter is pure white with only a THIN dark outline
// (a couple px, no filled panel) so it stays legible against the pale hazy sky.
function hollywoodLetterTexture(ch) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 160;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 160);
  g.font = 'bold 132px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // thin dark stroke halo ONLY (no backing rectangle) — enough edge contrast to read
  // white-on-pale-sky without reintroducing the banner look.
  g.lineWidth = 9; g.lineJoin = 'round'; g.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  g.strokeText(ch, 64, 86);
  g.fillStyle = '#ffffff';
  g.fillText(ch, 64, 86);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// compact rounded-dome hill silhouette — a dedicated "Mt. Lee" mound for the
// HOLLYWOOD sign to sit on. The 4 big ridge() layers below are either off-camera
// (too tall/near for the default view) or too flat/hazy at any x that isn't already
// behind the downtown towers, so the sign had nothing legible to actually perch on.
// This mound is sized and placed (see call site) inside a gap in the skyline that was
// verified empirically against the live render — clear sky between the near mid-rise
// building (x ~ -150) and the downtown cluster (x ~ -104 and up).
// broad ROLLING foothill silhouette for the HOLLYWOOD sign to sit on. Reworked from a
// tall narrow dome (which read as a "funky tall skinny" spike, per the user) to a WIDE,
// LOW, gently-undulating ridge — a soft Gaussian central rise with a couple of small
// secondary rolls on the shoulders, so it reads like the rolling San Gabriel foothills
// rather than a lone peak. Canvas is wide (3:1) so the plane can be wide+short.
function hillTexture(baseHex) {
  const W = 768, H = 256, base = 208;   // ridge sits LOW on the canvas -> lots of sky above it
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#' + new THREE.Color(baseHex).getHexString();
  g.beginPath();
  g.moveTo(0, H);
  g.lineTo(0, base);
  for (let x = 0; x <= W; x += 5) {
    const t = x / W;
    const y = base
      - Math.exp(-Math.pow((t - 0.5) / 0.36, 2)) * 150   // broad, soft central rise (wide shoulders = rolling, not a triangle)
      - Math.sin(t * Math.PI * 2.5 + 0.7) * 9            // gentle secondary undulation
      - Math.sin(t * Math.PI * 5.0) * 4;                 // fine roll
    g.lineTo(x, y);
  }
  g.lineTo(W, H);
  g.closePath();
  g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// hazy layered mountain-ridge silhouette (San Gabriel-ish), alpha-cut so sky
// shows above it. baseHex is the pre-hazed ridge color for that depth layer.
// snow=true lightens the upper ridgeline (source-atop paints only the filled peaks)
// for the farthest, tallest range — a subtle snow/haze cap that reads as depth.
function mountainTexture(baseHex, seed, peak, snow) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 220;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 220);
  g.fillStyle = '#' + new THREE.Color(baseHex).getHexString();
  g.beginPath(); g.moveTo(0, 220);
  let minY = 220;
  for (let x = 0; x <= 1024; x += 12) {
    // gentle LA-basin foothills (user: the silhouette was too jagged/alpine).
    // One broad primary swell + a soft secondary roll dominate; high-frequency
    // detail and random noise are dialed way down, so crests are low and rounded
    // — the smooth San Gabriel/Baldwin-Hills profile, not sawtooth peaks.
    const y = peak
      + Math.sin(x * 0.0055 + seed) * peak * 0.34         // broad primary ridge
      + Math.sin(x * 0.012 + seed * 1.6) * peak * 0.15    // secondary rolling hill
      + Math.sin(x * 0.026 + seed * 2.4) * peak * 0.05    // faint undulation
      + (hash(x * 0.5 + seed) - 0.5) * peak * 0.06;        // slight texture only
    const yy = Math.max(20, y);
    minY = Math.min(minY, yy);
    g.lineTo(x, yy);
  }
  g.lineTo(1024, 220); g.closePath(); g.fill();
  if (snow) {                                            // lighten the peaks only
    g.globalCompositeOperation = 'source-atop';
    const gg = g.createLinearGradient(0, minY, 0, minY + peak * 0.55);
    gg.addColorStop(0, 'rgba(236,241,249,0.60)');        // snow/haze cap
    gg.addColorStop(1, 'rgba(236,241,249,0)');
    g.fillStyle = gg; g.fillRect(0, minY, 1024, peak * 0.55);
    g.globalCompositeOperation = 'source-over';
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ============================================================================
// AIRCRAFT FLYBYS — an occasional helicopter near the downtown towers + an
// occasional airplane higher up, straight across the sky. Entirely
// self-contained: this section owns its own tiny requestAnimationFrame ticker
// (it does NOT hook into scene.js's render loop — scene.js already renders
// continuously, so mutating these objects' transforms here is enough for the
// change to show up on screen) and its own date-seeded daily schedule, so
// nothing outside this file needs to know it exists. Built once, the first
// time buildBackdrop runs (module-level `AC` guard below).
// ----------------------------------------------------------------------------

// tiny deterministic PRNG (mulberry32) — distinct from shared.js's single-shot
// hash(n): scheduling needs a repeatable STREAM of numbers per day (several
// flyby start times + durations + flight lanes), not one lookup value.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// calendar date -> integer key (also doubles as a stable per-day PRNG seed
// component below), so the schedule only changes when the day actually rolls
// over, not every reload.
const ymdKey = date => date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

// builds one aircraft type's schedule for a given day: `count` flybys at
// random minute-of-day starts, each with a random ~15-40s duration, a random
// travel direction, and a random "lane" (0..1) used to jitter that flight's
// altitude/depth for variety. `seedTag` keeps the heli/plane streams distinct
// even though they seed off the same date. Deterministic: same date + seedTag
// always produces the same day's schedule, so it's stable intra-day but
// varies day to day.
function buildDaySchedule(date, count, seedTag) {
  const rnd = mulberry32(ymdKey(date) * 131 + seedTag);
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      startMin: rnd() * 24 * 60,     // minute-of-day the flyby begins
      duration: 15 + rnd() * 25,     // seconds, 15..40 (per the brief)
      reverse: rnd() > 0.5,          // left->right or right->left this time
      lane: rnd(),                   // 0..1, jitters altitude/depth per flight
    });
  }
  return list;
}

// recomputes+caches a schedule only when the calendar day changes; converts
// each entry's minute-of-day into an absolute epoch-ms start time so the
// ticker can just compare against Date.now() (also makes it resume correctly
// mid-flyby after a page reload, instead of needing frame-accumulated state).
function ensureSchedule(cache, now, count, seedTag) {
  const key = ymdKey(now);
  if (cache.key !== key) {
    cache.key = key;
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    cache.entries = buildDaySchedule(now, count, seedTag)
      .map(e => Object.assign(e, { startMs: midnight + e.startMin * 60000 }));
  }
  return cache.entries;
}

// which (if any) schedule entry covers this instant; returns its progress
// 0..1 through the flyby, or null when nothing is currently in the air.
function activeFlight(entries, nowMs) {
  for (const e of entries) {
    const p = (nowMs - e.startMs) / (e.duration * 1000);
    if (p >= 0 && p <= 1) return { entry: e, p };
  }
  return null;
}

// low-poly helicopter: box cabin + nose bubble + tail boom + tail fin + rotor
// mast with two crossed blades (spun each frame for a blur cue) + a small
// spun tail rotor. All one shared hazed-silhouette material (cheap, matches
// the "reuse geometry/material" rule) plus a separate small blinking nav
// light. Local model space: nose points +X; the flight code below rotates the
// whole group to face its direction of travel.
function buildHelicopter(mat, lightMat) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.9), mat));           // cabin
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), mat);
  nose.position.set(1.0, -0.05, 0); g.add(nose);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 6), mat);
  boom.rotation.z = Math.PI / 2; boom.position.set(-1.8, 0.15, 0); g.add(boom); // tail boom
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.12), mat);
  fin.position.set(-2.8, 0.5, 0); g.add(fin);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6), mat);
  mast.position.set(0, 0.62, 0); g.add(mast);
  const rotor = new THREE.Group(); rotor.position.set(0, 0.82, 0);            // main rotor
  const bladeGeo = new THREE.BoxGeometry(3.6, 0.05, 0.16);
  const b1 = new THREE.Mesh(bladeGeo, mat);
  const b2 = new THREE.Mesh(bladeGeo, mat); b2.rotation.y = Math.PI / 2;
  rotor.add(b1, b2); g.add(rotor);
  const tailRotor = new THREE.Group(); tailRotor.position.set(-2.8, 0.15, 0.2); // tail rotor
  const tGeo = new THREE.BoxGeometry(0.05, 0.5, 0.05);
  const t1 = new THREE.Mesh(tGeo, mat);
  const t2 = new THREE.Mesh(tGeo, mat); t2.rotation.x = Math.PI / 2;
  tailRotor.add(t1, t2); g.add(tailRotor);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), lightMat); // belly beacon
  light.position.set(0, -0.25, 0); g.add(light);
  g.userData.rotor = rotor; g.userData.tailRotor = tailRotor; g.userData.light = light;
  return g;
}

// low-poly airplane: cylinder fuselage + nose cone + a wing box through the
// middle + a small tailplane + vertical fin. Same one-material-per-aircraft
// approach as the helicopter above. Local model space: nose points +X.
function buildAirplane(mat, lightMat) {
  const g = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 4.6, 8), mat);
  fuselage.rotation.z = Math.PI / 2; g.add(fuselage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 8), mat);
  nose.rotation.z = -Math.PI / 2; nose.position.set(2.7, 0, 0); g.add(nose);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 6.4), mat);
  wing.position.set(0.2, -0.1, 0); g.add(wing);
  const tailplane = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 2.2), mat);
  tailplane.position.set(-2.0, 0.1, 0); g.add(tailplane);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.1), mat);
  fin.position.set(-2.1, 0.5, 0); g.add(fin);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), lightMat); // wingtip beacon
  light.position.set(0.2, -0.1, 3.2); g.add(light);
  g.userData.light = light;
  return g;
}

// positions the helicopter for progress `p` (0..1) through its flyby: a
// straight lateral pass at a lane-jittered altitude/depth in the downtown
// tower band (z -216..-242, y 24..44 — see the LAYER 2 tower cluster above),
// with a faint hover bob/roll and a spinning main + tail rotor. depthTest
// still lets a nearer tower occlude it naturally, same as any other opaque mesh.
function flyHelicopter(g, entry, p, nowMs) {
  const xEdge = 210;
  g.position.set(
    THREE.MathUtils.lerp(entry.reverse ? xEdge : -xEdge, entry.reverse ? -xEdge : xEdge, p),
    24 + entry.lane * 20 + Math.sin(nowMs / 900) * 1.2,     // gentle hover bob
    -216 - entry.lane * 26);                                // -216..-242
  g.rotation.y = entry.reverse ? Math.PI : 0;
  g.rotation.z = Math.sin(nowMs / 700) * 0.04;              // faint roll wobble
  g.userData.rotor.rotation.y = (nowMs / 25) % (Math.PI * 2);        // fast main-rotor spin
  g.userData.tailRotor.rotation.x = (nowMs / 20) % (Math.PI * 2);
  g.userData.light.visible = (nowMs % 1000) < 350;                  // blinking beacon
}

// positions the airplane for progress `p`: a straight, level pass well above
// and beyond the tower cluster (z -284..-298, y 110..140), same lateral-pass
// shape as the helicopter but higher/farther and without the hover wobble.
function flyAirplane(g, entry, p, nowMs) {
  const xEdge = 220;
  g.position.set(
    THREE.MathUtils.lerp(entry.reverse ? xEdge : -xEdge, entry.reverse ? -xEdge : xEdge, p),
    110 + entry.lane * 30,
    -284 - entry.lane * 14);                                // -284..-298
  g.rotation.y = entry.reverse ? Math.PI : 0;
  g.userData.light.visible = (nowMs % 1400) < 300;                  // slower wingtip blink
}

const HELI_PER_DAY = 3, PLANE_PER_DAY = 2;   // per the brief: 3x/day heli, 2x/day plane

let AC = null;   // module-level singleton: { heli, plane, heliCache, planeCache }

// the aircraft's own animation ticker — deliberately separate from scene.js's
// render loop (that loop already renders every frame regardless; this just
// needs to keep the two groups' transforms/visibility up to date each frame).
// Wrapped in try/catch so a scheduling edge case (e.g. clock skew, a missing
// userData ref) can never take down the real render loop.
function tickAircraft() {
  if (!AC) return;
  requestAnimationFrame(tickAircraft);
  try {
    const now = new Date(), nowMs = now.getTime();
    const heliFlight = activeFlight(ensureSchedule(AC.heliCache, now, HELI_PER_DAY, 4001), nowMs);
    AC.heli.visible = !!heliFlight;
    if (heliFlight) flyHelicopter(AC.heli, heliFlight.entry, heliFlight.p, nowMs);

    const planeFlight = activeFlight(ensureSchedule(AC.planeCache, now, PLANE_PER_DAY, 7003), nowMs);
    AC.plane.visible = !!planeFlight;
    if (planeFlight) flyAirplane(AC.plane, planeFlight.entry, planeFlight.p, nowMs);
  } catch (_) { /* never let a scheduling hiccup break the render loop */ }
}

// builds the two aircraft (once) and starts the ticker. Silhouette color +
// haze pre-mix follow the same "fog:false, manual haze()" pattern the LAYER 2
// towers use above (hazeForZ picks the depth-appropriate haze fraction) — at
// this range scene fog would already blank them. Night keeps the aircraft
// flying, just as near-black silhouettes leaning on their blinking beacon
// (brighter/opaque) instead of a lit facade, since there's no "window" detail
// to show on something this small.
function setupAircraft(scene, night) {
  if (AC) return;   // buildBackdrop only runs once per page load in practice,
  try {              // but guard anyway so a second call can't double the ticker.
    const silhouette = night ? 0x0b0e14 : 0x3a4048;
    const heliMat = flat(haze(silhouette, hazeForZ(-228)), { fog: false });
    const planeMat = flat(haze(silhouette, hazeForZ(-290)), { fog: false });
    const beaconCol = night ? 0xff5a4a : 0xff8a70;
    const beaconOpacity = night ? 1.0 : 0.6;
    const heliLightMat = new THREE.MeshBasicMaterial({
      color: beaconCol, fog: false, transparent: true, opacity: beaconOpacity });
    const planeLightMat = heliLightMat.clone();

    const heli = buildHelicopter(heliMat, heliLightMat);
    const plane = buildAirplane(planeMat, planeLightMat);
    heli.visible = false; plane.visible = false;
    scene.add(heli, plane);

    AC = { heli, plane, heliCache: { key: null, entries: [] }, planeCache: { key: null, entries: [] } };
    requestAnimationFrame(tickAircraft);
  } catch (e) { try { console.warn('aircraft flyby setup skipped:', e); } catch (_) {} }
}

export function buildBackdrop(scene, night = false) {
  HAZE = night ? HAZE_NIGHT : HAZE_DAY;   // helpers below read the module tone
  // longer far-range than v1 (210 -> 260): the tower band used to sit ~90% fogged
  // ("light shafts"); layers now carry their own pre-mixed haze instead.
  // Night: slightly shorter far so the dark layers still separate from the dome.
  scene.fog = new THREE.Fog(HAZE.getHex(), 70, night ? 240 : 260);

  // ---- sky dome: 4-stop gradient + sun-side glow with a bloom-feeding hotspot.
  // Stops are PRE-COMPENSATED for the composer's OutputPass (ACES tone-maps the
  // whole buffer and desaturates the authored sunset — lighting agent's note):
  // saturation/contrast here is deliberately hotter than the target look. The
  // camera looks DOWN, so only the low band (t < ~0.25) is on screen — that band
  // carries the sunset story; `low` was a gray-green that read as flat cream.
  // Day stops carry the pre-compensated sunset; night stops are authored a
  // touch darker/more saturated for the same OutputPass reason, with the glow
  // repurposed as a warm city-glow low over the downtown band (-z) instead of
  // a sun. Same shader either way — only uniforms change.
  const SKY = night
    ? { top: 0x04070f, mid: 0x0a1226, low: 0x152036, hor: 0x2a3346,
        sun: 0xc98d4a, glowK: 0.4,   // dim, low city-glow — not a second sunset
        sunDir: new THREE.Vector3(0, 0.04, -1).normalize() }
    : { top: 0x2f6fc6, mid: 0x83b2e4, low: 0xc2daf0, hor: 0xdcebf4,
        sun: 0xfff2d6, glowK: 0.5,
        // matches the scene sun at (-75, 24, -55), normalized
        sunDir: new THREE.Vector3(-0.781, 0.250, -0.573) };
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(SKY.top) },
                mid: { value: new THREE.Color(SKY.mid) },
                low: { value: new THREE.Color(SKY.low) },
                hor: { value: new THREE.Color(SKY.hor) },
                sun: { value: new THREE.Color(SKY.sun) },
                glowK: { value: SKY.glowK },
                sunDir: { value: SKY.sunDir } },
    vertexShader: 'varying vec3 vn; void main(){'
      + ' vn = normalize(position);'
      + ' gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vn; uniform vec3 top, mid, low, hor, sun, sunDir;'
      + ' uniform float glowK;'
      + ' void main(){'
      + ' vec3 n = normalize(vn);'
      + ' float t = clamp(n.y, 0.0, 1.0);'
      + ' vec3 c = mix(hor, low, smoothstep(0.0, 0.12, t));'
      + ' c = mix(c, mid, smoothstep(0.12, 0.40, t));'
      + ' c = mix(c, top, smoothstep(0.40, 0.80, t));'
      + ' float d = clamp(dot(n, sunDir), 0.0, 1.0);'
      + ' float band = 1.0 - smoothstep(0.0, 0.34, t);'      // wash hugs the horizon
      + ' float wash = smoothstep(0.45, 1.0, d) * band;'     // broad warm wash
      + ' float sband = 1.0 - smoothstep(0.0, 0.5, t);'      // looser falloff: the sun
      + ' float spot = pow(d, 34.0) * sband;'                //   focal sits at t~0.25
      + ' c = mix(c, sun, wash * 0.6 * glowK);'              // glowK: 1 day, dim at night
      + ' c += sun * spot * 1.35 * glowK;'                   // overshoots 1.0 -> feeds bloom
      + ' gl_FragColor = vec4(c, 1.0); }'
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(380, 24, 12), skyMat));
  scene.background = new THREE.Color(night ? 0x0a0f1a : 0xf6c98e); // fallback below the dome

  if (night) {
    // faint stars on the upper dome (skip the horizon band where haze would eat them)
    const pos = [];
    for (let i = 0; i < 220; i++) {
      const az = hash(i * 3.7) * Math.PI * 2;
      const el = 0.18 + hash(i * 7.3 + 1) * 1.25;         // ~10..82 deg elevation
      const r = 370;
      pos.push(r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const stars = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xcfd8e8, size: 1.3, sizeAttenuation: false, transparent: true,
      opacity: 0.7, fog: false, depthWrite: false }));
    scene.add(stars);
  }

  // ---- MOON: the real Moon for Kelton Ave, right now. A soft emissive billboard
  // placed at the Moon's true altitude/azimuth (skyPoint, same compass as the sun)
  // so it rises in the east, arcs through the south, and sets in the west just like
  // the real thing. Only appears when it's actually above the horizon, and only in
  // the live 'now' / 'night' skies (moonAllowed) so the golden/noon showcase is
  // untouched. Brightness + a little scale track the illuminated fraction (phase):
  // a full moon glows bright, a thin crescent is a faint sliver (never fully gone).
  // Sits at r=340 — inside the sky dome (380) and star shell (370), in front of the
  // downtown/cloud layers; depthTest still lets a nearer tower or ridge occlude it.
  if (moonAllowed()) {
    const moon = lunarPos(new Date(), MOON_LAT, MOON_LON);
    if (moon.elevation > 0) {
      const bright = 0.4 + 0.6 * moon.illum;                 // crescent faint -> full bright
      const moonCol = night ? 0xdfe6f2 : 0xf3efe2;           // cool at night, warm-pale by day
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(),
        color: moonCol, transparent: true,
        opacity: (night ? 1.0 : 0.72) * bright,               // paler against a bright day sky
        fog: false, depthWrite: false }));
      s.position.copy(skyPoint(moon.elevation, moon.azimuth, 340));
      const sz = 22 + 12 * moon.illum;                        // fuller moon reads a touch larger
      s.scale.set(sz, sz, 1);
      scene.add(s);
    }
  }

  // ---- distant ground fill: the street's lawn plane ends at z=-150; without this
  // the tower band floats on sky. Sits just below y=0 to avoid z-fighting.
  const dg = new THREE.Mesh(new THREE.PlaneGeometry(620, 100), flat(haze(0x7f8c4b, 0.55)));
  dg.rotation.x = -Math.PI / 2; dg.position.set(0, -0.12, -195);
  scene.add(dg);

  // ---- LAYER 1 (mid distance, z -118..-140): neighborhood rooflines + treeline.
  // Small and low — it must read as blocks-away suburbia behind the facing houses,
  // not loom over them (the v1 blobs were r6-11 at y=r/2 and dwarfed the street).
  // sparse tree-blobs threaded between the buildings (thinned so they read as
  // trees BETWEEN homes, not a blobby wall — user: depth was too spherical)
  const treeNear = flat(haze(0x3f5233, 0.30));
  const treeFar = flat(haze(0x4a5a3a, 0.48));
  for (let x = -150; x <= 150; x += 26) {
    const far = hash(x + 1) > 0.5;
    const r = 2.2 + hash(x) * 2.0;
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), far ? treeFar : treeNear);
    // Phase A: near neighborhood band pulled +26 toward camera (-134/-122 -> -108/-96)
    // so depth-stepping reads off the new -38 building line without a gap.
    b.position.set(x + hash(x + 3) * 7, r * 0.42, (far ? -108 : -96) - hash(x + 5) * 6);
    scene.add(b);
  }
  // DEPTH BUILDINGS: real box apartments with window-row grids + varied rooflines
  // and warm-varied stucco tones — reads as distant homes, not blobs (user note).
  const dGrid = windowGridTex(0);                    // masonry punched windows
  const dBrick = windowGridTex(2);                   // brick facade variety
  // masonry blocks take a varied warm stucco tint; brick blocks stay near-white so the
  // baked brick colour reads (a warm tint would muddy it)
  const dWalls = [0xcbb89a, 0xd8c1a0, 0xc2b28f, 0xd0b896, 0xbdb59c].map(hex =>
    new THREE.MeshBasicMaterial({ map: dGrid, color: haze(hex, 0.40), fog: true }));
  const dBrickMat = new THREE.MeshBasicMaterial({ map: dBrick, color: haze(0xf0e8dc, 0.40), fog: true });
  const parapetMat = flat(haze(0x9a8a72, 0.42));
  const hipMat = flat(haze(0x8a7464, 0.42));
  for (let x = -140; x <= 140; x += 17) {
    if (hash(x + 7) < 0.20) continue;                 // gaps = streets between homes
    const w = 8 + hash(x + 11) * 7;
    const hgt = 4.5 + hash(x + 13) * 6;               // 1-3 story, varied
    const z = -98 - hash(x + 17) * 10;                // Phase A: +26 with the treeline
    const px = x + hash(x + 19) * 6;
    const isBrick = hash(x + 31) < 0.3;               // ~30% brick facades for material variety
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, 7),
      isBrick ? dBrickMat : dWalls[Math.floor(hash(x + 23) * dWalls.length)]);
    // window-grid tiling: ~1 window per 2.2u wide, per 3u tall
    body.material.map && (body.material = body.material.clone());
    const m = body.material.map.clone(); m.wrapS = m.wrapT = THREE.RepeatWrapping;
    m.repeat.set(Math.max(2, Math.round(w / 2.4)), Math.max(1, Math.round(hgt / 3)));
    body.material.map = m;
    body.position.set(px, hgt / 2, z);
    scene.add(body);
    if (hash(x + 29) < 0.55) {                        // flat parapet cap
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.5, 7.6), parapetMat);
      cap.position.set(px, hgt + 0.2, z); scene.add(cap);
    } else {                                          // low hip roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.68, 2.0, 4), hipMat);
      roof.rotation.y = Math.PI / 4; roof.position.set(px, hgt + 1.0, z); scene.add(roof);
    }
  }

  // aerial perspective: hazeForZ (module scope, above) is a pure function of DEPTH —
  // one haze curve drives every far band so nearer things stay crisp and distance
  // monotonically washes out. Spans the mid-rise bridge (z~-170) through the far
  // tower row (z~-262). Steeper front-to-back ramp than v1: nearer bands hold more
  // contrast (crisper), the far tower row + back fillers wash further out (hazier)
  // -> stronger depth read. R5 P6: ceiling pulled 0.86 -> 0.72 — R4 over-hazed the
  // far tower row into a flat cutout; this keeps the front-to-back gradient (near
  // towers crisper, far hazier) but leaves enough contrast on the far-far row for
  // the added crowns/banding to read.
  // clone the shared window grid onto a material and tile it to the box size so
  // window rows keep a consistent real-world scale (and vary per building type).
  const gridded = (mat, w, hgt, perW, perH) => {
    if (mat.map) {
      mat.map = mat.map.clone(); mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.repeat.set(Math.max(2, Math.round(w / perW)), Math.max(2, Math.round(hgt / perH)));
      mat.map.needsUpdate = true;
    }
    return mat;
  };

  // ---- LAYER 1.5 (mid-far bridge, z -168..-196): a hazy row of low mid-rise
  // blocks that STEPS the depth between the near apartment frontage (houses.js,
  // z~-73) and the downtown towers. Without it the eye jumped from 3-story homes
  // straight to skyscrapers — a flat cutout (user: the space between skyscrapers
  // and the far apartments needs fine tuning). Taller than the LAYER-1 homes,
  // shorter than the towers, hazed by distance so they read as "blocks on the way
  // downtown" fading into the vista.
  const gridB = night ? nightWindowTex() : windowGridTex();
  const bandMat = (f, tex) => night
    ? flat(0xf0f0f0, { map: tex, fog: false })
    : flat(haze(0x67717f, f), { map: tex, fog: false });
  for (let x = -150; x <= 150; x += 21) {
    if (hash(x + 3.1) < 0.18) continue;                  // gaps between blocks
    const z = -142 - hash(x + 5) * 28;                   // Phase A: +26 (-142..-170)
    const w = 12 + hash(x + 7) * 10;
    const hgt = 11 + hash(x + 9) * 12;                   // ~3-6 story mid-rise
    const d = 8 + hash(x + 11) * 5;
    const px = x + hash(x + 13) * 8;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d),
      gridded(bandMat(hazeForZ(z), gridB), w, hgt, 2.6, 3.2));
    b.position.set(px, hgt / 2, z); scene.add(b);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.6, d + 0.5),  // flat parapet
      flat(haze(0x565f6b, Math.min(0.9, hazeForZ(z) + 0.06)), { fog: false }));
    cap.position.set(px, hgt + 0.3, z); scene.add(cap);
  }

  // ---- LAYER 2 (far, z -212..-262): downtown cluster. Varied silhouettes with a
  // faint window grid, hazed as a function of DISTANCE so the skyline itself has
  // front-to-back depth — nearer heroes crisp, a back row washed into the vista —
  // not one flat band. Varied crowns (parapet / penthouse / mast) and two
  // landmark shapes: a stepped-crown tower and a cylindrical spire.
  // fog:false — at this pushed-back distance scene fog would sit at ~95%+ and
  // blank the grid ("light shafts" regression); the per-tower haze pre-mix IS this
  // layer's aerial perspective.
  // day: two facades — 0 punched-window masonry, 1 glass curtain-wall — each on a
  // slightly different hazed slab tone so towers don't read as one repeated block.
  // night: flat dark silhouette, no facade texture — see WINDOW LIGHTS below for the
  // lit-window detail. R6: the old approach cloned ONE shared canvas (sparse
  // hard-edged lit-window dots on a dark facade) onto every tower via gridded()'s
  // texture.clone(); at this distance THREE's default mipmapping averaged that
  // sparse high-contrast pattern down to a near-uniform gray blur, and since every
  // clone pointed at the SAME source canvas, only the tower(s) whose UV tiling
  // happened to land on a low mip level kept a legible window column — everything
  // else read as a murky dark blur. Instanced additive dots (below) never
  // mip-blur, so this now buys a crisp dark body + crisp lit windows instead of a
  // texture fighting the render distance.
  const gridDay = night ? null : windowGridTex(0);
  const gridDay2 = night ? null : windowGridTex(1);
  const towerMat = (f, facade = 0) => night
    ? flat(haze(0x11151f, Math.min(0.5, f * 0.55)), { fog: false })
    : flat(haze(facade ? 0x66727f : 0x5d6878, f), { map: facade ? gridDay2 : gridDay, fog: false });
  const crownMat = f => flat(night ? 0x2b3550 : haze(0x515b6b, Math.min(0.92, f + 0.05)), { fog: false });

  // ---- WINDOW LIGHTS (night + dusk): a believable scatter of warm lit windows
  // across MANY towers, not one. Built as tiny additive-blended quads instanced
  // onto the camera-facing (+z) face of each tower box — one InstancedMesh, one
  // draw call, no per-window mesh/material cost. Each tower rolls its own
  // "is this building lit tonight" chance and each window its own "is this pane
  // lit" chance off a seed unique to that tower (x/z), so density and layout vary
  // building to building instead of repeating one shared texture. `sun=golden`
  // gets a sparser, dimmer pass (a few early-lit offices, not a full night skyline).
  const duskGlow = !night && (() => {
    try { return new URLSearchParams(location.search).get('sun') === 'golden'; }
    catch (_) { return false; }
  })();
  const winLit = [];   // {x, y, z, warm} collected while towers are built, instanced once below
  const scatterWindows = (x, w, y0, hgt, z, d, seed) => {
    if (!night && !duskGlow) return;
    if (hash(seed) < (duskGlow ? 0.55 : 0.30)) return;           // this building stays dark tonight
    const cols = Math.max(2, Math.round(w / 2.2));
    const rows = Math.max(2, Math.round(hgt / 3.0));
    const density = (duskGlow ? 0.035 : 0.07) + hash(seed + 4.4) * (duskGlow ? 0.05 : 0.15);
    const fz = z + d / 2 + 0.04;                                 // proud of the facade, +z (camera) side
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cs = seed + r * 13.7 + c * 3.1;
        if (hash(cs) > density) continue;
        winLit.push({
          x: x - w / 2 + (c + 0.5) / cols * w,
          y: y0 + (r + 0.5) / rows * hgt,
          z: fz,
          warm: hash(cs + 9) > 0.82,
        });
      }
    }
  };
  // R5 P6: towers gain believable articulation — a mid-height mechanical/spandrel band,
  // an upper setback tier on the tallest, and richer crowns (parapet / penthouse+mast /
  // antenna / slim edge). All cheap boxes/cylinders; kept subtle so the far skyline
  // reads detailed, not busy. `facade` selects the window texture (see towerMat).
  const addTower = (x, hgt, w, d, z, crown, facade = 0) => {
    const f = hazeForZ(z);
    const tw = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, d),
      gridded(towerMat(f, facade), w, hgt, 2.2, 3.0));
    tw.position.set(x, hgt / 2, z); scene.add(tw);
    scatterWindows(x, w, 0, hgt, z, d, x * 2.7 + z * 1.3);
    // mid-height mechanical/spandrel band: a slightly proud floor line breaks the flat
    // facade on taller towers (structural break you see on real downtown blocks)
    if (hgt > 28) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 1.3, d + 0.4),
        crownMat(Math.min(0.9, f + 0.07)));
      band.position.set(x, hgt * 0.64, z); scene.add(band);
    }
    // upper setback: tall towers taper to a narrower top tier — classic downtown
    // massing so the skyline isn't a row of equal-width slabs
    let topY = hgt, topW = w, topD = d;
    if (hgt > 33) {
      const uh = hgt * 0.20; topW = w * 0.64; topD = d * 0.64;
      const up = new THREE.Mesh(new THREE.BoxGeometry(topW, uh, topD),
        gridded(towerMat(f, facade), topW, uh, 2.2, 3.0));
      up.position.set(x, hgt + uh / 2, z); scene.add(up);
      scatterWindows(x, topW, hgt, uh, z, topD, x * 2.7 + z * 1.3 + 5.5);
      topY = hgt + uh;
    }
    if (crown === 1) {                                   // flat parapet lip
      const cap = new THREE.Mesh(new THREE.BoxGeometry(topW + 0.6, 0.7, topD + 0.6), crownMat(f));
      cap.position.set(x, topY + 0.35, z); scene.add(cap);
    } else if (crown === 2) {                            // mechanical penthouse + short mast
      const ph = new THREE.Mesh(new THREE.BoxGeometry(topW * 0.5, 2.6, topD * 0.5), crownMat(f));
      ph.position.set(x, topY + 1.3, z); scene.add(ph);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4, 6), crownMat(f));
      mast.position.set(x, topY + 4.6, z); scene.add(mast);
    } else if (crown === 3) {                            // tall antenna mast + tip
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7, 6), crownMat(f));
      mast.position.set(x, topY + 3.5, z); scene.add(mast);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), crownMat(f));
      tip.position.set(x, topY + 7, z); scene.add(tip);
    } else {                                             // crown 0: slim parapet edge
      const cap = new THREE.Mesh(new THREE.BoxGeometry(topW + 0.3, 0.4, topD + 0.3), crownMat(f));
      cap.position.set(x, topY + 0.2, z); scene.add(cap);
    }
  };
  // front cluster: taller heroes nearer, hazed by z. [x, height, width, depth]
  const front = [
    [-104, 24, 10, 8], [-86, 36, 12, 9], [-66, 29, 8, 8], [-48, 43, 13, 10],
    [-28, 33, 9, 8], [26, 38, 11, 9], [46, 27, 8, 7], [64, 46, 12, 10],
    [86, 31, 10, 8], [106, 22, 9, 8],
  ];
  front.forEach(([x, hgt, w, d]) => {
    const z = -212 - hash(x + 2) * 22;                   // -212..-234
    addTower(x + hash(x) * 6, hgt, w, d, z, Math.floor(hash(x + 31) * 4), hash(x + 37) > 0.5 ? 1 : 0);
  });
  // back row: shorter, hazier fillers slotted behind the front gaps — the far edge
  // of downtown dissolving toward the foothills.
  [-95, -76, -57, -18, 36, 55, 75, 96].forEach((x) => {
    const z = -244 - hash(x + 4) * 18;                   // -244..-262
    const hgt = 16 + hash(x + 6) * 16;
    const w = 7 + hash(x + 8) * 5;
    addTower(x + hash(x + 1) * 5, hgt, w, 6, z, hash(x + 9) < 0.4 ? 1 : 0, hash(x + 37) > 0.55 ? 1 : 0);
  });
  // landmark #1: stepped-crown tower (three shrinking tiers), center-left
  [[13, 38, 0], [8, 8, 38], [5, 5.6, 46]].forEach(([w, hgt, y0], li) => {
    const ld = Math.max(5, w * 0.75);
    const t = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, ld),
      gridded(towerMat(hazeForZ(-230)), w, hgt, 2.2, 3.0));
    t.position.set(-38, y0 + hgt / 2, -230);   // in the horizon gap left of the center house
    scene.add(t);
    scatterWindows(-38, w, y0, hgt, -230, ld, -38 * 2.7 - 230 * 1.3 + li * 7.3);
  });
  // landmark #2: cylindrical tower with rounded cap + antenna spire, gap-right
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 34, 14), towerMat(hazeForZ(-238)));
  cyl.position.set(38, 17, -238);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
                             flat(haze(0x5d6878, hazeForZ(-238)), { fog: false }));
  cap.position.set(38, 34, -238);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 10, 6),
                               flat(haze(0x4a5462, 0.45), { fog: false }));
  spire.position.set(38, 39, -238);
  scene.add(cyl, cap, spire);
  scatterWindows(38, 6, 0, 34, -238, 8, 38 * 2.7 - 238 * 1.3 + 11);   // approx front face of the cylinder

  // instance every collected lit window as one additive-blended draw call — see
  // scatterWindows above for how the per-tower/per-window randomness is seeded.
  if (winLit.length) {
    // Window quads must be sized for the SKYLINE'S DISTANCE, not real-world window scale:
    // the towers sit ~256 units from the camera, where a 0.34x0.5 pane projects to ~1.4px —
    // sub-pixel, so the lights vanished and the skyline read as bare black silhouettes. At
    // ~1.2x1.8 (roughly half the 2.2x3.0 window cell) each pane lands ~5px and actually reads.
    const winGeo = new THREE.PlaneGeometry(1.2, 1.8);
    const winMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: night ? 0.95 : 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false,
    });
    const winInst = new THREE.InstancedMesh(winGeo, winMat, winLit.length);
    const dummy = new THREE.Object3D();
    const warmC = new THREE.Color(0xfff0c8), dimC = new THREE.Color(0xffb35e);
    winLit.forEach((wl, i) => {
      dummy.position.set(wl.x, wl.y, wl.z);
      dummy.updateMatrix();
      winInst.setMatrixAt(i, dummy.matrix);
      winInst.setColorAt(i, wl.warm ? warmC : dimC);
    });
    winInst.instanceMatrix.needsUpdate = true;
    if (winInst.instanceColor) winInst.instanceColor.needsUpdate = true;
    scene.add(winInst);
  }

  // ---- GRADED DISTANCE HAZE: soft HAZE-colored scrims stacked between the depth
  // layers, each sitting just IN FRONT of the band it veils so the vista reads as
  // steps THROUGH atmosphere — apartments (near, clear) -> mid-rise -> downtown ->
  // foothills — not a flat cutout (user: the space between skyscrapers and the far
  // apartments needs fine tuning). Denser at the base so building feet dissolve
  // while tops emerge. depthWrite:false + fog:false so they veil without occluding.
  const bandTex = hazeBandTex();
  // graded ramp of scrims, one just in front of each depth band; the added far
  // scrim (-272) veils the seam between the back tower row and the foothills so
  // downtown reads as its own distant plane, not fused to the ridgeline.
  // front scrim pulled +26 (-150 -> -124) to stay just in front of the moved mid-rise
  // band; tower/foothill scrims stay put (their bands didn't move).
  [[-124, 66, 0.12], [-198, 74, 0.18], [-236, 84, 0.22], [-272, 98, 0.30]].forEach(([z, h, a]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(820, h),
      new THREE.MeshBasicMaterial({ map: bandTex, transparent: true,
        opacity: night ? a * 0.7 : a, fog: false, depthWrite: false }));
    m.position.set(0, h / 2 - 4, z); scene.add(m);
  });

  // ---- LA MOUNTAINS: hazy ridge layers on the far horizon BEHIND the downtown
  // towers (z < -238). Two layers, aerial perspective (far = lighter/hazier).
  // Day only — at night they'd read as a black band; the night dome handles it.
  if (!night) {
    const ridge = (z, w, h, y, hazeF, seed, peak, op, snow) => {
      const col = haze(0x6b7488, hazeF);      // blue-grey range mountains
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: mountainTexture(col.getHex(), seed, peak, snow),
          transparent: true, opacity: op, fog: false, depthWrite: false }));
      m.position.set(0, y, z);
      scene.add(m);
    };
    // 4 layers, aerial perspective: near = darker/clearer/lower, far = hazier/taller/snow-capped.
    // The foothill is a nearer, lower, clearer wooded ridge that bridges the
    // downtown band to the mountains so the vista steps back in depth, not a jump.
    // peaks lowered (~28%) alongside the gentler profile so the ranges read as
    // low rolling foothills stepping back in haze, not a tall alpine wall.
    ridge(-282, 780, 108, 30, 0.42, 0.6, 66, 0.94, false);    // foothill: clearer, low, near
    ridge(-300, 900, 150, 46, 0.68, 1.7, 104, 0.88, false);   // near range
    ridge(-330, 1000, 170, 58, 0.84, 4.1, 128, 0.72, false);  // mid range, hazier
    ridge(-360, 1120, 195, 72, 0.93, 6.3, 150, 0.55, true);   // far range: tallest, hazed, snow caps
  }

  // NOTE: the sign below is built in BOTH day and night — it used to sit INSIDE the day-only
  // mountain block above, which is why it vanished after dark. The real sign is floodlit at
  // night (user ref photo: bright white letters on a black hill), so at night we keep the hill
  // as a dark silhouette and the letters render illuminated.
  // HOLLYWOOD SIGN + its own foreground hill ("Mt. Lee"). Previous placement (x -190,
    // y 105, z -353, on ridge layer 4) put the sign well ABOVE the visible frustum at the
    // default camera (fov 58, pos [0,30,26], tgt [0,0,-30]) — verified by projecting that
    // point through the same camera matrix: it landed at ~-24% screen Y, i.e. off the top
    // of the canvas entirely, which is why it read as "floating"/barely-there. The 4 ridge
    // layers' crest lines were also checked the same way: only the farthest (z -360) layer's
    // crest ever enters the visible frame, and only as a low, near-flat, heavily-hazed sliver
    // — not a legible "mountain" to mount a sign on.
    //
    // Fix: place a dedicated compact hill silhouette (hillTexture above) plus the sign in a
    // pocket of clear open sky, found by sweeping depth-tested marker spheres through the
    // live render (not just projection math, which can't see building occlusion) at x -190,
    // z -270 — to the LEFT of the near mid-rise apartment row (whose rightmost extent is
    // ~x -138) and far enough left of the downtown cluster (leftmost ~x -109) that nothing
    // occludes it. A 60x15 box centered at (-190, 22, -270) was verified corner-by-corner:
    // all 4 corners + edge midpoints render clear of every building AND stay inside the
    // camera frustum (screen Y 0-100%) — the frustum top there cuts off above world y ~34,
    // so this box (top at y 29.5) has a couple units of headroom.
    //
    // The sign itself is now 9 INDIVIDUAL white letter boards (hollywoodLetterTexture)
    // in a flat LINEAR row on this rolling foothill's crest — NOT a single banner plane
    // on a dark backing panel (the prior version the user rejected). See the per-letter
    // loop below for the row layout.
    try {
      // Blue-grey with a MODERATE haze mix so it recedes like a background foothill
      // instead of the near-black spike the user flagged as "funky" — still a touch
      // clearer than the 4 far ranges (haze 0.42-0.93) so white letters keep contrast.
      const hillMat = new THREE.MeshBasicMaterial({
        // night: near-black silhouette so the floodlit letters read against it (ref photo);
        // day: hazy blue-grey so it recedes as a background foothill.
        map: hillTexture(night ? 0x0c0f16 : haze(0x5a6678, 0.30).getHex()),
        transparent: true,
        alphaTest: 0.1,
        opacity: 1.0,
        fog: false,
        depthWrite: false,
      });
      // 55x25 — NOT the originally-planned 110x55 at z -278: verified empirically (forcing a
      // pure-red debug color and isolating depthTest/alphaTest/size/position one at a time)
      // that a wide 110-unit plane back at z -278 renders almost entirely invisible — its
      // edges reach past the clear gap (x -220..-160) into screen space that real buildings
      // legitimately occlude, and a wide 820-unit semi-transparent haze scrim at z -272 (see
      // "GRADED DISTANCE HAZE" above) sits between it and the camera. Keeping the hill's
      // that z -272 scrim is what actually renders correctly.
      // ROLLING FOOTHILL (user: the tall skinny peak looked "funky" — wanted rolling hills).
      // WIDE + LOW plane (92 x 30, aspect ~3:1) so the soft Gaussian crest reads as a broad
      // rolling rise, not a spike. It CAN run wider than the old 58 clear-pocket here because
      // (a) z -270 is in FRONT of the -272 haze scrim (so it isn't the invisible-plane case),
      // (b) its flanks at x -236..-144 sit LEFT of the downtown cluster (leftmost ~x -109), so
      // it never covers a tower, and (c) the near mid-rise row (z -124..-198) is IN FRONT of it
      // and just naturally occludes the right shoulder — hills tucking behind the city, correct.
      const hill = new THREE.Mesh(new THREE.PlaneGeometry(92, 30), hillMat);
      hill.position.set(-190, 18, -270);   // broad crest ~y27 — a rolling rise the sign sits on, no spike
      scene.add(hill);

      // INDIVIDUAL LETTERS across the peak (user rework): "HOLLYWOOD" is 9 separate white
      // letter boards. Per the latest feedback they now read LINEARLY — a straight row at
      // ONE altitude (no dome-follow arc) — and sit high on the raised peak's crest so the
      // sign doesn't hang low on pan views. Kept ~30% smaller than the old banner.
      const word = 'HOLLYWOOD';
      const hazeF = 0.06;                       // minimal haze — letters stay near-pure white
      // At NIGHT the real sign is floodlit (user ref photo: bright white letters against a
      // black hill), so drop the distance haze and bypass tone mapping — the letters then
      // read as ILLUMINATED instead of dimming into the dark hillside. Day keeps the haze.
      const letterCol = night ? new THREE.Color(0xffffff) : haze(0xffffff, hazeF);
      const LW = 4.6, LH = 5.8;                 // per-letter board size
      const SPACING = 4.4;                      // center-to-center; 9 letters span ~35u, inside the x -219..-161 pocket
      const cx = -190, cz = -264;               // in FRONT of the hill/scrim so letters stay crisp
      const SIGN_Y = 24;                        // flat altitude — on the rolling crest (~y27), still comfortably inside the default frustum top
      const n = word.length, mid = (n - 1) / 2;
      for (let i = 0; i < n; i++) {
        const mat = new THREE.MeshBasicMaterial({
          map: hollywoodLetterTexture(word[i]),
          color: letterCol,
          transparent: true,
          alphaTest: 0.35,      // crisp letter edge; no panel to preserve now
          fog: false,
          depthWrite: false,
          toneMapped: !night,   // night: bypass ACES so the floodlit letters stay bright
        });
        const off = i - mid;                    // -4..+4 across the row
        const y = SIGN_Y;                        // LINEAR: every letter at the same altitude (no arc)
        const letter = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH), mat);
        letter.position.set(cx + off * SPACING, y, cz);
        letter.renderOrder = 3;                 // ensure letters draw over the hill silhouette
        scene.add(letter);
      }
    } catch (e) {
      try { console.warn('Hollywood sign setup skipped:', e); } catch (_) {}
    }

  // ---- CLOUDS: soft cumulus billboards scattered across the upper sky (day) or
  // sparse dim wisps (night). Sprites always face the camera; fog off, no depth
  // write so they layer over the dome without occluding scene depth.
  const cloudTex = cloudTexture();
  const cirrusTex = cirrusTexture();
  const nClouds = night ? 5 : 16;
  for (let i = 0; i < nClouds; i++) {
    // ~1/3 of day clouds are high thin cirrus (wide, faint, up high); the rest are
    // fuller cumulus lower down — two cloud types = a layered LA sky, not one stamp
    const cirrus = !night && hash(i * 8.3) > 0.62;
    const az = (hash(i * 4.4) - 0.5) * Math.PI * 1.6;   // spread toward the -z view
    // sunlit vs shaded clouds: the scene sun is screen-LEFT (az<0), so clouds toward
    // it get a warm-gold core, those away read cooler-neutral — a subtle daylight cue
    const cloudCol = night ? 0x2a3550
      : (az < -0.15 ? 0xfff3df : az > 0.4 ? 0xeef2f6 : 0xfbfbf5);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cirrus ? cirrusTex : cloudTex,
      color: cloudCol, transparent: true,
      opacity: (night ? 0.3 : (cirrus ? 0.5 : 0.82)) + hash(i * 6.6) * 0.16,
      fog: false, depthWrite: false }));
    // the camera looks out ~level, so only a low sky band (near the horizon) is on
    // screen — cumulus sit low in the visible strip; cirrus ride higher/thinner
    const el = cirrus ? 0.22 + hash(i * 2.2) * 0.30     // cirrus: higher band
                      : 0.05 + hash(i * 2.2) * 0.26;    // cumulus: low band, in frame
    const r = 300;
    s.position.set(r * Math.cos(el) * Math.sin(az), r * Math.sin(el) + 18,
                   -r * Math.cos(el) * Math.cos(az) - 30);
    // size + aspect variation so no two clouds read identical; cirrus are wider/flatter
    const sc = (cirrus ? 62 : 40) + hash(i * 9.1) * (cirrus ? 70 : 66);
    const aspect = cirrus ? 3.4 + hash(i * 5.2) * 1.6 : 1.8 + hash(i * 3.9) * 0.9;
    s.scale.set(sc * aspect, sc, 1);
    // no renderOrder override: default (0) transparent sort draws the farther sky
    // dome (r380) before these nearer clouds (r300) so clouds layer over the sky,
    // while depthTest still lets opaque towers occlude any cloud behind them
    scene.add(s);
  }

  // ---- HORIZON CLOUD BANK: a few very wide, flat, soft cumulus stacks sitting
  // right on the horizon (in the low band the down-looking camera actually sees)
  // over the downtown/mountain vista. Adds layered sky texture near eye level
  // without rising into the (mostly off-screen) high dome. Warmed toward the sun.
  const nBank = night ? 2 : 5;
  for (let i = 0; i < nBank; i++) {
    const az = (hash(i * 11.7 + 2) - 0.5) * Math.PI * 1.5;   // spread toward the -z view
    const el = 0.015 + hash(i * 3.1 + 1) * 0.05;            // hug the horizon
    const r = 320;
    const bankCol = night ? 0x242d45 : (az < -0.1 ? 0xffe7cb : 0xf1ebdf);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex,
      color: bankCol, transparent: true,
      opacity: (night ? 0.22 : 0.5) + hash(i * 2.4) * 0.14,
      fog: false, depthWrite: false }));
    s.position.set(r * Math.cos(el) * Math.sin(az), r * Math.sin(el) + 8,
                   -r * Math.cos(el) * Math.cos(az) - 24);
    const sc = 70 + hash(i * 5.5) * 60;
    s.scale.set(sc * (3.6 + hash(i * 1.9) * 1.4), sc * 0.55, 1);  // wider + flatter distant bank
    scene.add(s);
  }

  // ---- AIRCRAFT FLYBYS: occasional helicopter (near the downtown towers) +
  // occasional airplane (higher, straight across the sky). See the AIRCRAFT
  // FLYBYS block above buildBackdrop for the builders/scheduler/ticker — this
  // just builds them once and starts their self-contained animation loop.
  setupAircraft(scene, night);
}
