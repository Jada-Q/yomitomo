# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npx tsc --noEmit          # Type check (run before every commit)
npx expo start --web      # Start web dev server (localhost:8081)
npx expo start            # Start native dev server (QR scan)
eas build --profile development --platform ios  # iOS dev build
```

No test framework is configured. Verify changes with `tsc` + manual web testing.

## Architecture

**Yomitomo (読み友)** — AI document reader for visually impaired people and foreigners in Japan. Scans administrative documents via camera OCR, then explains them in simple Japanese with AI.

### Two-Layer Processing Pipeline

```
Camera → ML Kit OCR (Layer 1, on-device, <0.5s)
           ↓
       Gemini API (Layer 2, async, ~2s)
           ↓ (fallback on 429/offline)
       Offline Templates (keyword matching, 5 document types)
           ↓
       Result Screen → TTS auto-read
```

The pipeline runs in `app/index.tsx handleCapture()`. Layer 2 completes BEFORE navigating to `/result` — this ordering is critical (previous bug: navigating first caused null summary on result screen).

### Key Modules

- **`lib/gemini.ts`** — Gemini API client. Returns `{ summary: DocumentSummary | null, rateLimited?: boolean }`. Mock mode via `EXPO_PUBLIC_USE_MOCK=true`. JSON parse includes markdown stripping + regex extraction fallback.
- **`lib/speech/tts.ts`** — Cross-platform TTS. Web uses `window.speechSynthesis` directly (expo-speech doesn't work on web). All web-specific code is inlined in `speak()` — do NOT extract into separate functions (Metro tree-shakes them).
- **`lib/offline-templates.ts`** — Keyword-matching fallback for 5 Japanese document types (年金/住民税/健康保険/公共料金/マイナンバー).
- **`lib/ocr/mlkitOcr.ts`** — ML Kit OCR wrapper with language detection. Returns mock text on web.
- **`stores/useDocumentStore.ts`** — Zustand store. `DocumentSummary` type is shared across gemini, offline-templates, and result UI.
- **`components/a11y/`** — Accessibility primitives (A11yButton, A11yText, A11yScreen). All UI must use these, not raw RN components.

### Accessibility Requirements

This app targets visually impaired users. Every UI element must have:
- `accessibilityLabel` + `accessibilityHint` on interactive elements
- 48pt minimum touch targets (use `A11Y.MIN_TOUCH_SIZE`)
- WCAG AAA 7:1+ contrast (gold `#FFD700` on black `#000000`)
- VoiceOver announcements for state changes (`AccessibilityInfo.announceForAccessibility`)

## Gemini API

- Free tier: ~20 requests/day (gemini-3-flash-preview)
- Claude Code がテストするときは必ず `EXPO_PUBLIC_USE_MOCK=true` を使え。API を叩くな
- モックモードでテスト完了後、API テストは最後に 1 回だけ
- 429 エラー時は自動で offline-templates にフォールバック + ユーザー通知

## Testing Protocol

1. `.env` に `EXPO_PUBLIC_USE_MOCK=true` を設定
2. `npx tsc --noEmit` — エラー 0 確認
3. `EXPO_PUBLIC_USE_MOCK=true npx expo start --web --clear` — キャッシュクリアで起動
4. バンドル検証: `curl -s "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.routerRoot=app" | grep "検索キーワード"`
5. モックで全機能動作確認後、`EXPO_PUBLIC_USE_MOCK=false` で API テスト（1 回のみ）

## Known Pitfalls

- **TTS on Web**: `expo-speech` は web 非対応。`window.speechSynthesis` を直接使う。`cancel()` 後 100ms delay 必須（Chrome バグ）。`onerror` の `interrupted`/`canceled` は正常動作なので無視。
- **Metro tree-shaking**: `speak()` 内の web/native コードは必ずインライン化。別関数に分けると Metro が消す（過去に `speakWeb()` が消えた実例あり）。
- **モジュールレベルコード**: import 時に実行されるコードが web で例外を投げるとモジュール全体が死ぬ。`AccessibilityInfo` のモジュールレベル呼び出しで `speak`/`stop` が undefined になった実例あり。
- **Navigation timing**: `router.push('/result')` は必ず `setSummary()` の後。先に遷移すると summary が null のまま表示される。
- **Expo 環境変数**: `EXPO_PUBLIC_` prefix 必須。`.env` 変更後はサーバー再起動が必要。

## Debugging

推測で直すな。ログで原因を特定してから修正。

1. データの流れに沿って `console.log` を入れる（ボタン → ハンドラ → 関数 → API/TTS）
2. ログが出ない箇所 = 断線箇所
3. バンドル出力を curl + grep で確認（コードが tree-shake されていないか）
4. 1 つ修正したら `npx tsc --noEmit` → サーバー再起動（`--clear`）→ バンドル grep → ブラウザ確認
5. 同じアプローチで 3 回失敗したら別の方法に切り替えろ
