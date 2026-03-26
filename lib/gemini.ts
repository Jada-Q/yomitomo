import type { DocumentSummary } from '@/stores/useDocumentStore';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `あなたは日本で暮らす視覚障害者や外国人のための「書類解説アシスタント」です。
利用者は書類を自分で読めません。OCRで読み取ったテキストを渡すので、「この書類は何か」「自分は何をすべきか」を教えてください。

■ 最重要ルール
- OCRテキストをそのまま繰り返すな。利用者はすでに原文を音声で聞いている。
- 「何の書類か」「なぜ届いたか」「何をすべきか」の3点を中心に、原文にない補足知識を加えて説明しろ。
- 専門用語は使わず、小学生でもわかる言葉で書け。

■ 出力フォーマット（JSON以外の文字を含めるな）
{
  "documentType": "やさしい日本語で書類の種類（例：電気代の請求書、年金のお知らせ、マイナンバーカードの案内）",
  "sender": "差出人（例：東京電力、日本年金機構、○○市役所、不明）",
  "summary": "この書類が届いた理由と、利用者にとって何が重要かを1〜2文で説明。金額・日付は必ず含める。原文の繰り返しではなく、『あなたはこうすればよい』という視点で書く",
  "keyInfo": ["利用者が知るべき重要ポイント。金額、期限、届け先など具体的に"],
  "actionNeeded": "具体的な行動指示。支払い方法（コンビニ、銀行、口座振替）や届出先（市役所の窓口、電話番号）まで書く。何もしなくてよい場合は『口座振替の場合は対応不要です』のように明記。不要ならnull",
  "deadline": "期限日（例：2026年3月30日）。期限がなければnull",
  "translation": "英語と中国語で、外国人が知るべきポイントを1文ずつ。単なる翻訳ではなく、日本の制度に不慣れな人への補足を含める（例：You need to pay this at a convenience store (konbini) or bank by March 30. / 请在3月30日之前到便利店或银行支付。可以在7-11、全家等便利店缴费。）。日本語以外の書類ならnull"
}

■ 注意事項
- 金額は「4,320円」のように読みやすく表記
- 日付は「2026年3月30日」のように年月日で表記
- 書類が日本語以外の場合も、回答は日本語で
- OCRの読み取りミスがあっても、文脈から推測して正しい情報を提供`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/**
 * Mock response for testing without hitting the API.
 * Activated by EXPO_PUBLIC_USE_MOCK=true or when API key is missing.
 */
function getMockSummary(): DocumentSummary {
  return {
    documentType: '電気代の請求書',
    sender: '東京電力エナジーパートナー',
    summary: 'お家で使った電気の代金を支払うためのお知らせです。4,320円を3月30日までに払う必要があります。',
    keyInfo: ['請求金額：4,320円', '支払期限：2026年3月30日'],
    actionNeeded: 'コンビニのレジまたは銀行で払込票を使って支払えます。口座振替の場合は対応不要です。',
    deadline: '2026年3月30日',
    translation: 'This is your electricity bill for 4,320 yen. Pay at a convenience store or bank by March 30. / 这是4,320日元的电费账单，请在3月30日之前到便利店或银行缴费。',
  };
}

/**
 * Check if Gemini API is available (API key configured and not in mock mode)
 */
export function isGeminiAvailable(): boolean {
  if (USE_MOCK) return false;
  return !!GEMINI_API_KEY && GEMINI_API_KEY.length > 0;
}

/**
 * Call Gemini API to explain a document from OCR text.
 * Returns mock data if USE_MOCK=true or API key is missing.
 * On 429 (rate limit), returns null so caller can fall back to offline templates.
 */
export async function explainDocument(
  ocrText: string,
): Promise<{ summary: DocumentSummary | null; rateLimited?: boolean }> {
  if (!isGeminiAvailable()) {
    return { summary: getMockSummary() };
  }

  const userPrompt = `以下はOCRで読み取った書類のテキストです。内容を解説してください。\n\n${ocrText}`;

  const primary = await callGemini(PRIMARY_MODEL, userPrompt);
  if (primary.summary) return primary;
  if (primary.rateLimited) return primary;

  const fallback = await callGemini(FALLBACK_MODEL, userPrompt);
  if (fallback.summary) return fallback;

  return fallback;
}

async function callGemini(
  model: string,
  userPrompt: string,
): Promise<{ summary: DocumentSummary | null; rateLimited?: boolean }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (res.status === 429) {
      console.warn(`[Gemini] Rate limited (429) for ${model}`);
      return { summary: null, rateLimited: true };
    }

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[Gemini] HTTP ${res.status} for ${model}:`, errorBody);
      return { summary: null };
    }

    const data: GeminiResponse = await res.json();

    if (data.error) {
      console.error(`[Gemini] API error for ${model}:`, data.error.message);
      return { summary: null };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error(`[Gemini] Empty response for ${model}`);
      return { summary: null };
    }

    return { summary: parseGeminiResponse(text) };
  } catch (e) {
    console.error(`[Gemini] Network error for ${model}:`, e);
    return { summary: null };
  }
}

/**
 * Parse Gemini response text into DocumentSummary.
 * Handles markdown code blocks and malformed JSON gracefully.
 */
function parseGeminiResponse(text: string): DocumentSummary | null {
  // Step 1: Strip markdown code block wrappers (```json ... ```)
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // Step 2: Try direct parse
  const result = tryParseJson(cleaned);
  if (result) return result;

  // Step 3: If direct parse fails, extract JSON object with regex
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extracted = tryParseJson(jsonMatch[0]);
    if (extracted) return extracted;
  }

  console.error('[Gemini] Failed to parse response:', text.slice(0, 200));
  return null;
}

function tryParseJson(text: string): DocumentSummary | null {
  try {
    const parsed = JSON.parse(text);
    return {
      documentType: String(parsed.documentType || '書類'),
      sender: String(parsed.sender || '不明'),
      summary: String(parsed.summary || ''),
      keyInfo: Array.isArray(parsed.keyInfo)
        ? parsed.keyInfo.map(String)
        : [],
      actionNeeded: parsed.actionNeeded ? String(parsed.actionNeeded) : null,
      deadline: parsed.deadline ? String(parsed.deadline) : null,
      translation: parsed.translation ? String(parsed.translation) : null,
    };
  } catch {
    return null;
  }
}
