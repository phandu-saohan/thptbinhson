-- ============================================================
-- SQL MIGRATION: THÊM TRƯỜNG ĐÓNG GÓP THÊM VÀO BẢNG REGISTRATIONS
-- Chạy đoạn script này trong Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ============================================================

-- 1. Thêm cột số tiền đóng góp thêm (donation_amount)
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS donation_amount numeric DEFAULT 0;

-- 2. Thêm cột đường dẫn ảnh biên lai đóng góp thêm (donation_receipt_url)
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS donation_receipt_url text;

-- 3. Thêm chú thích cho các cột mới
COMMENT ON COLUMN public.registrations.donation_amount IS 'Số tiền đóng góp thêm/tài trợ quỹ hội (VNĐ) cộng dồn từ các lần tài trợ';
COMMENT ON COLUMN public.registrations.donation_receipt_url IS 'Đường dẫn ảnh biên lai chuyển khoản đóng góp thêm/tài trợ';
