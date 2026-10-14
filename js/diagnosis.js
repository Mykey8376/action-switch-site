import { TYPES, GOALS, ACTIONS } from './diagnosis-data.js';

export function diagnose(type, goal, minutes) {
  if (!Object.hasOwn(TYPES, type) || !Object.hasOwn(GOALS, goal) || !['5', '15', '30'].includes(String(minutes))) {
    throw new RangeError('診断には有効な3つの回答が必要です。');
  }
  const typeTitle = TYPES[type].title;
  const goalName = GOALS[goal].name;
  const duration = Number(minutes);
  const actionTitle = ACTIONS[type][duration];
  const prompt = [
    '私は副業・起業に向けて一歩を踏み出したいと考えています。',
    '今の状況は「' + typeTitle + '」に近く、目指すのは「' + goalName + '」です。',
    '今日使える時間は' + duration + '分です。',
    'まず取り組むのは「' + actionTitle + '」です。',
    'この行動を' + duration + '分以内で終えられるよう、具体的な3ステップに分けてください。',
    '最初のステップから始めたいので、必要な質問は1つずつお願いします。',
    '有料サービスへの誘導や収益保証は不要です。',
  ].join('\n');
  return { typeTitle, insight: TYPES[type].insight, goalName, goalLine: GOALS[goal].line, duration, actionTitle, actionSteps: [actionTitle], prompt };
}
