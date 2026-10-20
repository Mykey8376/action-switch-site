import { CONFIG, verifiedUrl } from './config.js';

const title = '自分の矢印を変える 3つの問い';
const directions = ['self', 'other', 'both', 'unsure'];
const times = new Map([['today', '今日'], ['tomorrow', '明日'], ['this_week', '今週']]);
const screens = [...document.querySelectorAll('[data-screen]')];
const main = document.querySelector('#main');
const byId = id => document.getElementById(id);
const length = value => Array.from(value).length;
const cleanAction = value => value.trim().replace(/(?:。\s*)+$/u, '').trim();
let state;
let resultText = '';
let generation = 0;

function error(id, message, control) {
  byId(id).textContent = message;
  if (control) {
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }
}

function counts() {
  for (const [id, value, max] of [
    ['reflection', state.reflection, 160],
    ['recipient', state.recipient.trim(), 40],
    ['action', state.action.trim(), 120],
  ]) byId(id + '-count').textContent = length(value) + ' / ' + max + '文字';
}

function q3Errors() {
  const recipient = state.recipient.trim();
  const action = state.action.trim();
  return [
    ['recipient', !recipient ? '誰のためにするかを入力してください。' : length(recipient) > 40 ? '相手は40文字以内で入力してください。' : ''],
    ['action', !cleanAction(action) ? '何をするかを入力してください。' : length(action) > 120 ? '行動は120文字以内で入力してください。' : ''],
    ['when', !times.has(state.when) ? '時期を選んでください。' : ''],
  ];
}

function validResult() {
  return directions.includes(state.direction) && state.passedQ2 && length(state.reflection) <= 160 && q3Errors().every(([, message]) => !message);
}

function navigate(path, replace = false) {
  if (replace) {
    history.replaceState(null, '', '#' + path);
    render();
  } else if (location.hash === '#' + path) render();
  else location.hash = path;
}

function render() {
  let path = location.hash.slice(1) || '/';
  const known = ['/', '/q1', '/q2', '/q3', '/result'];
  if (!known.includes(path) ||
      (['/q2', '/q3', '/result'].includes(path) && !directions.includes(state.direction)) ||
      (['/q3', '/result'].includes(path) && !state.passedQ2) ||
      (path === '/result' && !validResult())) {
    path = '/';
    history.replaceState(null, '', '#/');
  }
  generation += 1;
  resultText = '';
  byId('declaration').textContent = '';
  byId('copy-text').value = '';
  byId('copy-status').textContent = '';
  byId('manual-copy').open = false;
  byId('copy').disabled = false;
  if (path === '/result') {
    // Q2は内省専用。行動文を構成する値は時期・相手・行動だけ。
    resultText = times.get(state.when) + '、' + state.recipient.trim() + 'のために、' + cleanAction(state.action) + '。';
    byId('declaration').textContent = resultText;
    byId('copy-text').value = resultText;
  }
  for (const screen of screens) screen.hidden = screen.dataset.screen !== path;
  const active = screens.find(screen => screen.dataset.screen === path);
  document.title = (path === '/' ? '' : path === '/result' ? '自分の一歩｜' : '問い' + path.slice(-1) + '｜') + title;
  active.querySelector('h1').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function reset() {
  state = { direction: null, reflection: '', recipient: '', action: '', when: 'today', passedQ2: false };
  document.querySelectorAll('form').forEach(form => form.reset());
  for (const id of ['reflection', 'recipient', 'action']) byId(id).value = '';
  document.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
  document.querySelectorAll('.error').forEach(node => { node.textContent = ''; });
  counts();
  navigate('/', true);
}

byId('q1-form').addEventListener('change', event => {
  if (event.target.name !== 'direction') return;
  state.direction = event.target.value;
  error('q1-error', '');
  document.querySelectorAll('[name=direction]').forEach(control => control.removeAttribute('aria-invalid'));
});
byId('q1-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!directions.includes(state.direction)) {
    const first = document.querySelector('[name=direction]');
    error('q1-error', '今の自分に近いものを1つ選んでください。', first);
    first.focus();
    return;
  }
  navigate('/q2');
});

for (const id of ['reflection', 'recipient', 'action']) {
  byId(id).addEventListener('input', event => {
    state[id] = event.target.value;
    if (!event.isComposing) error(id + '-error', '', event.target);
    counts();
  });
  byId(id).addEventListener('compositionend', () => {
    state[id] = byId(id).value;
    error(id + '-error', '', byId(id));
    counts();
  });
}
byId('q2-form').addEventListener('submit', event => {
  event.preventDefault();
  if (length(state.reflection) > 160) {
    error('reflection-error', '振り返りメモは160文字以内で入力してください。', byId('reflection'));
    byId('reflection').focus();
    return;
  }
  state.passedQ2 = true;
  navigate('/q3');
});
byId('q3-form').addEventListener('change', event => {
  if (event.target.name !== 'when') return;
  state.when = event.target.value;
  error('when-error', '');
});
byId('q3-form').addEventListener('submit', event => {
  event.preventDefault();
  const errors = q3Errors();
  for (const [id, message] of errors) error(id + '-error', message, id === 'when' ? null : byId(id));
  const first = errors.find(([, message]) => message);
  if (first) {
    (first[0] === 'when' ? document.querySelector('[name=when]') : byId(first[0])).focus();
    return;
  }
  navigate('/result');
});

// 明示的なボタン操作で進む。日本語変換の確定やQ2の改行を妨げない。
document.querySelectorAll('form').forEach(form => form.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing && event.target.matches('input[type=text],input[type=radio]')) event.preventDefault();
}));
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.back)));
byId('start').addEventListener('click', () => navigate('/q1'));
byId('start').disabled = false;
byId('review').addEventListener('click', () => navigate('/q3'));
byId('restart').addEventListener('click', reset);
byId('copy').addEventListener('click', async () => {
  if (!validResult() || !resultText) return;
  const currentGeneration = generation;
  const text = resultText;
  byId('copy').disabled = true;
  try {
    await navigator.clipboard.writeText(text);
    if (generation === currentGeneration) byId('copy-status').textContent = 'コピーしました。自分の一歩を持ち帰りましょう。';
  } catch {
    if (generation === currentGeneration) {
      byId('copy-status').textContent = '自動コピーができませんでした。下の文章を長押し、または全文を選択してコピーしてください。';
      byId('manual-copy').open = true;
      const field = byId('copy-text');
      field.focus();
      field.select();
      field.setSelectionRange(0, field.value.length);
    }
  } finally {
    if (generation === currentGeneration) byId('copy').disabled = false;
  }
});

for (const kind of ['diagnosis', 'line']) {
  const url = verifiedUrl(kind, CONFIG[kind]);
  if (!url) continue;
  byId(kind + '-link').href = url;
  byId(kind + '-section').hidden = false;
  byId('optional-links').hidden = false;
}
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
});
window.addEventListener('hashchange', render);
window.addEventListener('pageshow', event => { if (event.persisted) reset(); });
reset();
