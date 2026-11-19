import { freshPanelTransforms } from './layouts.js';

// Fixed scenes for screenshots. `?shot=cover` hides the editor and shows only the
// finished cover, full-bleed; `?shot=editor` shows the editor with photos loaded.
// Query knobs: photo (sample name), caption, tagline, layout, grade, size.
// window.__shotReady is set once the scene has painted.

export async function runShot(shot, query, editor) {
  const { state, redraw, loadIntoSlot } = editor;

  if (query.get('layout')) state.layout = query.get('layout');
  state.panels = freshPanelTransforms(state.layout);
  state.selected = 0;
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('size')) state.size = query.get('size');
  if (query.get('caption')) {
    state.title = query.get('caption');
    document.getElementById('title').value = state.title;
  }
  if (query.get('tagline')) {
    state.tagline = query.get('tagline');
    document.getElementById('tagline').value = state.tagline;
  }

  // Load the named sample into slot 0 and spread all three samples across the
  // panels, so every layout shows a full poster, not empty panels.
  const first = query.get('photo') ?? 'neon';
  const samples = [first, 'boulevard', 'pier', 'neon'].filter(
    (name, i, list) => list.indexOf(name) === i,
  );
  for (let i = 0; i < 3; i++) {
    await loadIntoSlot(i, `samples/${samples[i]}.jpg`);
  }
  state.panels.forEach((panel, i) => { panel.photo = i % 3; });

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.showSelection = false;
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
