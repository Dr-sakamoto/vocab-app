-- 進捗欄（ドーナツ＋毎日の伸び率）用の日次スナップショット。
--
-- word_stats は累積の正解/不正解数しか持たず、日付ごとの履歴が無い。
-- 「その日時点で定着している語数」を日付キーごとに1つだけ記録する
-- 軽量な jsonb マップを daily_streak と同じ user_meta に追加する。
alter table user_meta
  add column if not exists daily_progress jsonb not null default '{}'::jsonb;
