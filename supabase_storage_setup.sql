-- ============================================================
-- STORAGE SETUP - BUCKET "site-assets" cho CMS Dashboard
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- ============================================================

-- BƯỚC 1: Tạo bucket site-assets (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];


-- BƯỚC 2: Xóa policy cũ nếu có (tránh conflict)
DROP POLICY IF EXISTS "Public read site-assets"         ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete site-assets" ON storage.objects;


-- BƯỚC 3: Tạo RLS policies cho bucket

-- 3a. Ai cũng có thể XEM ảnh (public read)
CREATE POLICY "Public read site-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

-- 3b. Chỉ người đã đăng nhập mới được UPLOAD ảnh
CREATE POLICY "Authenticated upload site-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-assets'
    AND auth.role() = 'authenticated'
  );

-- 3c. Chỉ người đã đăng nhập mới được CẬP NHẬT ảnh
CREATE POLICY "Authenticated update site-assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site-assets'
    AND auth.role() = 'authenticated'
  );

-- 3d. Chỉ người đã đăng nhập mới được XÓA ảnh
CREATE POLICY "Authenticated delete site-assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site-assets'
    AND auth.role() = 'authenticated'
  );


-- BƯỚC 4: Tạo bảng site_settings nếu chưa có
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        text        PRIMARY KEY,
  value      text        NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_read_public" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_all_auth"    ON public.site_settings;

-- Ai cũng đọc được (landing page cần đọc để hiển thị)
CREATE POLICY "site_settings_read_public"
  ON public.site_settings FOR SELECT
  USING (true);

-- Chỉ admin đã đăng nhập mới được ghi
CREATE POLICY "site_settings_all_auth"
  ON public.site_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- BƯỚC 5: Thêm dữ liệu mặc định cho site_settings (nếu chưa có)
INSERT INTO public.site_settings (key, value) VALUES
  ('site_title',       'Tìm Lại Thanh Xuân'),
  ('site_subtitle',    '(2003 – 2006)'),
  ('site_tagline',     '"Trở Về - Kết Nối"'),
  ('hero_badge',       'Thư Ngỏ Hội Khóa 2003–2006'),
  ('event_date',       '12/7'),
  ('event_location',   'Trường THPT Bình Sơn'),
  ('letter_opening',   'Gửi những người bạn đã đi cùng nhau một đoạn thanh xuân,'),
  ('bank_name',        'Ngân hàng Techcombank'),
  ('bank_account',     '1902 3345 8880 12'),
  ('bank_holder',      'LE QUOC HUY'),
  ('bank_id_qr',       'TCB'),
  ('bank_no_qr',       '19023345888012'),
  ('donation_amount',  '1000000'),
  ('hero_video',       ''),
  ('hero_image',       'https://lh3.googleusercontent.com/aida-public/AB6AXuDZoPSErlIW76V6LcqZOGcZpJBCnf6FZigCs3HEaMg2weA6-2IxA7FmMkWn8GKmrDp8x4eKykLkKi6pMMYAKte8jiSzDdEyMDQ3_L7ps_23KZSfnM4HRugAjjZ0GQJds-5oliYGXvrrUscfJnw1SQSYNjQmdnduHl9CuC1WYcQILIDNANUuoW2ApyVasYm_Huqdb93Q9mawRd4jS4Bz8ZBFgViVGlsvqlCJ6qXLpF8CyhowDZmAHPaNfRGpU_Dfsd3jG-fxFUfCEOUyo'),
  ('photo1',           'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop'),
  ('photo2',           'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop'),
  ('photo3',           'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- XONG! Kiểm tra lại:
-- SELECT * FROM storage.buckets WHERE id = 'site-assets';
-- SELECT * FROM public.site_settings ORDER BY key;
-- ============================================================
