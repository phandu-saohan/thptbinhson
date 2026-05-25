-- =========================================================================
-- SQL SCRIPT: ĐỒNG BỘ/CẬP NHẬT NHÀ TÀI TRỢ (SPONSORS) TỪ BẢNG ĐĂNG KÝ (REGISTRATIONS)
-- ĐỐI VỚI CÁC ĐĂNG KÝ CÓ SỐ TIỀN > 1.000.000 VNĐ (Phần vượt quá 1 triệu là tiền tài trợ)
-- Chạy script này trong Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- =========================================================================

-- BƯỚC 1: Cập nhật thông tin và số tiền của các nhà tài trợ đã tồn tại trong bảng 'sponsors'
-- (So khớp dựa trên số điện thoại 'phone' và tính số tiền tài trợ = amount - 1.000.000)
UPDATE public.sponsors s
SET 
  name = r.name,
  class_c = COALESCE(NULLIF(r.class_c, ''), s.class_c),
  class_b = COALESCE(NULLIF(r.class_b, ''), s.class_b),
  amount = r.amount - 1000000,
  receipt_url = COALESCE(r.receipt_url, s.receipt_url),
  source = 'registration'
FROM public.registrations r
WHERE s.phone = r.phone 
  AND r.amount > 1000000;

-- BƯỚC 2: Thêm mới các nhà tài trợ từ bảng 'registrations' sang bảng 'sponsors'
-- nếu số điện thoại đó chưa tồn tại trong bảng 'sponsors'
INSERT INTO public.sponsors (name, phone, class_c, class_b, amount, receipt_url, source, created_at)
SELECT 
  r.name,
  r.phone,
  r.class_c,
  r.class_b,
  (r.amount - 1000000) AS amount,
  r.receipt_url,
  'registration' AS source,
  r.created_at
FROM public.registrations r
WHERE r.amount > 1000000
  AND NOT EXISTS (
    SELECT 1 
    FROM public.sponsors s 
    WHERE s.phone = r.phone
  );

-- BƯỚC 3: Hiển thị kết quả kiểm tra sau khi đồng bộ
SELECT 
  name, 
  phone, 
  class_c, 
  class_b, 
  amount AS sponsor_amount, 
  source, 
  created_at 
FROM public.sponsors
ORDER BY amount DESC;
