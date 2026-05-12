-- ============================================================
-- SUPABASE SCHEMA - HỘI KHÓA BÌNH SƠN 2003-2006
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- ============================================================

-- ============================================================
-- BƯỚC 1: XÓA BẢNG CŨ (nếu cần reset)
-- Bỏ comment phần này nếu muốn xóa và tạo lại từ đầu
-- ============================================================
/*
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.app_users CASCADE;

DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
*/

-- ============================================================
-- BƯỚC 2: TẠO CÁC ENUM TYPES
-- ============================================================

-- Loại giao dịch: Thu / Chi
CREATE TYPE transaction_type AS ENUM ('IN', 'OUT');

-- Trạng thái giao dịch
CREATE TYPE transaction_status AS ENUM ('SUCCESS', 'PENDING', 'AI_VERIFYING');

-- Trạng thái công việc
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- Mức độ ưu tiên công việc
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Vai trò người dùng trong hệ thống
CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBER', 'FINANCE');


-- ============================================================
-- BƯỚC 3: TẠO CÁC BẢNG
-- ============================================================

-- ----------------------------------------------------------
-- BẢNG 1: registrations - Đăng ký tham dự hội khóa
-- ----------------------------------------------------------
CREATE TABLE public.registrations (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,                        -- Họ và tên
  phone       text        NOT NULL,                        -- Số điện thoại
  will_attend text        NOT NULL DEFAULT 'yes',          -- Có tham dự không: 'yes' | 'no'
  memory      text,                                        -- Kỷ niệm chia sẻ (tùy chọn)
  amount      numeric     DEFAULT 0,                       -- Số tiền đóng góp (VNĐ), AI trích xuất từ biên lai
  created_at  timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.registrations IS 'Danh sách đăng ký tham dự hội khóa từ trang chủ';


-- ----------------------------------------------------------
-- BẢNG 2: transactions - Quản lý thu chi tài chính
-- ----------------------------------------------------------
CREATE TABLE public.transactions (
  id          uuid               DEFAULT gen_random_uuid() PRIMARY KEY,
  date        text               NOT NULL,                 -- Ngày/giờ hiển thị, VD: "14:22, 12/10"
  name        text               NOT NULL,                 -- Tên người nộp / tên khoản chi
  phone       text,                                        -- Số điện thoại (chỉ áp dụng thu)
  amount      numeric            NOT NULL,                 -- Số tiền (VNĐ), âm nếu chi
  type        transaction_type   NOT NULL,                 -- 'IN' = Thu, 'OUT' = Chi
  status      transaction_status NOT NULL DEFAULT 'SUCCESS',
  note        text,                                        -- Ghi chú / nội dung chuyển khoản
  created_at  timestamptz        DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.transactions IS 'Sổ thu chi tài chính hội khóa';


-- ----------------------------------------------------------
-- BẢNG 3: tasks - Quản lý công việc chuẩn bị sự kiện
-- ----------------------------------------------------------
CREATE TABLE public.tasks (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text          NOT NULL,                      -- Tên công việc
  assignee    text          NOT NULL,                      -- Người phụ trách
  due_date    text          NOT NULL,                      -- Hạn hoàn thành, VD: "15/10/2026"
  status      task_status   NOT NULL DEFAULT 'TODO',
  progress    integer       NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority    task_priority NOT NULL DEFAULT 'MEDIUM',
  created_at  timestamptz   DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.tasks IS 'Danh sách công việc chuẩn bị hội khóa';


-- ----------------------------------------------------------
-- BẢNG 4: app_users - Quản trị viên hệ thống dashboard
-- ----------------------------------------------------------
CREATE TABLE public.app_users (
  id          uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text      NOT NULL,                          -- Họ tên
  email       text      NOT NULL UNIQUE,                   -- Email (khớp với Supabase Auth)
  role        user_role NOT NULL DEFAULT 'MEMBER',
  permissions text[]    NOT NULL DEFAULT '{}',             -- Danh sách module được phép truy cập
  created_at  timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.app_users IS 'Danh sách quản trị viên và phân quyền dashboard';


-- ============================================================
-- BƯỚC 4: BẬT ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users      ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- BƯỚC 5: CẤU HÌNH RLS POLICIES
-- ============================================================

-- REGISTRATIONS:
-- Ai cũng có thể xem danh sách (BTC muốn xem ai đăng ký)
-- Ai cũng có thể đăng ký (trang chủ không cần đăng nhập)
CREATE POLICY "registrations_select_public"
  ON public.registrations FOR SELECT
  USING (true);

CREATE POLICY "registrations_insert_public"
  ON public.registrations FOR INSERT
  WITH CHECK (true);

-- Chỉ người đã đăng nhập mới được xóa/sửa (BTC)
CREATE POLICY "registrations_update_auth"
  ON public.registrations FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "registrations_delete_auth"
  ON public.registrations FOR DELETE
  USING (auth.role() = 'authenticated');


-- TRANSACTIONS:
-- Chỉ người đã đăng nhập (BTC) mới được xem và chỉnh sửa thu chi
CREATE POLICY "transactions_all_auth"
  ON public.transactions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- TASKS:
-- Chỉ người đã đăng nhập mới được quản lý công việc
CREATE POLICY "tasks_all_auth"
  ON public.tasks FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- APP_USERS:
-- Chỉ admin đã đăng nhập mới được xem và quản lý người dùng
CREATE POLICY "app_users_all_auth"
  ON public.app_users FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- BƯỚC 6: TẠO INDEX để tìm kiếm nhanh hơn
-- ============================================================

CREATE INDEX idx_registrations_created_at ON public.registrations (created_at DESC);
CREATE INDEX idx_transactions_type        ON public.transactions (type);
CREATE INDEX idx_transactions_status      ON public.transactions (status);
CREATE INDEX idx_transactions_created_at  ON public.transactions (created_at DESC);
CREATE INDEX idx_tasks_status             ON public.tasks (status);
CREATE INDEX idx_tasks_priority           ON public.tasks (priority);
CREATE INDEX idx_app_users_email          ON public.app_users (email);


-- ============================================================
-- BƯỚC 7: BẬT REALTIME (để dashboard tự cập nhật)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;


-- ============================================================
-- BƯỚC 8: DỮ LIỆU MẪU (Seed Data) - Tùy chọn
-- Bỏ comment phần này để chèn dữ liệu mẫu vào hệ thống
-- ============================================================

/*
-- Mẫu đăng ký tham dự
INSERT INTO public.registrations (name, phone, will_attend, memory) VALUES
  ('Nguyễn Văn An (12A1)',  '0912345678', 'yes', 'Nhớ nhất những buổi chào cờ đầu tuần và hát quốc ca cùng nhau.'),
  ('Trần Thị Bảo (12A2)',   '0987654321', 'yes', 'Kỷ niệm thi học sinh giỏi Văn năm lớp 11.'),
  ('Lê Hoàng Cường (12B1)', '0901234567', 'no',  'Rất tiếc năm nay bận công tác xa, chúc hội khóa thành công!');

-- Mẫu giao dịch thu chi
INSERT INTO public.transactions (date, name, phone, amount, type, status, note) VALUES
  ('14:22, 01/05', 'Nguyễn Hoàng Nam',    '091***4455', 1500000,   'IN',  'SUCCESS',     'Đóng góp quỹ hội'),
  ('13:05, 01/05', 'Phạm Thanh Thủy',     '098***1122', 1000000,   'IN',  'SUCCESS',     'Đóng góp quỹ hội'),
  ('10:45, 02/05', 'Đặt tiệc nhà hàng',   NULL,        -15000000,  'OUT', 'SUCCESS',     'Thanh toán đặt cọc đợt 1'),
  ('09:12, 03/05', 'Lê Thị Minh Khai',    '097***3322', 500000,    'IN',  'AI_VERIFYING','Chờ xác minh AI');

-- Mẫu công việc
INSERT INTO public.tasks (title, assignee, due_date, status, progress, priority) VALUES
  ('Đặt tiệc Buffet tại nhà hàng',     'Lê Quốc Huy',       '15/06/2026', 'DONE',        100, 'HIGH'),
  ('Thiết kế backdrop & Standee',       'Nguyễn Hoàng Nam',   '20/06/2026', 'IN_PROGRESS', 75,  'MEDIUM'),
  ('Tìm mua quà tặng kỷ niệm',         'Phạm Thanh Thủy',    '25/06/2026', 'TODO',        0,   'LOW'),
  ('Liên hệ và mời khách VIP',          'Trần Quốc Bảo',      '10/06/2026', 'TODO',        0,   'HIGH'),
  ('Thuê xe đưa đón thầy cô',           'Huỳnh Minh Tuấn',    '01/07/2026', 'TODO',        0,   'MEDIUM'),
  ('Chuẩn bị chương trình văn nghệ',    'Ban Văn Nghệ',        '05/07/2026', 'IN_PROGRESS', 40,  'HIGH');

-- Mẫu người dùng quản trị
-- LƯU Ý: Email phải trùng với tài khoản đã tạo trong Supabase Authentication
INSERT INTO public.app_users (name, email, role, permissions) VALUES
  ('Lê Quốc Huy',     'admin@binhson.edu.vn',   'ADMIN',   ARRAY['overview','transactions','tasks','reports','settings','users','appearance']),
  ('Phan Du',         'phandu8899@gmail.com',    'ADMIN',   ARRAY['overview','transactions','tasks','reports','settings','users','appearance']),
  ('Nguyễn Văn A',    'nguyenvana@gmail.com',    'FINANCE', ARRAY['overview','transactions','reports']),
  ('Trần Thị B',      'tranthib@gmail.com',      'MEMBER',  ARRAY['overview','tasks']);
*/


-- ============================================================
-- XONG! Kiểm tra các bảng đã tạo:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- ============================================================


-- ============================================================
-- MIGRATION: Thêm cột amount vào bảng registrations (nếu đã tạo bảng rồi)
-- Chạy lệnh này trong Supabase SQL Editor nếu bảng đã tồn tại:
-- ============================================================
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0;

COMMENT ON COLUMN public.registrations.amount IS 'Số tiền đóng góp quỹ hội (VNĐ), được AI trích xuất từ ảnh biên lai chuyển khoản';
