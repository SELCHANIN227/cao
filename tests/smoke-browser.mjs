import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const window = new Window({ url: 'http://localhost/' });
window.document.write(html);
window.document.close();
window.Math.random = () => 0.1;
window.scrollTo = () => {};
window.confirm = () => true;
window.HTMLElement.prototype.scrollIntoView = () => {};

class FakeAudio {
  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.playbackRate = 1;
    this.preload = 'auto';
    this.onended = null;
    this.onerror = null;
  }
  play() { return Promise.resolve(); }
  pause() {}
}
window.Audio = FakeAudio;
window.SpeechSynthesisUtterance = class {
  constructor(text) { this.text = text; }
};
window.speechSynthesis = {
  getVoices: () => [],
  speak: () => {},
  cancel: () => {},
  onvoiceschanged: null
};

for (const file of [
  'audio-manifest.js',
  'course-a1.js',
  'app-v4-base.js',
  'app-v4-normalize.js',
  'app-v4-render.js',
  'app-v4-lessons.js'
]) {
  window.eval(fs.readFileSync(path.join(root, file), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const A = window.CAO;
assert(A, 'Application runtime is not available');
assert(window.document.querySelectorAll('.unit-card').length === 39, 'Course map must render 39 units');
assert(window.document.querySelectorAll('#screen-placement .placement-mode-card').length === 2, 'Both placement modes must render');
assert(window.document.querySelectorAll('#wordList .word-card').length >= 650, 'Dictionary did not render the complete A1 vocabulary');
assert(window.document.querySelectorAll('[data-screen-link="placement"]').length >= 1, 'Placement navigation is missing');

A.switchScreen('placement');
assert(window.document.getElementById('screen-placement').classList.contains('active'), 'Placement screen did not open');
A.startPlacement('quick');
assert(!window.document.getElementById('lessonOverlay').classList.contains('hidden'), 'Quick placement overlay did not open');
assert(window.document.querySelectorAll('.answer-option').length >= 3, 'Quick placement question did not render answers');
window.document.querySelector('.answer-option').click();
assert(!window.document.getElementById('lessonFeedback').classList.contains('hidden'), 'Placement feedback did not open');
A.closeLesson();

A.startLesson(1, 1);
assert(window.document.querySelectorAll('.letter-card').length >= 5, 'Alphabet lesson did not render');
A.closeLesson();

A.startLesson(2, 1);
assert(window.document.querySelector('.teach-word-card'), 'Beginner word teaching card did not render');
assert(window.document.querySelector('.word-hint'), 'Tap-to-translate hint did not render');
A.closeLesson();

A.switchScreen('profile');
assert(window.document.querySelectorAll('.voice-pack-card').length === 3, 'Voice choices did not render');
assert(window.document.querySelectorAll('[data-placement-mode]').length === 2, 'Placement mode buttons disappeared after rerender');

console.log('Browser smoke test passed.');
window.close();
