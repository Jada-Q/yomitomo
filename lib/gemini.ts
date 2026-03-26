import type { DocumentSummary } from '@/stores/useDocumentStore';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite-preview';

const SYSTEM_PROMPT = `あなたは日本の生活書類を解説するアシスタントです。
視覚障害者や在日外国人に、書類の内容をわかりやすく説明します。

以下のJSON形式で必ず回答してください。JSON以外の文字を含めないでください。

{
  "documentType": "書類の種類（例：年金通知、住民税通知、健康保険料通知、電気料金請求書、マイナンバー通知）",
  "sender": "差出人（例：日本年金機構、○○市役所、不明）",
  "summary": "書類の要点を1〜2文で簡潔に説明（視覚障害者が音声で聞くことを前提に、数字や日付は省略せず読み上げやすい形で）",
  "keyInfo": ["重要な情報1", "重要な情報2"],
  "actionNeeded": "必要なアクション（支払い期限、届出期限など。不要ならnull）"
}

注意事項：
- 金額は「4,320円」のように読みやすく表記
- 日付は「2026年3月30日」のように年月日で表記
- 専門用語は簡単な言葉で補足
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
}

/**
 * Check if Gemini API is available (API key configured)
 */
export function isGeminiAvailable(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.length > 0;
}

/**
 * Call Gemini API to explain a document from OCR text.
 * Tries primary model first, falls back to lite model on failure.
 */
export async function explainDocument(
  ocrText: string,
): Promise<DocumentSummary | null> {
  if (!isGeminiAvailable()) return null;

  const userPrompt = `以下はOCRで読み取った書類のテキストです。内容を解説してください。\n\n${ocrText}`;

  // Try primary model, then fallback
  const result =
    (await callGemini(PRIMARY_MODEL, userPrompt)) ??
    (await callGemini(FALLBACK_MODEL, userPrompt));

  return result;
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

    if (!res.ok) return null;

    const data: GeminiResponse = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return parseGeminiResponse(text);
  } catch {
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
    };
  } catch {
    return null;
  }
}
