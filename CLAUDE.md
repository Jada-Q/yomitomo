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

## デバッグプロトコル

バグ修正時は以下の手順を必ず守れ。推測で直すな。

### 1. ログで断線箇所を特定
- データの流れに沿って console.log を入れる（ボタン → ハンドラ → 関数 → API/TTS）
- ログが出ない箇所 = 断線箇所。そこを重点的に調べる
- try-catch で例外を捕捉して、サイレント失敗を防ぐ

### 2. バンドル検証
- Metro のバンドル出力を curl で取得して、コードが正しくコンパイルされているか確認
- `curl -s "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true" | grep "検索キーワード"`
- tree-shaking で関数が消えていないか確認（過去に speakWeb が消えた事例あり）
- 関数はインライン化して書け。別関数に分けると Metro が tree-shake する可能性がある

### 3. 修正→テスト→確認のループ
- 1つ修正したら必ず `npx tsc --noEmit` で型チェック
- サーバー再起動は `--clear` でキャッシュクリア
- バンドル内容を grep で確認してから、ブラウザでの動作確認
- 同じアプローチで 3 回失敗したら別の方法に切り替えろ

### 4. よくあるハマりポイント
- **モジュールレベルコード**: import 時に実行されるコードが web で例外を投げるとモジュール全体が死ぬ
- **expo-speech**: web 非対応。`window.speechSynthesis` を直接使え
- **Chrome cancel バグ**: `speechSynthesis.cancel()` 直後の `speak()` は無視される → 100ms delay
- **Metro tree-shaking**: エクスポートされない関数は消える可能性がある → インライン化
- **Expo 環境変数**: `EXPO_PUBLIC_` prefix 必須。`.env` は Metro 起動時に読まれる。変更後はサーバー再起動
