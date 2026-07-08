'use client';
import { useState, useEffect } from 'react';

interface VanNgheQRProps {
  /** Hiện ở dạng popup nổi (button góc) hay inline */
  variant?: 'floating' | 'inline';
}

export default function VanNgheQR({ variant = 'floating' }: VanNgheQRProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vanNgheUrl, setVanNgheUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVanNgheUrl(`${window.location.origin}/vannghe`);
    }
  }, []);

  const qrSrc = vanNgheUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&color=581c87&bgcolor=ffffff&data=${encodeURIComponent(vanNgheUrl)}`
    : '';

  const handleCopy = async () => {
    if (!vanNgheUrl) return;
    try {
      await navigator.clipboard.writeText(vanNgheUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('input');
      el.value = vanNgheUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center gap-3">
        {qrSrc && (
          <img
            src={qrSrc}
            alt="QR Code Văn Nghệ"
            className="w-44 h-44 rounded-2xl border-4 border-purple-300 shadow-2xl shadow-purple-900/50"
          />
        )}
        <p className="text-white/60 text-[11px] text-center">Quét để mở trang văn nghệ</p>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Đã copy!' : 'Copy link'}
        </button>
      </div>
    );
  }

  // Floating button variant
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Xem QR code & link trang Văn Nghệ"
        className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 border border-white/20"
      >
        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
        <span className="hidden sm:inline">QR / Link</span>
      </button>

      {/* Popup panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setOpen(false)}
          />
          {/* Card */}
          <div className="absolute top-14 right-4 z-[100] bg-purple-900 border border-purple-600/60 rounded-3xl shadow-2xl shadow-black/60 p-5 w-72 animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-black text-sm">📱 Chia sẻ trang Văn Nghệ</p>
                <p className="text-purple-300 text-[11px] mt-0.5">Quét QR hoặc copy link</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-white text-[16px]">close</span>
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              {qrSrc ? (
                <div className="bg-white p-2 rounded-2xl shadow-xl">
                  <img
                    src={qrSrc}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-white/10 rounded-2xl flex items-center justify-center">
                  <span className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* URL + Copy */}
            <div className="bg-white/10 rounded-2xl p-3 flex items-center gap-2">
              <p className="text-white/80 text-[11px] font-mono flex-1 truncate">{vanNgheUrl}</p>
              <button
                onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-full transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Xong!' : 'Copy'}
              </button>
            </div>

            {/* Open in new tab */}
            <a
              href={vanNgheUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black text-xs py-2.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Mở trang riêng
            </a>
          </div>
        </>
      )}
    </>
  );
}
