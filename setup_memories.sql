-- ============================================================
-- THÊM TÍNH NĂNG ẢNH KỶ NIỆM (Memories Gallery)
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- ============================================================

-- BƯỚC 1: TẠO BẢNG photo_memories
CREATE TABLE IF NOT EXISTS public.photo_memories (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_name text        NOT NULL DEFAULT 'Ẩn danh',
  image_url     text        NOT NULL,
  description   text,
  likes         integer     DEFAULT 0,
  hearts        integer     DEFAULT 0,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.photo_memories IS 'Lưu trữ ảnh kỷ niệm của cựu học sinh';

-- BƯỚC 2: BẬT RLS CHO BẢNG MỚI
ALTER TABLE public.photo_memories ENABLE ROW LEVEL SECURITY;

-- BƯỚC 3: TẠO POLICIES CHO photo_memories
-- Xóa policy cũ nếu có (tránh lỗi conflict khi chạy nhiều lần)
DROP POLICY IF EXISTS "Public select photo_memories" ON public.photo_memories;
DROP POLICY IF EXISTS "Public insert photo_memories" ON public.photo_memories;
DROP POLICY IF EXISTS "Public update photo_memories" ON public.photo_memories;

-- Ai cũng có thể xem ảnh
CREATE POLICY "Public select photo_memories"
  ON public.photo_memories FOR SELECT
  USING (true);

-- Ai cũng có thể upload ảnh
CREATE POLICY "Public insert photo_memories"
  ON public.photo_memories FOR INSERT
  WITH CHECK (true);

-- Ai cũng có thể update lượt like và thả tim
CREATE POLICY "Public update photo_memories"
  ON public.photo_memories FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- BƯỚC 4: THÊM POLICY CHO BUCKET site-assets ĐỂ CHUẨN BỊ LƯU ẢNH KỶ NIỆM
-- Cho phép mọi người upload ảnh vào thư mục memories/
DROP POLICY IF EXISTS "Public upload memories" ON storage.objects;
CREATE POLICY "Public upload memories"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-assets'
    AND (storage.foldername(name))[1] = 'memories'
  );

-- Cho phép mọi người xem ảnh trong thư mục memories/
DROP POLICY IF EXISTS "Public read memories" ON storage.objects;
CREATE POLICY "Public read memories"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'site-assets'
    AND (storage.foldername(name))[1] = 'memories'
  );

-- BƯỚC 5: BẬT REALTIME CHO BẢNG photo_memories ĐỂ CẬP NHẬT LIKE NGAY LẬP TỨC
ALTER PUBLICATION supabase_realtime ADD TABLE public.photo_memories;
