-- Migration: Thêm cột shirt_size vào bảng registrations
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS shirt_size text;

COMMENT ON COLUMN public.registrations.shirt_size IS 'Size áo đăng ký (ví dụ: Nam XL, Nữ M)';
