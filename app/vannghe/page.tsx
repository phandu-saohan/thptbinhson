'use client';
import VanNgheBlock from '@/components/VanNgheBlock';
import VanNgheQR from '@/components/VanNgheQR';
import Link from 'next/link';

export default function VanNghePage() {
  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-950 via-purple-900 to-pink-900 overflow-y-auto pb-20">
      {/* Mini nav bar */}
      <div className="sticky top-0 z-50 bg-purple-900/80 backdrop-blur-xl border-b border-purple-700/50 px-4 py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎤</span>
          <div>
            <h1 className="text-white font-black text-base leading-tight">Giao Lưu Văn Nghệ</h1>
            <p className="text-purple-300 text-[11px]">THPT Bình Sơn — Hội khóa 2003–2006</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VanNgheQR />
          <Link
            href="/"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Trang chủ
          </Link>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <VanNgheBlock />
      </div>
    </div>
  );
}
