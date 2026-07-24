// twin3d/street_furniture.js — furniture matched to the real Kelton Ave refs
// (reference/streetview/): the signature curved-arm streetlight with yellow
// pedestrian-crossing diamond + red no-parking sign (east side, mid-frame),
// wooden utility poles with catenary spans, LA green organics bin with wheels,
// a subtle hydrant, and a street-name blade.
// OWNED BY orchestrator (unassigned) — component agents must not edit; ask first.
//
// Exports:
//   buildFurniture(scene)
import * as THREE from 'three';
import { hash } from './shared.js';

// local CanvasTexture helper (no renderer in this module's signature — default
// anisotropy is fine on small signs; same precedent as palms.js trunkTexture)
function tex(draw, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// yellow pedestrian-crossing diamond with black walker glyph (transparent corners)
function xingTexture() {
  return tex((c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h / 2); c.rotate(Math.PI / 4);
    const s = w * 0.60;
    c.fillStyle = '#f2b824'; c.fillRect(-s / 2, -s / 2, s, s);
    c.lineWidth = w * 0.030; c.strokeStyle = '#221f1a';
    c.strokeRect(-s / 2 + c.lineWidth * 1.2, -s / 2 + c.lineWidth * 1.2,
                 s - c.lineWidth * 2.4, s - c.lineWidth * 2.4);
    c.restore();
    // walker glyph
    c.fillStyle = '#221f1a'; c.strokeStyle = '#221f1a';
    c.lineWidth = w * 0.045; c.lineCap = 'round';
    c.beginPath(); c.arc(w * 0.50, h * 0.33, w * 0.05, 0, 7); c.fill();       // head
    c.beginPath(); c.moveTo(w * 0.50, h * 0.39); c.lineTo(w * 0.475, h * 0.54); c.stroke(); // torso
    c.beginPath(); c.moveTo(w * 0.49, h * 0.43); c.lineTo(w * 0.575, h * 0.50); c.stroke(); // arm
    c.beginPath(); c.moveTo(w * 0.49, h * 0.43); c.lineTo(w * 0.415, h * 0.49); c.stroke(); // arm back
    c.beginPath(); c.moveTo(w * 0.475, h * 0.54); c.lineTo(w * 0.405, h * 0.665); c.stroke(); // leg back
    c.beginPath(); c.moveTo(w * 0.475, h * 0.54); c.lineTo(w * 0.565, h * 0.655); c.stroke(); // leg fwd
  }, 128, 128);
}

// small red-on-white no-parking sign
function noParkTexture() {
  return tex((c, w, h) => {
    c.fillStyle = '#f4f1e8'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#b8382a'; c.lineWidth = w * 0.06;
    c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
    c.font = `700 ${h * 0.42}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#221f1a'; c.fillText('P', w / 2, h * 0.52);
    c.strokeStyle = '#b8382a'; c.lineWidth = w * 0.09;
    c.beginPath(); c.arc(w / 2, h * 0.52, w * 0.30, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(w * 0.30, h * 0.74); c.lineTo(w * 0.70, h * 0.30); c.stroke();
  }, 64, 96);
}

// green street-name blade
function bladeTexture() {
  return tex((c, w, h) => {
    c.fillStyle = '#1e5b38'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#e9e5d8'; c.lineWidth = h * 0.06;
    c.strokeRect(c.lineWidth, c.lineWidth, w - 2 * c.lineWidth, h - 2 * c.lineWidth);
    c.font = `700 ${h * 0.52}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#f2efe4'; c.fillText('KELTON AV', w / 2, h * 0.54);
  }, 256, 48);
}

// vertical wood-grain for the utility poles: warm base + darker streaks
function woodTexture() {
  const t = tex((c, w, h) => {
    c.fillStyle = '#6b5a44'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 34; i++) {
      const x = hash(i * 1.7) * w;
      c.strokeStyle = `rgba(${40 + hash(i) * 30 | 0},${32 + hash(i + 1) * 24 | 0},22,${0.18 + hash(i + 2) * 0.22})`;
      c.lineWidth = 0.6 + hash(i + 3) * 1.4;
      c.beginPath(); c.moveTo(x, 0);
      for (let y = 0; y <= h; y += 8) c.lineTo(x + Math.sin(y * 0.05 + i) * 1.6, y);
      c.stroke();
    }
  }, 32, 256);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 5);
  return t;
}

