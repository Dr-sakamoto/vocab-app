-- =====================================================
-- Supabase セットアップSQL
-- Supabase Dashboard > SQL Editor で実行してください
-- =====================================================

-- 単語ごとの正解/不正解統計
--
-- word_id は `target:品詞` 形式の安定ID（例: 'severe:adjective'）。
-- 以前は配列添字直結の `w0` / `w1` … を保存していたため、語彙データの
-- 途中に1語でも挿入・削除・並べ替えをすると以降の統計が別の単語へ
-- ずれていた。text 列のままで足りるので構造の変更は不要。
--
-- 移行前に書き込まれた `w<添字>` の行はそのまま残っていてよい。
-- クライアントが凍結スナップショット（lib/vocab/legacyWordIds.ts）で
-- 安定IDへ解決し、大きい方の値を採るかたちでマージする。
create table if not exists word_stats (
  user_id   uuid not null,
  word_id   text not null,
  correct   int  not null default 0,
  wrong     int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

-- メタデータ（解放済み単語プールのサイズ）
create table if not exists user_meta (
  user_id            uuid primary key,
  unlocked_pool_size int  not null default 60,
  updated_at         timestamptz not null default now()
);

alter table user_meta add column if not exists approved_answers jsonb not null default '{}'::jsonb;

-- AIが不正解と判定した回答（単語IDごとの配列）。
-- 同じ誤答を再び入力したとき、クライアントがAPI/AIを呼ばずに即座に
-- 不正解へ倒すためのキャッシュ。approved_answers と対になる構造。
alter table user_meta add column if not exists rejected_answers jsonb not null default '{}'::jsonb;

-- 旧・モンスター収集機能の列（monster_total_xp / active_monster_id /
-- monster_collection / professor_transfers）はアプリから読み書きしなくなった。
-- 既存環境のデータを壊さないため drop はせず、そのまま放置する。
-- 新規環境ではこのファイルの通り、これらの列は作成されない。

-- updated_at 自動更新トリガー
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists word_stats_updated_at on word_stats;
create trigger word_stats_updated_at
  before update on word_stats
  for each row execute procedure set_updated_at();

drop trigger if exists user_meta_updated_at on user_meta;
create trigger user_meta_updated_at
  before update on user_meta
  for each row execute procedure set_updated_at();

-- ─── Row Level Security ────────────────────────────────────
alter table word_stats enable row level security;
alter table user_meta  enable row level security;

-- 自分のデータのみ読み書き可
create policy "own word_stats" on word_stats
  for all using (auth.uid() = user_id);

create policy "own user_meta" on user_meta
  for all using (auth.uid() = user_id);

-- =====================================================
-- 課金エンタイトルメント（無料 / プレミアム）
-- -----------------------------------------------------
-- このテーブルが「課金特典の真実の源」。書き込みは決済
-- プロバイダの Webhook からサーバー（service_role 鍵）でのみ
-- 行う。ユーザーは自分の行を「読む」ことしかできない。
-- これによりクライアント改ざんでプレミアムを詐称できない。
-- =====================================================
create table if not exists entitlements (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  plan               text not null default 'free',     -- free / premium
  status             text not null default 'inactive', -- active / canceled / expired / inactive
  provider           text,                              -- stripe / apple / google
  provider_ref       text,                              -- subscription id / transaction id
  current_period_end timestamptz,                       -- null = ライフタイム
  updated_at         timestamptz not null default now()
);

drop trigger if exists entitlements_updated_at on entitlements;
create trigger entitlements_updated_at
  before update on entitlements
  for each row execute procedure set_updated_at();

alter table entitlements enable row level security;

-- ユーザーは自分のエンタイトルメントを「読む」ことだけ可能。
-- INSERT/UPDATE/DELETE のポリシーは意図的に作らない。
-- → 書き込みは service_role（RLSバイパス）経由の Webhook のみ。
create policy "read own entitlement" on entitlements
  for select using (auth.uid() = user_id);
