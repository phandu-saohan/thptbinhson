'use client';

import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TicketGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const [ticketData, setTicketData] = useState({
    fullName: 'Ung Thanh Khiết',
    toa: 'B1 - C10',
    ghe: '26',
    hangVe: 'EXPRESS',
  });

  // Đảm bảo Google Fonts đã được tải xong và lấy dữ liệu
  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });

    supabase.from('registrations')
      .select('id, name, class_c, class_b, created_at')
      .order('created_at', { ascending: true })
      .then((res) => {
        if (res.data) setMembers(res.data);
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
      ctx.font = `bold 52px "Open Sans", "Arial", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(ticketData.fullName.toUpperCase(), canvas.width / 2, 165);

      // 3-5. Thông tin vé – Anton
      ctx.font = `45px "Anton", "Impact", sans-serif`;
      ctx.fillStyle = '#0F52BA';
      ctx.textAlign = 'center';

      ctx.fillText(ticketData.toa, 400, 482);
      ctx.fillText(ticketData.ghe, 543, 482);
      ctx.fillText(ticketData.hangVe.toUpperCase(), 690, 482);
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

      ctx.font = `bold 52px "Open Sans", "Arial", sans-serif`;
      ctx.fillStyle = '#0F52BA';
      ctx.fillText(ticketData.fullName.toUpperCase(), canvas.width / 2, 185);

      // Các thông tin vé
      ctx.font = `45px "Anton", "Impact", sans-serif`;
      ctx.fillStyle = '#0F52BA';
      ctx.fillText(ticketData.toa, 400, 482);
      ctx.fillText(ticketData.ghe, 543, 482);
      ctx.fillText(ticketData.hangVe.toUpperCase(), 690, 482);

      // Label
      ctx.font = `bold 18px "Open Sans", "Arial", sans-serif`;
      ctx.fillStyle = '#666699';
      ctx.fillText('TOA', 400, 422);
      ctx.fillText('GHẾ', 543, 422);
      ctx.fillText('HẠNG VÉ', 690, 422);

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

  const shareTicket = async (platform: 'fb' | 'zalo') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (navigator.share) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Ve_ThanhXuan_${ticketData.fullName.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Chuyến Tàu Thanh Xuân',
              text: 'Vé lên chuyến tàu thanh xuân 2003-2006 của tôi!',
            });
            return;
          } catch (error) {
            console.log('Lỗi chia sẻ:', error);
          }
        } else {
            fallbackShare(platform);
        }
      }, 'image/jpeg', 0.92);
    } else {
      fallbackShare(platform);
    }
  };

  const fallbackShare = (platform: 'fb' | 'zalo') => {
      const url = encodeURIComponent(window.location.href);
      if (platform === 'fb') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
      } else if (platform === 'zalo') {
        window.open(`https://zalo.me/share?link=${url}`, '_blank');
      }
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
        {/* Chọn hành khách */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">person</span>
            Thành viên đã đăng ký
          </label>
          <select
            id="ticket-member-select"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-slate-800 font-bold text-base transition appearance-none cursor-pointer"
            onChange={(e) => {
              const selectedIdx = e.target.value;
              if (selectedIdx === '') return;
              const idx = parseInt(selectedIdx, 10);
              const member = members[idx];
              if (member) {
                const classC = member.class_c || '';
                const classB = member.class_b || '';
                const toa = [classC, classB].filter(Boolean).join(' - ') || 'VIP';
                setTicketData({
                  fullName: member.name,
                  toa: toa,
                  ghe: (idx + 1).toString().padStart(2, '0'),
                  hangVe: 'EXPRESS',
                });
              }
            }}
          >
            <option value="">-- Chọn tên của bạn --</option>
            {members.map((m, idx) => {
              const classStr = [m.class_c, m.class_b].filter(Boolean).join(' - ');
              return (
                <option key={m.id} value={idx}>
                  {m.name} {classStr ? `(${classStr})` : ''}
                </option>
              );
            })}
          </select>
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
              readOnly
              className="w-full px-3 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl text-slate-500 font-bold text-sm text-center cursor-not-allowed"
              value={ticketData.toa}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">chair</span>
              Ghế
            </label>
            <input
              type="text"
              readOnly
              className="w-full px-3 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl text-slate-500 font-bold text-sm text-center cursor-not-allowed"
              value={ticketData.ghe}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">star</span>
              Hạng vé
            </label>
            <input
              type="text"
              readOnly
              className="w-full px-3 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl text-slate-500 font-bold text-sm text-center cursor-not-allowed"
              value={ticketData.hangVe}
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
        className="mt-6 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-base w-full max-w-xs justify-center"
      >
        <span className="material-symbols-outlined">download</span>
        Tải vé về máy
      </button>

      {/* Social Share Buttons */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => shareTicket('zalo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0068ff] text-white font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Zalo_Logo.svg/512px-Zalo_Logo.svg.png" alt="Zalo" className="w-5 h-5 object-contain bg-white rounded-full p-0.5" />
          Zalo
        </button>
        <button
          onClick={() => shareTicket('fb')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] text-white font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </button>
      </div>

      <p className="mt-5 text-sm md:text-base text-red-600 font-bold text-center max-w-sm bg-red-50 py-2 px-4 rounded-xl border border-red-100 shadow-sm animate-pulse">
        * Note: Trên điện thoại để lấy vé bấm vào nút Zalo hoặc FB.
      </p>
    </div>
  );
}