export function buildFurniture(scene) {
  const galv = new THREE.MeshStandardMaterial({ color: 0x9aa0a3, metalness: 0.75, roughness: 0.45 });
  const galvDark = new THREE.MeshStandardMaterial({ color: 0x7e8487, metalness: 0.7, roughness: 0.5 });
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0xece4d6, roughness: 0.95 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x53452f, roughness: 1 });

  // ---- signature streetlight at the mid-block crossing, FRAME RIGHT per
  // reference/BRIEF.md (count lines land at world x~41; the crossing + pole sit
  // just beyond): tapered galvanized pole, curved arm over the road, luminaire,
  // ped-crossing diamond + no-parking signs, street-name blade
  // (cycle-7) nudged left out of the foreground-jacaranda sightline and angled
  // slightly toward the camera (at x=0) so the diamond reads in the canonical frame
  const sl = new THREE.Group(); sl.position.set(41.5, 0, -31.0);
  sl.rotation.y = -0.14;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.30, 19, 12), galv);
  pole.position.y = 9.5; pole.castShadow = true; sl.add(pole);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.48, 0.9, 12), galvDark);
  collar.position.y = 0.45; collar.castShadow = true; sl.add(collar);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 18.5, 0), new THREE.Vector3(0, 20.4, 2.8),
    new THREE.Vector3(0, 20.0, 6.4)), 14, 0.11, 8), galv);
  arm.castShadow = true; sl.add(arm);
  // cobra-head luminaire: tapered housing (wide at the arm, narrow at the tip)
  // with a downward-facing amber lens
  const lumMat = new THREE.MeshStandardMaterial({ color: 0x8d9396, metalness: 0.7, roughness: 0.4 });
  const lum = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.17, 1.9, 12), lumMat);
  lum.rotation.x = Math.PI / 2;                 // long axis along +z (the arm reach)
  lum.position.set(0, 19.95, 6.55); lum.castShadow = true; sl.add(lum);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffe9b0,
      emissiveIntensity: 0.18, side: THREE.DoubleSide }));
  lens.rotation.x = -Math.PI / 2; lens.position.set(0, 19.7, 6.9); sl.add(lens);

  const signMat = (t) => new THREE.MeshStandardMaterial({ map: t, transparent: true,
    alphaTest: 0.5, roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide });
  const xing = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), signMat(xingTexture()));
  xing.position.set(0, 8.4, 0.42); xing.castShadow = true; sl.add(xing);
  const noP = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.4), signMat(noParkTexture()));
  noP.position.set(0, 6.2, 0.40); noP.castShadow = true; sl.add(noP);
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.62), signMat(bladeTexture()));
  blade.position.set(0.3, 11.4, 0.34); blade.rotation.y = 0.35; blade.castShadow = true; sl.add(blade);
  scene.add(sl);

  // ---- second streetlight, NEAR side, plain (no crossing signage): gives
  // lighting.js's near-side night pool (over near bay N2, ground.js bays
  // [8,-13.5]) an actual lamp overhead instead of a light-pool with no fixture.
  // Sits at the near curb (parkway strip, z -11..-5.5) with the cobra-head arm
  // curving out over the road toward the bay it lights.
  const sl2 = new THREE.Group(); sl2.position.set(8, 0, -9);
  sl2.rotation.y = Math.PI;             // arm reaches toward -z, out over the bay
  const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 16, 12), galv);
  pole2.position.y = 8; pole2.castShadow = true; sl2.add(pole2);
  const collar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.40, 0.8, 12), galvDark);
  collar2.position.y = 0.4; collar2.castShadow = true; sl2.add(collar2);
  const arm2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 15.6, 0), new THREE.Vector3(0, 17.0, 2.2),
    new THREE.Vector3(0, 16.7, 4.8)), 12, 0.09, 8), galv);
  arm2.castShadow = true; sl2.add(arm2);
  const lum2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.14, 1.5, 12), lumMat);
  lum2.rotation.x = Math.PI / 2; lum2.position.set(0, 16.65, 5.0); lum2.castShadow = true; sl2.add(lum2);
  const lens2 = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffe9b0,
      emissiveIntensity: 0.18, side: THREE.DoubleSide }));
  lens2.rotation.x = -Math.PI / 2; lens2.position.set(0, 16.45, 5.3); sl2.add(lens2);
  scene.add(sl2);

  // ---- near-side landscape uplight fixtures: small ground pucks at the BASE of
  // each foreground jacaranda trunk (tree uprights in lighting.js aim up from these
  // positions), with warm emissive glow to visibly read as the light source at night
  // instead of the glow floating mid-surface with no fixture. Dark metal housing
  // with warm amber emission matches the uplighting color (0xffb066).
  const fixtureMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a, emissive: 0xffb066, emissiveIntensity: 0.16,
    metalness: 0.4, roughness: 0.6
  });
  for (const [x, z] of [[-22, 12], [28, 5], [52, 14]]) {
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.09, 10), fixtureMat);
    puck.position.set(x, 0.045, z); puck.castShadow = true; scene.add(puck);
  }

  // ---- wooden utility poles (two) + catenary wire spans between/beyond them
  const polePos = [-62, 78];
  for (const px of polePos) {
    const g = new THREE.Group(); g.position.set(px, 0, -32);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.46, 24, 10), wood);
    p.position.y = 12; p.castShadow = true; g.add(p);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.28, 0.28), woodDark);
    cross.position.y = 21.6; cross.castShadow = true; g.add(cross);
    for (const ix of [-1.5, -0.5, 0.5, 1.5]) {   // insulator nubs
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a463f, roughness: 0.6 }));
      ins.position.set(ix, 21.9, 0); g.add(ins);
    }
    // grey transformer can mounted below the crossarm on the left pole
    if (px === -62) {
      const xf = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.7, 14),
        new THREE.MeshStandardMaterial({ color: 0x8b9094, metalness: 0.55, roughness: 0.55 }));
      xf.position.set(0.85, 18.6, 0.55); xf.castShadow = true; g.add(xf);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.18, 14),
        new THREE.MeshStandardMaterial({ color: 0x74797c, metalness: 0.6, roughness: 0.5 }));
      cap.position.set(0.85, 19.55, 0.55); g.add(cap);
    }
    scene.add(g);
  }
  // spans: -120..-62, -62..78, 78..120 (sag scales with span length)
  // soft mid-grey + semi-transparent: WebGL ignores LineBasicMaterial.linewidth,
  // so color+opacity are the levers to keep wires from reading as heavy black
  // slashes against the newly-lightened cloud/mountain sky
  const wireMat = new THREE.LineBasicMaterial({ color: 0x8f9498,
    transparent: true, opacity: 0.5 });
  const spans = [[-120, -62], [-62, 78], [78, 120]];
  for (const dy of [0, 0.9]) {
    for (const [x0, x1] of spans) {
      const pts = [], len = x1 - x0, sag = Math.min(2.2, len * 0.014);
      for (let i = 0; i <= 16; i++) {
        const t = i / 16, x = x0 + len * t;
        pts.push(new THREE.Vector3(x, 21.4 + dy - sag * (1 - (2 * t - 1) ** 2), -32));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat));
    }
  }

  // ---- LA green organics bin: NOT visible in the real webcam frame (BRIEF
  // delta #8) — kept only as an incidental at the far LEFT frame edge, set at
  // the near-parkway curb edge (band spec: near parkway z −11..−5.5) where bins
  // actually sit on collection day
  const binG = new THREE.Group(); binG.position.set(-52, 0, -8.5);
  binG.scale.setScalar(0.85);
  const binGreen = new THREE.MeshStandardMaterial({ color: 0x3f6d3a, roughness: 0.8 });
  const binDark = new THREE.MeshStandardMaterial({ color: 0x2f5230, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.74, 2.3, 4), binGreen);
  body.rotation.y = Math.PI / 4;                       // square-ish tapered body
  body.position.y = 1.15; body.castShadow = true; binG.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.26, 4), binDark);
  lid.rotation.y = Math.PI / 4; lid.rotation.z = 0.05;
  lid.position.y = 2.42; lid.castShadow = true; binG.add(lid);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), binDark);
  bar.rotation.z = Math.PI / 2; bar.position.set(0, 2.05, -0.72); binG.add(bar);
  for (const wx of [-0.45, 0.45]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 10),
      new THREE.MeshStandardMaterial({ color: 0x1d1b18, roughness: 0.9 }));
    wheel.rotation.x = Math.PI / 2; wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.24, -0.62); wheel.castShadow = true; binG.add(wheel);
  }
  binG.rotation.y = (hash(7) - 0.5) * 0.5;             // set out at a casual angle
  scene.add(binG);

  // (no hydrant: none exists in the real webcam frame — BRIEF delta #8)
}
