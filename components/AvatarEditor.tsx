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
    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const userImg = new Image();
      const frameImg = new Image();

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

      // 3. Download
      const link = document.createElement('a');
      link.download = `Avatar_BinhSon_20Nam_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
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
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-headline text-primary mb-4">Tạo Avatar Kỷ Niệm</h2>
        <p className="text-on-surface-variant italic">"Lồng khung ký ức - Gắn kết tương lai"</p>
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
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
            />
          </div>

          <div className="w-full max-w-[500px] bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
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

            <div className="flex gap-4">
              <button
                onClick={() => setImage(null)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">close</span>
                Chọn lại
              </button>
              <button
                onClick={downloadAvatar}
                disabled={isGenerating}
                className="flex-[2] px-4 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isGenerating ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-lg">download</span>
                )}
                {isGenerating ? "..." : "Tải ảnh"}
              </button>
              
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                  }}
                  className="w-12 h-12 bg-[#1877F2] text-white rounded-xl flex items-center justify-center shadow-md hover:opacity-90 transition active:scale-95"
                  title="Chia sẻ Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    window.open(`https://sp.zalo.me/share/base?url=${url}`, '_blank');
                  }}
                  className="w-12 h-12 bg-[#0068FF] text-white rounded-xl flex items-center justify-center shadow-md hover:opacity-90 transition active:scale-95"
                  title="Chia sẻ Zalo"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" className="w-6 h-6 brightness-0 invert" />
                </button>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 text-center italic">
              * Mẹo: Tải ảnh về máy rồi đăng lên FB/Zalo để khoe với bạn bè nhé!
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
