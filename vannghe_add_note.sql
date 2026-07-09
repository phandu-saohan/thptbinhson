-- Thêm cột "note" (lời nhắn) vào bảng vannghe_songs
-- Chạy trong Supabase SQL Editor

ALTER TABLE public.vannghe_songs
  ADD COLUMN IF NOT EXISTS note text;
