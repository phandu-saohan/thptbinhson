-- ============================================================
-- MIGRATION: Bảng Giao Lưu Văn Nghệ (idempotent - chạy nhiều lần không lỗi)
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- Bảng đăng ký bài hát biểu diễn
CREATE TABLE IF NOT EXISTS public.vannghe_songs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  singer_name  text        NOT NULL,          -- Tên người biểu diễn
  song_title   text        NOT NULL,          -- Tên bài hát
  artist       text        NOT NULL DEFAULT '',-- Tên ca sĩ gốc
  class_name   text        NOT NULL DEFAULT '',-- Lớp
  avatar_url   text,                           -- URL ảnh selfie
  status       text        NOT NULL DEFAULT 'waiting', -- 'waiting' | 'done'
  heart_count  integer     NOT NULL DEFAULT 0, -- Tổng trái tim
  created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Bảng lượt tim (mỗi device chỉ được tim 1 lần mỗi bài)
CREATE TABLE IF NOT EXISTS public.vannghe_hearts (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id   uuid        NOT NULL REFERENCES public.vannghe_songs(id) ON DELETE CASCADE,
  device_id text        NOT NULL,             -- UUID tạo từ localStorage
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(song_id, device_id)
);

-- Bật RLS
ALTER TABLE public.vannghe_songs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vannghe_hearts ENABLE ROW LEVEL SECURITY;

-- Xóa policies cũ nếu đã tồn tại (tránh lỗi duplicate)
DROP POLICY IF EXISTS "vannghe_songs_select_public" ON public.vannghe_songs;
DROP POLICY IF EXISTS "vannghe_songs_insert_public" ON public.vannghe_songs;
DROP POLICY IF EXISTS "vannghe_songs_update_auth"   ON public.vannghe_songs;
DROP POLICY IF EXISTS "vannghe_songs_delete_auth"   ON public.vannghe_songs;
DROP POLICY IF EXISTS "vannghe_hearts_select_public" ON public.vannghe_hearts;
DROP POLICY IF EXISTS "vannghe_hearts_insert_public" ON public.vannghe_hearts;

-- Tạo lại policies
CREATE POLICY "vannghe_songs_select_public"
  ON public.vannghe_songs FOR SELECT USING (true);

CREATE POLICY "vannghe_songs_insert_public"
  ON public.vannghe_songs FOR INSERT WITH CHECK (true);

CREATE POLICY "vannghe_songs_update_auth"
  ON public.vannghe_songs FOR UPDATE USING (true);

CREATE POLICY "vannghe_songs_delete_auth"
  ON public.vannghe_songs FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "vannghe_hearts_select_public"
  ON public.vannghe_hearts FOR SELECT USING (true);

CREATE POLICY "vannghe_hearts_insert_public"
  ON public.vannghe_hearts FOR INSERT WITH CHECK (true);

-- Realtime (bỏ qua nếu đã thêm rồi)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vannghe_songs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vannghe_hearts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_vannghe_songs_status     ON public.vannghe_songs (status);
CREATE INDEX IF NOT EXISTS idx_vannghe_songs_created_at ON public.vannghe_songs (created_at);
CREATE INDEX IF NOT EXISTS idx_vannghe_hearts_song_id   ON public.vannghe_hearts (song_id);
