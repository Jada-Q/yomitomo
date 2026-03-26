import type { DocumentSummary } from '@/stores/useDocumentStore';

interface OfflineTemplate {
  keywords: string[];
  documentType: string;
  sender: string;
  buildSummary: (text: string) => string;
  buildKeyInfo: (text: string) => string[];
  buildAction: (text: string) => string | null;
}

/**
 * Extract a monetary amount from OCR text (e.g. "4,320円" or "12345円")
 */
function extractAmount(text: string): string | null {
  const match = text.match(/[\d,]+円/);
  return match ? match[0] : null;
}

/**
 * Extract a date from OCR text (e.g. "令和7年3月30日" or "2026年3月30日")
 */
function extractDate(text: string): string | null {
  const western = text.match(/\d{4}年\d{1,2}月\d{1,2}日/);
  if (western) return western[0];
  const reiwa = text.match(/令和\d{1,2}年\d{1,2}月\d{1,2}日/);
  if (reiwa) return reiwa[0];
  const slashed = text.match(/\d{4}\/\d{1,2}\/\d{1,2}/);
  if (slashed) return slashed[0];
  return null;
}

const TEMPLATES: OfflineTemplate[] = [
  // 年金通知
  {
    keywords: ['年金', '国民年金', '厚生年金', '年金機構', '年金事務所', '被保険者'],
    documentType: '年金通知',
    sender: '日本年金機構',
    buildSummary: (text) => {
      const amount = extractAmount(text);
      return amount
        ? `年金に関する通知です。金額は${amount}です。`
        : '年金に関する通知です。';
    },
    buildKeyInfo: (text) => {
      const info: string[] = [];
      const amount = extractAmount(text);
      const date = extractDate(text);
      if (amount) info.push(`金額：${amount}`);
      if (date) info.push(`日付：${date}`);
      if (text.includes('免除')) info.push('保険料の免除に関する内容が含まれています');
      if (text.includes('未納')) info.push('未納の保険料があります');
      return info;
    },
    buildAction: (text) => {
      const date = extractDate(text);
      if (text.includes('未納') || text.includes('納付'))
        return date ? `${date}までに納付が必要です` : '保険料の納付が必要です';
      if (text.includes('届出') || text.includes('届け出'))
        return '届出の手続きが必要です';
      return null;
    },
  },

  // 住民税
  {
    keywords: ['住民税', '市民税', '県民税', '都民税', '区民税', '特別徴収', '普通徴収', '課税証明'],
    documentType: '住民税通知',
    sender: '市区町村役所',
    buildSummary: (text) => {
      const amount = extractAmount(text);
      return amount
        ? `住民税に関する通知です。税額は${amount}です。`
        : '住民税に関する通知です。';
    },
    buildKeyInfo: (text) => {
      const info: string[] = [];
      const amount = extractAmount(text);
      const date = extractDate(text);
      if (amount) info.push(`税額：${amount}`);
      if (date) info.push(`期限：${date}`);
      if (text.includes('特別徴収')) info.push('給与から天引きされます');
      if (text.includes('普通徴収')) info.push('自分で納付する必要があります');
      return info;
    },
    buildAction: (text) => {
      const date = extractDate(text);
      if (text.includes('普通徴収') || text.includes('納付'))
        return date ? `${date}までに納付してください` : '住民税の納付が必要です';
      return null;
    },
  },

  // 健康保険
  {
    keywords: ['健康保険', '国民健康保険', '国保', '保険証', '被保険者証', '医療費', '高額療養'],
    documentType: '健康保険通知',
    sender: '市区町村役所・健康保険組合',
    buildSummary: (text) => {
      const amount = extractAmount(text);
      if (text.includes('高額療養'))
        return '高額療養費に関する通知です。医療費の自己負担額が上限を超えた場合の払い戻しについてです。';
      return amount
        ? `健康保険に関する通知です。金額は${amount}です。`
        : '健康保険に関する通知です。';
    },
    buildKeyInfo: (text) => {
      const info: string[] = [];
      const amount = extractAmount(text);
      const date = extractDate(text);
      if (amount) info.push(`金額：${amount}`);
      if (date) info.push(`期限：${date}`);
      if (text.includes('資格喪失')) info.push('保険の資格喪失に関する内容です');
      if (text.includes('被扶養者')) info.push('扶養に関する内容が含まれています');
      return info;
    },
    buildAction: (text) => {
      const date = extractDate(text);
      if (text.includes('届出') || text.includes('届け出') || text.includes('申請'))
        return date ? `${date}までに届出・申請が必要です` : '届出・申請の手続きが必要です';
      if (text.includes('納付'))
        return date ? `${date}までに納付してください` : '保険料の納付が必要です';
      return null;
    },
  },

  // 公共料金（電気・ガス・水道）
  {
    keywords: ['電力', '東京電力', '関西電力', '中部電力', 'ガス', '東京ガス', '水道', '請求書', '検針', '使用量', 'kWh'],
    documentType: '公共料金請求書',
    sender: '電力・ガス・水道会社',
    buildSummary: (text) => {
      const amount = extractAmount(text);
      let type = '公共料金';
      if (text.includes('電力') || text.includes('電気') || text.includes('kWh')) type = '電気料金';
      else if (text.includes('ガス')) type = 'ガス料金';
      else if (text.includes('水道')) type = '水道料金';
      return amount
        ? `${type}の請求書です。請求金額は${amount}です。`
        : `${type}の請求書です。`;
    },
    buildKeyInfo: (text) => {
      const info: string[] = [];
      const amount = extractAmount(text);
      const date = extractDate(text);
      if (amount) info.push(`請求金額：${amount}`);
      if (date) info.push(`支払期限：${date}`);
      const usage = text.match(/[\d,]+\s*kWh/);
      if (usage) info.push(`使用量：${usage[0]}`);
      return info;
    },
    buildAction: (text) => {
      const date = extractDate(text);
      return date ? `${date}までにお支払いください` : 'お支払いが必要です';
    },
  },

  // マイナンバー
  {
    keywords: ['マイナンバー', '個人番号', '通知カード', 'マイナンバーカード', '個人番号カード', '電子証明書'],
    documentType: 'マイナンバー関連通知',
    sender: '市区町村役所',
    buildSummary: (text) => {
      if (text.includes('更新')) return 'マイナンバーカードの更新に関する通知です。';
      if (text.includes('交付')) return 'マイナンバーカードの交付に関する通知です。';
      return 'マイナンバーに関する通知です。';
    },
    buildKeyInfo: (text) => {
      const info: string[] = [];
      const date = extractDate(text);
      if (date) info.push(`期限：${date}`);
      if (text.includes('電子証明書')) info.push('電子証明書に関する内容が含まれています');
      if (text.includes('暗証番号')) info.push('暗証番号の設定・変更が必要な場合があります');
      return info;
    },
    buildAction: (text) => {
      const date = extractDate(text);
      if (text.includes('更新'))
        return date ? `${date}までにカードの更新手続きをしてください` : 'マイナンバーカードの更新が必要です';
      if (text.includes('届出') || text.includes('届け出') || text.includes('申請'))
        return date ? `${date}までに届出・申請してください` : '届出・申請が必要です';
      return null;
    },
  },
];

/**
 * Try to match OCR text against offline templates.
 * Returns a DocumentSummary if a template matches, or null if no match.
 */
export function matchOfflineTemplate(ocrText: string): DocumentSummary | null {
  const text = ocrText.toLowerCase();

  let bestMatch: OfflineTemplate | null = null;
  let bestScore = 0;

  for (const template of TEMPLATES) {
    const score = template.keywords.reduce(
      (acc, kw) => acc + (text.includes(kw.toLowerCase()) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }

  // Require at least 1 keyword match
  if (!bestMatch || bestScore === 0) return null;

  return {
    documentType: bestMatch.documentType,
    sender: bestMatch.sender,
    summary: bestMatch.buildSummary(ocrText),
    keyInfo: bestMatch.buildKeyInfo(ocrText),
    actionNeeded: bestMatch.buildAction(ocrText),
  };
}
