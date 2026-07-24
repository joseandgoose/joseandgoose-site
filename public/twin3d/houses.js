// twin3d/houses.js — Kelton Ave apartment buildings (reference-matched rebuild).
// OWNED BY houses agent — other agents must not edit.
//
// Wave-A rebuild from Street View + window-camera reference: the real street is
// 2-3 story LA apartment blocks, not bungalows. East side (what the camera
// films): cream/white stucco, flat parapet rooflines, window rows, ivy/hedge
// frontage. Style cues from the user's own building (210h capture): recessed
// balconies w/ planter boxes, horizontal floor banding, underground garage ramp.
//
// PHOTO reference match (twin_comparison/reference/buildings/building_across_1..4.jpg
// — the user's own photos of the buildings directly across from the window): the far
// front row is NOT uniform white flat-roof blocks but THREE DISTINCT buildings —
//   A = Spanish/Med 1940s walk-up (short, cream, HIPPED RED CLAY-TILE roof, dark
//       forest-green trim/shutters, green side stair) — the cottage/hero mass;
//   B = 1970s/80s grey concrete modernist block (tallest, flat roof, a grid of
//       PROJECTING cantilevered box balconies, subterranean garage ramp, monolithic);
//   C = plain cream flat-roof mid-rise (3 stories, simple recessed windows) — repeats
//       down the block (terminal-near-Wilkins + right-edge).
// See the row-assembly comment below for the exact mapping. Rooftop condenser
// clusters (roofAC), the rear property wall + two hazy rear rows are kept.
//
// Exports:
//   buildHouses(scene, renderer)
import * as THREE from 'three';
import { makeCanvasTex, noiseFill, hash } from './shared.js';

