# Yomitomo（読み友）Project Rules

## Gemini API

- Free tier: 1日20リクエスト（gemini-3-flash-preview）
- テスト時は無駄にAPIを叩くな。モックデータでテストしてからAPIテストは最後に1回だけ
- モックモード: `.env` で `EXPO_PUBLIC_USE_MOCK=true` にすると API を叩かずにサンプルレスポンスを返す
- Claude Code がテストするときは必ずモックモードを使え
- 429 エラー時はオフラインテンプレート (`lib/offline-templates.ts`) にフォールバック

## テスト手順

1. `.env` に `EXPO_PUBLIC_USE_MOCK=true` を追加
2. `npx tsc --noEmit` でビルドエラー確認
3. `npx expo start --web` で Web 版をテスト
4. モックで全機能が動くことを確認してから、`EXPO_PUBLIC_USE_MOCK=false` にして API テスト（1回だけ）

## TTS (Text-to-Speech)

- Web: `window.speechSynthesis` を直接使用（expo-speech は web 非対応）
- Native: `expo-speech` を使用
- `cancel()` 後に 100ms delay を入れてから `speak()` を呼ぶ（Chrome バグ対策）
- `onerror` の `interrupted` / `canceled` は正常動作なので無視
