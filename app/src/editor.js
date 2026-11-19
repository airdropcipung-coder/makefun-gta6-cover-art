// The editor: owns the cover state, wires every control in the sidebar, and lets
// the user drag a panel's photo around and scroll to zoom it, right on the preview.

import { drawCover, panelAt } from './cover.js';
import { GRADES, LAYOUTS, SIZES, freshPanelTransforms } from './layouts.js';

const SAMPLES = ['boulevard', 'pier', 'neon'];
const SLOT_COUNT = 3;

export function createEditor(canvas) {
  const state = {
    layout: 'trio',
    grade: 'sunset',
    size: 'square',
    title: 'SUNSET HEIST',
    tagline: 'VICE CITY · 2026',
    titleScale: 100,
    photos: [null, null, null],
    panels: freshPanelTransforms('trio'),
    selected: 0,
    showSelection: true,
  };

  const $ = (id) => document.getElementById(id);
  const status = $('status');
  let panelsTouched = false;

  function say(message) {
    status.textContent = message;
  }

  /** Spreads the loaded photos across the panels, until the user assigns them. */
  function spreadPhotos() {
    const loaded = state.photos.map((p, i) => (p ? i : -1)).filter((i) => i !== -1);
    if (!loaded.length) return;
    state.panels.forEach((panel, i) => { panel.photo = loaded[i % loaded.length]; });
  }

  function redraw() {
    const size = SIZES[state.size];
    if (canvas.width !== size.width || canvas.height !== size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }
    drawCover(canvas, state);
  }

  // ---- photo slots -------------------------------------------------------

  const slotsBox = $('slots');
  const slotInputs = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.innerHTML = `<span class="empty">+</span><span class="tag">Photo ${i + 1}</span>
      <input type="file" accept="image/*" aria-label="Choose photo ${i + 1}">`;
    slotsBox.appendChild(slot);
    const input = slot.querySelector('input');
    slotInputs.push(input);
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        state.photos[i] = await loadImage(URL.createObjectURL(file));
        if (!panelsTouched) spreadPhotos();
        refreshSlots();
        redraw();
        say(`Photo ${i + 1} loaded — ${file.name}`);
      } catch {
        say(`Could not read ${file.name}.`);
      }
    });
  }

  function refreshSlots() {
    [...slotsBox.children].forEach((slot, i) => {
      const old = slot.querySelector('img');
      if (old) old.remove();
      const photo = state.photos[i];
      if (photo) {
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = `Photo ${i + 1}`;
        slot.insertBefore(img, slot.querySelector('.empty'));
        slot.querySelector('.empty').style.display = 'none';
      } else {
        slot.querySelector('.empty').style.display = '';
      }
    });
    refreshPanelPhotoSelect();
  }

  $('samples').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-sample]');
    if (!button) return;
    const name = button.dataset.sample;
    const free = state.photos.findIndex((p) => p === null);
    const slot = free === -1 ? 0 : free;
    state.photos[slot] = await loadImage(`samples/${name}.jpg`);
    if (!panelsTouched) spreadPhotos();
    refreshSlots();
    redraw();
    say(`Sample “${name}” loaded into photo ${slot + 1}.`);
  });

  // ---- layout, grade and size pickers ------------------------------------

  function syncPicker(box, currentId) {
    const keys = (box.dataset.keys ?? '').split(',');
    [...box.children].forEach((button, index) => {
      button.setAttribute('aria-pressed', String(keys[index] === currentId));
    });
  }

  function buildPicker(box, entries, current, onPick) {
    box.dataset.keys = Object.keys(entries).join(',');
    box.innerHTML = '';
    for (const [id, entry] of Object.entries(entries)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = entry.label;
      button.setAttribute('aria-pressed', String(id === current));
      if (entry.swatch) button.style.background = entry.swatch;
      button.addEventListener('click', () => {
        onPick(id);
        [...box.children].forEach((b) => b.setAttribute('aria-pressed', 'false'));
        button.setAttribute('aria-pressed', 'true');
      });
      box.appendChild(button);
    }
  }

  buildPicker($('layouts'), LAYOUTS, state.layout, (id) => {
    const previous = state.panels;
    state.layout = id;
    state.panels = freshPanelTransforms(id);
    // Keep each panel's photo when the layout changes shape.
    state.panels.forEach((panel, i) => { panel.photo = previous[i]?.photo ?? 0; });
    state.selected = 0;
    refreshPanelControls();
    redraw();
  });
  buildPicker($('grades'), GRADES, state.grade, (id) => {
    state.grade = id;
    redraw();
  });
  buildPicker($('sizes'), SIZES, state.size, (id) => {
    state.size = id;
    redraw();
  });

  // ---- caption -----------------------------------------------------------

  $('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  $('tagline').addEventListener('input', (e) => {
    state.tagline = e.target.value;
    redraw();
  });
  $('titleScale').addEventListener('input', (e) => {
    state.titleScale = Number(e.target.value);
    redraw();
  });

  // ---- selected panel ----------------------------------------------------

  const panelPhoto = $('panelPhoto');
  const panelZoom = $('panelZoom');

  function refreshPanelPhotoSelect() {
    panelPhoto.innerHTML = '';
    for (let i = 0; i < SLOT_COUNT; i++) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = state.photos[i] ? `Photo ${i + 1}` : `Photo ${i + 1} (empty)`;
      panelPhoto.appendChild(option);
    }
    panelPhoto.value = String(state.panels[state.selected]?.photo ?? 0);
  }

  function refreshPanelControls() {
    refreshPanelPhotoSelect();
    panelZoom.value = String(Math.round((state.panels[state.selected]?.zoom ?? 1) * 100));
  }

  panelPhoto.addEventListener('change', () => {
    panelsTouched = true;
    state.panels[state.selected].photo = Number(panelPhoto.value);
    redraw();
  });
  panelZoom.addEventListener('input', () => {
    state.panels[state.selected].zoom = Number(panelZoom.value) / 100;
    redraw();
  });
  $('panelReset').addEventListener('click', () => {
    state.panels[state.selected] = { photo: state.panels[state.selected].photo, zoom: 1, dx: 0, dy: 0 };
    refreshPanelControls();
    redraw();
    say('Panel reset.');
  });
  $('panelFill').addEventListener('click', () => {
    panelsTouched = true;
    const used = state.photos.findIndex((p) => p !== null);
    const photo = used === -1 ? 0 : used;
    state.panels.forEach((p) => { p.photo = photo; });
    refreshPanelControls();
    redraw();
    say('Every panel now shows the same photo.');
  });

  // ---- drag and zoom on the preview --------------------------------------

  let drag = null;

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const hit = panelAt(state, point.x, point.y, canvas.width, canvas.height);
    if (hit === -1) return;
    state.selected = hit;
    refreshPanelControls();
    drag = { x: point.x, y: point.y, panel: state.panels[hit] };
    canvas.classList.add('dragging');
    canvas.setPointerCapture(event.pointerId);
    redraw();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const point = canvasPoint(event);
    const panel = drag.panel;
    panel.dx += (point.x - drag.x) / canvas.width;
    panel.dy += (point.y - drag.y) / canvas.height;
    drag.x = point.x;
    drag.y = point.y;
    redraw();
  });

  function endDrag(event) {
    drag = null;
    canvas.classList.remove('dragging');
    if (event) canvas.releasePointerCapture?.(event.pointerId);
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const point = canvasPoint(event);
    const hit = panelAt(state, point.x, point.y, canvas.width, canvas.height);
    if (hit === -1) return;
    state.selected = hit;
    const panel = state.panels[hit];
    panel.zoom = Math.min(2.6, Math.max(1, panel.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
    refreshPanelControls();
    redraw();
  }, { passive: false });

  // ---- export ------------------------------------------------------------

  $('export').addEventListener('click', () => {
    const size = SIZES[state.size];
    const offscreen = document.createElement('canvas');
    offscreen.width = size.width;
    offscreen.height = size.height;
    drawCover(offscreen, { ...state, showSelection: false });
    offscreen.toBlob((blob) => {
      if (!blob) {
        say('Export failed — please try again.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-sunset-cover-${size.width}x${size.height}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      say(`Saved vice-sunset-cover-${size.width}x${size.height}.png`);
    }, 'image/png');
  });

  // ---- surprise me -------------------------------------------------------

  $('surprise').addEventListener('click', async () => {
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.panels = freshPanelTransforms(state.layout);
    state.selected = 0;
    const order = [...SAMPLES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < SLOT_COUNT; i++) {
      state.photos[i] = await loadImage(`samples/${order[i]}.jpg`);
      state.panels[i % state.panels.length].photo = i;
    }
    refreshSlots();
    refreshPanelControls();
    syncPicker($('layouts'), state.layout);
    syncPicker($('grades'), state.grade);
    redraw();
    say('A fresh combination — tweak anything you like.');
  });

  refreshSlots();
  refreshPanelControls();
  redraw();
  return { state, redraw, loadIntoSlot };

  /** Loads a sample or file image into one photo slot (used by screenshot scenes). */
  async function loadIntoSlot(slot, url) {
    state.photos[slot] = await loadImage(url);
    refreshSlots();
    redraw();
  }
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
