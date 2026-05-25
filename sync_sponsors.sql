-- =========================================================================
-- SQL SCRIPT: ĐỒNG BỘ/CẬP NHẬT NHÀ TÀI TRỢ (SPONSORS) TỪ BẢNG ĐĂNG KÝ (REGISTRATIONS)
-- CHÍNH SÁCH TÀI TRỢ:
-- 1. Nếu VẮNG MẶT (will_attend = 'no'): Toàn bộ số tiền đóng góp được tính là tài trợ (100% r.amount).
-- 2. Nếu CÓ THAM DỰ (will_attend = 'yes'): Số tiền tài trợ = Số tiền đóng góp - 1.000.000 VNĐ (trừ chi phí tham dự).
-- Chỉ áp dụng cho các đăng ký có số tiền đóng góp > 0.
-- =========================================================================

-- BƯỚC 1: Cập nhật thông tin và số tiền của các nhà tài trợ đã tồn tại trong bảng 'sponsors'
-- (So khớp dựa trên số điện thoại 'phone')
UPDATE public.sponsors s
SET 
  name = r.name,
  class_c = COALESCE(NULLIF(r.class_c, ''), s.class_c),
  class_b = COALESCE(NULLIF(r.class_b, ''), s.class_b),
  amount = CASE 
             WHEN r.will_attend = 'no' THEN r.amount
             ELSE GREATEST(0, r.amount - 1000000)
           END,
  receipt_url = COALESCE(r.receipt_url, s.receipt_url),
  source = 'registration'
FROM public.registrations r
WHERE s.phone = r.phone 
  AND r.amount > 0;

-- BƯỚC 2: Thêm mới các nhà tài trợ từ bảng 'registrations' sang bảng 'sponsors'
-- nếu số điện thoại đó chưa tồn tại trong bảng 'sponsors'
INSERT INTO public.sponsors (name, phone, class_c, class_b, amount, receipt_url, source, created_at)
SELECT 
  r.name,
  r.phone,
  r.class_c,
  r.class_b,
  CASE 
    WHEN r.will_attend = 'no' THEN r.amount
    ELSE GREATEST(0, r.amount - 1000000)
  END AS amount,
  r.receipt_url,
  'registration' AS source,
  r.created_at
FROM public.registrations r
WHERE r.amount > 0
  -- Điều kiện để được đưa vào bảng vinh danh tài trợ:
  -- Hoặc là vắng mặt và có đóng đóng góp (>0 VNĐ)
  -- Hoặc là tham dự và đóng góp nhiều hơn lệ phí (>1.000.000 VNĐ)
  AND (
    (r.will_attend = 'no' AND r.amount > 0)
    OR (r.will_attend = 'yes' AND r.amount > 1000000)
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM public.sponsors s 
    WHERE s.phone = r.phone
  );

-- BƯỚC 3: Hiển thị kết quả kiểm tra sau khi đồng bộ
SELECT 
  s.name, 
  s.phone, 
  s.class_c, 
  s.class_b, 
  s.amount AS sponsor_amount, 
  r.will_attend,
  r.amount AS total_registered_amount,
  s.source, 
  s.created_at 
FROM public.sponsors s
LEFT JOIN public.registrations r ON s.phone = r.phone
ORDER BY s.amount DESC;
