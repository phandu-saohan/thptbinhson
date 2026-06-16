-- Cập nhật bảng registrations thêm trường Lớp C và Lớp B
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS class_c text,
ADD COLUMN IF NOT EXISTS class_b text;

-- Cập nhật bảng transactions thêm trường Lớp C và Lớp B
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS class_c text,
ADD COLUMN IF NOT EXISTS class_b text;
