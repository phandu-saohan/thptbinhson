-- Thêm cấu hình Hình ảnh Meta SEO mặc định vào bảng site_settings (nếu chưa có)
INSERT INTO public.site_settings (key, value)
VALUES ('seo_image', '/logo.jpg')
ON CONFLICT (key) DO NOTHING;
