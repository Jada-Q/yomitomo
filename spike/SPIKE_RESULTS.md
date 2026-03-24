# Spike Results — Yomitomo Tech Validation

## Spike 1: Claude Vision Japanese Document Reading

**Status**: GO (with caveats)

### Findings
- Claude Sonnet Vision can read Japanese text from screenshots with high accuracy
- Returns structured JSON when prompted correctly
- Understands document context (type, sender, key info, required actions)
- Mixed CJK content (Chinese + Japanese) handled well
- Response time: ~2-5 seconds for typical document photos

### Caveats
- Need real-world test with physical document photos (angled, poor lighting)
- Handwritten Japanese needs dedicated testing
- API Key needed: user must set up ANTHROPIC_API_KEY for Supabase Edge Functions

### Test Script
Run: `ANTHROPIC_API_KEY=sk-... npx tsx spike/test-claude-vision.ts <image-path>`

---

## Spike 2: VoiceOver in React Native

**Status**: READY FOR DEVICE TESTING

### What We Built
- `A11yButton` — enforces accessibilityLabel, 48x48 min touch, haptic feedback
- `A11yScreen` — auto-focuses title on mount, announces screen name
- `A11yText` — auto-announces dynamic content changes
- All 3 tab screens use these components with Japanese labels/hints

### What Needs Real Device Testing
- VoiceOver focus order across tab navigation
- accessibilityHint reading behavior
- Custom announcements timing
- Gesture navigation (swipe between elements)

### Known RN VoiceOver Issues to Watch
- Dynamic content updates may not auto-announce on all iOS versions
- Tab bar focus management may need workarounds
- Modal presentation focus trapping

---

## Spike 3: OpenStreetMap Tactile Paving Data

**Status**: GO — validates crowdsourcing feature

### Data Density (March 2026)

| Region | Nodes | Ways | Total |
|--------|-------|------|-------|
| Japan | 27,016 | 18,152 | **45,239** |
| Germany (comparison) | 158,457 | 57,292 | 217,626 |
| Global | 2,174,328 | 418,127 | 2,596,373 |

### Analysis
- Japan has only **1.7%** of global tactile paving data despite being the inventor
- Germany has **4.8x more** tagged data than Japan
- This gap is massive considering Japan's physical tactile paving density is among the highest in the world
- **Conclusion**: The data gap validates our crowdsourcing feature as the primary differentiator

### Overpass API Notes
- Primary server frequently times out under load
- Mirror (kumi.systems) available as fallback
- bbox queries more reliable than area queries for large regions
- Japan Taginfo (geofabrik) provides reliable count stats

### Data Source Strategy
1. OpenStreetMap (existing data) — fetch via Overpass API
2. Crowdsourced reports (new data) — store in Supabase
3. Future: Government barrier-free maps (バリアフリーマップ)

---

## Overall Go/No-Go Decision

| Feature | Decision | Confidence |
|---------|----------|------------|
| Document Reader (Claude Vision) | **GO** | High — API works, prompt tested |
| Scene Describer | **GO** | High — same pipeline as document reader |
| Tactile Paving Map | **GO** | High — OSM data sparse = crowdsourcing needed |
| VoiceOver Accessibility | **GO (conditional)** | Medium — needs real device validation |

**Next Step**: Phase 2 — MVP Document Reader pipeline end-to-end
