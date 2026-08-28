-- 分散学習（間隔反復）の状態を word_stats に持たせる。
--
-- last_answered はクライアントが実際に解答した時刻。updated_at ではなく
-- 専用の列を足すのは、updated_at がトリガによる「行の書き込み時刻」で、
-- 一括同期のたびに上書きされてしまい最終復習日として使えないため。
--
-- correct_streak は直近で連続正解した回数（誤答で0に戻る）。次にその語を
-- 出すまでの間隔の段を指す（lib/reviewSchedule.ts の REVIEW_INTERVAL_DAYS）。
--
-- 既存行は last_answered = null / correct_streak = 0 になる。クライアントは
-- 時刻を持たない語を「常に出題対象」として扱うので、この列を足しただけでは
-- 既存ユーザーの出題は変わらない。解答するたびに時刻が入っていく。
alter table word_stats add column if not exists last_answered  timestamptz;
alter table word_stats add column if not exists correct_streak int not null default 0;
