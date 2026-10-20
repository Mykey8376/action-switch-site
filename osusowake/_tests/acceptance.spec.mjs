import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const entry = 'osusowake/';
const screen = (page, path) => page.locator(`[data-screen="${path}"]`);
async function toQ2(page, direction = 'self') {
  await page.goto(entry);
  await page.locator('#start').click();
  await expect(screen(page, '/q1')).toBeVisible();
  await page.locator(`[name=direction][value=${direction}]`).check();
  await page.locator('#q1-form button').click();
  await expect(screen(page, '/q2')).toBeVisible();
}
async function toQ3(page, reflection = '') {
  await toQ2(page);
  await page.locator('#reflection').fill(reflection);
  await page.locator('#q2-form button').click();
  await expect(screen(page, '/q3')).toBeVisible();
}
async function result(page, { recipient = '家族', action = '自分から声をかける', when = 'today', reflection = '' } = {}) {
  await toQ3(page, reflection);
  await page.locator('#recipient').fill(recipient);
  await page.locator('#action').fill(action);
  await page.locator(`[name=when][value=${when}]`).check();
  await page.locator('#q3-form button').click();
  await expect(screen(page, '/result')).toBeVisible();
}

test('OS-01/02/08 無登録で完走し実Clipboardと一致', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await result(page);
  const text = '今日、家族のために、自分から声をかける。';
  await expect(page.locator('#declaration')).toHaveText(text);
  await expect(page.locator('#optional-links')).toBeHidden();
  await page.locator('#copy').click();
  await expect(page.locator('#copy-status')).toContainText('コピーしました');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
  await page.locator('#restart').click();
  await expect(screen(page, '/')).toBeVisible();
});

for (const direction of ['self', 'other', 'both', 'unsure']) {
  test(`OS-03 Q1必須と4択 ${direction}`, async ({ page }) => {
    await page.goto(entry);
    await page.locator('#start').click();
    await page.locator('#q1-form button').click();
    await expect(screen(page, '/q1')).toBeVisible();
    await expect(page.locator('#q1-error')).toContainText('1つ選んで');
    await expect(page.locator('[name=direction]').first()).toBeFocused();
    await page.locator(`[name=direction][value=${direction}]`).check();
    await page.locator('#q1-form button').click();
    await expect(screen(page, '/q2')).toBeVisible();
  });
}

test('OS-04 Q2任意・説明・コードポイント160/161・IME', async ({ page }) => {
  await toQ2(page);
  await expect(page.locator('#q2-private')).toContainText('結果画面・コピー文・URLには含まれません');
  await page.locator('#reflection').fill('😀'.repeat(160));
  await expect(page.locator('#reflection-count')).toHaveText('160 / 160文字');
  await page.locator('#q2-form button').click();
  await expect(screen(page, '/q3')).toBeVisible();
  await page.locator('[data-screen="/q3"] [data-back]').click();
  await page.locator('#reflection').fill('😀'.repeat(161));
  await page.locator('#q2-form button').click();
  await expect(page.locator('#reflection-error')).toContainText('160文字以内');
  await expect(screen(page, '/q2')).toBeVisible();
  await page.locator('#reflection').evaluate(el => {
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    el.value = '参加してみたい';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  });
  await expect(page.locator('#reflection')).toHaveValue('参加してみたい');
  await expect(page.locator('#reflection-count')).toHaveText('7 / 160文字');
  await page.locator('#reflection').fill('');
  await page.locator('#q2-form button').click();
  await expect(screen(page, '/q3')).toBeVisible();
});

test('OS-05 Q3各欄必須・トリム・40/41・120/121・句点のみ', async ({ page }) => {
  await toQ3(page);
  await expect(page.locator('[name=when][value=today]')).toBeChecked();
  await page.locator('#recipient').fill('　 ');
  await page.locator('#q3-form button').click();
  await expect(page.locator('#recipient-error')).not.toBeEmpty();
  await expect(page.locator('#action-error')).not.toBeEmpty();
  await expect(page.locator('#recipient')).toBeFocused();
  await page.locator('#recipient').fill('家族');
  await page.locator('#q3-form button').click();
  await expect(page.locator('#action')).toBeFocused();
  await page.locator('#action').fill('。。。');
  await page.locator('#q3-form button').click();
  await expect(page.locator('#action-error')).toContainText('入力してください');
  await page.locator('#recipient').fill('😀'.repeat(41));
  await page.locator('#action').fill('あ'.repeat(121));
  await page.locator('#q3-form button').click();
  await expect(page.locator('#recipient-error')).toContainText('40文字以内');
  await expect(page.locator('#action-error')).toContainText('120文字以内');
  await page.locator('#recipient').fill(' 😀'.repeat(20).trim() + '😀'); // 40 code points
  await expect(page.locator('#recipient-count')).toHaveText('40 / 40文字');
  await page.locator('#action').fill('😀'.repeat(120));
  await page.locator('#q3-form button').click();
  await expect(screen(page, '/result')).toBeVisible();
});

