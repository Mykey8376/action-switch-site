import { QUESTIONS } from './diagnosis-data.js';
import { diagnose } from './diagnosis.js';
import { CONFIG, validExternalUrl } from './config.js';

const main = document.querySelector('main');
const answers = [null, null, null];
const lineUrl = validExternalUrl(CONFIG.lineUrl);
const openChatUrl = validExternalUrl(CONFIG.openChatUrl);
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const link = (url, label, className = 'secondary') => '<a class="' + className + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">' + label + ' ↗</a>';
function navigate(path, replace = false) {
  if (replace) { history.replaceState(null, '', '#' + path); render(); }
  else if (location.hash === '#' + path) render();
  else location.hash = path;
}
function currentResult() {
  try { return diagnose(...answers); } catch { return null; }
}
function start() {
  return '<section class="hero"><div class="hero-copy"><p class="eyebrow">60秒の行動スイッチ診断</p><h1>もう、学んで<br><span class="accent">終わりにしない。</span></h1><p class="hero-description">3つの質問で、今の自分に合う<br>“今日の一歩”が見つかる</p><div class="facts" aria-label="3問、目標60秒、無料"><div class="fact"><strong>3問</strong><small>選ぶだけ</small></div><div class="fact"><strong>60秒</strong><small>目標時間</small></div><div class="fact"><strong>無料</strong><small>追加登録なし</small></div></div><a href="#/q1" class="primary">無料で診断する <span class="arrow" aria-hidden="true">→</span></a><p class="note">自己整理のための簡易チェックです。医学的・心理学的な確定診断ではありません。収益・成功を保証するものではありません。</p></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="switch"><div class="switch-knob">↗</div></div><span class="art-label">YOUR FIRST STEP</span></div></section>';
}
function question(index) {
  const q = QUESTIONS[index];
  return '<section class="panel"><div class="question-top"><button class="back" data-back="' + index + '">← 戻る</button><span class="counter">' + (index + 1) + ' / 3</span></div><div class="progress" aria-label="全3問中' + (index + 1) + '問目">' + [0, 1, 2].map(n => '<span class="' + (n <= index ? 'filled' : '') + '"></span>').join('') + '</div><h1 class="question-title" id="question-title">' + q.title + '</h1><p class="helper">今の自分に近いものを、1つ選んでください。</p><form id="question-form"><fieldset aria-labelledby="question-title"><div class="choices">' + q.options.map(option => '<label class="choice"><input type="radio" name="answer" value="' + option.value + '"' + (answers[index] === option.value ? ' checked' : '') + '><span>' + option.label + '</span><span class="selected-mark" aria-hidden="true">✓</span></label>').join('') + '</div></fieldset><button class="primary" type="submit"' + (answers[index] ? '' : ' disabled') + '>' + (index === 2 ? '今日の一歩を見る' : '次へ') + ' <span class="arrow" aria-hidden="true">→</span></button></form></section>';
}
function resultView(result) {
  return '<section class="panel"><p class="result-status"><span class="status-icon" aria-hidden="true">✓</span>診断完了。ここから、一歩。</p><article class="action-card"><div class="action-header"><span>今日の一歩</span><span class="duration">' + result.duration + '分</span></div><h1>' + esc(result.actionTitle) + '</h1><p class="goal-line">' + esc(result.goalLine) + '<br>あなたが目指すのは「' + esc(result.goalName) + '」</p></article><article class="type-card"><p class="type-label">今のあなたに近い行動タイプ</p><h2>' + esc(result.typeTitle) + '</h2><p>' + esc(result.insight) + '</p></article><section class="ai-card"><h2>この一歩をAIと進める</h2><p>コピーした文章をChatGPTに貼り付けると、取り組む手順を相談できます。</p><button class="primary" id="copy-prompt">プロンプトをコピー <span class="arrow" aria-hidden="true">↗</span></button><p id="copy-status" class="copy-status" role="status" aria-live="polite"></p><details id="prompt-details"><summary>プロンプトを確認・手動でコピー</summary><label for="prompt-text" class="manual-label">長押ししてコピー（PCでは全文を選択してコピー）</label><textarea id="prompt-text" readonly spellcheck="false">' + esc(result.prompt) + '</textarea></details><p class="note">このサイト内でAIは実行されません。ChatGPTの利用条件・回答は外部サービスに依存します。</p></section>' + (openChatUrl ? '<aside class="challenge-callout"><h2>一歩を、7日間につなげる</h2><p class="note">参加費無料・ニックネーム参加。参加も退室も自由です。</p><a class="secondary" href="#/challenge">7日間チャレンジについて</a></aside>' : '') + '<button class="restart" id="restart">もう一度診断する</button></section>';
}
function info() {
  return '<article class="panel document"><a class="back" href="#/">← トップへ</a><h1>使い方・プライバシー</h1><section><h2>今日の一歩を見つける</h2><ol><li>今の悩み、増やしたい自由、今日使える時間を選びます。</li><li>結果に表示された行動を1つ試してみてください。</li><li>AIの補助が欲しいときは、プロンプトをコピーしてChatGPTに貼り付けます。</li></ol><p>回答は戻って変更できます。ページを再読み込みすると回答は消え、最初からになります。</p></section><section><h2>回答とプライバシー</h2><p>診断回答は、このページを開いている間だけブラウザのメモリで扱います。回答や個人情報をサーバーへ送信せず、入力フォームやアクセス解析、Cookieによる追跡も使用しません。</p><p>サイト配信元では通常のアクセス情報が記録される場合があります。コピーした文章をChatGPTに貼り付けた場合やLINEなどへ移動した場合は、そのサービスの利用規約・プライバシーポリシーが適用されます。</p></section><section><h2>診断について</h2><p>医学的・心理学的な確定診断ではなく、自己整理用の簡易チェックです。収益・成功は保証しません。選んだ時間で取り組む一つの行動を提案します。</p></section><section><h2>リンクが開けないとき</h2><p>通信状態を確認し、リンクをもう一度タップしてください。LINE内ブラウザで開けない場合は、端末の標準ブラウザでお試しください。LINE側の案内に従ってアプリやWeb版をご利用ください。</p></section>' + (lineUrl ? '<section><h2>LINEで再アクセス</h2><p>LINE公式アカウントに追加すると、診断へのリンクを受け取れます。あとから解除できます。</p>' + link(lineUrl, 'LINE公式アカウントを開く', 'secondary line-link') + '</section>' : '') + '</article>';
}
function aiInfo() {
  const result = currentResult();
  return '<article class="panel document"><a class="back" href="#/">← トップへ</a><h1>AI行動スタートカード</h1><section><h2>今日の一歩を、具体的な手順に</h2><p>診断すると、あなたの行動タイプ・目的・使える時間に合わせたChatGPT用プロンプトを受け取れます。</p><ol><li>3問の診断で、今日の一歩を決める。</li><li>結果画面で「プロンプトをコピー」をタップ。</li><li>ChatGPTを開き、貼り付けて送信する。</li></ol><p>コピーできない場合は、結果画面のテキスト欄を長押ししてコピーできます。個人情報の入力は不要です。</p><p class="note">このサイト内でAIは実行されません。ChatGPTの利用条件・回答は外部サービスに依存します。</p><a class="primary" href="' + (result ? '#/result' : '#/q1') + '">' + (result ? '診断結果のAIカードを見る' : '無料で診断する') + '</a></section></article>';
}
function challengeInfo() {
  const days = [['今日の5分・15分・30分を宣言しよう', '今日は〇〇をします'], ['得意なことを3つ出そう', '得意なこと1つ'], ['誰の悩みを解決したい？', '届けたい相手'], ['アイデアを一文にしよう', 'サービス/発信アイデア1行'], ['試作品を一つ作ろう', '作ったもの／着手したこと'], ['一人に見せてみよう', 'もらった反応または学び'], ['7日間の振り返り', 'できたこと＋次の一歩']];
  return '<article class="panel document"><a class="back" href="#/">← トップへ</a><h1>学んで終わりにしない｜<br>7日間行動チャレンジ</h1><section><p>副業・起業の学びを今日の行動に変えるための無料の実践室です。</p><p>参加費無料・ニックネーム参加・参加も退室も自由。参加しなくても、診断とAIプロンプトを使えます。</p></section><section><h2>7日間のプログラム</h2><ol class="day-list">' + days.map((day, index) => '<li><strong>DAY ' + (index + 1) + '</strong>' + day[0] + '<p class="note">「' + day[1] + '」をひと言。</p></li>').join('') + '</ol></section><section><h2>参加のルール</h2><ul><li>報告は短くてOK。他人と比べない。</li><li>個人情報・連絡先を投稿しない。</li><li>宣伝・勧誘・営業DM・金銭授受は禁止。</li><li>参加も退室も自由です。</li></ul><p>運営投稿は原則1日1回。返信や投稿のノルマはありません。LINE公式アカウントへの友だち追加とは別の参加先です。</p></section>' + (openChatUrl ? link(openChatUrl, 'ルールを確認して任意で参加する') + '<p class="note">LINEオープンチャットが開きます。開けない場合は通信状態を確認し、標準ブラウザでお試しください。</p>' : '') + '</article>';
}
function render() {
  let path = location.hash.slice(1) || '/';
  if (!['/', '/q1', '/q2', '/q3', '/result', '/info', '/ai', '/challenge'].includes(path)) return navigate('/', true);
  const index = /^\/q[123]$/.test(path) ? Number(path.slice(2)) - 1 : -1;
  if (index > 0 && answers.slice(0, index).some(answer => !answer)) return navigate('/', true);
  const result = currentResult();
  if (path === '/result' && !result) return navigate('/', true);
  const views = { '/': start, '/info': info, '/ai': aiInfo, '/challenge': challengeInfo };
  main.innerHTML = index >= 0 ? question(index) : path === '/result' ? resultView(result) : views[path]();
  document.title = (index >= 0 ? '質問' + (index + 1) + '｜' : path === '/result' ? '今日の一歩｜' : '') + '60秒の行動スイッチ診断';
  main.querySelector('h1')?.setAttribute('tabindex', '-1');
  main.querySelector('h1')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  if (index >= 0) {
    const form = main.querySelector('form');
    form.addEventListener('change', event => {
      if (event.target.name !== 'answer') return;
      answers[index] = event.target.value;
      form.querySelector('button').disabled = false;
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!answers[index]) return;
      navigate(index === 2 ? '/result' : '/q' + (index + 2));
    });
    main.querySelector('[data-back]').addEventListener('click', () => navigate(index === 0 ? '/' : '/q' + index));
  }
  main.querySelector('#restart')?.addEventListener('click', () => { answers.fill(null); navigate('/'); });
  main.querySelector('#copy-prompt')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    const status = main.querySelector('#copy-status');
    const details = main.querySelector('#prompt-details');
    const textarea = main.querySelector('#prompt-text');
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(result.prompt);
      status.textContent = 'コピーしました。ChatGPTに貼り付けてください。';
    } catch {
      status.textContent = '自動コピーができませんでした。下の文章を長押ししてコピーしてください。';
      details.open = true;
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
    } finally { button.disabled = false; }
  });
}
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); });
window.addEventListener('hashchange', render);
window.addEventListener('pageshow', event => { if (event.persisted) { answers.fill(null); navigate('/', true); } });
render();
