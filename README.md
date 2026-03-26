<div align="center">

# 読み友 Yomitomo

**AI-powered assistant for understanding Japanese life documents**

日本の生活書類をAIが解説するアシスタント

[![Expo](https://img.shields.io/badge/Expo-55-000020?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![ML Kit](https://img.shields.io/badge/ML_Kit-OCR-4285F4?logo=google)](https://developers.google.com/ml-kit)
[![Gemini](https://img.shields.io/badge/Gemini_3-Flash-4285F4?logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[How It Works](#how-it-works) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Why](#why-yomitomo)

</div>

---

## Why Yomitomo?

**No free app helps visually impaired people and foreigners in Japan understand administrative documents.**

年金通知、住民税、健康保険、公共料金... Japanese life documents are complex even for native speakers. For visually impaired people and foreigners, they're nearly impossible.

| App | Free | JP Documents | Explains Content | Accessible |
|-----|------|-------------|-----------------|------------|
| **Yomitomo** | **Yes** | **Yes** | **Yes (AI)** | **VoiceOver-first** |
| Seeing AI | Yes | OCR only | No | Yes |
| Apple Live Text | Yes | OCR only | No | Partial |
| Google Lens | Yes | OCR only | No | No |

## How It Works

```
1. Open app → camera ready
2. Take photo of document
3. < 0.5s → ML Kit OCR reads text (on-device)
4. ~2s → Gemini AI explains: type, amount, deadline, action needed
5. Offline? → keyword matching for 5 common document types
```

### Two-Layer Architecture

- **Layer 1 (instant, offline)**: ML Kit OCR → text extraction → TTS. On-device, < 0.5s
- **Layer 2 (AI explanation)**: Gemini 3 Flash API → structured explanation (document type, key info, action needed)
- **Fallback (offline)**: Keyword matching templates for 年金・住民税・健康保険・公共料金・マイナンバー

## Quick Start

```bash
git clone https://github.com/Jada-Q/yomitomo.git
cd yomitomo
npm install

# Set up Gemini API key (free tier)
cp .env.example .env
# Get key at https://aistudio.google.com/apikey

# Web preview (demo mode)
npm run web

# iOS (requires EAS Build for native modules)
eas build --profile development --platform ios
```

## Architecture

```
yomitomo/
├── app/
│   ├── index.tsx          # Camera (main screen)
│   ├── result.tsx         # Two-stage result (OCR + AI explanation)
│   ├── history.tsx        # Local reading history
│   └── settings.tsx       # Speech rate
├── components/a11y/       # Accessibility primitives
├── lib/
│   ├── ocr/mlkitOcr.ts   # ML Kit OCR (JP/CN/EN)
│   ├── gemini.ts          # Gemini 3 Flash API — document explanation
│   ├── offline-templates.ts # Offline keyword matching (5 document types)
│   ├── speech/tts.ts      # VoiceOver-aware TTS
│   └── storage/localHistory.ts
├── stores/                # Zustand state
└── web/                   # Landing page
```

### Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Framework | Expo SDK 55 + React Native | Free |
| OCR | ML Kit (rn-mlkit-ocr) | Free, on-device |
| AI Explanation | Gemini 3 Flash API | Free tier |
| Offline Fallback | Keyword matching templates | Free |
| Speech | expo-speech + VoiceOver | Free |
| State | Zustand | Free |
| Storage | AsyncStorage (local) | Free |
| Build | EAS Build → TestFlight | Free tier |

## Accessibility

Built **VoiceOver-first** — every feature works without looking at the screen.

| Principle | Implementation |
|-----------|---------------|
| Touch targets | 48pt minimum (exceeds Apple's 44pt) |
| Contrast | WCAG AAA 7:1+ (black #000 + gold #FFD700) |
| Focus management | Auto-focus title on screen transition |
| Dual TTS | VoiceOver ON → system handles; OFF → expo-speech |
| Offline fallback | Core features work without network |

## Target Users

- **視覚障害者** (visually impaired people in Japan) — 310,000 people, 83% struggle with information access
- **在日外国人** (foreigners living in Japan) — 3.4M people who receive Japanese administrative documents

## License

MIT

---

<div align="center">

Free. Accessible. Helpful.

無料・アクセシブル・あなたの味方。

</div>
