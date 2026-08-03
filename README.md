# Vocab App

英単語の日本語訳を**記述式**で答える暗記アプリ。完全一致で拾えない表記ゆれは
AI（Gemini）が判定するため、選択式より「思い出す」負荷を保ったまま学習できる。

- 出題 → 日本語訳をタイピングで入力 → 判定 → 次の問題、の単一ループ
- 10問ごとに画面遷移せずリザルトへ中身だけ入れ替わり、続けて次のセットへ
- 正答率に応じて出題プールが段階的に解放される
- 進捗は localStorage 保存。メール+パスワードでログインすると Supabase へクラウド同期

詳しい方針は [`CLAUDE.md`](./CLAUDE.md)、収益化計画は
[`MONETIZATION.md`](./MONETIZATION.md) を参照。

## 開発

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # tests/ を実行
npm run lint
npm run build
```

### 環境変数

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開鍵 |
| `GEMINI_API_KEY` | AI判定（`/api/ai-review`）。**サーバー側のみ** |

DBスキーマは [`supabase_setup.sql`](./supabase_setup.sql) を Supabase の
SQL Editor で実行して作成する。
