-- ============================================================
-- FIX: Cho phép cập nhật cột amount trong registrations (public)
-- và insert giao dịch AI_VERIFYING từ trang chủ (không cần login)
-- Chạy trong Supabase SQL Editor
-- ============================================================


-- BƯỚC 1: Cho phép PUBLIC update cột amount trong registrations
-- (Khách upload biên lai không đăng nhập vẫn cập nhật được)
DROP POLICY IF EXISTS "registrations_update_amount_public" ON public.registrations;

CREATE POLICY "registrations_update_amount_public"
  ON public.registrations FOR UPDATE
  USING (true)          -- cho phép tìm record
  WITH CHECK (true);    -- cho phép ghi


-- BƯỚC 2: Cho phép PUBLIC insert vào transactions
-- (Chỉ các record AI_VERIFYING từ trang chủ)
DROP POLICY IF EXISTS "transactions_insert_public" ON public.transactions;

CREATE POLICY "transactions_insert_public"
  ON public.transactions FOR INSERT
  WITH CHECK (
    status = 'AI_VERIFYING'  -- chỉ cho phép trạng thái chờ xác minh
  );


-- BƯỚC 3: Cho phép PUBLIC select transactions (để trang chủ xem thống kê)
DROP POLICY IF EXISTS "transactions_select_public" ON public.transactions;

CREATE POLICY "transactions_select_public"
  ON public.transactions FOR SELECT
  USING (true);


-- XONG! Bây giờ:
-- ✅ Khách upload biên lai → AI đọc số tiền → tự UPDATE vào registrations.amount
-- ✅ Giao dịch AI_VERIFYING được INSERT vào transactions từ trang chủ
-- ✅ BTC vào Dashboard xác nhận và chuyển status → SUCCESS
