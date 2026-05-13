-- Thêm cột receipt_url vào bảng registrations để lưu đường dẫn ảnh biên lai chuyển khoản
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS receipt_url text;

COMMENT ON COLUMN public.registrations.receipt_url IS 'Đường dẫn công khai của ảnh biên lai được tải lên Supabase Storage';
