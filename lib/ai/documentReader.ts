import { DOCUMENT_READER_PROMPT } from './prompts';
import { getDemoDocument } from './demoData';

const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const IS_DEMO = process.env.EXPO_PUBLIC_MODE === 'demo';

export interface DocumentReadingResult {
  summary: string;
  documentType: string;
  sender: string;
  keyInfo: string[];
  actionNeeded: string | null;
  fullText: string;
  error?: string;
}

/**
 * Read a document photo using Claude Vision
 * In demo mode, returns realistic mock data
 */
export async function readDocument(
  base64Image: string,
): Promise<DocumentReadingResult> {
  if (IS_DEMO) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getDemoDocument();
  }

  try {
    const response = await fetch(
      `${SUPABASE_FUNCTION_URL}/functions/v1/read-document`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          prompt: DOCUMENT_READER_PROMPT,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as DocumentReadingResult;
  } catch (error) {
    return {
      summary: 'すみません、読み取りに失敗しました。もう一度お試しください。',
      documentType: '不明',
      sender: '',
      keyInfo: [],
      actionNeeded: null,
      fullText: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
