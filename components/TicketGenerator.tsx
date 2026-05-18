'use client';

import { useRef, useEffect, useState } from 'react';

export default function TicketGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const [ticketData, setTicketData] = useState({
    fullName: 'Ung Thanh Khiết',
    toa: 'B1 - C10',
    ghe: '26',
    hangVe: 'EXPRESS',
  });

  // Đảm bảo Google Fonts đã được tải xong
  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });
  }, []);

  // Vẽ vé lên canvas
  useEffect(() => {
    if (!fontsLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImage = new Image();
    baseImage.crossOrigin = 'anonymous';
    baseImage.src = '/images/ticket-blank.jpg';

    baseImage.onload = () => {
      canvas.width = baseImage.naturalWidth;
      canvas.height = baseImage.naturalHeight;

      // 1. Vẽ phôi nền
      ctx.drawImage(baseImage, 0, 0);

      // 2. Tên hành khách – Open Sans Bold
      ctx.font = `bold 64px "Open Sans", "Arial", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(ticketData.fullName.toUpperCase(), canvas.width / 2, 165);

      // 3-5. Thông tin vé – Anton
      ctx.font = `45px "Anton", "Impact", sans-serif`;
      ctx.fillStyle = '#0F52BA';
      ctx.textAlign = 'center';

      ctx.fillText(ticketData.toa, 445, 515);
      ctx.fillText(ticketData.ghe, 608, 515);
      ctx.fillText(ticketData.hangVe.toUpperCase(), 768, 515);
    };

    baseImage.onerror = () => {
      // Vẽ canvas placeholder nếu chưa có ảnh phôi
      canvas.width = 960;
      canvas.height = 640;

      // Nền gradient
      const grad = ctx.createLinearGradient(0, 0, 960, 0);
      grad.addColorStop(0, '#003380');
      grad.addColorStop(0.5, '#0F52BA');
      grad.addColorStop(1, '#003380');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 960, 640);

      // Dải trắng trên
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 960, 210);

      // Dải xanh đậm giữa
      ctx.fillStyle = '#001d4a';
      ctx.fillRect(0, 210, 960, 40);

      // Dải thông tin
      ctx.fillStyle = '#e8f0ff';
      ctx.fillRect(0, 250, 960, 300);

      // Header text trên nền trắng
      ctx.font = `bold 64px "Open Sans", "Arial", sans-serif`;
      ctx.fillStyle = '#003380';
      ctx.textAlign = 'center';
      ctx.fillText('CHUYẾN TÀU THANH XUÂN', canvas.width / 2, 110);

      ctx.font = `bold 64px "Open Sans", "Arial", sans-serif`;
      ctx.fillStyle = '#0F52BA';
      ctx.fillText(ticketData.fullName.toUpperCase(), canvas.width / 2, 185);

      // Các thông tin vé
      ctx.font = `45px "Anton", "Impact", sans-serif`;
      ctx.fillStyle = '#0F52BA';
      ctx.fillText(ticketData.toa, 445, 415);
      ctx.fillText(ticketData.ghe, 608, 415);
      ctx.fillText(ticketData.hangVe.toUpperCase(), 768, 415);

      // Label
      ctx.font = `bold 18px "Open Sans", "Arial", sans-serif`;
      ctx.fillStyle = '#666699';
      ctx.fillText('TOA', 445, 355);
      ctx.fillText('GHẾ', 608, 355);
      ctx.fillText('HẠNG VÉ', 768, 355);

      // Watermark
      ctx.font = `bold 20px "Open Sans", "Arial", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('* Hãy đặt file ticket-blank.jpg vào /public/images/ *', canvas.width / 2, 590);
    };
  }, [ticketData, fontsLoaded]);

  const downloadTicket = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.download = `Ve_ThanhXuan_${ticketData.fullName.replace(/\s+/g, '_')}.jpg`;
    link.href = image;
    link.click();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      {/* Tiêu đề */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-headline text-primary mb-2 md:mb-4 tracking-tight">
          Tạo Vé Chuyến Tàu
        </h2>
        <p className="text-on-surface-variant text-sm md:text-base italic opacity-80">
          &ldquo;Khắc tên bạn lên chuyến tàu ký ức – 2003 &amp; 2026&rdquo;
        </p>
      </div>

      {/* Form nhập liệu */}
      <div className="w-full max-w-2xl bg-white p-6 rounded-3xl shadow-xl shadow-primary/10 border border-slate-100 mb-8 space-y-5">
        {/* Tên hành khách */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">person</span>
            Tên hành khách
          </label>
          <input
            type="text"
            id="ticket-full-name"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-slate-800 font-bold text-base transition"
            value={ticketData.fullName}
            onChange={(e) => setTicketData({ ...ticketData, fullName: e.target.value })}
            placeholder="Nhập họ và tên..."
          />
        </div>

        {/* Thông tin toa / ghế / hạng vé */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">train</span>
              Toa
            </label>
            <input
              type="text"
              id="ticket-toa"
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-slate-800 font-bold text-sm transition text-center"
              value={ticketData.toa}
              onChange={(e) => setTicketData({ ...ticketData, toa: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">chair</span>
              Ghế
            </label>
            <input
              type="text"
              id="ticket-ghe"
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-slate-800 font-bold text-sm transition text-center"
              value={ticketData.ghe}
              onChange={(e) => setTicketData({ ...ticketData, ghe: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">star</span>
              Hạng vé
            </label>
            <input
              type="text"
              id="ticket-hang-ve"
              className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-slate-800 font-bold text-sm transition text-center"
              value={ticketData.hangVe}
              onChange={(e) => setTicketData({ ...ticketData, hangVe: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Canvas preview */}
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100 shadow-2xl shadow-primary/10">
        <canvas
          ref={canvasRef}
          id="ticket-canvas"
          className="w-full h-auto block"
        />
      </div>

      {/* Nút tải về */}
      <button
        onClick={downloadTicket}
        id="download-ticket-btn"
        className="mt-6 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-base"
      >
        <span className="material-symbols-outlined">download</span>
        Tải vé về máy
      </button>

      <p className="mt-4 text-[11px] text-slate-400 text-center italic">
        * Mẹo: Sau khi tải về, hãy đăng lên Facebook hoặc Zalo để khoe với bạn bè nhé!
      </p>
    </div>
  );
}