for (const [when, label] of [['today', '今日'], ['tomorrow', '明日'], ['this_week', '今週']]) {
  for (const punctuation of ['', '。', '。。。', '。 。']) {
    test(`OS-06/08 時期・句点・コピー完全一致 ${when}/${punctuation || 'なし'}`, async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copied = text; } } });
      });
      await result(page, { recipient: ' 仲間　', action: ' 企画に立候補する' + punctuation + ' ', when, reflection: '内省専用_待っている一歩' });
      const expected = label + '、仲間のために、企画に立候補する。';
      await expect(page.locator('#declaration')).toHaveText(expected);
      await expect(page.locator('#copy-text')).toHaveValue(expected);
      await expect(screen(page, '/result')).not.toContainText('内省専用');
      expect(page.url()).not.toContain(encodeURIComponent('内省専用'));
      await page.locator('#copy').click();
      await expect(page.locator('#copy-status')).toContainText('コピーしました');
      expect(await page.evaluate(() => window.copied)).toBe(expected);
    });
  }
}

test('OS-07 戻る・履歴・全回答保持・修正結果', async ({ page }) => {
  await result(page, { reflection: 'イベントに参加する', when: 'tomorrow' });
  await page.locator('#review').click();
  await expect(page.locator('#recipient')).toHaveValue('家族');
  await expect(page.locator('[name=when][value=tomorrow]')).toBeChecked();
  await page.locator('[data-screen="/q3"] [data-back]').click();
  await expect(page.locator('#reflection')).toHaveValue('イベントに参加する');
  await page.locator('[data-screen="/q2"] [data-back]').click();
  await expect(page.locator('[name=direction][value=self]')).toBeChecked();
  await page.locator('[name=direction][value=both]').check();
  await page.locator('#q1-form button').click();
  await page.locator('#q2-form button').click();
  await page.locator('#recipient').fill('同僚');
  await page.locator('#action').fill('お礼を伝える。');
  await page.locator('[name=when][value=this_week]').check();
  await page.locator('#q3-form button').click();
  await expect(page.locator('#declaration')).toHaveText('今週、同僚のために、お礼を伝える。');
  await page.goBack();
  await expect(screen(page, '/q3')).toBeVisible();
  await expect(page.locator('#action')).toHaveValue('お礼を伝える。');
});

for (const unavailable of [false, true]) {
  test(`OS-09 コピー${unavailable ? '未対応' : '拒否'}で手動選択`, async ({ page }) => {
    await page.addInitScript(missing => Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: missing ? undefined : { writeText: async () => { throw new Error('denied'); } },
    }), unavailable);
    await result(page);
    await page.locator('#copy').click();
    await expect(page.locator('#copy-status')).toContainText('自動コピーができませんでした');
    await expect(page.locator('#manual-copy')).toHaveAttribute('open', '');
    await expect(page.locator('#copy-text')).toBeFocused();
    expect(await page.locator('#copy-text').evaluate(el => el.selectionEnd - el.selectionStart)).toBe((await page.locator('#declaration').textContent()).length);
  });
}

test('OS-10 再実行で値・旧結果・通知を初期化', async ({ page }) => {
  await result(page, { when: 'this_week', reflection: '内省' });
  await page.locator('#restart').click();
  await expect(page.locator('#declaration')).toBeEmpty();
  await expect(page.locator('#copy-text')).toHaveValue('');
  await expect(page.locator('#copy-status')).toBeEmpty();
  await page.locator('#start').click();
  await expect(page.locator('[name=direction]:checked')).toHaveCount(0);
  await page.locator('[name=direction][value=unsure]').check();
  await page.locator('#q1-form button').click();
  await expect(page.locator('#reflection')).toHaveValue('');
  await page.locator('#q2-form button').click();
  await expect(page.locator('#recipient')).toHaveValue('');
  await expect(page.locator('#action')).toHaveValue('');
  await expect(page.locator('[name=when][value=today]')).toBeChecked();
});

