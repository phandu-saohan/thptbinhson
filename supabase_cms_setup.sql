-- ============================================================
-- CMS SETUP FOR BÌNH SƠN 2003-2006
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "site_settings_read_public" ON public.site_settings;
CREATE POLICY "site_settings_read_public" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_all_auth" ON public.site_settings;
CREATE POLICY "site_settings_all_auth" ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');

-- 4. Storage Bucket Setup
-- NOTE: You may need to create the 'site-assets' bucket manually in the Supabase Dashboard -> Storage
-- and set its access to PUBLIC.
-- Alternatively, if your permissions allow, the following might work:
/*
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'authenticated');
*/

-- 5. Seed Initial Content (Optional - defaults will be used in code if empty)
INSERT INTO public.site_settings (key, value) VALUES
('site_title', 'Tìm Lại Thanh Xuân'),
('site_subtitle', '(2003 – 2006)'),
('site_tagline', '"Trở Về - Kết Nối"'),
('hero_badge', 'Thư Ngỏ Hội Khóa 2003–2006'),
('event_date', '12/7'),
('event_location', 'Trường THPT Bình Sơn'),
('letter_opening', 'Gửi những người bạn đã đi cùng nhau một đoạn thanh xuân,'),
('bank_name', 'Ngân hàng Techcombank'),
('bank_account', '1902 3345 8880 12'),
('bank_holder', 'LE QUOC HUY'),
('bank_id_qr', 'TCB'),
('bank_no_qr', '19023345888012'),
('donation_amount', '1000000'),
('hero_video', 'https://assets.mixkit.co/videos/preview/mixkit-sun-shining-through-the-leaves-of-a-tree-in-the-8238-large.mp4'),
('photo1', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop'),
('photo2', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop'),
('event_schedule', '[{"time":"9:00 - 11:00 (11/7)","title":"Gặp gỡ tiền sự kiện","desc":"Nhận áo đồng phục, tham quan và cùng nhau trang trí lại lớp học năm xưa – nơi lưu giữ những ký ức thanh xuân.","location":"Trường THPT Bình Sơn","icon":"checkroom"},{"time":"07:30 - 08:00 (12/7)","title":"Đón tiếp – “Ký ức vui vẻ”","desc":"Chào đón quý thầy cô và cựu học sinh, giao lưu thân mật, thưởng thức cà phê sáng tại sân trường.","location":"Sân trường","icon":"coffee"},{"time":"08:00 - 08:20","title":"Văn nghệ khai màn","desc":"Các tiết mục văn nghệ chào mừng đầy sôi động.","location":"Sân khấu chính","icon":"music_note"},{"time":"08:20 - 08:40","title":"Khai mạc chương trình","desc":"Tuyên bố lý do, giới thiệu đại biểu.","location":"Sân khấu chính","icon":"campaign"},{"time":"08:40 - 08:50","title":"Tri ân thầy cô","desc":"Đại diện học sinh phát biểu cảm nghĩ và tri ân các thầy cô giáo.","location":"Sân khấu chính","icon":"person"},{"time":"08:50 - 09:00","title":"Hành trình ký ức","desc":"Trình chiếu video kỷ niệm – những hình ảnh xưa và nay đầy xúc động.","location":"Sân khấu chính","icon":"movie"},{"time":"09:00 - 09:15","title":"Lễ tri ân","desc":"Tặng hoa và giao lưu chia sẻ cùng quý thầy cô giáo.","location":"Sân khấu chính","icon":"volunteer_activism"},{"time":"09:15 - 09:25","title":"Quỹ khuyến học","desc":"Trao Quỹ khuyến học cho nhà trường để hỗ trợ các thế hệ mai sau.","location":"Sân khấu chính","icon":"school"},{"time":"09:25 - 09:40","title":"Vinh danh nhà tài trợ","desc":"Tặng hoa, kỷ niệm chương cho các Nhà tài trợ đồng hành.","location":"Sân khấu chính","icon":"military_tech"},{"time":"09:40 - 09:50","title":"Gắn kết tập thể","desc":"Vinh danh lớp có số lượng tham dự đông nhất.","location":"Sân khấu chính","icon":"groups"},{"time":"09:50 - 10:00","title":"Kết nối truyền thống","desc":"Trao cờ luân lưu cho khóa tiếp theo tiếp nối truyền thống.","location":"Sân khấu chính","icon":"flag"},{"time":"10:00 - 10:10","title":"Phát biểu của Nhà trường","desc":"Đại diện Ban Giám hiệu Nhà trường phát biểu chúc mừng.","location":"Sân khấu chính","icon":"record_voice_over"},{"time":"10:10 - 10:50","title":"Trở về lớp cũ (khối 11)","desc":"Ngồi lại chỗ xưa, ôn lại những kỷ niệm thân thương tuổi học trò.","location":"Khu vực lớp học","icon":"meeting_room"},{"time":"10:50 - 11:30","title":"Trở về lớp cũ (khối 12)","desc":"Tiếp nối hành trình ký ức, gặp lại bạn bè năm ấy.","location":"Khu vực lớp học","icon":"school"},{"time":"11:30 - 14:00","title":"Tiệc thân mật & Văn nghệ","desc":"Giao lưu, chia sẻ, thưởng thức chương trình văn nghệ đầy cảm xúc.","location":"Nhà đa năng","icon":"restaurant"},{"time":"14:00","title":"Chụp ảnh lưu niệm – Bế mạc","desc":"Ghi lại khoảnh khắc hội ngộ và khép lại chương trình.","location":"Sân trường","icon":"photo_camera"}]'),
('planned_expenses', '[{"name":"Tiệc kỷ niệm & Buffet","amount":72000000,"note":"~120 người × 600k","icon":"restaurant"},{"name":"Chụp hình / Quay phim","amount":27000000,"note":"Ekip chuyên nghiệp","icon":"videocam"},{"name":"Sân khấu & Âm thanh ánh sáng","amount":36000000,"note":"Thuê trọn gói","icon":"music_note"},{"name":"Quà lưu niệm cho thành viên","amount":18000000,"note":"120 phần × 150k","icon":"card_giftcard"},{"name":"Quỹ dự phòng","amount":27000000,"note":"Chi phí phát sinh","icon":"savings"}]')
ON CONFLICT (key) DO NOTHING;
