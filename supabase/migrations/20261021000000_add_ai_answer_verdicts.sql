-- AI判定（/api/check のフォールバック）の結果を、語×回答ごとに集計する。
--
-- AIが正解と認めた回答は、これまで判定した端末の localStorage
-- （vocab-approved-answers）にしか残らず、正解データ（lib/vocab/）は
-- 直らなかった。よく認められる回答を集めて人が確認し、正解データへ
-- 反映するための材料にする。
--
-- 誰の回答かは持たない（user_id 無し）。書き込みはサーバー
-- （SUPABASE_SERVICE_ROLE_KEY を持つ /api/check）だけが行い、
-- RLS を有効にしたうえでポリシーを置かないので anon / authenticated からは
-- 読み書きできない。
create table if not exists ai_answer_verdicts (
  word_id    text        not null,
  answer     text        not null,
  approved   boolean     not null,
  hits       integer     not null default 1,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  primary key (word_id, answer, approved)
);

alter table ai_answer_verdicts enable row level security;

-- 同じ語×回答×判定が来たら回数を足す。supabase-js の upsert では加算できない
-- ので関数にする。実行できるのは service_role だけ。
create or replace function record_ai_answer_verdict(
  p_word_id  text,
  p_answer   text,
  p_approved boolean
) returns void
language sql
security invoker
set search_path = public
as $$
  insert into ai_answer_verdicts (word_id, answer, approved)
  values (p_word_id, p_answer, p_approved)
  on conflict (word_id, answer, approved)
  do update set hits = ai_answer_verdicts.hits + 1, last_seen = now();
$$;

revoke execute on function record_ai_answer_verdict(text, text, boolean)
  from public, anon, authenticated;
grant execute on function record_ai_answer_verdict(text, text, boolean)
  to service_role;