test('OS-11 直接アクセス・不正ハッシュ・更新・BFCache復帰', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const hash of ['#/result', '#/q3', '#/q2', '#/q1', '#/unknown', '#%invalid']) {
    await page.goto(entry + hash);
    // ハッシュだけの移動は同一文書内。新規直接アクセス相当として読み直す。
    await page.reload();
    await expect(screen(page, '/')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#/');
  }
  await result(page);
  await page.reload();
  await expect(screen(page, '/')).toBeVisible();
  await result(page);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(screen(page, '/')).toBeVisible();
  await expect(page.locator('#recipient')).toHaveValue('');
  const response = await request.get(entry + 'missing-page');
  expect(response.status()).toBe(404);
  expect(errors).toEqual([]);
});

test('OS-12 HTML/JS/引用符は文字列として描画', async ({ page }) => {
  const recipient = '<script>alert(1)</script>';
  const action = '<img src=x onerror="window.xss=1"> & " \'。';
  let dialogs = 0;
  page.on('dialog', dialog => { dialogs += 1; dialog.dismiss(); });
  await result(page, { recipient, action, reflection: '<svg onload=alert(1)>' });
  await expect(page.locator('#declaration')).toHaveText('今日、' + recipient + 'のために、' + action);
  expect(await page.locator('#declaration').locator('*').count()).toBe(0);
  expect(await page.evaluate(() => window.xss)).toBeUndefined();
  expect(dialogs).toBe(0);
});

test('OS-13 回答非送信・非保存・URL非混入・外部依存なし', async ({ page, context }) => {
  const requests = [];
  page.on('request', req => requests.push({ url: req.url(), method: req.method(), data: req.postData() }));
  await toQ3(page, 'PRIVATE_Q2_試験文');
  const before = requests.length;
  await page.locator('#recipient').fill('PRIVATE_TARGET');
  await page.locator('#action').fill('PRIVATE_ACTION');
  await page.locator('#q3-form button').click();
  await expect(screen(page, '/result')).toBeVisible();
  expect(requests.length).toBe(before);
  expect(requests.every(req => new URL(req.url).origin === new URL(page.url()).origin && req.method === 'GET' && !req.data)).toBe(true);
  expect(JSON.stringify(requests)).not.toContain('PRIVATE');
  expect(page.url()).not.toContain('PRIVATE');
  const stored = await page.evaluate(async () => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie, history: history.state, caches: await caches.keys(), workers: (await navigator.serviceWorker.getRegistrations()).length }));
  expect(stored).toEqual({ local: 0, session: 0, cookie: '', history: null, caches: [], workers: 0 });
  expect(await context.cookies()).toEqual([]);
  await expect(page.locator('.privacy')).toContainText('個人名、住所、連絡先などの入力は不要');
  await expect(page.locator('.privacy')).toContainText('配信元では通常のアクセス情報が記録される場合');
  const source = readFileSync(fileURLToPath(new URL('../js/app.js', import.meta.url)), 'utf8');
  expect(source).not.toMatch(/innerHTML|localStorage|sessionStorage|sendBeacon|fetch\(|XMLHttpRequest|console\./u);
});

test('OS-14 未確認・不正URLの検証と初期非表示', async ({ page }) => {
  await result(page);
  await expect(page.locator('#optional-links')).toBeHidden();
  const values = await page.evaluate(async () => {
    const { verifiedUrl } = await import('./js/config.js');
    return [
      verifiedUrl('line', { url: 'https://lin.ee/nAMWXRZ', verified: false }),
      ...['', 'javascript:alert(1)', 'http://lin.ee/a', 'https://evil.example/a', 'https://lin.ee.evil.example/a', 'https://u:p@lin.ee/a', 'https://lin.ee/a?answer=secret', 'https://lin.ee/a#x', 'https://lin.ee/a b'].map(url => verifiedUrl('line', { url, verified: true })),
    ];
  });
  expect(values.every(value => value === '')).toBe(true);
});

