export const TYPES = {
  direction: { title: '方向性迷子タイプ', insight: '選択肢が多く、最初に試す一つを決めにくい状態かもしれません。まず仮決めして試しましょう。' },
  collect: { title: '情報収集ループタイプ', insight: '学ぶことで安心し、試す時間が後回しになっているかもしれません。今日ひとつ実践しましょう。' },
  publish: { title: '完璧待ちタイプ', insight: '完成度を気にして、人の反応を得る機会が少なくなっているかもしれません。小さく共有しましょう。' },
  continue: { title: '継続ストップタイプ', insight: '続け方が今の生活に合っていないかもしれません。短く取り組める仕組みを作りましょう。' },
};
export const GOALS = {
  money: { name: 'お金の余裕', line: '将来のお金の選択肢を増やすために' },
  time: { name: '自分の時間', line: '使える時間を少しずつ増やすために' },
  family: { name: '家族との時間', line: '大切な人との時間を楽しむために' },
  work: { name: '働き方の自由', line: '働き方の選択肢を増やすために' },
};
export const ACTIONS = {
  direction: { 5: '興味のあることを2つ書き、今日試したい方に丸をつける', 15: '自分の経験を3つ書き、誰かの役に立ちそうなことを1つ仮決めする', 30: '経験と相手の悩みを整理し、小さなサービス案を1つ文章にする' },
  collect: { 5: '最近学んだことを1つ選び、「今日試すこと」を1行で書く', 15: '最近学んだことを1つ実際に試し、結果を1行残す', 30: '学んだことを使った小さな成果物を1つ作り、画面保存する' },
  publish: { 5: 'いまあるものを見せたい相手を1人決める', 15: '未完成でも1人に見せる短いメッセージを作って送る', 30: '共有版を整えて1人に見せ、感想を1つ聞く' },
  continue: { 5: '明日やる5分の作業を決め、予定に入れる', 15: '目標を5分作業に分け、最初の1つを実行する', 30: '1週間分の短い作業枠を3つ決め、今日の1枠を実行する' },
};
export const QUESTIONS = [
  { title: '今、一番近い悩みは？', options: [
    { value: 'direction', label: '何から始めればいいか分からない' },
    { value: 'collect', label: '学んでいるのに行動できていない' },
    { value: 'publish', label: '準備はしたけれど人に見せられない' },
    { value: 'continue', label: '始めても続かない' },
  ] },
  { title: '今、増やしたい『自由』は？', options: Object.entries(GOALS).map(([value, goal]) => ({ value, label: goal.name })) },
  { title: '今日使える時間は？', options: [5, 15, 30].map(value => ({ value: String(value), label: value + '分' })) },
];
