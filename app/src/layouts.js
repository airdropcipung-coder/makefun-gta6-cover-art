// Panel layouts for the poster: each layout is a list of panels, and each panel is a
// polygon in unit coordinates (0..1 across the cover). The slanted edges give the
// diagonal-slice look of a multi-panel poster, and the white gutters come from the
// stroke drawn around every panel.

export const LAYOUTS = {
  trio: {
    label: 'Hero trio',
    panels: [
      [[0, 0], [0.63, 0], [0.57, 1], [0, 1]],
      [[0.65, 0], [1, 0], [1, 0.47], [0.59, 0.47]],
      [[0.59, 0.53], [1, 0.53], [1, 1], [0.57, 1]],
    ],
  },
  strip: {
    label: 'Sunset strip',
    panels: [
      [[0, 0], [0.38, 0], [0.30, 1], [0, 1]],
      [[0.40, 0], [0.70, 0], [0.62, 1], [0.32, 1]],
      [[0.72, 0], [1, 0], [1, 1], [0.64, 1]],
    ],
  },
  hero: {
    label: 'Hero + duo',
    panels: [
      [[0, 0], [1, 0], [1, 0.55], [0, 0.63]],
      [[0, 0.67], [0.52, 0.67], [0.48, 1], [0, 1]],
      [[0.54, 0.67], [1, 0.67], [1, 1], [0.50, 1]],
    ],
  },
  quad: {
    label: 'Four corners',
    panels: [
      [[0, 0], [0.55, 0], [0.50, 0.50], [0, 0.50]],
      [[0.57, 0], [1, 0], [1, 0.50], [0.52, 0.50]],
      [[0, 0.52], [0.48, 0.52], [0.53, 1], [0, 1]],
      [[0.50, 0.52], [1, 0.52], [1, 1], [0.55, 1]],
    ],
  },
};

/** The export sizes the app offers, in pixels. */
export const SIZES = {
  square: { label: 'Square · 1080 × 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide · 1920 × 1080', width: 1920, height: 1080 },
};

/** Colour grades: a canvas filter for the photos plus two overlay washes. */
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.35) contrast(1.06) brightness(1.02)',
    wash: ['rgba(255, 110, 40, 0.16)', 'rgba(190, 30, 110, 0.20)'],
    swatch: 'linear-gradient(135deg,#ff7a2f,#c41e6e)',
    accent: '#ff7a2f',
  },
  neon: {
    label: 'Neon nights',
    filter: 'saturate(1.5) contrast(1.12)',
    wash: ['rgba(255, 46, 136, 0.20)', 'rgba(47, 216, 255, 0.16)'],
    swatch: 'linear-gradient(135deg,#ff2e88,#2fd8ff)',
    accent: '#ff2e88',
  },
  noir: {
    label: 'Palm noir',
    filter: 'saturate(0.55) contrast(1.18) brightness(0.96)',
    wash: ['rgba(10, 10, 30, 0.28)', 'rgba(255, 190, 90, 0.10)'],
    swatch: 'linear-gradient(135deg,#3a3a55,#0c0c18)',
    accent: '#ffd166',
  },
  pastel: {
    label: 'Pastel vice',
    filter: 'saturate(1.12) contrast(0.98) brightness(1.07)',
    wash: ['rgba(255, 170, 210, 0.18)', 'rgba(140, 180, 255, 0.14)'],
    swatch: 'linear-gradient(135deg,#ffb3d9,#8cb4ff)',
    accent: '#ffb3d9',
  },
};

/** A fresh per-panel transform for every panel of a layout. */
export function freshPanelTransforms(layoutId) {
  return LAYOUTS[layoutId].panels.map(() => ({ photo: 0, zoom: 1, dx: 0, dy: 0 }));
}

/** True when the point (x, y in pixels) lies inside the polygon (unit coords). */
export function pointInPolygon(px, py, polygon, width, height) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const x1 = xi * width;
    const y1 = yi * height;
    const x2 = xj * width;
    const y2 = yj * height;
    if (y1 > py !== y2 > py && px < ((x2 - x1) * (py - y1)) / (y2 - y1) + x1) {
      inside = !inside;
    }
  }
  return inside;
}
