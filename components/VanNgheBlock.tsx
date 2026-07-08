'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Song {
  id: string;
  singer_name: string;
  song_title: string;
  artist: string;
  class_name: string;
  avatar_url?: string;
  status: 'waiting' | 'done';
  heart_count: number;
  created_at: string;
}

// Lấy hoặc tạo device_id từ localStorage (dùng để chống vote nhiều lần)
function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('vn_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('vn_device_id', id);
  }
  return id;
}

// ── RegisterModal ──────────────────────────────────────────────────────────
function RegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [singerName, setSingerName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [className, setClassName] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mở camera trước
  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      setStream(s);
      setCameraMode(true);
    } catch {
      setError('Không thể mở camera. Vui lòng cho phép truy cập camera!');
    }
  };

  useEffect(() => {
    if (cameraMode && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [cameraMode, stream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    // Mirror effect for selfie
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    setAvatarDataUrl(c.toDataURL('image/jpeg', 0.85));
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraMode(false);
  };

  const retakePhoto = () => {
    setAvatarDataUrl(null);
    openCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singerName.trim() || !songTitle.trim()) {
      setError('Vui lòng điền đầy đủ tên và tên bài hát!');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let uploadedUrl = '';
      // Upload avatar nếu có
      if (avatarDataUrl) {
        const res = await fetch(avatarDataUrl);
        const blob = await res.blob();
        const fileName = `vannghe-avatar-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('site-assets')
          .upload(`vannghe/${fileName}`, blob, { contentType: 'image/jpeg' });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(`vannghe/${fileName}`);
          uploadedUrl = urlData.publicUrl;
        }
      }
      const { error: dbErr } = await supabase.from('vannghe_songs').insert([{
        singer_name: singerName.trim(),
        song_title: songTitle.trim(),
        artist: artist.trim(),
        class_name: className.trim(),
        avatar_url: uploadedUrl || null,
        status: 'waiting',
        heart_count: 0,
      }]);
      if (dbErr) throw dbErr;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                🎤 Đăng ký biểu diễn
              </h3>
              <p className="text-white/80 text-xs mt-0.5">Điền thông tin bài hát của bạn</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Avatar / Camera */}
          <div className="flex flex-col items-center gap-3">
            {cameraMode ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-48 h-48 rounded-full object-cover border-4 border-purple-400 shadow-xl"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="mt-3 w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  Chụp ảnh
                </button>
              </div>
            ) : avatarDataUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={avatarDataUrl}
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-purple-400 shadow-xl"
                />
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="text-purple-600 text-sm font-bold underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Chụp lại
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openCamera}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-400 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 transition-colors group"
              >
                <span className="material-symbols-outlined text-3xl text-purple-500 group-hover:scale-110 transition-transform">photo_camera</span>
                <span className="text-[11px] font-bold text-purple-500">Chụp selfie</span>
              </button>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tên của bạn *</label>
              <input
                type="text"
                value={singerName}
                onChange={e => setSingerName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tên bài hát *</label>
              <input
                type="text"
                value={songTitle}
                onChange={e => setSongTitle(e.target.value)}
                placeholder="Ví dụ: Mong ước kỷ niệm xưa"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tên ca sĩ gốc</label>
              <input
                type="text"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                placeholder="Ví dụ: Như Quỳnh"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Lớp</label>
              <input
                type="text"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="Ví dụ: C5 - B12"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl font-medium text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-95 transition-all text-base disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">mic</span>
                Đăng ký biểu diễn
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main VanNgheBlock ──────────────────────────────────────────
export default function VanNgheBlock({ onNavigateHome }: { onNavigateHome?: () => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [heartingId, setHeartingId] = useState<string | null>(null);

  // Load danh sách bài hát
  const fetchSongs = useCallback(async () => {
    const { data } = await supabase
      .from('vannghe_songs')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setSongs(data as Song[]);
    setLoading(false);
  }, []);

  // Load trái tim đã bấm từ localStorage
  useEffect(() => {
    const raw = localStorage.getItem('vn_liked_songs');
    if (raw) {
      try { setLikedSongs(new Set(JSON.parse(raw))); } catch {}
    }
  }, []);

  useEffect(() => {
    fetchSongs();
    // Dùng polling thay cho Realtime để tránh lỗi channel conflict trong StrictMode
    const timer = setInterval(fetchSongs, 5000);
    return () => clearInterval(timer);
  }, [fetchSongs]);

  const handleHeart = async (song: Song) => {
    if (likedSongs.has(song.id)) return;
    setHeartingId(song.id);
    const deviceId = getDeviceId();
    try {
      const { error } = await supabase.from('vannghe_hearts').insert([{ song_id: song.id, device_id: deviceId }]);
      if (!error) {
        await supabase.from('vannghe_songs').update({ heart_count: song.heart_count + 1 }).eq('id', song.id);
        const newLiked = new Set([...likedSongs, song.id]);
        setLikedSongs(newLiked);
        localStorage.setItem('vn_liked_songs', JSON.stringify([...newLiked]));
        fetchSongs();
      }
    } finally {
      setHeartingId(null);
    }
  };

  const waitingQueue = songs.filter(s => s.status === 'waiting');
  const doneList = songs
    .filter(s => s.status === 'done')
    .sort((a, b) => b.heart_count - a.heart_count);

  const getMedalColor = (idx: number) => {
    if (idx === 0) return 'from-yellow-400 to-amber-500';
    if (idx === 1) return 'from-slate-300 to-slate-400';
    if (idx === 2) return 'from-amber-600 to-amber-700';
    return 'from-purple-400 to-pink-500';
  };
  const getMedalEmoji = (idx: number) => ['🥇', '🥈', '🥉'][idx] ?? `#${idx + 1}`;

  return (
    <div className="animate-in fade-in duration-700">
      {/* Register Button — compact top bar */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <p className="text-white/60 text-sm">
            <span className="font-black text-white text-lg">{waitingQueue.length}</span> bài chờ · <span className="font-black text-pink-300 text-lg">{doneList.length}</span> bài đã hát
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white font-black px-5 py-2.5 rounded-full shadow-xl shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-[22px]">mic</span>
          Đăng ký bài hát
          <span className="bg-white/25 px-2 py-0.5 rounded-full text-xs font-bold">{waitingQueue.length} chờ</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 items-start">

          {/* ── CỘT TRÁI: Hàng chờ biểu diễn ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-[18px]">queue_music</span>
              </div>
              <h3 className="font-black text-lg text-white">Hàng chờ biểu diễn</h3>
              <span className="ml-auto bg-orange-500/20 text-orange-300 font-black text-xs px-3 py-1 rounded-full border border-orange-500/30">
                {waitingQueue.length} bài
              </span>
            </div>

            {waitingQueue.length === 0 ? (
              <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-3xl p-10 text-center">
                <span className="text-5xl block mb-3">🎤</span>
                <p className="text-white/70 font-medium">Chưa có ai đăng ký</p>
                <p className="text-white/40 text-sm mt-1">Hãy là người đầu tiên lên sân khấu!</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold px-6 py-2.5 rounded-full text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Đăng ký ngay
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingQueue.map((song, idx) => (
                  <div
                    key={song.id}
                    className={`relative bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${idx === 0 ? 'border-orange-300 ring-2 ring-orange-200' : 'border-slate-100'}`}
                  >
                    {/* Stripe for current performer */}
                    {idx === 0 && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-pink-400 rounded-t-2xl" />
                    )}
                    <div className="flex items-center gap-3">
                      {/* Order number */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-md ${idx === 0 ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {idx === 0 ? <span className="material-symbols-outlined text-[18px]">mic</span> : idx + 1}
                      </div>

                      {/* Avatar */}
                      {song.avatar_url ? (
                        <img src={song.avatar_url} alt={song.singer_name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-200 flex items-center justify-center font-black text-purple-600 text-lg shrink-0">
                          {song.singer_name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-800 text-sm leading-tight truncate">{song.singer_name}</p>
                        <p className="font-bold text-purple-600 text-sm truncate">🎵 {song.song_title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {song.artist && <span className="text-[11px] text-slate-400 truncate">Ca sĩ: {song.artist}</span>}
                          {song.class_name && (
                            <span className="bg-purple-50 text-purple-600 font-bold text-[10px] px-2 py-0.5 rounded-full border border-purple-100">{song.class_name}</span>
                          )}
                        </div>
                      </div>

                      {idx === 0 && (
                        <span className="shrink-0 text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full animate-pulse">
                          ĐANG HÁT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── CỘT PHẢI: Bài hát đã biểu diễn & bình chọn ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-base">❤️</span>
              </div>
              <h3 className="font-black text-lg text-white">Bảng xếp hạng</h3>
              <span className="ml-auto bg-rose-500/20 text-rose-300 font-black text-xs px-3 py-1 rounded-full border border-rose-500/30">
                {doneList.length} bài
              </span>
            </div>

            {doneList.length === 0 ? (
              <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-3xl p-10 text-center">
                <span className="text-5xl block mb-3">🏆</span>
                <p className="text-white/70 font-medium">Chưa có bài hát nào kết thúc</p>
                <p className="text-white/40 text-sm mt-1">Bình chọn ngay sau khi màn trình diễn kết thúc!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doneList.map((song, idx) => {
                  const isLiked = likedSongs.has(song.id);
                  const isHearting = heartingId === song.id;
                  return (
                    <div
                      key={song.id}
                      className={`relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border ${idx === 0 ? 'border-yellow-300 ring-2 ring-yellow-200' : idx === 1 ? 'border-slate-300' : idx === 2 ? 'border-amber-300' : 'border-slate-100'}`}
                    >
                      {/* Gradient top stripe */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getMedalColor(idx)} rounded-t-2xl`} />

                      <div className="flex items-center gap-3">
                        {/* Medal */}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(idx)} flex items-center justify-center shadow-md shrink-0 text-lg`}>
                          {typeof getMedalEmoji(idx) === 'string' && getMedalEmoji(idx).startsWith('#')
                            ? <span className="text-white font-black text-xs">{getMedalEmoji(idx)}</span>
                            : getMedalEmoji(idx)}
                        </div>

                        {/* Avatar */}
                        {song.avatar_url ? (
                          <img src={song.avatar_url} alt={song.singer_name} className="w-12 h-12 rounded-full object-cover border-2 border-rose-200 shadow-sm shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 border-2 border-rose-200 flex items-center justify-center font-black text-rose-600 text-lg shrink-0">
                            {song.singer_name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-800 text-sm leading-tight truncate">{song.singer_name}</p>
                          <p className="font-bold text-rose-500 text-sm truncate">🎵 {song.song_title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {song.artist && <span className="text-[11px] text-slate-400 truncate">Ca sĩ: {song.artist}</span>}
                            {song.class_name && (
                              <span className="bg-rose-50 text-rose-600 font-bold text-[10px] px-2 py-0.5 rounded-full border border-rose-100">{song.class_name}</span>
                            )}
                          </div>
                        </div>

                        {/* Heart button */}
                        <div className="flex flex-col items-center shrink-0">
                          <button
                            onClick={() => handleHeart(song)}
                            disabled={isLiked || isHearting}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md text-xl ${
                              isLiked
                                ? 'bg-rose-500 text-white scale-95 shadow-rose-300'
                                : 'bg-white border-2 border-rose-300 text-rose-400 hover:bg-rose-500 hover:text-white hover:scale-110 hover:shadow-rose-300 active:scale-90'
                            } ${isHearting ? 'animate-bounce' : ''}`}
                            title={isLiked ? 'Đã bình chọn' : 'Bấm tim yêu thích'}
                          >
                            {isLiked ? '❤️' : '🤍'}
                          </button>
                          <span className="text-xs font-black text-rose-500 mt-1">
                            {song.heart_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showModal && (
        <RegisterModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchSongs();
          }}
        />
      )}
    </div>
  );
}
