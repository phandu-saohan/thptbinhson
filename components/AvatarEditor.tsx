"use client";

import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';

const DEFAULT_FRAME = '/khung-avatar.png';

export default function AvatarEditor({ frameSource = DEFAULT_FRAME }: { frameSource?: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const downloadAvatar = async () => {
    if (!image || !croppedAreaPixels) return;
    if (!frameSource || frameSource === '/khung-avatar.png') {
       // Optional: verify if file exists or just let it try
    }
    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const userImg = new Image();
      const frameImg = new Image();
      
      // Fix CORS for Canvas
      userImg.crossOrigin = "anonymous";
      frameImg.crossOrigin = "anonymous";

      userImg.src = image;
      frameImg.src = frameSource;

      await Promise.all([
        new Promise((res) => (userImg.onload = res)),
        new Promise((res) => (frameImg.onload = res)),
      ]);

      canvas.width = 1000;
      canvas.height = 1000;

      // 1. Draw user image
      ctx.drawImage(
        userImg,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        1000,
        1000
      );

      // 2. Draw frame overlay
      ctx.drawImage(frameImg, 0, 0, 1000, 1000);

      // 3. Get Data URL
      const dataUrl = canvas.toDataURL('image/png');
      setResultImage(dataUrl);

      // 4. Try auto-download (may be blocked by Zalo/FB)
      const link = document.createElement('a');
      link.download = `Avatar_BinhSon_20Nam_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating avatar:", error);
      alert("Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-headline text-primary mb-2 md:mb-4 tracking-tight">Tạo Avatar Kỷ Niệm</h2>
        <p className="text-on-surface-variant text-sm md:text-base italic opacity-80">"Lồng khung ký ức - Gắn kết tương lai"</p>
      </div>
      
      {!image ? (
        <div className="w-full max-w-md aspect-square bg-surface-container-low border-2 border-dashed border-outline-variant rounded-3xl flex flex-col items-center justify-center p-12 text-center group hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden">
          <input 
            type="file" 
            accept="image/*" 
            onChange={onFileChange} 
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          />
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">add_a_photo</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">Chọn ảnh của bạn</h3>
          <p className="text-sm text-on-surface-variant">Tải lên ảnh chân dung để lồng vào khung kỷ niệm 20 năm</p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-8">
          <div className="relative w-full max-w-[500px] aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              classes={{
                containerClassName: "bg-slate-900",
                mediaClassName: "opacity-90",
              }}
            />
            {/* Real-time Frame Overlay */}
            <img 
              src={frameSource} 
              alt="Frame Overlay" 
              crossOrigin="anonymous"
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
            />
          </div>

          <div className="w-full max-w-[500px] bg-white p-4 md:p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5 md:space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-wider">
                <span>Phóng to / Thu nhỏ</span>
                <span className="text-primary">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={downloadAvatar}
                disabled={isGenerating}
                className="w-full px-6 py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isGenerating ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-xl">download</span>
                )}
                {isGenerating ? "Đang xử lý..." : "Tải ảnh về máy"}
              </button>

              <button
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#1877F2] text-white rounded-2xl shadow-md hover:opacity-90 transition active:scale-95 text-sm font-bold"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Chia sẻ lên Facebook
              </button>
              <button
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  window.open(`https://sp.zalo.me/share/base?url=${url}`, '_blank');
                }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#0068FF] text-white rounded-2xl shadow-md hover:opacity-90 transition active:scale-95 text-sm font-bold"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" className="w-5 h-5 brightness-0 invert" />
                Chia sẻ qua Zalo
              </button>

              <button
                onClick={() => setImage(null)}
                className="w-full px-6 py-3 border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-lg">close</span>
                Chọn ảnh khác
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 text-center italic">
              * Mẹo: Tải ảnh về máy rồi đăng lên FB/Zalo để khoe với bạn bè nhé!
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Result Modal for In-app Browsers (Zalo/FB) */}
      {resultImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full flex flex-col items-center gap-6 shadow-2xl relative">
            <button 
              onClick={() => setResultImage(null)}
              className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold"
            >
              Đóng <span className="material-symbols-outlined bg-white/20 rounded-full p-1">close</span>
            </button>
            
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-primary uppercase tracking-tight">Hoàn tất!</h3>
              <p className="text-xs text-on-surface-variant font-medium">Ảnh của bạn đã sẵn sàng</p>
            </div>

            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-inner border-4 border-slate-50">
              <img src={resultImage} alt="Final Avatar" className="w-full h-full object-contain" />
            </div>

            <div className="w-full space-y-4">
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-[11px] text-primary font-bold text-center leading-relaxed">
                  💡 Mẹo cho Zalo/Facebook:<br/>
                  Nhấn giữ vào ảnh trên và chọn "Lưu hình ảnh" để tải về máy.
                </p>
              </div>
              
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `Avatar_BinhSon_20Nam_${Date.now()}.png`;
                  link.href = resultImage;
                  link.click();
                }}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-primary/20"
              >
                <span className="material-symbols-outlined">download</span>
                Tải lại một lần nữa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
