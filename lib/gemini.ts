import type { DocumentSummary } from '@/stores/useDocumentStore';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const PRIMARY_MODEL = 'gemini-2.5-flash-preview-05-20';
const FALLBACK_MODEL = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `あなたは日本の生活書類を解説するアシスタントです。
視覚障害者や在日外国人に、書類の内容をわかりやすく説明します。

以下のJSON形式で必ず回答してください。JSON以外の文字を含めないでください。

{
  "documentType": "書類の種類（例：年金通知、住民税通知、健康保険料通知、電気料金請求書、マイナンバー通知）",
  "sender": "差出人（例：日本年金機構、○○市役所、不明）",
  "summary": "書類の要点を1〜2文で簡潔に説明（視覚障害者が音声で聞くことを前提に、数字や日付は省略せず読み上げやすい形で）",
  "keyInfo": ["重要な情報1", "重要な情報2"],
  "actionNeeded": "必要なアクション（支払い、届出など。不要ならnull）",
  "deadline": "期限日（例：2026年3月30日。期限がなければnull）",
  "translation": "書類の要点を英語と中国語でも簡潔に説明（例：This is an electricity bill for 4,320 yen, due March 30. / 这是一张4,320日元的电费账单，截止日期为3月30日。）。日本語の書類の場合のみ。日本語以外の書類ならnull"
}

注意事項：
- 金額は「4,320円」のように読みやすく表記
- 日付は「2026年3月30日」のように年月日で表記
- 専門用語は簡単な言葉で補足
- 書類が日本語以外の場合も、回答は日本語で
- OCRの読み取りミスがあっても、文脈から推測して正しい情報を提供
- translationは在日外国人のために、英語と中国語で要点を1文ずつ提供`;

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
 * Check if Gemini API is available (API key configured)
 */
export function isGeminiAvailable(): boolean {
  const available = !!GEMINI_API_KEY && GEMINI_API_KEY.length > 0;
  if (!available) {
    console.warn('[Gemini] API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in .env');
  }
  return available;
}

/**
 * Call Gemini API to explain a document from OCR text.
 * Tries primary model first, falls back to secondary model on failure.
 */
export async function explainDocument(
  ocrText: string,
): Promise<DocumentSummary | null> {
  if (!isGeminiAvailable()) return null;

  const userPrompt = `以下はOCRで読み取った書類のテキストです。内容を解説してください。\n\n${ocrText}`;

  console.log('[Gemini] Trying primary model:', PRIMARY_MODEL);
  const primary = await callGemini(PRIMARY_MODEL, userPrompt);
  if (primary) return primary;

  console.log('[Gemini] Primary failed, trying fallback:', FALLBACK_MODEL);
  const fallback = await callGemini(FALLBACK_MODEL, userPrompt);
  if (fallback) return fallback;

  console.error('[Gemini] Both models failed');
  return null;
}

async function callGemini(
  model: string,
  userPrompt: string,
): Promise<DocumentSummary | null> {
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

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[Gemini] HTTP ${res.status} for model ${model}:`, errorBody);
      return null;
    }

    const data: GeminiResponse = await res.json();

    if (data.error) {
      console.error(`[Gemini] API error for model ${model}:`, data.error.message);
      return null;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error(`[Gemini] No text in response for model ${model}:`, JSON.stringify(data));
      return null;
    }

    console.log(`[Gemini] Success with model ${model}`);
    return parseGeminiResponse(text);
  } catch (e) {
    console.error(`[Gemini] Network error for model ${model}:`, e);
    return null;
  }
}

function parseGeminiResponse(text: string): DocumentSummary | null {
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
  } catch (e) {
    console.error('[Gemini] Failed to parse response:', text, e);
    return null;
  }
}
