-- AIが不正解と判定した回答（単語IDごとの配列）。
-- 同じ誤答を再び入力したとき、クライアントがAPI/AIを呼ばずに即座に
-- 不正解へ倒すためのキャッシュ。approved_answers と対になる構造。
--
-- この列を使うコード（lib/sync.ts）を先にデプロイし、本番DBへの適用を
-- 忘れていた期間、同期は毎回 `column user_meta.rejected_answers does not
-- exist` で落ちていた。マイグレーションをリポジトリで管理するのは
-- 同じ取りこぼしを繰り返さないため。
alter table user_meta add column if not exists rejected_answers jsonb not null default '{}'::jsonb;
