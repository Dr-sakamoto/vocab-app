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
  updated_at         timestamptz not null default now()
);

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
