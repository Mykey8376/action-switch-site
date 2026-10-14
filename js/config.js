// 発行済みの HTTPS URL だけを設定してください。空欄の導線は表示されません。
export const CONFIG = Object.freeze({ lineUrl: '', openChatUrl: '' });

export function validExternalUrl(value) {
  if (typeof value !== 'string' || !value || /[<>\s]/.test(value)) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
