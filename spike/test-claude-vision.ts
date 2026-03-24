/**
 * Spike 1: Test Claude Vision Japanese Document Reading
 *
 * Usage: npx tsx spike/test-claude-vision.ts <image-path>
 *
 * Requires: ANTHROPIC_API_KEY env var
 *
 * Tests Claude's ability to:
 * 1. Read Japanese text from photos
 * 2. Understand document context
 * 3. Return structured JSON
 */

import * as fs from "fs";
import * as path from "path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("❌ Set ANTHROPIC_API_KEY environment variable first");
  console.error("   export ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("Usage: npx tsx spike/test-claude-vision.ts <image-path>");
  console.error("Example: npx tsx spike/test-claude-vision.ts ~/Desktop/test-document.jpg");
  process.exit(1);
}

const fullPath = path.resolve(imagePath);
if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`);
  process.exit(1);
}

const imageBuffer = fs.readFileSync(fullPath);
const base64Image = imageBuffer.toString("base64");
const ext = path.extname(fullPath).toLowerCase();
const mediaType =
  ext === ".png" ? "image/png" :
  ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
  ext === ".webp" ? "image/webp" :
  "image/jpeg";

console.log(`📷 Image: ${fullPath} (${(imageBuffer.length / 1024).toFixed(0)}KB)`);
console.log(`🔄 Sending to Claude Vision...`);
console.log();

async function main() {
const startTime = Date.now();

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
この写真に写っている書類・画面を読み取り、以下のJSON形式で回答してください：
{
  "summary": "自然な日本語での要約（読み上げに適した形）",
  "documentType": "書類・画面の種類",
  "sender": "差出人・発行元（わかれば）",
  "keyInfo": ["重要な情報1", "重要な情報2"],
  "actionNeeded": "必要なアクション（なければnull）",
  "fullText": "読み取れたテキスト全文"
}
JSONのみを返してください。`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: "この画像を読み取り、指定されたJSON形式で回答してください。",
          },
        ],
      },
    ],
  }),
});

const elapsed = Date.now() - startTime;

if (!response.ok) {
  const errorText = await response.text();
  console.error(`❌ API Error: ${response.status}`);
  console.error(errorText);
  process.exit(1);
}

const data = await response.json();
const textContent = data.content?.find((c: { type: string }) => c.type === "text");

if (!textContent) {
  console.error("❌ No text in response");
  process.exit(1);
}

console.log(`⏱ Response time: ${(elapsed / 1000).toFixed(1)}s`);
console.log(`📊 Tokens - Input: ${data.usage?.input_tokens}, Output: ${data.usage?.output_tokens}`);
console.log();

try {
  const result = JSON.parse(textContent.text);
  console.log("✅ Structured JSON response:");
  console.log();
  console.log(`📄 種類: ${result.documentType}`);
  console.log(`📬 差出人: ${result.sender}`);
  console.log();
  console.log(`📝 要約:`);
  console.log(`   ${result.summary}`);
  console.log();
  if (result.keyInfo?.length > 0) {
    console.log(`🔑 重要情報:`);
    result.keyInfo.forEach((info: string, i: number) => {
      console.log(`   ${i + 1}. ${info}`);
    });
    console.log();
  }
  if (result.actionNeeded) {
    console.log(`⚠️ アクション: ${result.actionNeeded}`);
    console.log();
  }
  console.log("--- Raw JSON ---");
  console.log(JSON.stringify(result, null, 2));
} catch {
  console.log("⚠️ Response is not valid JSON, raw text:");
  console.log(textContent.text);
}
}

main().catch(console.error);
