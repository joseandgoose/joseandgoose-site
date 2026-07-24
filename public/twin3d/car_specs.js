// car_specs.js — real-world dimensions + front-end cues per fleet model, for
// car_parts.js to build photoreal proportions against. Dimensions in millimetres.
//
// Sources: manufacturer press kits (Honda News, Toyota Pressroom, Ford Media) where
// fetchable, cross-checked against auto123/Edmunds/Cars.com/KBB/CarsGuide spec pages
// via web search. Front/rear overhang is rarely published; where a source didn't give
// an explicit split, the split was estimated from (length - wheelbase) using typical
// body-style proportions — the total always reconciles to length - wheelbase exactly.
// Headlight/grille cues are read off real front-3/4 and front-on photos of the
// specific model-year, picked from the closest matching enum value.
//
// bodyType: sedan|wagon|hatchback|suv|minivan|pickup
// headlight: round | rect | swept-wrap | slim-led | projector-cluster
// grille: horizontal-bars | mesh | closed-body | blocky-slot | trapezoid-chrome
//
// R11 optional feature cues (all have safe fallbacks in car_parts.js — a model
// may omit any of them and still build):
//   fogLights:     bool   — fog/flood lamp pods in the lower front-bumper corners
//   taillightWrap: bool   — tall tail lamps that climb the D-pillar (SUV/wagon/van/
//                           vertical-corner hatch) vs a compact horizontal lamp
//   roofCrown:     number — side-to-side roof dome depth (world units; ~0.04 boxy
//                           .. ~0.06 rounded); roofs are crowned, never flat slabs
//   roofArch:      number — front-to-back roof arch depth (world units)
//   quarterGap:    number — rear quarter-window width as a fraction of half-length;
//                           kept SMALL (~0.11–0.14) so it's the smallest glass
//   bumperDepth:   number — how far the wrap-around bumper band stands off the corner
//   glassRoof:     bool   — the roof panel is dark glass, not body-color sheetmetal,
//                           and the A/B/C pillars black out so the greenhouse reads
//                           as one continuous glass canopy (Tesla panoramic-roof cue)
//   trimDark:      bool   — window belt trim + door handles render dark/flush instead
//                           of bright chrome (chrome-delete cars: EVs, blacked-out trim)
export const CAR_SPECS = {
  forester: {
    // 2019 Subaru Forester (SK), 2.5i — thecarconnection/CarsGuide/Edmunds/KBB
    bodyType: 'suv',
    lengthMM: 4625, widthMM: 1815, heightMM: 1714, wheelbaseMM: 2670,
    trackFMM: 1565, trackRMM: 1570,
    frontOverhangMM: 915, rearOverhangMM: 1040, // split estimated, total exact (4625-2670)
    headlight: 'projector-cluster',
    grille: 'hexagon',   // R13: exact SK 6-sided grille (was trapezoid-chrome approximation)
    fogLights: true, taillightWrap: true, roofCrown: 0.06, roofArch: 0.03, quarterGap: 0.14,
    estimated: true, // track + overhang split not independently confirmed
    notes: 'hexagonal/trapezoid grille with piano-black mesh + chrome surround bar; ' +
      'slim modular headlamp cluster — separate main projector, turn-signal, and LED DRL segments',
  },
  bronco: {
    // 2021 Ford Bronco Sport (base), Cars.com/Edmunds/USNews/Ford media
    bodyType: 'suv',
    lengthMM: 4387, widthMM: 1887, heightMM: 1814, wheelbaseMM: 2670,
    trackFMM: 1557, trackRMM: 1557,
    frontOverhangMM: 948, rearOverhangMM: 769, // split estimated, total exact (4387-2670)
    headlight: 'round',
    grille: 'blocky-slot',
    fogLights: true, taillightWrap: true, roofCrown: 0.045, roofArch: 0.02, quarterGap: 0.13,
    estimated: true, // track + overhang split not independently confirmed
    notes: 'deliberately round LED headlamps (throwback to classic Bronco), set into ' +
      'square corner housings; flat matte-black slot grille with raised "BRONCO" lettering, minimal chrome',
  },
  crv: {
    // 2017 Honda CR-V LX — Honda press kit (hondanews.com) + auto123
    bodyType: 'suv',
    lengthMM: 4586, widthMM: 1849, heightMM: 1689, wheelbaseMM: 2660,
    trackFMM: 1601, trackRMM: 1615,
    frontOverhangMM: 940, rearOverhangMM: 986,
    headlight: 'swept-wrap',
    grille: 'horizontal-bars',
    fogLights: true, taillightWrap: true, roofCrown: 0.06, roofArch: 0.035, quarterGap: 0.12,
    estimated: false,
    notes: 'chrome upper bar across grille, wraparound headlamps swept into the front fenders; ' +
      'roof-hinged liftgate down to the bumper, tall LED "wing" tail lamps up the D-pillar',
  },
  accord: {
    // 2013 Honda Accord Sedan (9th gen) — Honda press kit/owners site/auto123
    bodyType: 'sedan',
    lengthMM: 4885, widthMM: 1850, heightMM: 1465, wheelbaseMM: 2775,
    trackFMM: 1585, trackRMM: 1585,
    frontOverhangMM: 930, rearOverhangMM: 1180, // split estimated, total exact (4885-2775)
    headlight: 'swept-wrap',
    grille: 'trapezoid-chrome',
    fogLights: true, taillightWrap: false, roofCrown: 0.05, roofArch: 0.035, quarterGap: 0.12,
    estimated: true, // overhang split not independently confirmed
    notes: 'angular jewel-eye projector headlamps swept back into the fenders; ' +
      'bold trapezoidal chrome-bordered grille with dark mesh insert',
  },
  camry: {
    // 2015 Toyota Camry (XV50 facelift), LE — thecarconnection/CarsGuide/Edmunds
    bodyType: 'sedan',
    lengthMM: 4850, widthMM: 1825, heightMM: 1470, wheelbaseMM: 2776,
    trackFMM: 1595, trackRMM: 1585,
    frontOverhangMM: 915, rearOverhangMM: 1159, // split estimated, total exact (4850-2776)
    headlight: 'swept-wrap',
    grille: 'trapezoid-chrome',
    fogLights: true, taillightWrap: false, roofCrown: 0.05, roofArch: 0.03, quarterGap: 0.12,
    estimated: true, // overhang split not independently confirmed
    notes: '2015 facelift gave slender swept headlamps with LED accents; ' +
      'wide trapezoidal grille with chrome garnish bar (LE/XLE trim)',
  },
  corolla: {
    // 2014 Toyota Corolla (E170, pre-facelift) — thecarconnection/CarsGuide/Edmunds
    bodyType: 'sedan',
    lengthMM: 4650, widthMM: 1776, heightMM: 1455, wheelbaseMM: 2700,
    trackFMM: 1531, trackRMM: 1534,
    frontOverhangMM: 905, rearOverhangMM: 1045, // split estimated, total exact (4650-2700)
    headlight: 'swept-wrap',
    grille: 'trapezoid-chrome',
    fogLights: true, taillightWrap: false, roofCrown: 0.05, roofArch: 0.03, quarterGap: 0.13,
    estimated: true, // overhang split not independently confirmed
    notes: 'narrow angular swept-back headlamps; trapezoidal lower grille with ' +
      'thin chrome bar linking the headlights',
  },
  prius: {
    // 2016 Toyota Prius liftback (XW50) — Toyota pressroom/thecarconnection/CarsGuide
    bodyType: 'hatchback',
    lengthMM: 4540, widthMM: 1760, heightMM: 1490, wheelbaseMM: 2700,
    trackFMM: 1530, trackRMM: 1540,
    frontOverhangMM: 950, rearOverhangMM: 890,
    headlight: 'slim-led',
    grille: 'closed-body',
    fogLights: false, taillightWrap: true, roofCrown: 0.05, roofArch: 0.035, quarterGap: 0.12,
    estimated: false,
    notes: 'distinctive ultra-thin boomerang-shaped LED headlamp units; mostly closed, ' +
      'body-color aero front fascia with a small black lower trapezoid intake (no real upper grille)',
  },
  odyssey: {
    // 2018 Honda Odyssey (RC1) — Honda press kit + auto123 + CarsGuide
    bodyType: 'minivan',
    lengthMM: 5161, widthMM: 1994, heightMM: 1768, wheelbaseMM: 3000,
    trackFMM: 1709, trackRMM: 1707,
    frontOverhangMM: 940, rearOverhangMM: 1221, // split estimated, total exact (5161-3000)
    headlight: 'swept-wrap',
    grille: 'trapezoid-chrome',
    fogLights: true, taillightWrap: true, roofCrown: 0.06, roofArch: 0.03, quarterGap: 0.13,
    estimated: true, // overhang split not independently confirmed
    notes: 'wide wraparound headlamps with LED DRL blade; chrome "flying wing" garnish ' +
      'across a pentagonal/trapezoid grille',
  },
  f150: {
    // 2015 Ford F-150 SuperCrew, short (5.5ft) box, XLT — Edmunds/auto123/dealer spec sheet
    bodyType: 'pickup',
    lengthMM: 5890, widthMM: 2029, heightMM: 1961, wheelbaseMM: 3683,
    trackFMM: 1717, trackRMM: 1717,
    frontOverhangMM: 960, rearOverhangMM: 1247,
    headlight: 'rect',
    grille: 'blocky-slot',
    fogLights: true, taillightWrap: false, roofCrown: 0.04, roofArch: 0.02, quarterGap: 0.13,
    estimated: false,
    notes: 'rectangular/trapezoidal halogen headlamp units (XLT); classic three-bar ' +
      'chrome/body-color slot grille — the archetypal big-truck face',
  },
  model3: {
    // 2019 Tesla Model 3 — thecarconnection/CarsGuide/Edmunds/evspecifications
    bodyType: 'sedan',
    lengthMM: 4694, widthMM: 1849, heightMM: 1443, wheelbaseMM: 2875,
    trackFMM: 1580, trackRMM: 1580,
    frontOverhangMM: 850, rearOverhangMM: 969, // split estimated, total exact (4694-2875)
    headlight: 'slim-led',
    grille: 'closed-body',
    fogLights: false, taillightWrap: false, roofCrown: 0.055, roofArch: 0.045, quarterGap: 0.11,
    glassRoof: true, trimDark: true,
    estimated: true, // overhang split not independently confirmed
    notes: 'ultra-thin LED headlight strips; fully closed, smooth body-color front ' +
      'fascia with no functional grille opening; full-length panoramic GLASS ROOF with a ' +
      'single central pillar, chrome-delete black window trim + flush body-color door handles, ' +
      'soft one-arc fastback roofline into a short high decklid + spoiler lip',
  },
};
