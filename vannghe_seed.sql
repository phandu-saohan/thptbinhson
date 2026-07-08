-- ============================================================
-- SEED DATA: 10 bài hát mẫu cho Giao Lưu Văn Nghệ
-- Chạy trong Supabase SQL Editor
-- ============================================================

INSERT INTO public.vannghe_songs (singer_name, song_title, artist, class_name, status, heart_count, created_at) VALUES
  ('Nguyễn Hoàng Nam',   'Mong Ước Kỷ Niệm Xưa',        'Như Quỳnh',        'C5 - B12', 'waiting', 0, NOW() - INTERVAL '30 minutes'),
  ('Trần Thị Minh Châu', 'Hương Ngọc Lan',               'Vũ Khanh',         'C3 - B7',  'waiting', 0, NOW() - INTERVAL '28 minutes'),
  ('Lê Quốc Huy',        'Một Thời Đã Xa',               'Đan Trường',       'C8 - B15', 'waiting', 0, NOW() - INTERVAL '25 minutes'),
  ('Phạm Thanh Thủy',    'Còn Mãi Yêu Em',               'Lam Trường',       'C1 - B3',  'waiting', 0, NOW() - INTERVAL '22 minutes'),
  ('Huỳnh Minh Tuấn',    'Tình Thôi Xót Xa',             'Mỹ Tâm',           'C6 - B11', 'waiting', 0, NOW() - INTERVAL '18 minutes'),
  ('Võ Thị Kim Ngân',    'Câu Chuyện Đầu Năm',           'Ngọc Sơn',         'C2 - B5',  'waiting', 0, NOW() - INTERVAL '15 minutes'),
  ('Đặng Văn Khải',      'Nối Lại Tình Xưa',             'Tuấn Vũ',          'C9 - B2',  'waiting', 0, NOW() - INTERVAL '12 minutes'),
  ('Bùi Thị Lan Anh',    'Trái Tim Không Ngủ Yên',       'Mỹ Tâm',           'C4 - B9',  'done',    12, NOW() - INTERVAL '40 minutes'),
  ('Ngô Tấn Phát',       'Duyên Phận',                   'Như Quỳnh',        'C7 - B13', 'done',    8,  NOW() - INTERVAL '50 minutes'),
  ('Trương Thị Mai',     'Nhớ Nhau Hoài',                'Hương Lan',        'C10 - B1', 'done',    15, NOW() - INTERVAL '60 minutes');
