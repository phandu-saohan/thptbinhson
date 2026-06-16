-- ============================================================
-- SQL SCRIPT: KHỞI TẠO CỘT & GIEO DỮ LIỆU TÀI TRỢ DÙNG THỬ (SUPABASE)
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- ============================================================

-- BƯỚC 1: Đảm bảo bảng registrations có đầy đủ các cột Lớp C và Lớp B
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS class_c text,
ADD COLUMN IF NOT EXISTS class_b text;

-- BƯỚC 2: Thêm dữ liệu tài trợ dùng thử (Mock/Seed Data) vào bảng registrations
-- Hướng dẫn: Chỉ cần copy toàn bộ đoạn dưới đây và chạy trong SQL Editor
INSERT INTO public.registrations (name, phone, will_attend, memory, amount, class_c, class_b, created_at)
VALUES
  -- 💎 Nhà tài trợ Kim Cương (>= 5.000.000đ)
  ('Nguyễn Minh Triết', '0912345678', 'yes', 'Tri ân mái trường Bình Sơn thân yêu, nơi chắp cánh ước mơ bay xa. Chúc ngày hội khóa của chúng ta thành công rực rỡ!', 10000000, 'C3', 'B1', NOW() - INTERVAL '1 day'),
  ('Phạm Hoàng Nam', '0987654321', 'yes', '20 năm trôi qua như một cái chớp mắt, rất mong chờ ngày được gặp lại thầy cô và toàn thể các bạn niên khóa 2003 - 2006!', 5000000, 'C7', 'B5', NOW() - INTERVAL '2 days'),

  -- 🏆 Nhà tài trợ Vàng (>= 2.000.000đ)
  ('Trần Thị Thu Hương', '0905123456', 'yes', 'Thầy cô như người lái đò thầm lặng. Xin gửi chút tấm lòng tri ân sâu sắc nhất tới thầy cô trường Bình Sơn.', 3000000, 'C12', 'B3', NOW() - INTERVAL '3 days'),
  ('Lê Anh Tuấn', '0934567890', 'yes', 'Nhớ những buổi trưa trốn học đi đá bóng, nhớ tiếng cười giòn giã của lớp mình. Hẹn gặp lại các bạn thân yêu!', 2000000, 'C1', 'B2', NOW() - INTERVAL '4 days'),
  ('Vũ Đức Thắng', '0945678901', 'yes', 'Tự hào là học sinh khóa 2003-2006. Đóng góp một phần nhỏ để cùng BTC chuẩn bị ngày hội thật ấm cúng.', 2500000, 'C5', 'B8', NOW() - INTERVAL '5 days'),

  -- 🥈 Nhà tài trợ Bạc (>= 1.000.000đ)
  ('Đặng Thị Mai', '0967890123', 'yes', 'Mong rằng các thế hệ học sinh Bình Sơn sẽ luôn gắn bó và yêu thương nhau như ngày đầu.', 1500000, 'C2', 'B4', NOW() - INTERVAL '6 days'),
  ('Bùi Thế Anh', '0978901234', 'yes', 'Chúc chuyến tàu thanh xuân của chúng ta lăn bánh thật êm ái và chở đầy ắp tiếng cười hạnh phúc.', 1200000, 'C10', 'B6', NOW() - INTERVAL '7 days'),
  ('Ngô Quốc Khánh', '0989012345', 'yes', 'Kỷ niệm thời học sinh là kho báu vô giá nhất cuộc đời. Hẹn gặp lại mọi người nhé!', 1000000, 'C3', 'B12', NOW() - INTERVAL '8 days'),

  -- 🤝 Tấm lòng vàng (Đồng hành) (< 1.000.000đ)
  ('Lê Thị Tuyết Mai', '0911223344', 'yes', 'Gửi trọn tình yêu thương và lời chúc tốt đẹp nhất đến tập thể khóa 2003-2006.', 500000, 'C9', 'B10', NOW() - INTERVAL '9 days'),
  ('Nguyễn Văn Hùng', '0922334455', 'yes', 'Thời gian có thể xóa nhòa nhiều thứ nhưng tình bạn tuổi học trò thì vẫn mãi sáng mãi.', 500000, 'C4', 'B15', NOW() - INTERVAL '10 days'),
  ('Hoàng Lan Anh', '0933445566', 'yes', 'Chúc thầy cô luôn mạnh khỏe và mãi là người chèo lái dẫn đường cho các thế hệ học sinh.', 300000, 'C11', 'B7', NOW() - INTERVAL '11 days'),
  ('Đỗ Quang Minh', '0944556677', 'yes', 'Rất tự hào khi được là một mảnh ghép của mái trường Bình Sơn.', 300000, 'C8', 'B14', NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- BƯỚC 3: Đồng bộ sang bảng transactions (quản lý thu chi chung của BTC)
-- Để bảng vinh danh và thống kê tài chính luôn đồng bộ khớp số liệu!
INSERT INTO public.transactions (date, name, phone, amount, type, status, note, created_at, class_c, class_b)
VALUES
  ('1 ngày trước', 'Nguyễn Minh Triết', '0912345678', 10000000, 'IN', 'SUCCESS', 'Nguyễn Minh Triết - C3 - Tai tro khoa', NOW() - INTERVAL '1 day', 'C3', 'B1'),
  ('2 ngày trước', 'Phạm Hoàng Nam', '0987654321', 5000000, 'IN', 'SUCCESS', 'Pham Hoang Nam - C7 - Tai tro khoa', NOW() - INTERVAL '2 days', 'C7', 'B5'),
  ('3 ngày trước', 'Trần Thị Thu Hương', '0905123456', 3000000, 'IN', 'SUCCESS', 'Tran Thi Thu Hương - C12 - Tai tro khoa', NOW() - INTERVAL '3 days', 'C12', 'B3'),
  ('4 ngày trước', 'Lê Anh Tuấn', '0934567890', 2000000, 'IN', 'SUCCESS', 'Le Anh Tuấn - C1 - Tai tro khoa', NOW() - INTERVAL '4 days', 'C1', 'B2'),
  ('5 ngày trước', 'Vũ Đức Thắng', '0945678901', 2500000, 'IN', 'SUCCESS', 'Vu Duc Thang - C5 - Tai tro khoa', NOW() - INTERVAL '5 days', 'C5', 'B8'),
  ('6 ngày trước', 'Đặng Thị Mai', '0967890123', 1500000, 'IN', 'SUCCESS', 'Dang Thi Mai - C2 - Tai tro khoa', NOW() - INTERVAL '6 days', 'C2', 'B4'),
  ('7 ngày trước', 'Bùi Thế Anh', '0978901234', 1200000, 'IN', 'SUCCESS', 'Bui The Anh - C10 - Tai tro khoa', NOW() - INTERVAL '7 days', 'C10', 'B6'),
  ('8 ngày trước', 'Ngô Quốc Khánh', '0989012345', 1000000, 'IN', 'SUCCESS', 'Ngo Quoc Khanh - C3 - Tai tro khoa', NOW() - INTERVAL '8 days', 'C3', 'B12'),
  ('9 ngày trước', 'Lê Thị Tuyết Mai', '0911223344', 500000, 'IN', 'SUCCESS', 'Le Thi Tuyết Mai - C9 - Tai tro khoa', NOW() - INTERVAL '9 days', 'C9', 'B10'),
  ('10 ngày trước', 'Nguyễn Văn Hùng', '0922334455', 500000, 'IN', 'SUCCESS', 'Nguyen Van Hung - C4 - Tai tro khoa', NOW() - INTERVAL '10 days', 'C4', 'B15'),
  ('11 ngày trước', 'Hoàng Lan Anh', '0933445566', 300000, 'IN', 'SUCCESS', 'Hoang Lan Anh - C11 - Tai tro khoa', NOW() - INTERVAL '11 days', 'C11', 'B7'),
  ('12 ngày trước', 'Đỗ Quang Minh', '0944556677', 300000, 'IN', 'SUCCESS', 'Do Quang Minh - C8 - Tai tro khoa', NOW() - INTERVAL '12 days', 'C8', 'B14')
ON CONFLICT DO NOTHING;

-- XONG!
-- ✅ Đã cập nhật cấu trúc cột trong registrations.
-- ✅ Đã nạp dữ liệu tài trợ phong phú cho các phân cấp Kim Cương, Vàng, Bạc, Đồng hành.
-- ✅ Đã đồng bộ sang sổ thu chi transactions để BTC dễ quản lý.
