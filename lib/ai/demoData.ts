/**
 * Demo mode mock data for testing without API keys
 * Simulates Claude Vision responses with realistic Japanese content
 */

import { DocumentReadingResult } from './documentReader';
import { SceneDescription } from './sceneDescriber';

const DEMO_DOCUMENTS: DocumentReadingResult[] = [
  {
    summary:
      'これは東京電力エナジーパートナーからの電気料金のお知らせです。2026年3月分の電気料金は4,320円で、支払い期限は3月30日です。先月より約200円安くなっています。',
    documentType: '電気料金の請求書',
    sender: '東京電力エナジーパートナー株式会社',
    keyInfo: [
      '請求金額：4,320円',
      '対象期間：2026年2月5日～3月4日',
      '支払い期限：2026年3月30日',
      '使用量：186kWh（前月比 -12kWh）',
      'お客様番号：0312-xxxx-xxxx',
    ],
    actionNeeded: '3月30日までにお支払いください。コンビニまたは口座振替で支払い可能です。',
    fullText: '',
  },
  {
    summary:
      'これはロキソニンSの薬の説明書です。頭痛、生理痛、歯痛などの痛み止めです。1回1錠、1日2回まで服用できます。空腹時の服用は避けてください。',
    documentType: '薬の説明書（市販薬）',
    sender: '第一三共ヘルスケア株式会社',
    keyInfo: [
      '薬品名：ロキソニンS',
      '用法：1回1錠、1日2回まで',
      '効能：頭痛、歯痛、生理痛、関節痛',
      '注意：空腹時を避ける、15歳未満は服用不可',
      '副作用：胃部不快感、発疹の場合は服用中止',
    ],
    actionNeeded: '食後に服用してください。症状が3日以上続く場合は医師に相談してください。',
    fullText: '',
  },
  {
    summary:
      'これは居酒屋「鳥貴族」のメニューです。全品均一価格370円のチェーン居酒屋です。焼き鳥、サラダ、ドリンクなどがあります。',
    documentType: 'レストランのメニュー',
    sender: '鳥貴族',
    keyInfo: [
      '全品370円均一',
      'おすすめ：もも貴族焼き（たれ・塩）',
      'ドリンク：生ビール370円、ハイボール370円',
      'サラダ：キャベツ盛り（おかわり自由）',
    ],
    actionNeeded: null,
    fullText: '',
  },
];

const DEMO_SCENES: SceneDescription[] = [
  {
    summary:
      '屋外の交差点にいます。正面に横断歩道があり、信号は赤です。左側にコンビニのローソンがあります。歩道には点字ブロックが敷かれています。人通りはやや多めです。右側に自転車が2台停められており、歩道が少し狭くなっています。',
    locationType: '屋外・交差点',
    objects: ['横断歩道', '信号機（赤）', 'ローソン（左側）', '点字ブロック', '自転車2台（右側）'],
    peopleDensity: 'やや混雑',
    hazards: ['信号が赤です。横断しないでください', '右側の自転車で歩道が狭くなっています'],
    readableText: ['ローソン', '押しボタン式信号', '止まれ'],
  },
  {
    summary:
      '駅の改札前にいます。正面にJRの自動改札機が5台並んでいます。左端が幅の広い改札で、車椅子やベビーカーが通れます。床に点字ブロックがあり、改札へ誘導しています。人は少なく、空いています。',
    locationType: '屋内・駅の改札前',
    objects: ['自動改札機5台', '幅広改札（左端）', '点字ブロック', '案内板'],
    peopleDensity: '空いている',
    hazards: ['段差はありません'],
    readableText: ['JR東日本', '出口', 'Exit', 'きっぷうりば'],
  },
];

let demoDocIndex = 0;
let demoSceneIndex = 0;

export function getDemoDocument(): DocumentReadingResult {
  const result = DEMO_DOCUMENTS[demoDocIndex % DEMO_DOCUMENTS.length];
  demoDocIndex++;
  return result;
}

export function getDemoScene(): SceneDescription {
  const result = DEMO_SCENES[demoSceneIndex % DEMO_SCENES.length];
  demoSceneIndex++;
  return result;
}
