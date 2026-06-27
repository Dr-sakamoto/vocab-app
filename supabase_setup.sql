-- =====================================================
-- Supabase セットアップSQL
-- Supabase Dashboard > SQL Editor で実行してください
-- =====================================================

-- 単語ごとの正解/不正解統計
create table if not exists word_stats (
  user_id   uuid not null,
  word_id   text not null,
  correct   int  not null default 0,
  wrong     int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

-- メタデータ（プールサイズ、モンスターXP）
create table if not exists user_meta (
  user_id            uuid primary key,
  unlocked_pool_size int  not null default 60,
  monster_total_xp   int  not null default 0,
  active_monster_id  text,
  monster_collection jsonb,
  professor_transfers jsonb not null default '{}'::jsonb,
  updated_at         timestamptz not null default now()
);

alter table user_meta add column if not exists active_monster_id text;
alter table user_meta add column if not exists monster_collection jsonb;
alter table user_meta add column if not exists professor_transfers jsonb not null default '{}'::jsonb;

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
