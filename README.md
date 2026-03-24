<div align="center">

# 読み友 Yomitomo

**AI-powered information assistant for visually impaired people in Japan**

視覚障害者のためのAI情報アシスタント

[![Expo](https://img.shields.io/badge/Expo-55-000020?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://typescriptlang.org)
[![Claude API](https://img.shields.io/badge/Claude-Vision_API-D97706)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[Features](#features) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Research](#research) · [Contributing](#contributing)

</div>

---

## Why Yomitomo?

**83% of Japan's 310,000 visually impaired people struggle with information access** — not navigation. Most people assume Braille solves reading, but only **10% can read Braille**.

Japan invented tactile paving (点字ブロック) in 1967, yet has **no digital map** of it. Germany has 4.8x more tactile paving data on OpenStreetMap than Japan.

Yomitomo addresses both problems: AI-powered document reading + Japan's first tactile paving digital map.

## Features

### 📄 Smart Document Reader
Take a photo of any document — bills, medicine labels, menus, mail — and AI reads it with **context**, not just raw OCR.

> "東京電力の請求書です。3月分の電気料金は4,320円、支払い期限は3月30日です。"

### 👁 Scene Describer
Point your camera at surroundings. AI describes the environment with **safety information first** — obstacles, crowds, readable signs.

### 🗺 Tactile Paving Map (盲道マップ)
Crowdsourced digital map of tactile paving in Japanese cities. Search nearby, report new locations, help build the first comprehensive database.

## Quick Start

```bash
# Clone
git clone https://github.com/Jada-Q/yomitomo.git
cd yomitomo

# Install
npm install

# Run (demo mode — no API keys needed)
npm start
```

Scan the QR code with **Expo Go** on your iPhone. The app runs in demo mode with realistic Japanese mock data.

### Connect Real Backend

```bash
# Copy env template
cp .env.example .env

# Edit with your keys
# EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
# EXPO_PUBLIC_MODE=production
```

## Architecture

```
yomitomo/
├── app/                  # 15 routes (Expo Router)
│   ├── (tabs)/           # 3 tabs: Read / See / Map
│   ├── read/             # Document camera + result + history
│   ├── see/              # Scene camera + result
│   ├── onboarding.tsx    # First-launch walkthrough
│   └── settings.tsx      # Speech rate, app info
├── components/a11y/      # Accessibility primitives
├── lib/ai/               # Claude Vision pipeline + prompts
├── lib/speech/           # TTS with VoiceOver awareness
├── lib/map/              # OpenStreetMap tactile paving
├── stores/               # Zustand state management
├── supabase/functions/   # Edge Functions (Claude API proxy)
└── web/                  # Landing page
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 55 + React Native |
| Language | TypeScript |
| AI | Claude API (Sonnet, Vision) |
| Backend | Supabase (Auth, DB, Edge Functions) |
| Maps | OpenStreetMap + Overpass API |
| Speech | expo-speech (TTS) |
| State | Zustand |
| Build | EAS Build → TestFlight |

### AI Pipeline

```
Camera → base64 → Supabase Edge Function → Claude Vision → Structured JSON → TTS
```

All AI calls go through server-side Edge Functions (API keys never on device).

## Accessibility Design

Built **VoiceOver-first** — every feature works without looking at the screen.

| Principle | Implementation |
|-----------|---------------|
| Touch targets | 48pt minimum (exceeds Apple's 44pt) |
| Contrast | WCAG AAA 7:1+ (black + gold) |
| Focus management | Auto-focus title on screen transition |
| Dual TTS | VoiceOver ON → system handles; OFF → expo-speech |
| Voice navigation | Japanese voice commands |

## Research

This project is backed by real user research data:

| Source | Finding |
|--------|---------|
| [JVIF ICT Survey 2022](http://nichimou.org/) | 83% information access difficulty |
| [JBICT.Net AT Survey 2023](https://jbict.net/) | 91% iPhone, 90% VoiceOver usage |
| [OpenStreetMap Taginfo](https://taginfo.geofabrik.de/) | Japan: 45,239 vs Germany: 217,626 tactile paving records |
| [MHLW Guide Helper Survey](https://www.mhlw.go.jp/) | 40% rarely leave home |

## Project Structure

```
45 files · 15 routes · 0 TypeScript errors
Demo mode available (no API keys required)
```

## Contributing

This project welcomes contributions, especially from:
- Visually impaired users (feedback on UX)
- OpenStreetMap contributors (tactile paving mapping)
- Japanese accessibility advocates
- React Native / Expo developers

## License

MIT

---

<div align="center">

Built with accessibility in mind.

視覚障害者の情報アクセスを、テクノロジーの力で変える。

</div>
