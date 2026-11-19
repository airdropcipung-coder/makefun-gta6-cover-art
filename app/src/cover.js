// The cover renderer: draws the multi-panel poster onto any canvas at any size.
// Photos are clipped into slanted panels, graded, then the caption is lettered
// across the foot in heavy capitals with an outline and a neon drop shadow.

import { GRADES, LAYOUTS, pointInPolygon } from './layouts.js';

const GUTTER = '#fff4e6';
const BACKDROP = '#1a0b2e';

/** Draws the whole cover for `state` onto `canvas` at the canvas's own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = LAYOUTS[state.layout];
  const grade = GRADES[state.grade];

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((polygon, index) => {
    const panel = state.panels[index] ?? { photo: 0, zoom: 1, dx: 0, dy: 0 };
    drawPanel(ctx, polygon, state.photos[panel.photo] ?? null, panel, grade, w, h);
  });

  drawCaption(ctx, state, grade, w, h);
  drawVignette(ctx, w, h);

  if (state.showSelection && state.selected >= 0) {
    drawSelection(ctx, layout.panels[state.selected], w, h);
  }
}

/** Clips one photo into a panel polygon, cover-fitted, then grades it. */
function drawPanel(ctx, polygon, photo, panel, grade, w, h) {
  const pts = polygon.map(([x, y]) => [x * w, y * h]);
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.clip();

  const xs = pts.map(([x]) => x);
  const ys = pts.map(([, y]) => y);
  const bx = Math.min(...xs);
  const by = Math.min(...ys);
  const bw = Math.max(...xs) - bx;
  const bh = Math.max(...ys) - by;

  if (photo) {
    const base = Math.max(bw / photo.naturalWidth, bh / photo.naturalHeight);
    const scale = base * panel.zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    // A tall photo in a wide panel would centre on the torso; aim the visible
    // window at the photo's upper third instead, where a face usually is. The
    // photo's centre lands at `focusY` of the panel, so a focus above the
    // middle pushes the centre down and reveals the top of the photo.
    const tallPhoto = photo.naturalHeight > photo.naturalWidth * 1.15;
    let focusY = 0.5;
    if (tallPhoto && bw > bh * 1.15) {
      focusY = 0.5 + (0.5 - 0.33) * (ph / bh);
      focusY = Math.min(Math.max(focusY, 1 - ph / (2 * bh)), ph / (2 * bh));
    }
    const cx = bx + bw / 2 + panel.dx * bw;
    const cy = by + bh * focusY + panel.dy * bh;
    ctx.filter = grade.filter;
    ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
    ctx.filter = 'none';
  } else {
    const sky = ctx.createLinearGradient(bx, by, bx, by + bh);
    sky.addColorStop(0, '#3a1558');
    sky.addColorStop(1, '#12081f');
    ctx.fillStyle = sky;
    ctx.fillRect(bx, by, bw, bh);
  }

  // Grade washes: a warm wash from the top, a cool one from the bottom.
  const top = ctx.createLinearGradient(bx, by, bx, by + bh);
  top.addColorStop(0, grade.wash[0]);
  top.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = top;
  ctx.fillRect(bx, by, bw, bh);
  const bottom = ctx.createLinearGradient(bx, by + bh * 0.45, bx, by + bh);
  bottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottom.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = bottom;
  ctx.fillRect(bx, by, bw, bh);
  ctx.restore();

  // The white gutter between panels.
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.strokeStyle = GUTTER;
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.stroke();
  ctx.restore();
}

/** Letters the tagline and title across the foot of the cover. */
function drawCaption(ctx, state, grade, w, h) {
  const title = state.title.trim().toUpperCase();
  const tagline = state.tagline.trim().toUpperCase();
  if (!title && !tagline) return;

  const bandH = h * 0.24;
  const band = ctx.createLinearGradient(0, h - bandH, 0, h);
  band.addColorStop(0, 'rgba(16, 6, 30, 0)');
  band.addColorStop(0.55, 'rgba(16, 6, 30, 0.62)');
  band.addColorStop(1, 'rgba(16, 6, 30, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h - bandH, w, bandH);

  const cx = w / 2;
  const baseY = h - h * 0.045;
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.rotate(-0.02);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (title) {
    let size = (h * 0.115 * state.titleScale) / 100;
    const font = (s) => `900 ${s}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
    ctx.font = font(size);
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * 0.02}px`;
    while (size > h * 0.03 && ctx.measureText(title).width > w * 0.92) {
      size -= 2;
      ctx.font = font(size);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = '#160a24';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetX = size * 0.045;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(title, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 0, 0);
  }

  if (tagline) {
    const tagSize = Math.max(12, h * 0.028);
    ctx.font = `700 ${tagSize}px "Arial Black", Impact, sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${tagSize * 0.32}px`;
    const y = title ? -h * 0.115 * (state.titleScale / 100) - h * 0.012 : 0;
    ctx.fillStyle = grade.accent;
    ctx.fillText(tagline, 0, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

/** A soft darkening at the corners so the poster feels printed, not flat. */
function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(10, 4, 20, 0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** A dashed outline around the panel the editor has selected. */
function drawSelection(ctx, polygon, w, h) {
  const pts = polygon.map(([x, y]) => [x * w, y * h]);
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.setLineDash([Math.max(8, w * 0.012), Math.max(6, w * 0.008)]);
  ctx.strokeStyle = '#2fd8ff';
  ctx.lineWidth = Math.max(3, w * 0.005);
  ctx.stroke();
  ctx.restore();
}

/** Which panel of `state` contains the preview point (x, y in canvas pixels). */
export function panelAt(state, x, y, width, height) {
  const panels = LAYOUTS[state.layout].panels;
  for (let i = panels.length - 1; i >= 0; i--) {
    if (pointInPolygon(x, y, panels[i], width, height)) return i;
  }
  return -1;
}
