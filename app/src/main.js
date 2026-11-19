// Boots the studio: builds the editor, then either runs a screenshot scene
// (`?shot=cover` or `?shot=editor`) or leaves the empty editor ready to use.

import { createEditor } from './editor.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const editor = createEditor(canvas);

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), editor);
}
