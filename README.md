<div align="center">

# 読み友 Yomitomo

**Free, offline document reader for visually impaired people**

無料・オフライン・日中英対応の文書リーダー

[![Expo](https://img.shields.io/badge/Expo-55-000020?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://typescriptlang.org)
[![ML Kit](https://img.shields.io/badge/ML_Kit-OCR-4285F4?logo=google)](https://developers.google.com/ml-kit)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[How It Works](#how-it-works) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Why](#why-yomitomo)

</div>

---

## Why Yomitomo?

**No free iOS app supports Japanese + Chinese + English offline OCR for visually impaired users.**

| App | Free | Japanese | Chinese | Offline |
|-----|------|----------|---------|---------|
| **Yomitomo** | **Yes** | **Yes** | **Yes** | **Yes** |
| Seeing AI | Yes | Yes | No | Partial |
| Apple Live Text | Yes | No | Yes | Yes |
| Envision AI | $5/mo | Yes | Yes | Yes |
| Be My Eyes | Yes | Cloud | Cloud | No |

83% of Japan's 310,000 visually impaired people struggle with information access. 90% cannot read Braille. Yomitomo fills the gap.

## How It Works

```
1. Open app → camera ready
2. Take photo of document
3. < 0.5s → OCR reads text aloud (ML Kit, on-device)
4. ~5s → AI summarizes: type, amount, deadline (Qwen 2.5, on-device)
```

**Zero API calls. Zero servers. Zero cost.** Everything runs on your iPhone.

### Two-Layer Architecture

- **Layer 1 (instant)**: ML Kit OCR → text extraction → TTS. Works offline, < 0.5s
- **Layer 2 (optional)**: Qwen 2.5 1.5B local LLM → structured summary (document type, sender, key info, action needed)

## Quick Start

```bash
git clone https://github.com/Jada-Q/yomitomo.git
cd yomitomo
npm install

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
│   ├── result.tsx         # Two-stage result (OCR + AI summary)
│   ├── history.tsx        # Local reading history
│   └── settings.tsx       # Speech rate, model download
├── components/a11y/       # Accessibility primitives
├── lib/
│   ├── ocr/mlkitOcr.ts   # ML Kit OCR (JP/CN/EN)
│   ├── llm/               # Local LLM (llama.rn + Qwen 2.5)
│   └── speech/tts.ts      # VoiceOver-aware TTS
├── stores/                # Zustand state
└── web/                   # Landing page
```

### Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Framework | Expo SDK 55 + React Native | Free |
| OCR | ML Kit (rn-mlkit-ocr) | Free, on-device |
| AI Summary | Qwen 2.5 1.5B via llama.rn | Free, on-device |
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
| Offline-first | All features work without network |

## Research

| Source | Finding |
|--------|---------|
| [JVIF ICT Survey 2022](http://nichimou.org/) | 83% information access difficulty |
| [JBICT.Net AT Survey 2023](https://jbict.net/) | 91% iPhone, 90% VoiceOver usage |
| [MHLW Guide Helper Survey](https://www.mhlw.go.jp/) | 40% rarely leave home |

## License

MIT

---

<div align="center">

Free. Offline. Accessible.

無料・オフライン・アクセシブル。

</div>