export function buildHouses(scene, renderer) {
  const canvasTex = (draw, w, h, rep) => makeCanvasTex(THREE, renderer, draw, w, h, rep);

  // stucco: base noise + soft tonal blotches + faint weather streaks under sills
  const stuccoTex = (hex) => canvasTex((c, w, h) => {
    noiseFill(c, w, h, hex, 24);
    for (let i = 0; i < 7; i++) {
      c.globalAlpha = 0.09;
      c.fillStyle = i % 2 ? 'rgba(70,60,48,1)' : 'rgba(255,250,235,1)';
      c.beginPath();
      c.ellipse(hash(i + 3) * w, hash(i + 11) * h, 22 + hash(i) * 30, 12 + hash(i + 7) * 16,
                hash(i + 5) * 3, 0, 7);
      c.fill();
    }
    c.globalAlpha = 0.06; c.fillStyle = 'rgba(60,52,40,1)';
    for (let i = 0; i < 5; i++)                              // vertical weather streaks
      c.fillRect(hash(i + 61) * w, 0, 2 + hash(i + 7) * 3, h);
    c.globalAlpha = 1;
  }, 128, 128, 2);

  // GLAZED-PANE texture baker (R6 — over-correction fix). The prior pass darkened the
  // glass so hard that each front pane became a FLAT DEAD-DARK rectangle → it read as
  // a recessed VOID / dark panel, not a glazed window: a bare dark rectangle carries
  // none of the cues the eye uses to see "glass", and the pane sits 0.34u back in the
  // reveal shadow, so at frame distance a dark rect in a dark hole just reads as a
  // hole. Fix = bake the three missing glazing cues straight into the pane so they
  // survive at distance (the 0.07 muntin MESHES are sub-pixel that far out) AND glow
  // OUT of the recess shadow via the emissiveMap: (1) a bright angled SKY-GLINT
  // reflection streak across the upper pane — the single strongest "this is glass"
  // signal; (2) a pale FRAME border just inside the glass edge; (3) a light MULLION
  // cross → a 3x2 grid of lights. `lit` = warm interior glow (a scattered few, for
  // life); else dark blue glass + sky sheen — kept clearly DARKER than the cream/grey
  // walls, but never flat-dead-dark again.
  const paneTex = (lit) => canvasTex((c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);           // base glass, lighter at top
    if (lit) { gr.addColorStop(0, '#ffe1a0'); gr.addColorStop(0.55, '#efbf62'); gr.addColorStop(1, '#c68f3d'); }
    else     { gr.addColorStop(0, '#5b6f7d'); gr.addColorStop(0.5, '#33434f'); gr.addColorStop(1, '#20303b'); }
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.globalAlpha = lit ? 0.30 : 0.62;                       // bright diagonal SKY-GLINT reflection
    c.fillStyle = lit ? '#fff4d6' : '#d8e7f3';
    c.beginPath();
    c.moveTo(0, h * 0.30); c.lineTo(w * 0.6, 0); c.lineTo(w, 0);
    c.lineTo(w, h * 0.14); c.lineTo(0, h * 0.52); c.closePath(); c.fill();
    c.globalAlpha = lit ? 0.45 : 0.9;                        // sharp reflection edge line
    c.strokeStyle = lit ? '#fff8e8' : '#eff6fc'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(w * 0.04, h * 0.48); c.lineTo(w * 0.64, 0); c.stroke();
    c.globalAlpha = 1;
    c.strokeStyle = '#eef0e6'; c.lineWidth = Math.max(2.5, w * 0.09);   // pale FRAME border
    c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
    c.strokeStyle = lit ? 'rgba(120,96,54,0.85)' : 'rgba(236,240,232,0.9)';  // MULLION cross → 3x2 lights
    c.lineWidth = Math.max(1.5, w * 0.055);
    c.beginPath();
    c.moveTo(w / 3, 0); c.lineTo(w / 3, h); c.moveTo(w * 2 / 3, 0); c.lineTo(w * 2 / 3, h);
    c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  }, 42, 64, 1);
  const glassTex = paneTex(false);
  const glassLitTex = paneTex(true);

  // divided-light sash: white multi-pane grid over dark glass (the cottage
  // fourplex's signature per reference/BRIEF.md — cheaper as texture than mesh)
  const dividedTex = canvasTex((c, w, h) => {
    c.fillStyle = '#242e2b'; c.fillRect(0, 0, w, h);         // DARK glass base (was mid #3a4440 — read too near the cream wall)
    const gr = c.createLinearGradient(0, 0, 0, h);           // faint sheen only — the pane MUST stay dark so it
    gr.addColorStop(0, 'rgba(150,176,190,0.22)'); gr.addColorStop(1, 'rgba(20,30,38,0.22)');  // contrasts the pale wall (R8)
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.5; c.fillStyle = '#10161a';            // head-recess shadow line
    c.fillRect(0, 0, w, h * 0.07); c.globalAlpha = 1;
    // small corner sky-glint only (was a half-pane wash at 0.5α that averaged the whole
    // pane to sky-white on the light-walled cottage → window vanished into the wall)
    c.globalAlpha = 0.28; c.fillStyle = '#cfe0ee';           // small diagonal sky-glint → reads as glass, upper corner only
    c.beginPath(); c.moveTo(0, h * 0.20); c.lineTo(w * 0.34, 0); c.lineTo(w * 0.62, 0);
    c.lineTo(w, h * 0.10); c.lineTo(0, h * 0.30); c.closePath(); c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = '#f4f2ea';
    c.lineWidth = 2;                                         // outer sash frame (window edge)
    c.strokeRect(1, 1, w - 2, h - 2);
    c.lineWidth = 1.3;                                       // THINNER inner muntin cross (was 3 — read too heavy vs pane size)
    for (let i = 1; i < 3; i++) {                            // 3x2 pane grid
      c.beginPath(); c.moveTo(w * i / 3, 0); c.lineTo(w * i / 3, h); c.stroke();
    }
    c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  }, 48, 64, 1);

  // flat-roof surface: built-up gravel/membrane over the parapet-bound roof deck.
  // The flat tops read plain from the high camera (user P7) — this gives them a
  // real material: mottled gravel base, dark membrane roll SEAMS, scattered
  // ballast speckle + a couple of tar/weather patches. One shared tex/mat for the
  // whole row (polycount-safe — it rides on a single plane per building).
  const roofTex = canvasTex((c, w, h) => {
    noiseFill(c, w, h, '#5c584f', 20);                        // gravel/membrane base
    c.strokeStyle = 'rgba(28,25,21,0.5)'; c.lineWidth = 2;    // membrane roll seams
    for (let y = 18; y < h; y += 32) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }
    for (let i = 0; i < 46; i++) {                            // ballast speckle
      c.globalAlpha = 0.12 + hash(i) * 0.22;
      c.fillStyle = hash(i + 3) > 0.5 ? '#726c61' : '#403c35';
      c.beginPath(); c.arc(hash(i + 1) * w, hash(i + 7) * h, 1 + hash(i + 5) * 2.4, 0, 7); c.fill();
    }
    c.globalAlpha = 0.18; c.fillStyle = '#2d2a25';            // tar/weather patches
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.ellipse(hash(i + 13) * w, hash(i + 17) * h, 14 + hash(i) * 20, 9 + hash(i + 2) * 12,
                hash(i) * 3, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  }, 128, 128, 2);
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.98 });

  // dark glass, low roughness for a reflective SHEEN off the scene lights; the emissive
  // rides the pane texture so the baked glazing cues (sky-glint, pale frame, mullion
  // cross) self-illuminate OUT of the deep reveal shadow that was crushing the panes to
  // flat-black voids — that emissive glow of the bright cues, not the dark field, is
  // what now carries the "glazed window" read at frame distance.
  const glassMat = new THREE.MeshStandardMaterial({ map: glassTex,
    metalness: 0.28, roughness: 0.2,
    emissive: 0xffffff, emissiveMap: glassTex, emissiveIntensity: 0.24 });
  // warm-lit variant: a scattered few front windows glow with interior light for life
  // (feedback: mix of lit + unlit). Matte (no sky-mirror on a lit pane), strong
  // emissive; reuses the SAME window geometry, so it costs zero extra polys.
  const glassLitMat = new THREE.MeshStandardMaterial({ map: glassLitTex,
    metalness: 0.05, roughness: 0.5,
    emissive: 0xffffff, emissiveMap: glassLitTex, emissiveIntensity: 0.7 });
  const revealMat = new THREE.MeshStandardMaterial({ color: 0x241f19, roughness: 1 });
  const acMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a2, roughness: 0.6,
    metalness: 0.25 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.7 });
  const planterGreen = new THREE.MeshStandardMaterial({ color: 0x4c6a33, roughness: 1,
    flatShading: true });

  // dark forest-green trim for Building A — the Spanish/Mediterranean 1940s walk-up
  // (reference photos 1, 3-left, 4): cream stucco carrying green-framed divided-light
  // windows, dark-green louvered shutters, a green entry surround and a green side
  // stair/balcony walkway. One shared material for all of A's green woodwork.
  const greenTrim = new THREE.MeshStandardMaterial({ color: 0x2d4a34, roughness: 0.6 });

  // terra-cotta barrel-tile for Building A's low-pitch HIPPED roof (reference: a red
  // clay-tile hip — NOT the grey shingle the old uniform row used, and the ONLY
  // pitched roof on the far side). Pantile ridges + darker course lines over a
  // clay-red base; one shared tex rides the single hip cone (polycount-safe).
  const tileTex = canvasTex((c, w, h) => {
    noiseFill(c, w, h, '#b0492a', 16);
    for (let x = 0; x < w; x += 12) {
      c.strokeStyle = 'rgba(88,30,16,0.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke();
      c.strokeStyle = 'rgba(214,118,72,0.5)';
      c.beginPath(); c.moveTo(x + 6, 0); c.lineTo(x + 6, h); c.stroke();
    }
    c.globalAlpha = 0.3; c.strokeStyle = 'rgba(70,24,12,0.7)';
    for (let y = 12; y < h; y += 15) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }
    c.globalAlpha = 1;
  }, 128, 128, 3);
  const tileMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.85 });

  // rooftop condenser units — every flat roof in the aerial reference
  // (kelton_aerial.png / kelton_oblique.png) is PACKED with AC/HVAC condensers,
  // vents and duct boxes. Shared geometry + one material set for the whole row so
  // the dense rooftop-mechanical read costs almost nothing (polycount-safe).
  const gCondBody = new THREE.BoxGeometry(1.5, 0.95, 1.5);
  const gCondFan  = new THREE.BoxGeometry(1.15, 0.14, 1.15);
  const condMat = new THREE.MeshStandardMaterial({ color: 0xb6babd, roughness: 0.55,
    metalness: 0.35 });
  const condFanMat = new THREE.MeshStandardMaterial({ color: 0x35383b, roughness: 0.85 });

  // brick: running-bond courses with per-brick tonal jitter over mortar — gives a
  // couple of buildings a real masonry read so the row doesn't look like clones
  const brickTex = (hex) => canvasTex((c, w, h) => {
    const base = new THREE.Color(hex);
    c.fillStyle = '#d8cdbb'; c.fillRect(0, 0, w, h);          // mortar bed
    const bh = 13, bw = 26;
    for (let y = 0, r = 0; y < h; y += bh, r++) {
      const off = (r % 2) ? -bw / 2 : 0;                      // running bond
      for (let x = off; x < w; x += bw) {
        const jit = hash(r * 31 + x * 0.7) * 0.16 - 0.08;
        c.fillStyle = '#' + base.clone().offsetHSL(0, 0, jit).getHexString();
        c.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      }
    }
  }, 128, 128, 3);

  // sectional roll-up garage door (paneled) for where a driveway meets a building
  const garageTex = canvasTex((c, w, h) => {
    noiseFill(c, w, h, '#c6c1b4', 10);
    c.strokeStyle = 'rgba(55,50,42,0.55)'; c.lineWidth = 2;
    for (let y = 9; y < h; y += 13) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = 'rgba(55,50,42,0.22)';
    for (let x = 16; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  }, 64, 64, 1);
  const garageMat = new THREE.MeshStandardMaterial({ map: garageTex, roughness: 0.7,
    metalness: 0.15 });
  // LIGHT anodized-aluminum slider frame (was dark 0x55595c). Building B's grey wall +
  // now-dark glass swallowed a dark frame; a light silver surround + mullions give a
  // crisp bright outline so each slider reads as a distinct opening (user flag).
  const winMetal = new THREE.MeshStandardMaterial({ color: 0xc4c8cc, metalness: 0.5,
    roughness: 0.42 });

  // ---- shared window geometry (recessed "punched" opening) -----------------
  // Real facade depth without booleans: a trim reveal RING (4 bars with Z-depth)
  // framing glass set BACK behind the wall face, plus a projecting sill. Geometry
  // is shared across every window on the row, so hundreds of recesses cost only a
  // handful of BufferGeometries (feedback: watch polycount / instance where sane).
  const REV = 0.42, OW = 3.4, OH = 2.8, JW = 0.26;            // reveal depth (deepened R5); opening ENLARGED (R7) so C's punched windows read clearly at distance (~51% of bay wide, ~78% of floor tall, matching 2D _buildingC), jamb
  const gTrimJamb  = new THREE.BoxGeometry(JW, OH + JW * 2, REV);
  const gTrimHead  = new THREE.BoxGeometry(OW, JW, REV);
  const gTrimGlass = new THREE.BoxGeometry(OW - 0.06, OH - 0.06, 0.08);
  const gTrimSill  = new THREE.BoxGeometry(OW + 0.7, 0.22, 0.55);
  // muntins: 2 vertical + 1 horizontal bar across the sash → a 3x2 divided light,
  // shared across every trim window (R5 P4: far windows need real pane divisions)
  const gTrimMunV  = new THREE.BoxGeometry(0.07, OH - 0.12, 0.06);
  const gTrimMunH  = new THREE.BoxGeometry(OW - 0.12, 0.07, 0.06);
  const gJulRail   = new THREE.BoxGeometry(OW + 0.7, 0.12, 0.12);
  const gJulBar    = new THREE.BoxGeometry(0.05, 0.95, 0.05);
  const SW = 4.0, SH = 2.1, SJ = 0.16, SREV = 0.26;          // slider opening
  const gSlJamb  = new THREE.BoxGeometry(SJ, SH + SJ * 2, SREV);
  const gSlHead  = new THREE.BoxGeometry(SW, SJ, SREV);
  const gSlGlass = new THREE.BoxGeometry(SW - 0.06, SH - 0.06, 0.08);
  const gSlBar   = new THREE.BoxGeometry(0.08, SH - 0.06, 0.06);
  const gSlBarH  = new THREE.BoxGeometry(SW - 0.06, 0.07, 0.06);  // slider horizontal rail (R5 P4)
  const gSlSill  = new THREE.BoxGeometry(SW + 0.4, 0.16, 0.32);

  // facade cavity depth shared by every punched building (block body pulled back this
  // far; jamb reveals + recessed sashes sit inside it). Single source of truth so the
  // slab holes, the body setback, and the sash Z all agree.
  const FD = 0.5;

  // build a stucco FRONT-FACADE slab with REAL punched holes at each opening rect
  // [cx,cy,hw,hh] (world units, relative to the building group), extruded `FD` deep so
  // its front face lands on the wall plane `frontZ`. The building body is pulled back
  // `FD` to leave a cavity behind the holes → recessed sashes/doors read with true
  // depth instead of being decals on (or buried behind) a flat wall. Holes must stay
  // fully inside 0..H vertically or ExtrudeGeometry triangulation breaks.
  function buildPunchedFacade(g, w, H, frontZ, openings, mat) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, H); shape.lineTo(-w / 2, H); shape.lineTo(-w / 2, 0);
    for (const [cx, cy, hw, hh] of openings) {
      const p = new THREE.Path();
      p.moveTo(cx - hw, cy - hh); p.lineTo(cx + hw, cy - hh);
      p.lineTo(cx + hw, cy + hh); p.lineTo(cx - hw, cy + hh); p.lineTo(cx - hw, cy - hh);
      shape.holes.push(p);
    }
    const m = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: FD, bevelEnabled: false }), mat);
    m.position.z = frontZ - FD;                              // extrudes +Z → front face at frontZ
    m.castShadow = m.receiveShadow = true; g.add(m);
  }

  // recessed trim window: reveal ring lines the punched hole, glass set back at the
  // cavity floor, sill ledge, and (for a sparse few upper windows) a juliet guardrail
  function punchTrim(g, x, y, front, trimMat, juliet, glassM = glassMat) {
    const zc = front + 0.02 - REV / 2;                        // ring: wall face -> inward
    for (const s of [-1, 1]) {
      const jamb = new THREE.Mesh(gTrimJamb, trimMat);
      jamb.position.set(x + s * (OW / 2 + JW / 2), y, zc); g.add(jamb);
    }
    const head = new THREE.Mesh(gTrimHead, trimMat);
    head.position.set(x, y + OH / 2 + JW / 2, zc); head.castShadow = true; g.add(head);
    const sillR = new THREE.Mesh(gTrimHead, trimMat);
    sillR.position.set(x, y - OH / 2 - JW / 2, zc); g.add(sillR);
    const glass = new THREE.Mesh(gTrimGlass, glassM);
    glass.position.set(x, y, front - FD + 0.08); g.add(glass);   // glass recessed at the cavity floor behind the punched hole → true depth
    const mz = front - FD + 0.14;                            // muntins just in front of the sash
    for (const s of [-1, 1]) {
      const mv = new THREE.Mesh(gTrimMunV, trimMat);
      mv.position.set(x + s * OW / 6, y, mz); g.add(mv);     // 2 vertical → 3 lights across
    }
    const mh = new THREE.Mesh(gTrimMunH, trimMat);
    mh.position.set(x, y, mz); g.add(mh);                    // 1 horizontal → 2 tiers
    const sill = new THREE.Mesh(gTrimSill, trimMat);
    sill.position.set(x, y - OH / 2 - JW - 0.02, front + 0.2);
    sill.castShadow = true; g.add(sill);                     // projecting sill ledge
    if (juliet) {
      const rail = new THREE.Mesh(gJulRail, railMat);
      rail.position.set(x, y - OH / 2 + 0.15, front + 0.5); g.add(rail);
      for (let b = 0; b < 7; b++) {
        const bar = new THREE.Mesh(gJulBar, railMat);
        bar.position.set(x - OW / 2 + 0.1 + b * (OW / 6), y - OH / 2 - 0.35, front + 0.5);
        g.add(bar);
      }
    }
  }

  // recessed aluminum slider: shallow dark-metal reveal + recessed glass + mullion
  function punchSlider(g, x, y, front, glassM = glassMat) {
    const zc = front + 0.02 - SREV / 2;
    for (const s of [-1, 1]) {
      const jamb = new THREE.Mesh(gSlJamb, winMetal);
      jamb.position.set(x + s * (SW / 2 + SJ / 2), y, zc); g.add(jamb);
    }
    const head = new THREE.Mesh(gSlHead, winMetal);
    head.position.set(x, y + SH / 2 + SJ / 2, zc); head.castShadow = true; g.add(head);
    const sillR = new THREE.Mesh(gSlHead, winMetal);
    sillR.position.set(x, y - SH / 2 - SJ / 2, zc); g.add(sillR);
    const glass = new THREE.Mesh(gSlGlass, glassM);
    glass.position.set(x, y, front - FD + 0.08); g.add(glass);   // glass recessed at the cavity floor behind the punched hole → true depth
    const bar = new THREE.Mesh(gSlBar, winMetal);
    bar.position.set(x, y, front - FD + 0.14); g.add(bar);       // center mullion, in front of glass
    const barH = new THREE.Mesh(gSlBarH, winMetal);
    barH.position.set(x, y, front - FD + 0.14); g.add(barH);     // horizontal rail (R5 P4)
    const sill = new THREE.Mesh(gSlSill, winMetal);
    sill.position.set(x, y - SH / 2 - SJ - 0.02, front + 0.14);
    sill.castShadow = true; g.add(sill);
  }

  const STORY = 3.6;                                          // world units per floor

  // one apartment block. cfg: x, stories, w(idth), d(epth), wall hex, trim color,
  // balconies (row of recessed balconies on upper floors), garage (ramp entrance),
  // acUnits (count), parapetStep (raised section), zc (rear-lot z / per-building
  // setback), rot (Y rotation — corner buildings turn to face the cross street),
  // parapetH (parapet height — roofline variety), roofVents (roof-clutter count)
  const block = (cfg) => {
    const { x, stories, w, d = 18, wall, trim = 0xf0ece0, balconies = false,
            garage = false, ac = 0, parapetStep = false, zc = -47, rot = 0,
            parapetH = 0.9, roofVents = 2, brick = false, brickBase = false,
            beltCourse = false, garageDoor = false, roofAC = 3,
            boxBalconies = false, plain = false,
            garageX = 0.22, garageW = 8.5 } = cfg;   // garage local-x fraction of w + opening
                                                       // width — overridable so a garage can
                                                       // be parked at a building's CORNER
                                                       // (e.g. the cream Building C driveway)
                                                       // instead of Building B's default spot
    // subtle per-building roughness so neighbouring stucco walls don't read as
    // one continuous material under the same light
    const wallRough = cfg.wallRough ?? (0.9 + hash(x + 1.7) * 0.07);
    const g = new THREE.Group(); g.position.set(x, 0, zc); g.rotation.y = rot;
    const H = stories * STORY + parapetH;                     // + parapet
    const front = d / 2;
    const trimMat = new THREE.MeshStandardMaterial({ color: trim, roughness: 0.85 });

    // main massing — brick or noise-stucco, with per-building roughness variation
    const wallHex = '#' + new THREE.Color(wall).getHexString();
    const bodyMat = brick
      ? new THREE.MeshStandardMaterial({ roughness: 0.97, map: brickTex(wallHex) })
      : new THREE.MeshStandardMaterial({ roughness: wallRough, map: stuccoTex(wallHex) });
    // body pulled BACK by FD at the front (front face -> front-FD) so the punched
    // facade slab added at the end leaves a real reveal cavity behind each opening.
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, H, d - FD), bodyMat);
    body.position.set(0, H / 2, -FD / 2); body.castShadow = body.receiveShadow = true; g.add(body);

    // ground-floor brick wainscot (front, split around the entry) capped by a
    // trim water-table — a masonry base that reads distinct from stucco neighbours
    if (brickBase) {
      const bh = 0.85, seg = w / 2 - 2.6, bMat = new THREE.MeshStandardMaterial({  // plinth stays below window glass
        roughness: 0.97, map: brickTex('#9c6a4e') });
      for (const s of [-1, 1]) {
        const wain = new THREE.Mesh(new THREE.BoxGeometry(seg, bh, 0.3), bMat);
        wain.position.set(s * (w / 4 + 1.3), bh / 2, front + 0.06);
        wain.receiveShadow = true; g.add(wain);
        const wcap = new THREE.Mesh(new THREE.BoxGeometry(seg + 0.2, 0.16, 0.42), trimMat);
        wcap.position.set(s * (w / 4 + 1.3), bh + 0.08, front + 0.1);
        wcap.castShadow = true; g.add(wcap);
      }
    }

    // parapet coping RING (was a full slab that buried the roof deck) + optional
    // raised step + roof clutter. Leaving the ring's center OPEN lets the gravel
    // roof deck and the clutter/penthouse shadows read from the high down-look
    // camera (R5 P7) — a solid cap hid all of it. Low lip = the parapet edge.
    const copW = 0.5, copH = 0.35, copY = H + 0.12;
    const gCopX = new THREE.BoxGeometry(w + copW, copH, copW);   // front/back coping rails
    const gCopZ = new THREE.BoxGeometry(copW, copH, d + copW);   // left/right coping rails
    for (const s of [-1, 1]) {
      const cx = new THREE.Mesh(gCopX, trimMat);
      cx.position.set(0, copY, s * d / 2); cx.castShadow = true; g.add(cx);
      const cz = new THREE.Mesh(gCopZ, trimMat);
      cz.position.set(s * w / 2, copY, 0); cz.castShadow = true; g.add(cz);
    }
    // projecting cornice just under the parapet — casts a shadow line across the
    // top floor so the flat facades read architectural, not like plain boxes.
    // Suppressed for `plain` blocks (Building B's raw-concrete modernist box has no
    // cornice/ornament — the projecting balconies carry the horizontal read).
    if (!plain) {
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 1.1, 0.55, d + 1.1), trimMat);
      cornice.position.y = H - 0.5; cornice.castShadow = true; g.add(cornice);
    }
    // gravel/membrane roof deck inside the parapet coping — gives the flat top a
    // real material from the high camera (R5 P7) and takes the shadows of the
    // roof clutter/penthouse. Sized to the FULL building footprint (w x d) so it
    // exactly covers the top and its edges tuck under the coping rails — no
    // bare-stucco gap, no overhang. One inset plane per building (polycount-safe).
    const roofDeck = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roofMat);
    roofDeck.rotation.x = -Math.PI / 2;
    roofDeck.position.set(0, H + 0.04, 0); roofDeck.receiveShadow = true; g.add(roofDeck);
    if (parapetStep) {
      // smaller + wall-toned: the old wide trim-white slab glared as a pale
      // trapezoid on the roof from the high camera
      const step = new THREE.Mesh(new THREE.BoxGeometry(w * 0.2, 0.9, d * 0.38),
        new THREE.MeshStandardMaterial({ color: wall, roughness: 0.95 }));
      step.position.set(-w * 0.24, H + 0.45, -d * 0.1); step.castShadow = true; g.add(step);
    }
    // stair/elevator penthouse — position + size vary per building (deterministic
    // hash on x) so the roofline reads distinct along the row, not stamped
    const paW = 2.2 + hash(x + 2) * 1.2, paD = 1.9 + hash(x + 8) * 1.0;
    const access = new THREE.Mesh(new THREE.BoxGeometry(paW, 1.4 + hash(x) * 0.8, paD),
      new THREE.MeshStandardMaterial({ color: 0xcfc8b6, roughness: 1 }));
    access.position.set(w * (0.12 + hash(x + 4) * 0.32), H + 0.75, -d * (0.12 + hash(x + 6) * 0.2));
    access.castShadow = true; g.add(access);
    // roof clutter: small HVAC/vent boxes break the flat parapet silhouette
    // against the downtown towers behind (feedback: apartment-side roofline detail)
    const ventMat = new THREE.MeshStandardMaterial({ color: 0x8f897b, roughness: 1 });
    for (let v = 0; v < roofVents; v++) {
      const vw = 0.7 + hash(x + v * 5 + 1) * 1.3, vh = 0.5 + hash(x + v * 9 + 3) * 0.9;
      const vent = new THREE.Mesh(new THREE.BoxGeometry(vw, vh, vw * 0.85), ventMat);
      vent.position.set(-w / 2 + w * (0.22 + 0.56 * hash(x + v * 13 + 7)),
                        H + vh / 2, -d * (0.08 + 0.34 * hash(x + v * 3 + 5)));
      vent.castShadow = true; g.add(vent);
    }
    // rooftop condenser cluster — the dense AC/HVAC packs that cover every flat
    // roof in kelton_aerial.png. Deterministic spread across the rear ~⅔ of the
    // deck (clear of the front parapet edge), body + dark fan grille each. Shared
    // geometry, so N units cost only 2N cheap boxes.
    for (let a = 0; a < roofAC; a++) {
      const ax = -w / 2 + w * (0.16 + 0.66 * hash(x + a * 11 + 21));
      const az = d * (0.30 - 0.55 * hash(x + a * 7 + 29));      // biased toward the rear
      const body = new THREE.Mesh(gCondBody, condMat);
      body.position.set(ax, H + 0.52, az); body.castShadow = true; g.add(body);
      const fan = new THREE.Mesh(gCondFan, condFanMat);
      fan.position.set(ax, H + 1.02, az); g.add(fan);
    }

    // horizontal floor-band fascia lines (the banding on the user's building) —
    // suppressed for `plain` blocks (Building B's grey concrete has no contrasting
    // bands; its cantilevered balcony slabs supply the horizontal rhythm instead)
    if (!plain) for (let f = 1; f < stories; f++) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, 0.34, 0.24), trimMat);
      band.position.set(0, f * STORY, front + 0.1); g.add(band);   // proud of the punched facade plane
    }
    // projecting string course over the ground floor — a full-perimeter belt of
    // trim that separates a masonry/expressed base from the upper storeys
    if (beltCourse) {
      const belt = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.42, d + 0.5), trimMat);
      belt.position.y = STORY; belt.castShadow = true; g.add(belt);
    }

    // window rows: recessed reveal + glass + sill (lean: 3 meshes per window)
    const cols = Math.max(3, Math.round(w / 7));
    const xs = [];
    for (let i = 0; i < cols; i++) xs.push(-w / 2 + w * (i + 0.5) / cols);
    // openings = [cx,cy,hw,hh] rects fed to the punched-facade slab (built at the end,
    // once every window/balcony/entry/garage opening is known). entX defined here so the
    // ground-floor window over the entry is skipped (its hole would overlap the entry's).
    const openings = [];
    // entX overridable (cfg.entX) so a specific building's real front door can be
    // pinned to a world position (e.g. lining up with a paved walk in ground.js)
    // instead of the generic garage-relative default.
    const entX = cfg.entX ?? (garage ? -w * 0.30 : 0);
    const winHW = (cfg.sliders ? SW : OW) / 2 + 0.05;
    const winHH = (cfg.sliders ? SH : OH) / 2 + 0.05;
    let acLeft = ac;
    for (let f = 0; f < stories; f++) {
      const wy = f * STORY + 2.15;
      for (let i = 0; i < cols; i++) {
        // balconies replace windows on upper floors. Recessed style = the two
        // middle bays (default apartment blocks); box style (Building B) = EVERY
        // upper bay, a repeating grid of projecting cantilevered concrete balconies.
        const isBalc = boxBalconies ? f > 0
                                    : (balconies && f > 0 && (i === 1 || i === cols - 2));
        if (isBalc) {
          if (boxBalconies) { boxBalcony(g, xs[i], f * STORY, front, trimMat);
            openings.push([xs[i], f * STORY + 2.0, 2.7, 1.6]); }
          else { balcony(g, xs[i], f * STORY, front, trimMat);
            openings.push([xs[i], f * STORY + 2.05, 2.4, 1.45]); }
          continue;
        }
        // skip the ground-floor opening the garage door occupies
        if (garageDoor && f === 0 && Math.abs(xs[i] + w * 0.34) < 3) continue;
        // skip ground-floor windows over the underground garage ramp mouth
        if (garage && f === 0 && Math.abs(xs[i] - w * garageX) < 5) continue;
        // skip the ground-floor window the entry doorway occupies (hole would overlap)
        if (f === 0 && Math.abs(xs[i] - entX) < OW) continue;
        openings.push([xs[i], wy, winHW, winHH]);
        // a scattered few panes glow warm (interior light) — mix of lit + unlit for life
        const glassM = hash(x + f * 23 + i * 11 + 3.7) < 0.18 ? glassLitMat : glassMat;
        if (cfg.sliders) {
          // plain-stucco building: recessed aluminum sliders, thin dark-metal reveal
          // (BRIEF: "white 3-story, plain stucco, aluminum sliders")
          punchSlider(g, xs[i], wy, front, glassM);
        } else {
          // recessed trim window: reveal ring + set-back sash + sill, a sparse few
          // upper openings carry a juliet guardrail (deterministic, not noisy)
          const juliet = f > 0 && hash(x + f * 17 + i * 5) < 0.26;   // more juliet rails (reference: many small balconies)
          punchTrim(g, xs[i], wy, front, trimMat, juliet, glassM);
        }
        if (acLeft > 0 && hash(x + f * 7 + i * 13) < 0.22) {  // sparse AC window units
          const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.7), acMat);
          box.position.set(xs[i] + 0.65, wy - 0.5, front + 0.32);
          box.castShadow = true; g.add(box); acLeft--;
        }
      }
    }

    // side-face windows (user flag: visible ±x walls were blank stucco).
    // Sparser than the front — 2 columns per floor per side, slider treatment.
    const sideMetal = new THREE.MeshStandardMaterial({ color: 0x55595c,
      metalness: 0.6, roughness: 0.4 });
    for (const s of [-1, 1]) {
      for (let f = 0; f < stories; f++) {
        const wy = f * STORY + 2.15;
        for (let i = 0; i < 2; i++) {
          const wz = -d / 2 + d * (i + 0.5) / 2;
          const fr = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 3.4), sideMetal);
          fr.position.set(s * (w / 2 + 0.04), wy, wz); g.add(fr);
          const gl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 3.0), glassMat);
          gl.position.set(s * (w / 2 + 0.12), wy, wz); g.add(gl);
        }
      }
    }

    // street-level entry — RECESSED doorway: reveal jambs + head give the opening
    // real depth, glass door pair set back in the alcove, projecting canopy, stoop.
    // entX defined up top with the window grid; punch a real hole for the alcove.
    openings.push([entX, 1.6, 1.9, 1.45]);                   // entry doorway opening
    const eREV = 0.5, ezc = front + 0.02 - eREV / 2;
    for (const s of [-1, 1]) {                                 // reveal jambs
      const j = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.0, eREV), trimMat);
      j.position.set(entX + s * 1.85, 1.6, ezc); j.castShadow = true; g.add(j);
    }
    const eHead = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.32, eREV), trimMat);
    eHead.position.set(entX, 3.05, ezc); eHead.castShadow = true; g.add(eHead);
    const doors = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 0.1), glassMat);
    doors.position.set(entX, 1.5, front + 0.02 - eREV + 0.08); g.add(doors); // set back
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.28, 1.2), trimMat);
    canopy.position.set(entX, 3.28, front + 0.55); canopy.castShadow = true; g.add(canopy);
    // entry stoop: two low steps up to the door (grounds the facade at the street)
    const stepMat = new THREE.MeshStandardMaterial({ color: 0xbdb6a4, roughness: 1 });
    for (let s = 0; s < 2; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(4.2 - s * 0.9, 0.28, 1.0 - s * 0.3), stepMat);
      step.position.set(entX, 0.14 + s * 0.28, front + 0.75 - s * 0.32);
      step.castShadow = step.receiveShadow = true; g.add(step);
    }
    // entry apron: a short paved walk from the stoop out to the lot line keeps
    // the doorway visually CLEAR and prominent (the shrubs agent gaps its planting
    // at these entry x-positions) — the entrance reads open, never buried in
    // foliage (user P3: building entrances must be uninterrupted).
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xc0b9a7, roughness: 1 });
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.6), apronMat);
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(entX, 0.02, front + 2.7); apron.receiveShadow = true; g.add(apron);

    // above-ground sectional garage door where the driveway meets this building —
    // single-car width, tucked into the gap between two ground-floor window columns
    if (garageDoor) {
      const gdW = 3.2, gdH = 3.2, gdx = -w * 0.34;
      const gd = new THREE.Mesh(new THREE.BoxGeometry(gdW, gdH, 0.16), garageMat);
      gd.position.set(gdx, gdH / 2 + 0.05, front + 0.05); gd.castShadow = true; g.add(gd);
      const gdHead = new THREE.Mesh(new THREE.BoxGeometry(gdW + 0.4, 0.4, 0.5), trimMat);
      gdHead.position.set(gdx, gdH + 0.32, front + 0.12); gdHead.castShadow = true; g.add(gdHead);
    }

    // underground garage: dark opening (extends BELOW grade so the descending street
    // ramp built in ground.js enters it) + lintel. The ramp + retaining walls now live
    // in ground.js so they line up with the curb-cut driveway (this used to have its own
    // stray ramp that didn't connect to any street driveway — the user's flag).
    if (garage) {
      const gw = garageW, gx = w * garageX;
      const opening = new THREE.Mesh(new THREE.BoxGeometry(gw, 4.6, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x0e0c0a, roughness: 1 }));
      opening.position.set(gx, 0.9, front + 0.05); g.add(opening);   // y -1.4..3.2 (below grade → accepts the ramp)
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(gw + 1.2, 0.5, 0.7), trimMat);
      lintel.position.set(gx, 3.25, front + 0.1); lintel.castShadow = true; g.add(lintel);
    }
    // PUNCHED FACADE last, once every window/balcony/entry hole is collected: a stucco
    // slab (same wall material) with real openings so the recessed sashes/doors behind
    // it read with genuine depth. Garage doors stay flush (they belong on the wall).
    buildPunchedFacade(g, w, H, front, openings, bodyMat);
    scene.add(g);
    return g;                                                 // caller may attach extras (e.g. a garage gate)
  };

  // recessed balcony. Rework after user flag ("wonky"): the old near-black inset
  // read as a broken window with debris at frame distance. Now: shaded mid-tone
  // recess wall flush with the facade, its own glass door, white deck fascia,
  // denser railing, planter tucked at the deck edge.
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 1 });
  function balcony(g, bx, floorY, front, trimMat) {
    const back = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.9, 0.12), recessMat);
    back.position.set(bx, floorY + 2.05, front - 0.02); g.add(back);       // flush recess wall
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 0.08), glassMat);
    door.position.set(bx - 0.9, floorY + 1.85, front + 0.05); g.add(door); // slider onto balcony
    const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.30, 1.35), trimMat);
    deck.position.set(bx, floorY + 0.66, front + 0.62); deck.castShadow = true; g.add(deck);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 0.14), railMat);
    rail.position.set(bx, floorY + 1.85, front + 1.24); g.add(rail);
    for (let b = 0; b <= 10; b++) {                                        // denser bars
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 0.06), railMat);
      bar.position.set(bx - 2.15 + b * 0.43, floorY + 1.33, front + 1.24); g.add(bar);
    }
    const planter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 0.5), trimMat);
    planter.position.set(bx + 1.3, floorY + 1.02, front + 1.0); g.add(planter);
    const green = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), planterGreen);
    green.position.set(bx + 1.3, floorY + 1.4, front + 1.0); green.scale.y = 0.65;
    g.add(green);
  }

  // PROJECTING cantilevered box balcony — Building B's signature (photo 2, the
  // 1970s/80s grey concrete modernist block): a solid raw-stucco parapet box
  // cantilevered OUT past the facade with floor-to-ceiling glass behind, repeated
  // in a grid across every upper bay. Distinct from the recessed balcony above.
  // Shared geometry, so the whole grid stays cheap.
  // WIDENED (R7 — size/prominence fix): the 2D reference (_buildingB) glazes ~76% of
  // each 7u bay floor-to-ceiling, but the prior 3D door was only 2.7u (~38% of the
  // bay) so the dark glass read as a thin slot, not the bold DARK-GLASS BALCONY GRID
  // the 2D shows. Widen the whole cantilevered box + its full-height glass to fill the
  // bay: glass 5.2u (~74% of the 7u bay, matching 2D) and taller (3.15u ≈ floor-to-
  // ceiling), the box slab/parapets grown to carry it, side parapets pushed out to match.
  const gBalSlab  = new THREE.BoxGeometry(5.9, 0.30, 2.2);      // cantilevered floor slab (widened)
  const gBalFront = new THREE.BoxGeometry(5.9, 1.25, 0.26);     // solid front parapet (widened)
  const gBalSide  = new THREE.BoxGeometry(0.26, 1.25, 2.2);     // solid side parapets
  const gBalDoor  = new THREE.BoxGeometry(5.2, 3.15, 0.10);     // BIG floor-to-ceiling dark glass behind
  function boxBalcony(g, bx, floorY, front, mat) {
    const zc = front + 1.05;
    const slab = new THREE.Mesh(gBalSlab, mat);
    slab.position.set(bx, floorY + 0.5, zc); slab.castShadow = slab.receiveShadow = true; g.add(slab);
    const fr = new THREE.Mesh(gBalFront, mat);
    fr.position.set(bx, floorY + 1.18, zc + 0.93); fr.castShadow = true; g.add(fr);
    for (const s of [-1, 1]) {
      const sd = new THREE.Mesh(gBalSide, mat);
      sd.position.set(bx + s * 2.82, floorY + 1.18, zc); sd.castShadow = true; g.add(sd);   // pushed out to the wider slab edge
    }
    const door = new THREE.Mesh(gBalDoor, glassMat);
    door.position.set(bx, floorY + 2.0, front + 0.05); g.add(door);  // floor-to-ceiling dark glass
  }

  // cream cottage-style fourplex (BRIEF: the building most visible in the webcam
  // top band): 2 stories, divided-light windows, hip roof, brick-edged walkway
  const cottage = (x, zc = -46) => {
    const g = new THREE.Group(); g.position.set(x, 0, zc);
    const w = 26, d = 16, H = 7.6, front = d / 2;
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ea, roughness: 0.85 });
    // light cream stucco — explicit + lifted a touch into the white/cream family so
    // the hero building reads as a proper LIGHT wall consistent with the far row.
    // (It was rendering dark/greyed because the oversized roof below buried the
    // whole facade in its own cast shadow — the roof fix restores the light read,
    // and the slightly lighter cream keeps it firmly in the white/cream palette.)
    // stucco shared by the body + the punched front facade slab so they read seamless
    const cottageWallMat = new THREE.MeshStandardMaterial({ roughness: 0.9, map: stuccoTex('#eae6d8') });
    // FD = reveal depth. The body is pulled BACK by FD at the front (front face -> front-FD)
    // so the punched facade slab in front of it leaves a real cavity behind each opening —
    // that cavity is what gives the street windows/door true recessed DEPTH (vs. the old
    // solid box where the recess was buried and the panes were occluded entirely).
    const FD = 0.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, H, d - FD), cottageWallMat);
    body.position.set(0, H / 2, -FD / 2);                    // back face unchanged; front pulled back FD
    body.castShadow = body.receiveShadow = true; g.add(body);
    // hip roof: shallow shingled pyramid over an eave slab
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 2.6, 0.4, d + 2.6), trimMat);
    eave.position.y = H + 0.2; eave.castShadow = true; g.add(eave);
    // hip roof over the RECTANGULAR footprint. A 4-sided cone is a SQUARE pyramid:
    // sizing its radius to cover the WIDTH (0.72·eaveW → flat faces at ~0.71R ≈
    // 14.6, a small overhang past the 14.3 half-width) made it massively OVERHANG
    // the shorter DEPTH — the same 14.6 reach over a half-depth of only 9.3 left a
    // giant roof cantilevering ~5u past the front/back walls and dropping the whole
    // facade into its own shadow (user: "roof too large for the shape below" + walls
    // reading dark). Keep the width-fit radius, then SQUASH the pyramid in Z by the
    // eave depth/width ratio so all four eaves meet the walls with the same small
    // overhang. The squash rides on an unrotated PARENT group so it acts on world Z
    // *after* the 45° turn (scaling the rotated mesh directly would skew it along
    // the turned local axis instead).
    const roofPivot = new THREE.Group();
    roofPivot.position.y = H + 2.0;
    roofPivot.scale.z = (d + 2.6) / (w + 2.6);               // 18.6/28.6 → rectangular hip
    const roof = new THREE.Mesh(new THREE.ConeGeometry((w + 2.6) * 0.72, 3.2, 4), tileMat);
    roof.rotation.y = Math.PI / 4; roof.castShadow = true; roofPivot.add(roof);
    g.add(roofPivot);
    // divided-light windows, 2 floors x 4 cols (texture carries the pane grid).
    // Recessed: trim reveal ring around a set-back sash so the hero building reads
    // with real punched openings, not decals — geometry shared across the 7 windows
    // metalness KILLED (was 0.25): a metallic low-roughness pane mirrors the bright sky/sun
    // back as near-white on the light cottage wall, which is exactly why the windows blended
    // out. Matte + dark keeps the pane reading as a genuine dark opening against pale stucco.
    const dividedMat = new THREE.MeshStandardMaterial({ map: dividedTex,
      metalness: 0.0, roughness: 0.62 });
    // ENLARGED (R7 — size/prominence fix): the 2D reference (_buildingA) shows LARGE
    // divided-light windows with wide FOREST-GREEN SHUTTERS (shutter ≈ 34% of the
    // window width) flanking each one. The prior 3D sash (2.6×3.0) with thin 0.55u
    // shutters read faint at distance, so grow the sash and widen the shutters to
    // ~32% of the sash (0.95u) so the green louvers clearly read beside each window.
    const cjw = 0.2, cwW = 3.0, cwH = 3.2;
    const gcJamb = new THREE.BoxGeometry(cjw, cwH + cjw * 2, FD);   // reveal jamb lines the hole through the full facade depth
    const gcHead = new THREE.BoxGeometry(cwW, cjw, FD);
    const gcSash = new THREE.BoxGeometry(cwW, cwH, 0.14);
    const gcSill = new THREE.BoxGeometry(cwW + 0.4, 0.2, 0.45);
    const gcShutter = new THREE.BoxGeometry(0.95, cwH + 0.15, 0.16);   // WIDE green louvered shutter
    const czc = front - FD / 2;                              // reveal ring centered in the cavity depth
    const sashZ = front - FD + 0.08;                         // glass set back at the cavity floor → true recess

    // window centers (skip the ground-floor door slot at i=2)
    const cWins = [];
    for (let f = 0; f < 2; f++) for (let i = 0; i < 4; i++) {
      if (f === 0 && i === 2) continue;
      cWins.push([-w / 2 + w * (i + 0.5) / 4, f * 3.5 + 2.3]);
    }
    const doorX = -w / 2 + w * 2.5 / 4;

    // PUNCHED FRONT FACADE: a stucco slab with real rectangular holes at every window +
    // the door, so the recessed sashes/door read with genuine depth through the openings
    // (the body was pulled back FD to leave the cavity). Shape holes = true see-through.
    const cShape = new THREE.Shape();
    cShape.moveTo(-w / 2, 0); cShape.lineTo(w / 2, 0);
    cShape.lineTo(w / 2, H); cShape.lineTo(-w / 2, H); cShape.lineTo(-w / 2, 0);
    const rectHole = (cx, cy, hw, hh) => {
      const p = new THREE.Path();
      p.moveTo(cx - hw, cy - hh); p.lineTo(cx + hw, cy - hh);
      p.lineTo(cx + hw, cy + hh); p.lineTo(cx - hw, cy + hh); p.lineTo(cx - hw, cy - hh);
      return p;
    };
    for (const [wx, wyv] of cWins) cShape.holes.push(rectHole(wx, wyv, cwW / 2, cwH / 2));
    cShape.holes.push(rectHole(doorX, 1.8, 1.0, 1.7));       // door opening
    const cFacade = new THREE.Mesh(
      new THREE.ExtrudeGeometry(cShape, { depth: FD, bevelEnabled: false }), cottageWallMat);
    cFacade.position.z = front - FD;                         // extrudes +Z → front face lands at `front`
    cFacade.castShadow = cFacade.receiveShadow = true; g.add(cFacade);

    for (const [wx, wyv] of cWins) {
      // GREEN reveal frame (jambs + head + sill) lining the punched opening
      for (const s of [-1, 1]) {
        const jamb = new THREE.Mesh(gcJamb, greenTrim);
        jamb.position.set(wx + s * (cwW / 2 + cjw / 2), wyv, czc); g.add(jamb);
      }
      const head = new THREE.Mesh(gcHead, greenTrim);
      head.position.set(wx, wyv + cwH / 2 + cjw / 2, czc); head.castShadow = true; g.add(head);
      const win = new THREE.Mesh(gcSash, dividedMat);
      win.position.set(wx, wyv, sashZ); g.add(win);          // sash recessed at the cavity floor
      const sill = new THREE.Mesh(gcSill, greenTrim);
      sill.position.set(wx, wyv - cwH / 2 - 0.15, front + 0.14); sill.castShadow = true; g.add(sill);
      // dark-green louvered shutters flanking each window (reference photos 1, 4)
      for (const s of [-1, 1]) {
        const sh = new THREE.Mesh(gcShutter, greenTrim);
        sh.position.set(wx + s * (cwW / 2 + cjw + 0.55), wyv, front + 0.05);   // proud, on the facade face
        sh.castShadow = true; g.add(sh);
      }
    }
    // side-face divided-light windows (user flag: blank side walls) — 2 per floor per side
    for (const s of [-1, 1]) for (let f = 0; f < 2; f++) for (let i = 0; i < 2; i++) {
      const wz = -d / 2 + d * (i + 0.5) / 2;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 2.3), dividedMat);
      win.position.set(s * (w / 2 + 0.05), f * 3.5 + 2.3, wz); g.add(win);
    }

    // entry: RECESSED painted-wood door set back in the PUNCHED door opening, green
    // surround lining the reveal, small gabled hood, brick-edged walkway to the sidewalk
    const ddzc = front - FD / 2;                             // surround lines the cavity depth
    for (const s of [-1, 1]) {                               // GREEN entry surround
      const j = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.6, FD), greenTrim);
      j.position.set(doorX + s * 1.1, 1.8, ddzc); g.add(j);
    }
    const dHead = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, FD), greenTrim);
    dHead.position.set(doorX, 3.55, ddzc); dHead.castShadow = true; g.add(dHead);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.4, 0.14), greenTrim);  // green door
    door.position.set(doorX, 1.7, front - FD + 0.09); g.add(door);  // recessed at the cavity floor
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.24, 1.6), trimMat);
    hood.position.set(doorX, 3.7, front + 0.6); hood.rotation.x = 0.18;
    hood.castShadow = true; g.add(hood);
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(1.7, Math.abs(zc + front + 36) + 1.2),
      new THREE.MeshStandardMaterial({ color: 0xb9b2a0, roughness: 1 }));
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(doorX, 0.015, front + (Math.abs(zc + front + 36) + 1.2) / 2);
    walk.receiveShadow = true; g.add(walk);
    for (const s of [-1, 1]) {                               // brick edge courses
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.1, Math.abs(zc + front + 36) + 1.2),
        new THREE.MeshStandardMaterial({ color: 0x9c5c48, roughness: 1 }));
      edge.position.set(doorX + s * 0.95, 0.05,
        front + (Math.abs(zc + front + 36) + 1.2) / 2);
      g.add(edge);
    }

    // green exterior side stair + 2nd-floor walkway (reference photo 4, right side of
    // the Spanish walk-up): a cream deck edged by a dark-green guardrail, with a
    // green stair stringer dropping to grade near the street.
    const sideX = w / 2 + 0.9;
    const wY = 3.5 + 0.9;                                    // second-floor walkway level
    const wdeck = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, d - 2), trimMat);
    wdeck.position.set(sideX, wY, 0); wdeck.castShadow = true; g.add(wdeck);
    const wrailTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, d - 2), greenTrim);
    wrailTop.position.set(sideX + 0.85, wY + 1.05, 0); g.add(wrailTop);
    const nBar = 14;
    for (let b = 0; b <= nBar; b++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.05, 0.07), greenTrim);
      bar.position.set(sideX + 0.85, wY + 0.55, -(d - 2) / 2 + b * (d - 2) / nBar); g.add(bar);
    }
    const stair = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 6.4), greenTrim);
    stair.position.set(sideX, wY / 2 + 0.15, front - 1.5);
    stair.rotation.x = 0.62; stair.castShadow = true; g.add(stair);
    const stairRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 6.4), greenTrim);
    stairRail.position.set(sideX + 0.8, wY / 2 + 0.9, front - 1.5);
    stairRail.rotation.x = 0.62; g.add(stairRail);
    scene.add(g);
  };

  // ---- the far side, rebuilt from the user's REAL PHOTOS of the buildings across
  // from the window (twin_comparison/reference/buildings/building_across_1..4.jpg).
  // The old row read as uniform white flat-roof blocks; the real far side is THREE
  // DISTINCT buildings, so each is now typed to its actual counterpart:
  //
  //   A — Spanish/Mediterranean 1940s walk-up (photos 1, 3-left, 4): the SHORT one
  //       (2 stories), cream stucco, a low-pitch HIPPED RED CLAY-TILE roof (the only
  //       pitched/tiled roof on the far side), dark forest-green trim + shutters +
  //       green divided-light window frames + a green side stair/walkway. This is
  //       the cream cottage/hero mass (most visible in the webcam top band).
  //   B — 1970s/80s grey concrete modernist block (photo 2): the TALL one (4
  //       stories), grey/taupe raw stucco, FLAT roof, a repeating grid of PROJECTING
  //       cantilevered box balconies over floor-to-ceiling glass, a subterranean
  //       garage ramp. Monolithic — no cornice, no floor bands, no ornament.
  //   C — plain cream stucco mid-rise (photo 3 center/right): 3 stories, off-white/
  //       cream stucco, FLAT roof, simple recessed windows, minimal ornament. The
  //       real block repeats down the street, so both the terminal building near
  //       Wilkins and the right-edge block are C-typology cream mid-rises.
  //
  // Heights: A short (2), C mid (3), B tall (4) — a real, varied roofline, not the
  // old uniform 3-4 story white wall.
  //
  // KEPT (per brief): the +26 Phase-A layout shift (frontage baseline z ≈ -38), the
  // Wilkins cross-street opening on the LEFT (no building on that corner — the low
  // structure sits WELL BACK across the intersection at z ≈ -84), every entry, the
  // rear property wall + the two hazy rear rows behind. Only each front building's
  // typology / roof / colour / balconies changed.
  // Row edges (x): [Wilkins gap] | -67..-27 (C) |[drive]| cottage A | 24..66 (B) | 74..112 (C)

  // Far-side-of-Wilkins structure: deep set-back (z ≈ -84), turned to face the
  // intersection, low + small + neutral — closes the vista across the cross street.
  block({ x: -100, stories: 2, w: 20, d: 16, wall: 0xd2ccbd, trim: 0xe8e2d2,
          zc: -84, rot: 0.6, parapetH: 0.6, roofVents: 1, roofAC: 1 });             // far side of Wilkins — set well back across the intersection (light greige)
  // C (terminal, near Wilkins): plain cream flat-roof mid-rise, 3 stories, simple
  // recessed windows, no balconies/belt/ornament (reference photo 3 center/right).
  // garage: RIGHT-CORNER underground garage (reusing Building B's dark-opening +
  // lintel mechanism) so it lines up with the ground.js curb-cut driveway/apron
  // centered at world x≈-29.5 (curb cut -34..-25). Building spans local x -20..20
  // (world -67..-27); garageX=0.4375 -> local x 17.5 = world -29.5, and a
  // NARROWER garageW (5, vs B's 8.5) keeps the opening from overhanging past the
  // building's right edge at local x=20 (world -27).
  block({ x: -47, stories: 3, w: 40, wall: 0xe7e1d1, trim: 0xf1ebdb,
          parapetH: 0.9, roofVents: 2, roofAC: 3, wallRough: 0.9,
          garage: true, garageX: 0.4375, garageW: 5 });                            // Building C — plain cream mid-rise, right-corner garage
  cottage(4);                                                                       // Building A — Spanish walk-up: red-tile hip roof + green trim (hero)
  // B: 1970s/80s grey concrete modernist, 4 stories (tallest), FLAT roof, a grid of
  // PROJECTING box balconies over floor-to-ceiling glass, subterranean garage ramp,
  // monolithic (plain: no cornice/bands) — reference photo 2.
  block({ x: 45, stories: 4, w: 42, d: 22, wall: 0x9a968d, trim: 0x8a867e,
          sliders: true, boxBalconies: true, garage: true, plain: true,
          zc: -51, parapetH: 1.2, roofVents: 3, roofAC: 4, wallRough: 0.96 });      // Building B — grey modernist box-balcony block
  // C (right edge): a second plain cream mid-rise, 3 stories — the C typology
  // repeating down the block (reference photo 3), subdued neighbour bleeding L->R.
  block({ x: 93, stories: 3, w: 38, d: 16, wall: 0xe4ded0, trim: 0xeee8d8,
          zc: -45, parapetH: 0.8, roofVents: 2, roofAC: 3, wallRough: 0.92 });      // Building C (repeat) — plain cream mid-rise, right edge

  // ---- NEAR SIDE (camera side): the user's own building, 1414 Kelton --------
  // SECOND PASS — the user corrected the first pass after checking their own
  // Google Map: on their (near) side of the street there is essentially ONE
  // building that runs the FULL LENGTH of the block (not a short frontage), and
  // their own vantage point is the 3rd floor of a 6-FLOOR building — so the old
  // 2-story/w=30 mass was both too short and too small. This pass: ONE long
  // 6-story building spanning the near frontage, wide enough to read as "the
  // whole block is one building" (w=140 vs the far row's individual 38-42-wide
  // buildings — several block-widths' worth). Cream/beige stucco, balconies +
  // gated underground garage kept from the first pass (matches real 1414:
  // stucco, balconies, gated garage).
  //
  // CRITICAL — do not wall off the across-street view. The "show" camera preset
  // (scene.js) sits at (0,30,26) looking at tgt (0,0,-30): a steep ~28° down
  // tilt at fov 58 (vertical, 16:9). This building sits on the CAMERA'S OWN side
  // (positive z) — rot=PI turns its "front" (garage/entry/balconies) to face the
  // street (-z), so its front (small-z) edge is the street-facing facade and its
  // back (large-z) edge is the side nearer the camera, matching every far-side
  // building's front-faces-camera convention. Two independent checks, both
  // driven off the actual camera math (not eyeballed):
  //   1. Frustum floor: the bottom view-frustum edge crosses y=0 at z ≈ 6.6 (ray
  //      from the camera at down-angle 28.2°+halfFov 29° = 57.2°: 30/tan(57.2°)
  //      ≈ 19.4 horizontal run back from the camera's z=26). For z below that,
  //      the ground is inside the frame; above it (closer to the camera, our
  //      near-frontage band) the ground itself is below the visible frame — so
  //      only whatever POKES UP above the local frustum-floor y at a given z
  //      shows at all, and only as a low band at the extreme bottom of frame.
  //   2. Occlusion vs. the far row: what actually matters for "does this block
  //      the street" is whether this building's mass intercepts the sightline
  //      from the camera down to the CLOSEST far building's base (Building C /
  //      the cottage front, z ≈ -38 — the binding case; farther buildings need
  //      even less clearance). That sightline's height at a given near-side z is
  //      y(z) = 30 * (38 + z) / 64 (linear interpolation of the camera-to-target
  //      ray between camera z=26,y=30 and far-target z=-38,y=0). Setting
  //      y(z) = H (this building's full height, stories*3.6 + parapet = 22.5 for
  //      6 stories) and solving gives z = 10 as the bare-minimum front-face
  //      position below which this mass would poke into that sightline and
  //      visually block the far row. Placing the building well past that
  //      threshold — zc=26 (matches the camera's own z), d=16, so front face at
  //      z=18 and back face at z=34 — gives y(18) ≈ 26.25, a ~3.75-unit margin
  //      over the 22.5 building height, and pushes roughly HALF the building's
  //      depth (and essentially all its upper floors, mass-wise) to z > 26, i.e.
  //      at/behind the camera's own position — genuinely out of the forward
  //      frustum, not just visually thin. Only the low, street-facing front
  //      (garage/entry/first balcony tier) actually renders, as a foreground
  //      band at the very bottom of frame; the far row (z -38..-90, mid/upper
  //      frame) stays fully clear.
  const K_W = 140, K_D = 16;                          // near building footprint (wide, spans the block)
  // Two near-side driveways in ground.js (apronMk) both terminate at THIS
  // building now that it spans the full merged-lot frontage: LEFT bay world
  // x=-16 ("1414's own"), RIGHT bay world x=33 (the former "1400" lot's drive).
  // rot=PI negates world x for this group (worldX = -localX), so: bay1 local
  // x=16, bay2 local x=-33. Each gets its own garage door (task: every
  // driveway needs one, not a shared/mismatched single opening).
  const K_GARAGE1_LX = 16, K_GARAGE2_LX = -33, K_GARAGE_W = 7;
  // The generic street-entry door/stoop/apron block() builds (see cfg.entX
  // above) is pinned here to local x=-7.3 -> world x=+7.3, lining up with
  // ground.js's dedicated pedestrian walk (buildGround's `nearWalk`, centered
  // x=7.3). Left at the OLD garage-relative default this landed at world x=42
  // — nowhere near any paved walk, which is why the path down to the sidewalk
  // read as lost after the second-pass rework.
  const K_ENTRY_LX = -7.3;
  const kelton1414 = block({
    x: 0, zc: 26, rot: Math.PI, stories: 6, w: K_W, d: K_D,
    wall: 0xe6dcc7, trim: 0xf1ebd8, balconies: true, garage: true,
    garageX: K_GARAGE1_LX / K_W, garageW: K_GARAGE_W, entX: K_ENTRY_LX,
    parapetH: 0.9, roofVents: 3, roofAC: 5, wallRough: 0.93,
  });                                                                              // 1414 Kelton — near-side frontage (second pass: full-block, 6-story)
  // scene.js keys off this name to hide the building unless the camera orbits
  // to look back toward +z (see updateNearBuildingVisibility in scene.js) —
  // in the default "show" view it sits on the camera's own side and must stay
  // hidden so it never intrudes on the across-street frame.
  kelton1414.name = 'nearBuilding1414';
  if (kelton1414) {
    const kFront = K_D / 2;
    const trimMatK = new THREE.MeshStandardMaterial({ color: 0xf1ebd8, roughness: 0.85 });
    // SECTIONAL GARAGE DOORS — real ref is a gated garage, but a bare dark hole
    // (even barred) still read as "open" from a distance (user flag). Replaces
    // the old vertical-bar gate with an actual sectional roll-up door: a stack
    // of thin horizontal panel boxes, dark neutral metal, filling each bay's
    // mouth. Bay 1's opening/lintel already exist (punched by block()'s
    // cfg.garage above, using K_GARAGE1_LX/K_GARAGE_W); bay 2 is a second
    // opening built by hand here since block() only punches one per call.
    // Both are added as children of the returned group so they sit in the SAME
    // local coords as the block()-built geometry and rotate/position with it.
    // (bay 1's ground-floor window is properly skipped by block()'s own
    // garage-skip check, which reads back the cfg.garageX we passed in; bay 2
    // has no such hook into that check, so any ground-floor window punched
    // near K_GARAGE2_LX is simply hidden behind this door's opaque panels —
    // harmless from the street, since the door sits proud of the facade.)
    const opening2 = new THREE.Mesh(new THREE.BoxGeometry(K_GARAGE_W, 4.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0e0c0a, roughness: 1 }));
    opening2.position.set(K_GARAGE2_LX, 0.9, kFront + 0.05); kelton1414.add(opening2);
    const lintel2 = new THREE.Mesh(new THREE.BoxGeometry(K_GARAGE_W + 1.2, 0.5, 0.7), trimMatK);
    lintel2.position.set(K_GARAGE2_LX, 3.25, kFront + 0.1); lintel2.castShadow = true; kelton1414.add(lintel2);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x3a3d40, metalness: 0.5, roughness: 0.4 });
    const panelCount = 6, doorH = 3.6, panelH = doorH / panelCount;
    for (const gx of [K_GARAGE1_LX, K_GARAGE2_LX]) {
      for (let p = 0; p < panelCount; p++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(K_GARAGE_W - 0.4, panelH - 0.06, 0.1), doorMat);
        panel.position.set(gx, 0.1 + p * panelH + panelH / 2, kFront + 0.12);
        panel.castShadow = true; kelton1414.add(panel);
      }
    }

    // ENTRY PATH TO THE SIDEWALK (task: restore the staircase + door under the
    // window) — block()'s generic entry (door + 2-step stoop + apron) is
    // already built at entX=K_ENTRY_LX above. That apron only reaches local
    // z = front + 2.7 + 2.3(half-depth) = 13 (world z 26-13=13) — short of
    // ground.js's `nearWalk` pedestrian strip, whose near edge is world z=8
    // (buildGround, centered x=7.3). Pave the remaining local z 13..18
    // (world z 13..8) so the door-to-stoop-to-sidewalk path reads as one
    // continuous walk with no bare-grass gap, same concrete tone as the
    // stoop's own apron.
    const entryConnectMat = new THREE.MeshStandardMaterial({ color: 0xc0b9a7, roughness: 1 });
    const entryConnect = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 5), entryConnectMat);
    entryConnect.rotation.x = -Math.PI / 2;
    entryConnect.position.set(K_ENTRY_LX, 0.03, kFront + 7.5);   // local z 13..18
    entryConnect.receiveShadow = true; kelton1414.add(entryConnect);
  }

  // ---- REAR PROPERTY CUTOFF (user P2): the far lot is a BOUNDED apartment
  // block, not open space. A rear property-line wall closes off the back of the
  // front row (whose backs sit at z ≈ -54..-62), and a hazy SECOND ROW of
  // apartment buildings rises behind it — their upper floors/rooflines crest the
  // wall through the front-row driveway gaps, so the depth reads as "more
  // buildings behind", like a dense LA block. Kept simple + hazy (the backdrop
  // fog does the rest) to stay cheap and keep the monitoring bg clear. The wall
  // stops short at x ≈ -70 so the Wilkins cross-street opening stays open.
  const wallMat = new THREE.MeshStandardMaterial({ roughness: 1, map: stuccoTex('#c2bcac') });
  const rearWall = new THREE.Mesh(new THREE.BoxGeometry(186, 4.0, 0.7), wallMat);
  rearWall.position.set(23, 2.0, -64);
  rearWall.castShadow = rearWall.receiveShadow = true; scene.add(rearWall);
  const wallCap = new THREE.Mesh(new THREE.BoxGeometry(186, 0.26, 1.05),
    new THREE.MeshStandardMaterial({ color: 0xd8d2c2, roughness: 1 }));
  wallCap.position.set(23, 4.06, -64); wallCap.castShadow = true; scene.add(wallCap);
  // pilaster posts articulate the wall so it doesn't read as one flat slab
  const pilMat = new THREE.MeshStandardMaterial({ color: 0xbdb6a4, roughness: 1 });
  for (let px = -66; px <= 112; px += 26) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 1.0), pilMat);
    pil.position.set(px, 2.25, -63.9); pil.castShadow = true; scene.add(pil);
  }

  // ---- FAR-SIDE FRONT-ROW PROPERTY-LINE DIVIDERS -----------------------------
  // Before this: the far-side front row (cream C x-47, cottage A x4, grey B x45,
  // cream C-repeat x93) had bare grass gaps between adjacent buildings with NO
  // property division at all — only the one rear-lot wall (above) and the
  // sidewalk/curb existed. Real adjacent LA apartment lots on a block are split
  // by a low garden/party wall at the side lot line, often tied into a matching
  // low wall along the front property line at the sidewalk. Adds exactly that,
  // reusing the rear wall's own stucco tex (wallMat) + cap/pilaster tones so the
  // dividers read as the same masonry family, just chest-high instead of a full
  // rear fence.
  //
  // Only 2 of the 3 gaps get a divider — the middle gap (cottage x17 -> B x24) IS
  // the cottage's own side-access driveway (ground.js apronMk(20.5,...), curb cut
  // 17..24) and must stay open, per the task's "keep gaps at entries/driveways"
  // rule. Checked against ground.js: the far curb is UNCUT across both gaps used
  // here (curbSeg(-27,17,-30) and curbSeg(58.5,120,-30)) — confirmed no driveway
  // crosses either one. The cream C (terminal) right-corner driveway sits just
  // OUTSIDE gap 1, at world x -32..-27 (apronMk(-29.5,...)) i.e. inside that
  // building's own footprint, so gap 1's wall is inset a couple units clear of it.
  const divH = 1.3, divT = 0.3;                 // chest-high wall, thin stucco panel
  const divCapMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c2, roughness: 1 }); // = rearWall's wallCap tone

  // cinder block / concrete masonry for property-line party walls. A grid of grey
  // blocks (muted ~#b8b4a8) separated by darker mortar lines + faint surface noise
  // to avoid a flat plastic read. Running-bond pattern for visual interest.
  const cinderBlockTex = canvasTex((c, w, h) => {
    c.fillStyle = '#6b6763'; c.fillRect(0, 0, w, h);             // mortar bed (darker grey)
    noiseFill(c, w, h, '#6b6763', 10);                           // mortar noise
    const bh = 20, bw = 30;                                       // block height/width (concrete block scale)
    for (let y = 0, r = 0; y < h; y += bh, r++) {
      const off = (r % 2) ? -bw / 2 : 0;                         // running bond offset
      for (let x = off; x < w; x += bw) {
        const jit = hash(r * 31 + x * 0.7) * 0.12 - 0.06;        // per-block tonal jitter
        c.fillStyle = '#' + new THREE.Color(0xb8b4a8).offsetHSL(0, 0, jit).getHexString();
        c.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);            // block with mortar joints
        // faint surface pitting on the block (concrete texture detail)
        c.globalAlpha = 0.06;
        for (let i = 0; i < 3; i++) {
          c.fillStyle = 'rgba(80, 75, 70, 1)';
          c.beginPath();
          c.arc(x + bw * 0.3 + hash(r * 51 + x * 0.3 + i) * (bw * 0.4),
                y + bh * 0.3 + hash(r * 37 + x * 0.5 + i) * (bh * 0.4),
                0.4 + hash(r + i) * 0.6, 0, 7);
          c.fill();
        }
        c.globalAlpha = 1;
      }
    }
  }, 128, 128, 1);
  const dividerMat = new THREE.MeshStandardMaterial({ map: cinderBlockTex, roughness: 0.95 });

  function propertyDivider(xCenter, frontHalfSpan, depth, frontZ = -38) {
    const backZ = frontZ - depth;
    // party wall: the actual side lot-line divider, running perpendicular to the
    // street from the shared front building line back into the lot. Cinder block
    // masonry with mortar joints, giving it a proper built-up fence read.
    const party = new THREE.Mesh(new THREE.BoxGeometry(divT, divH, depth), dividerMat);
    party.position.set(xCenter, divH / 2, (frontZ + backZ) / 2);
    party.castShadow = party.receiveShadow = true; scene.add(party);
    const partyCap = new THREE.Mesh(new THREE.BoxGeometry(divT + 0.14, 0.14, depth + 0.14), divCapMat);
    partyCap.position.set(xCenter, divH + 0.07, (frontZ + backZ) / 2); scene.add(partyCap);
    // low front-property-line wall tying the two buildings' frontage together at
    // the sidewalk edge — set back a couple units from each building's actual
    // corner so it never touches a facade or a driveway apron
    const front = new THREE.Mesh(new THREE.BoxGeometry(frontHalfSpan * 2, divH, divT), dividerMat);
    front.position.set(xCenter, divH / 2, frontZ); front.castShadow = front.receiveShadow = true; scene.add(front);
    const frontCap = new THREE.Mesh(new THREE.BoxGeometry(frontHalfSpan * 2 + 0.14, 0.14, divT + 0.14), divCapMat);
    frontCap.position.set(xCenter, divH + 0.07, frontZ); scene.add(frontCap);
    // corner piers — a finished garden-wall return at each end of the front wall,
    // plus one where the party wall dead-ends in the side yard (matches the rear
    // wall's own pilaster treatment above, just shorter)
    for (const [px, pz] of [[xCenter - frontHalfSpan, frontZ], [xCenter + frontHalfSpan, frontZ], [xCenter, backZ]]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.46, divH + 0.3, 0.46), pilMat);
      pier.position.set(px, (divH + 0.3) / 2, pz); pier.castShadow = true; scene.add(pier);
    }
  }
  // gap 1: cream Building C (terminal, right edge world x-27) <-> cottage A (left
  // edge world x-9) — an 18u-wide clear gap, no driveway. Wall centered x-18,
  // front span 14u (x-25..-11, 2u clear of each building corner), 12u deep yard.
  propertyDivider(-18, 7, 12);
  // gap 3: grey Building B (right edge world x66) <-> cream C-repeat (left edge
  // world x74) — an 8u-wide clear gap, no driveway. Wall centered x70, front span
  // 6u (x67..73, 1u clear of each corner), 12u deep yard.
  propertyDivider(70, 3, 12);
  // gap 2 (cottage x17 -> B x24) intentionally has NO divider — it's the
  // cottage's own side-access driveway; a wall there would block that drive.

  // ---- BACKGROUND APARTMENT ROWS (behind the rear property wall) ------------
  // The two hazy rows behind the wall used to be flat grey boxes carrying a single
  // faint window decal on ONE shared material → they read as unfinished "grey
  // blobs" (user flag). Rebuilt as REAL background apartment buildings: a framed
  // window GRID (rows/cols of panes — most dark blue-glass, a scattered few warm
  // LIT), VARIED stucco/brick wall tones so each block reads as a DISTINCT building,
  // and roofline/height variety. Still BACKGROUND: texture-only (no per-window
  // meshes), lower detail than the front A/B/C row, no shadows, left hazy/distant so
  // they never steal the monitoring view. One small shared texture/material set per
  // row → polycount + texture cost stays flat.

  // framed-window facade texture. emissivePass=false → wall tone (stucco noise or
  // brick courses) + a grid of framed window panes: pale frame surround, glass with
  // a vertical reflection falloff (warm cream when LIT, dark blue-grey when dark),
  // a muntin cross → 4 lights, and faint floor-band shadow lines. emissivePass=true
  // → black field with ONLY the lit panes drawn warm, used as the emissiveMap so the
  // exact same windows glow at dusk. A shared per-building `seed` keeps the two
  // passes in lockstep (same windows lit in map + emissive).
  const facadeTex = (wallHex, seed, cols, rows, litChance, brick, emissivePass) =>
    canvasTex((c, w, h) => {
      if (emissivePass) { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); }
      else {
        noiseFill(c, w, h, wallHex, 14);
        if (brick) {                                            // masonry course lines
          c.strokeStyle = 'rgba(70,50,40,0.16)'; c.lineWidth = 1;
          for (let y = 6; y < h; y += 9) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
        }
      }
      const pw = w / cols, ph = h / rows, mx = pw * 0.24, my = ph * 0.22;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const lit = hash(seed + r * 7.31 + k * 2.13) < litChance;
        const x = k * pw + mx, y = r * ph + my, ww = pw - mx * 2, hh = ph - my * 2;
        if (emissivePass) {
          if (!lit) continue;
          c.fillStyle = '#ffe6ad'; c.fillRect(x, y, ww, hh);    // lit-window glow mask
          continue;
        }
        c.fillStyle = 'rgba(242,238,226,0.75)';                 // crisp pale window-frame surround
        c.fillRect(x - pw * 0.08, y - ph * 0.07, ww + pw * 0.16, hh + ph * 0.14);
        const g = c.createLinearGradient(0, y, 0, y + hh);      // glass reflection falloff
        // DARK unlit glass (was #63747f→#31404c — too near the beige/grey walls, so
        // panes blended in); lit panes stay warm cream for life at dusk.
        if (lit) { g.addColorStop(0, '#f7e4a8'); g.addColorStop(1, '#d9b761'); }
        else { g.addColorStop(0, '#48586a'); g.addColorStop(1, '#1e2934'); }
        c.fillStyle = g; c.fillRect(x, y, ww, hh);
        if (!lit) {                                             // head-recess shadow on dark panes
          c.fillStyle = 'rgba(10,15,20,0.5)'; c.fillRect(x, y, ww, hh * 0.13);
          c.globalAlpha = 0.5; c.fillStyle = '#cfe0ee';         // bright sky-glint → reads as glass not void
          c.beginPath();
          c.moveTo(x, y + hh * 0.30); c.lineTo(x + ww * 0.6, y); c.lineTo(x + ww, y);
          c.lineTo(x + ww, y + hh * 0.16); c.lineTo(x, y + hh * 0.55); c.closePath(); c.fill();
          c.globalAlpha = 1;
        }
        c.strokeStyle = 'rgba(236,232,220,0.62)';               // muntin cross → 4 lights
        c.lineWidth = Math.max(1, pw * 0.04);
        c.beginPath();
        c.moveTo(x + ww / 2, y); c.lineTo(x + ww / 2, y + hh);
        c.moveTo(x, y + hh / 2); c.lineTo(x + ww, y + hh / 2); c.stroke();
      }
      if (!emissivePass) {                                      // faint floor-band shadows
        c.strokeStyle = 'rgba(58,54,46,0.13)'; c.lineWidth = 2;
        for (let r = 1; r < rows; r++) { c.beginPath(); c.moveTo(0, r * ph); c.lineTo(w, r * ph); c.stroke(); }
      }
    }, cols * 22, rows * 28, 1);

  // per-building wall tones so the row reads as SEPARATE buildings, not one mass:
  // warm beige / cool grey stucco, tan + brown brick, pale cream. [wall, seed,
  // litChance, brick]. Shared across both rear rows (row 3 re-uses them dimmer).
  const bgFacades = [
    ['#cabfa6', 3.1, 0.26, false],   // warm beige stucco
    ['#b3b1a9', 7.7, 0.20, false],   // cool grey stucco
    ['#bd9f83', 12.4, 0.30, true],   // tan brick
    ['#d5cebd', 5.9, 0.18, false],   // pale cream stucco
    ['#c2a58a', 9.3, 0.26, true],    // brown brick
  ];
  // second row (z ≈ -76): full detail — map + emissive-lit windows + toned parapet cap.
  const bgMats = bgFacades.map(([wall, seed, lit, brick]) =>
    new THREE.MeshStandardMaterial({
      map: facadeTex(wall, seed, 6, 5, lit, brick, false),
      emissive: 0xffffff, emissiveIntensity: 0.5,
      emissiveMap: facadeTex(wall, seed, 6, 5, lit, brick, true),
      roughness: 1,
    }));
  const bgCapMats = bgFacades.map(([wall]) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(wall).offsetHSL(0, -0.02, 0.08), roughness: 1 }));
  const roofBoxMat = new THREE.MeshStandardMaterial({ color: 0xb8b2a4, roughness: 1 });

  // [x, width, height] — staggered so upper floors peek through the front-row
  // driveway gaps (x ≈ -18, 20) and crest the ~4u rear wall. Height varies for a
  // real roofline; each block gets a distinct tone/brick facade.
  const rearRow = [[-45, 26, 16], [-15, 24, 18.5], [20, 22, 17], [55, 30, 15.5], [95, 28, 15]];
  rearRow.forEach(([rx, rw, rH], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(rw, rH, 12), bgMats[i % bgMats.length]);
    b.position.set(rx, rH / 2, -76); scene.add(b);
    const capR = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.6, 0.4, 12.6),
      bgCapMats[i % bgCapMats.length]);
    capR.position.set(rx, rH + 0.2, -76); scene.add(capR);
    // deterministic rooftop stair/tank box on some blocks → varied roofline crest
    if (hash(rx + 4.2) < 0.6) {
      const bw = 2.6 + hash(rx) * 2.4, bd = 3.2 + hash(rx + 1) * 2.0;
      const box = new THREE.Mesh(new THREE.BoxGeometry(bw, 1.6 + hash(rx + 2) * 1.1, bd), roofBoxMat);
      box.position.set(rx + (hash(rx + 3) - 0.5) * rw * 0.5, rH + 0.9, -76 - 1.5); scene.add(box);
    }
  });
  // a THIRD, still-hazier row deeper in the backdrop — kelton_oblique.png shows the
  // block PACKED with apartments receding, not just one row behind. Only their upper
  // floors crest the second row. Lower detail: map-only windows (no emissive), a
  // cool haze tint on the material color, thin caps — set deep in the fog to stay
  // cheap and keep the monitoring background clear.
  const bgMats3 = bgFacades.map(([wall, seed, lit, brick]) =>
    new THREE.MeshStandardMaterial({
      map: facadeTex(wall, seed + 40, 7, 4, lit * 0.7, brick, false),
      color: 0xd7dad9, roughness: 1 }));      // slight cool haze multiply
  const rearRow3 = [[-28, 30, 13], [12, 32, 14], [50, 28, 12.5], [90, 30, 13.5]];
  rearRow3.forEach(([rx, rw, rH], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(rw, rH, 11), bgMats3[i % bgMats3.length]);
    b.position.set(rx, rH / 2, -90); scene.add(b);
    const capR = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.5, 0.35, 11.5), bgCapMats[i % bgCapMats.length]);
    capR.position.set(rx, rH + 0.18, -90); scene.add(capR);
  });
}
