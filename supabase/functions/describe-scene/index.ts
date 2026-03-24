// Supabase Edge Function: describe-scene
// Receives a base64 image, sends to Claude Vision API, returns structured scene description

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { image, prompt } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `あなたは視覚障害者のための周囲説明アシスタントです。
安全に関する情報を最優先してください。
回答は以下のJSON形式で返してください：
{
  "summary": "周囲の状況を自然な日本語で説明（読み上げに適した形、安全情報を先に）",
  "locationType": "場所の種類",
  "objects": ["目の前にあるもの1", "もの2"],
  "peopleDensity": "人の混雑度（空いている/やや混雑/混雑）",
  "hazards": ["注意すべきこと1", "こと2"],
  "readableText": ["読める文字1", "文字2"]
}
JSONのみを返し、他のテキストは含めないでください。`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: image,
                },
              },
              {
                type: "text",
                text:
                  prompt ||
                  "この場面を説明し、指定されたJSON形式で回答してください。",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const claudeResponse = await response.json();
    const textContent = claudeResponse.content?.find(
      (c: { type: string }) => c.type === "text"
    );

    if (!textContent) {
      throw new Error("No text in Claude response");
    }

    let result;
    try {
      result = JSON.parse(textContent.text);
    } catch {
      result = {
        summary: textContent.text,
        locationType: "不明",
        objects: [],
        peopleDensity: "不明",
        hazards: [],
        readableText: [],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({
        error: message,
        summary:
          "すみません、周囲の説明に失敗しました。もう一度お試しください。",
        locationType: "エラー",
        objects: [],
        peopleDensity: "不明",
        hazards: [],
        readableText: [],
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
