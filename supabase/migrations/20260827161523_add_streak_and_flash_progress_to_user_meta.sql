-- 端末ローカルに取り残されていた2つの進捗をクラウド同期の対象に加える。
--
-- daily_streak   … { current, longest, lastPlayedDate } （lib/streak.ts）
-- flash_progress … { index, seen, lap, mistakeOnly }    （lib/flashWeight.ts）
--
-- どちらも「未設定」と「空」を区別したいので null 許容にする（既存の
-- approved_answers / rejected_answers は空オブジェクトが自然なので '{}' 既定）。
alter table user_meta add column if not exists daily_streak   jsonb;
alter table user_meta add column if not exists flash_progress jsonb;
