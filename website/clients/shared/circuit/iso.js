// Tiny isometric projection kit used by every Circuit illustration.
// World axes: +X runs right-down, +Y runs left-down, +Z is up. One world
// unit is `u` px. Faces are shaded by mixing the hue with --tile-shade, so
// illustrations follow the light/dark theme automatically.

const COS = 0.8660254;

export function makeIso({ ox = 200, oy = 120, u = 16 } = {}) {
  const P = (x, y, z = 0) => [ox + (x - y) * COS * u, oy + (x + y) * 0.5 * u - z * u];
  const pts = (list) => list.map(([x, y, z]) => P(x, y, z).map((n) => Math.round(n * 10) / 10).join(',')).join(' ');

  // Axis-aligned box. Returns point strings for the three visible faces.
  function box(x, y, z, w, d, h) {
    return {
      top: pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]),
      left: pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]),
      right: pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]),
    };
  }

  // Affine matrices that map a flat 2D drawing onto a face.
  // top: local (a, b) → world (x0 + a, y0 + b, z)
  // left (faces left-front, Y fixed): local a → +X, local b → −Z (down)
  // right (faces right-front, X fixed): local a → −Y, local b → −Z (down)
  function topMatrix(x0, y0, z) {
    const [e, f] = P(x0, y0, z);
    return `matrix(${COS * u} ${0.5 * u} ${-COS * u} ${0.5 * u} ${e} ${f})`;
  }
  function leftMatrix(x0, y, zTop) {
    const [e, f] = P(x0, y, zTop);
    return `matrix(${COS * u} ${0.5 * u} 0 ${u} ${e} ${f})`;
  }
  function rightMatrix(x, y0, zTop) {
    const [e, f] = P(x, y0, zTop);
    return `matrix(${COS * u} ${-0.5 * u} 0 ${u} ${e} ${f})`;
  }

  return { P, pts, box, topMatrix, leftMatrix, rightMatrix, u };
}

export function shadeOf(color, amount) {
  return `color-mix(in srgb, ${color} ${amount}%, var(--tile-shade))`;
}
