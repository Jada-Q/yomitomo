import { SCENE_DESCRIBER_PROMPT } from './prompts';
import { getDemoScene } from './demoData';

const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const IS_DEMO = process.env.EXPO_PUBLIC_MODE === 'demo';

export interface SceneDescription {
  summary: string;
  locationType: string;
  objects: string[];
  peopleDensity: string;
  hazards: string[];
  readableText: string[];
  error?: string;
}

/**
 * Describe a scene photo using Claude Vision
 * In demo mode, returns realistic mock data
 */
export async function describeScene(
  base64Image: string,
): Promise<SceneDescription> {
  if (IS_DEMO) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getDemoScene();
  }

  try {
    const response = await fetch(
      `${SUPABASE_FUNCTION_URL}/functions/v1/describe-scene`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          prompt: SCENE_DESCRIBER_PROMPT,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as SceneDescription;
  } catch (error) {
    return {
      summary: 'すみません、周囲の説明に失敗しました。もう一度お試しください。',
      locationType: '不明',
      objects: [],
      peopleDensity: '不明',
      hazards: [],
      readableText: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
