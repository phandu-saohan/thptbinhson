import type {Metadata} from 'next';
import './globals.css';
import { supabase } from '@/lib/supabaseClient';

export async function generateMetadata(): Promise<Metadata> {
  let seoImage = '/logo.jpg';
  try {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'seo_image').maybeSingle();
    if (data?.value) {
      seoImage = data.value;
    }
  } catch (err) {
    console.error("Lỗi khi tải ảnh SEO", err);
  }

  return {
    title: 'Chuyến Tàu Thanh Xuân – 20 Năm Ngày Trở Về | Hội Khóa Bình Sơn 2003–2006',
    description: 'Hội khóa kỷ niệm 20 năm ngày ra trường của thế hệ học sinh THPT Bình Sơn – Quảng Ngãi khóa 2003–2006. Đăng ký tham dự ngày gặp mặt và đóng góp quỹ hội tại đây.',
    keywords: ['Hội khóa Bình Sơn', 'THPT Bình Sơn Quảng Ngãi', 'Chuyến tàu thanh xuân', '20 năm ngày trở về', 'Khóa 2003 2006', 'hội ngộ', 'họp lớp'],
    authors: [{ name: 'Ban Tổ Chức Hội Khóa 2003–2006' }],
    robots: { index: true, follow: true },
    openGraph: {
      title: 'Chuyến Tàu Thanh Xuân – 20 Năm Ngày Trở Về',
      description: 'Hội khóa kỷ niệm 20 năm THPT Bình Sơn – Quảng Ngãi | Khóa 2003–2006. Đăng ký tham dự ngay!',
      type: 'website',
      locale: 'vi_VN',
      siteName: 'Hội Khóa Bình Sơn 2003–2006',
      images: [{ url: seoImage, width: 1200, height: 630, alt: 'Chuyến Tàu Thanh Xuân – Hội Khóa Bình Sơn 2003–2006' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Chuyến Tàu Thanh Xuân – 20 Năm Ngày Trở Về',
      description: 'Hội khóa kỷ niệm 20 năm THPT Bình Sơn – Quảng Ngãi | Khóa 2003–2006',
      images: [seoImage],
    },
  };
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/logo.jpg" type="image/jpeg" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Be+Vietnam+Pro:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
