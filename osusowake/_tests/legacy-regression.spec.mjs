import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const baseline = '2b8bcdd4da5293dd7834222b0afad03abd1628e4';
const repo = fileURLToPath(new URL('../../', import.meta.url));
const actions = {
  direction: ['興味のあることを2つ書き、今日試したい方に丸をつける', '自分の経験を3つ書き、誰かの役に立ちそうなことを1つ仮決めする', '経験と相手の悩みを整理し、小さなサービス案を1つ文章にする'],
  collect: ['最近学んだことを1つ選び、「今日試すこと」を1行で書く', '最近学んだことを1つ実際に試し、結果を1行残す', '学んだことを使った小さな成果物を1つ作り、画面保存する'],
  publish: ['いまあるものを見せたい相手を1人決める', '未完成でも1人に見せる短いメッセージを作って送る', '共有版を整えて1人に見せ、感想を1つ聞く'],
  continue: ['明日やる5分の作業を決め、予定に入れる', '目標を5分作業に分け、最初の1つを実行する', '1週間分の短い作業枠を3つ決め、今日の1枠を実行する'],
};
const types = { direction: '方向性迷子タイプ', collect: '情報収集ループタイプ', publish: '完璧待ちタイプ', continue: '継続ストップタイプ' };
const goals = { money: 'お金の余裕', time: '自分の時間', family: '家族との時間', work: '働き方の自由' };

test('OS-15 既存6ファイルは基準SHAとバイト一致', () => {
  const files = ['index.html', 'assets/styles.css', 'js/app.js', 'js/config.js', 'js/diagnosis-data.js', 'js/diagnosis.js'];
  // 基準コミットがHEADの祖先であることを確認する。
  execFileSync(
    'git',
    ['merge-base', '--is-ancestor', baseline, 'HEAD'],
    { cwd: repo }
  );
  for (const path of files) {
    const original = execFileSync('git', ['show', baseline + ':' + path], { cwd: repo });
    expect(readFileSync(repo + path).equals(original), path).toBe(true);
    if (process.env.TEST_BUILT === '1') {
      expect(readFileSync(fileURLToPath(new URL('./build/action-switch-site/' + path, import.meta.url))).equals(original), 'built ' + path).toBe(true);
    }
  }
});

for (const type of Object.keys(types)) for (const goal of Object.keys(goals)) for (const [index, minutes] of ['5', '15', '30'].entries()) {
  test(`OS-15 既存48通り ${type}/${goal}/${minutes}`, async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: /無料で診断する/u }).click();
    for (const answer of [type, goal, minutes]) {
      await page.locator(`[name=answer][value="${answer}"]`).check();
      await page.locator('#question-form button').click();
    }
    await expect(page.locator('.action-card h1')).toHaveText(actions[type][index]);
    await expect(page.locator('.type-card h2')).toHaveText(types[type]);
    await expect(page.locator('.goal-line')).toContainText(goals[goal]);
    await expect(page.locator('.duration')).toHaveText(minutes + '分');
  });
}

test('OS-15 既存の戻る・コピー成功/失敗・再実行・直リンク', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./');
  await page.getByRole('link', { name: /無料で診断する/u }).click();
  await expect(page.locator('#question-form button')).toBeDisabled();
  await page.locator('[name=answer][value=direction]').check();
  await page.locator('#question-form button').click();
  await page.locator('[data-back]').click();
  await expect(page.locator('[name=answer][value=direction]')).toBeChecked();
  await page.locator('#question-form button').click();
  await page.locator('[name=answer][value=family]').check();
  await page.locator('#question-form button').click();
  await page.locator('[name=answer][value="5"]').check();
  await page.locator('#question-form button').click();
  const prompt = await page.locator('#prompt-text').inputValue();
  await page.locator('#copy-prompt').click();
  await expect(page.locator('#copy-status')).toContainText('コピーしました');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(prompt);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
  await page.locator('#copy-prompt').click();
  await expect(page.locator('#prompt-details')).toHaveAttribute('open', '');
  await expect(page.locator('#prompt-text')).toBeFocused();
  await page.locator('#restart').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('終わりにしない');
  await page.getByRole('link', { name: /無料で診断する/u }).click();
  await expect(page.locator('[name=answer]:checked')).toHaveCount(0);
  await page.goto('./#/result');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('終わりにしない');
});
