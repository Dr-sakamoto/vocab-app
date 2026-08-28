# Vocab App

英単語の日本語訳を**記述式**で答える暗記アプリ。完全一致で拾えない表記ゆれは
AI（Gemini）が判定するため、選択式より「思い出す」負荷を保ったまま学習できる。

- 出題 → 日本語訳をタイピングで入力 → 判定 → 次の問題、の単一ループ
- 判定は `/api/check` の1往復で確定する（完全一致 → 形態素解析＋同義語 → AI判定）
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
| `GEMINI_API_KEY` | AI判定（`/api/check` のフォールバック）。**サーバー側のみ**。未設定でも形態素解析による判定だけで動作する |

### DBスキーマ

スキーマの唯一の情報源は [`supabase/migrations/`](./supabase/migrations)。
SQL Editor に手で貼るのではなく、必ずマイグレーションを足して適用する。

```bash
npx supabase@latest login
npx supabase@latest link --project-ref <プロジェクトref>

npx supabase@latest migration new add_something   # 新しい .sql を作る
npx supabase@latest migration list                # ローカルと本番の差分を見る
npx supabase@latest db push                       # 未適用分を本番へ適用
```

**列を足すコードをマージしたら、同じタイミングで `db push` すること。**
コードだけ先に出るとクライアントが存在しない列を要求し、同期が失敗する
（実際に8/20〜8/27、`rejected_answers` の適用漏れで同期が止まった）。
