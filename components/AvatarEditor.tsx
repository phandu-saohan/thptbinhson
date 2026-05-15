"use client";

import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';

const FRAME_SOURCE = '/khung-avatar.png';

export default function AvatarEditor() {
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
      frameImg.src = FRAME_SOURCE;

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
              src={FRAME_SOURCE} 
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
                className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">close</span>
                Chọn ảnh khác
              </button>
              <button
                onClick={downloadAvatar}
                disabled={isGenerating}
                className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isGenerating ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-lg">download</span>
                )}
                {isGenerating ? "Đang xử lý..." : "Tải ảnh về máy"}
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 text-center italic">
              * Mẹo: Bạn có thể dùng chuột hoặc ngón tay để kéo và điều chỉnh vị trí khuôn mặt cho khớp với khung tròn.
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
