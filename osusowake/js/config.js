// 確認完了までは空欄・falseを維持する。URLの設定だけでは表示しない。
// LINEは正しいアカウントと登録後の動作、診断は現在の公開動作を確認する。
export const CONFIG = Object.freeze({
  diagnosis: Object.freeze({ url: '', verified: false }),
  line: Object.freeze({ url: '', verified: false }),
});

export function verifiedUrl(kind, entry) {
  if (entry?.verified !== true || typeof entry.url !== 'string' || /[\s<>]/u.test(entry.url)) return '';
  try {
    const url = new URL(entry.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return '';
    if (kind === 'line' && url.hostname === 'lin.ee' && /^\/[A-Za-z0-9]+$/u.test(url.pathname)) return url.href;
    if (kind === 'diagnosis' && url.hostname === 'mykey8376.github.io' && url.pathname === '/action-switch-site/') return url.href;
  } catch { /* 不正・未確認の導線は表示しない。 */ }
  return '';
}
