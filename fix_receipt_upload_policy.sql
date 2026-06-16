-- ============================================================
-- FIX: Cho phép người dùng KHÔNG đăng nhập upload ảnh biên lai
-- vào thư mục receipts/ trong bucket site-assets
-- Chạy trong Supabase SQL Editor
-- ============================================================

-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Public upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public read receipts" ON storage.objects;

-- Cho phép BẤT KỲ AI cũng upload vào thư mục receipts/
CREATE POLICY "Public upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-assets'
    AND (storage.foldername(name))[1] = 'receipts'
  );

-- Cho phép BẤT KỲ AI cũng xem ảnh trong receipts/
CREATE POLICY "Public read receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'site-assets'
    AND (storage.foldername(name))[1] = 'receipts'
  );

-- ============================================================
-- Kiểm tra lại policies:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'objects';
-- ============================================================
