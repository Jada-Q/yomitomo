// Supabase Edge Function: read-document
// Receives a base64 image, sends to Claude Vision API, returns structured document reading

import "jsr:@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Call Claude Vision API
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
        system: `あなたは視覚障害者のための読み上げアシスタントです。
回答は以下のJSON形式で返してください：
{
  "summary": "自然な日本語での要約（読み上げに適した形）",
  "documentType": "書類の種類",
  "sender": "差出人・発行元",
  "keyInfo": ["重要な情報1", "重要な情報2"],
  "actionNeeded": "必要なアクション（なければnull）",
  "fullText": "全文テキスト"
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
                  "この書類を読み取り、指定されたJSON形式で回答してください。",
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

    // Parse the JSON response from Claude
    let result;
    try {
      result = JSON.parse(textContent.text);
    } catch {
      // If Claude didn't return valid JSON, wrap it
      result = {
        summary: textContent.text,
        documentType: "不明",
        sender: "",
        keyInfo: [],
        actionNeeded: null,
        fullText: textContent.text,
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
        summary: "すみません、読み取りに失敗しました。もう一度お試しください。",
        documentType: "エラー",
        sender: "",
        keyInfo: [],
        actionNeeded: null,
        fullText: "",
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
