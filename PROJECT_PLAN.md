# Yomitomo（読み友）

AI-powered information assistant for visually impaired people in Japan.

## Problem

- 83% of Japan's 310,000 visually impaired people struggle with information access
- Only 10% can read Braille
- Japan invented tactile paving (1967) but has no digital map of it
- Existing apps lack Japanese context understanding

## Solution

**Smart Document Reader**: Take a photo of any document → AI reads and explains it in natural Japanese
**Scene Describer**: Point camera at surroundings → AI describes the environment with safety priority
**Tactile Paving Map**: Crowdsourced digital map of 点字ブロック in Japanese cities

## Tech Stack

- Expo SDK 55 + React Native (TypeScript)
- Claude API (Sonnet with Vision) for document understanding
- Supabase (Auth, DB, Edge Functions)
- VoiceOver-first accessibility design

## Key Design Principles

- Always dark mode, high contrast (WCAG AAA 7:1+)
- 48pt minimum touch targets
- Voice-first interaction
- Japanese language throughout
- 91% of target users use iPhone → iOS priority

## Status

Phase 0-1: Project setup + tech spikes