for (const verified of [false, true]) {
  test(`OS-14 設定済URL・確認フラグ=${verified}（外部遷移なし）`, async ({ page }) => {
    const config = readFileSync(fileURLToPath(new URL('../js/config.js', import.meta.url)), 'utf8');
    const settings = { diagnosis: { url: 'https://mykey8376.github.io/action-switch-site/', verified }, line: { url: 'https://lin.ee/nAMWXRZ', verified } };
    await page.route('**/osusowake/js/config.js', route => route.fulfill({ contentType: 'text/javascript', body: config.replace(/export const CONFIG = Object.freeze\(\{[\s\S]*?\n\}\);/u, 'export const CONFIG = ' + JSON.stringify(settings) + ';') }));
    await toQ3(page);
    await expect(page.locator('#optional-links')).toBeHidden();
    await page.locator('#recipient').fill('家族');
    await page.locator('#action').fill('お礼を伝える');
    await page.locator('#q3-form button').click();
    if (verified) {
      await expect(page.locator('#line-link')).toBeVisible();
      await expect(page.locator('#line-link')).toHaveAttribute('href', 'https://lin.ee/nAMWXRZ');
      await expect(page.locator('#line-section')).toContainText('登録は任意');
      await expect(page.locator('#diagnosis-link')).toBeVisible();
    } else await expect(page.locator('#optional-links')).toBeHidden();
  });
}

for (const width of [320, 375, 390, 768, 1440]) {
  test(`OS-16 全画面と長文の横スクロールなし ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    async function noOverflow() {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.goto(entry); await noOverflow();
    await page.locator('#start').click(); await noOverflow();
    await page.locator('[name=direction][value=self]').check();
    await page.locator('#q1-form button').click(); await noOverflow();
    await page.locator('#q2-form button').click(); await noOverflow();
    await page.locator('#recipient').fill('長'.repeat(40));
    await page.locator('#action').fill('長'.repeat(120));
    await page.locator('#q3-form button').click(); await noOverflow();
    await page.locator('#manual-copy summary').click(); await noOverflow();
  });
}

test('OS-17 キーボード完走・エラーフォーカス・Enter抑制', async ({ page }) => {
  await page.goto(entry);
  await page.locator('#start').focus();
  await page.keyboard.press('Enter');
  await expect(screen(page, '/q1').locator('h1')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[name=direction][value=self]')).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(screen(page, '/q2').locator('h1')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.type('memo');
  await page.keyboard.press('Enter');
  await expect(screen(page, '/q2')).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(screen(page, '/q3').locator('h1')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.type('family');
  await page.keyboard.press('Enter');
  await expect(screen(page, '/q3')).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.type('say thanks');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(screen(page, '/result').locator('h1')).toBeFocused();
  await expect(page.locator('#declaration')).toHaveText('明日、familyのために、say thanks。');
});

test('OS-17 全5画面axe WCAG AA・主要タップ領域・200%相当', async ({ page }) => {
  await page.goto(entry);
  async function audit() {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
    const small = await page.locator('[data-screen]:not([hidden]) button, [data-screen]:not([hidden]) .choice').evaluateAll(elements => elements.filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map(el => el.textContent));
    expect(small).toEqual([]);
  }
  await audit();
  await page.locator('#start').click(); await audit();
  await page.locator('[name=direction][value=self]').check();
  await page.locator('#q1-form button').click(); await audit();
  await page.locator('#q2-form button').click(); await audit();
  await page.locator('#recipient').fill('家族');
  await page.locator('#action').fill('お礼を伝える');
  await page.locator('#q3-form button').click(); await audit();
  // Desktop viewport 1280 CSS px at 200% zoom corresponds to 640 CSS px.
  await page.setViewportSize({ width: 640, height: 450 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('OS-19 相対資産・CSP・ローカル404・成果物除外', async ({ page, request }) => {
  const response = await page.goto(entry);
  expect(response.status()).toBe(200);
  for (const asset of ['assets/styles.css', 'js/app.js', 'js/config.js']) expect((await request.get(entry + asset)).status()).toBe(200);
  await expect(page.locator('meta[http-equiv=Content-Security-Policy]')).toHaveAttribute('content', /connect-src 'none'.*form-action 'none'/u);
  expect((await request.get(entry + 'nonexistent/')).status()).toBe(404);
  if (process.env.TEST_BUILT === '1') {
    const root = fileURLToPath(new URL('./build/action-switch-site/', import.meta.url));
    const files = readdirSync(root, { recursive: true }).map(String);
    expect(files.some(path => /(^|\/)(_tests|_ops|node_modules|test-results|playwright-report)(\/|$)/u.test(path))).toBe(false);
    for (const path of ['osusowake/index.html', 'osusowake/assets/styles.css', 'osusowake/js/app.js', 'osusowake/js/config.js']) expect(existsSync(root + path)).toBe(true);
    for (const path of ['_tests/package.json', '_ops/README.md']) expect((await request.get(entry + path)).status()).toBe(404);
  }
});
