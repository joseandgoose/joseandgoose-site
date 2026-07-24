// twin3d/shared.js — shared constants + utilities for the 3D street twin.
// FROZEN: interface changes require the orchestrator. Component agents may READ
// this file but must not edit it.
//
// Exports:
//   camXZ(cx, cy)                      cam-pixel (1920x1080) -> world ground {x, z}
//   hash(n)                            deterministic 0..1 pseudo-random
//   makeCanvasTex(THREE, renderer, draw, w, h, rep)   procedural CanvasTexture
//   noiseFill(ctx, w, h, base, amt)    fill a 2d context with base color + noise

// cam-pixel (1920x1080) -> world ground (x,z). far bays cy~280 -> z=-50,
// near bays cy~640 -> z=-18. Road spans z -56..-11; near sidewalk/parkway -11..6.
export const camXZ = (cx, cy) => ({ x: (cx / 1920 - 0.5) * 110, z: 0.0889 * cy - 74.9 });

export const hash = n => { const s = Math.sin(n * 127.1) * 43758.55; return s - Math.floor(s); };

export function makeCanvasTex(THREE, renderer, draw, w, h, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

export function noiseFill(ctx, w, h, base, amt) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.sin(i * 12.9898) * 43758.5 % 1) * amt - amt / 2;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}
