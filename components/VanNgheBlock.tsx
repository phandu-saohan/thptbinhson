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
  note?: string;
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
function RegisterModal({
  onClose,
  onSuccess,
  existingSongs = [],
  editingSong,
}: {
  onClose: () => void;
  onSuccess: () => void;
  existingSongs?: Song[];
  editingSong?: Song;
}) {
  const [singerName, setSingerName] = useState(editingSong?.singer_name || '');
  const [songTitle, setSongTitle] = useState(editingSong?.song_title || '');
  const [artist, setArtist] = useState(editingSong?.artist || '');
  const [className, setClassName] = useState(editingSong?.class_name || '');
  const [note, setNote] = useState(editingSong?.note || '');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(editingSong?.avatar_url || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý upload ảnh từ thư viện
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  };

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
      let uploadedUrl = editingSong?.avatar_url || '';
      // Upload avatar nếu có ảnh mới (base64)
      if (avatarDataUrl && avatarDataUrl.startsWith('data:image')) {
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
      } else if (!avatarDataUrl) {
        uploadedUrl = '';
      }

      if (editingSong) {
        const { error: dbErr } = await supabase
          .from('vannghe_songs')
          .update({
            singer_name: singerName.trim(),
            song_title: songTitle.trim(),
            artist: artist.trim(),
            class_name: className.trim(),
            note: note.trim() || null,
            avatar_url: uploadedUrl || null,
          })
          .eq('id', editingSong.id);
        if (dbErr) throw dbErr;
      } else {
        const { error: dbErr } = await supabase.from('vannghe_songs').insert([{
          singer_name: singerName.trim(),
          song_title: songTitle.trim(),
          artist: artist.trim(),
          class_name: className.trim(),
          note: note.trim() || null,
          avatar_url: uploadedUrl || null,
          status: 'waiting',
          heart_count: 0,
        }]);
        if (dbErr) throw dbErr;
      }
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

      {/* Modal container — hộp cố định, nội dung cuộn trong */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Header — sticky, không cuộn */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 p-5 text-white shrink-0 rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                🎤 {editingSong ? 'Chỉnh sửa tiết mục' : 'Đăng ký biểu diễn'}
              </h3>
              <p className="text-white/80 text-xs mt-0.5">{editingSong ? 'Cập nhật thông tin tiết mục của bạn' : 'Điền thông tin bài hát của bạn'}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Body — cuộn được khi nội dung dài */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-5 space-y-4 pb-8">

            {/* Avatar / Camera / Upload */}
            <div className="flex flex-col items-center gap-3">
              {cameraMode ? (
                <div className="relative w-full flex flex-col items-center">
                  <video ref={videoRef} autoPlay playsInline muted
                    className="w-48 h-48 rounded-full object-cover border-4 border-purple-400 shadow-xl"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <button type="button" onClick={capturePhoto}
                    className="mt-3 w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>Chụp ảnh
                  </button>
                  <button type="button"
                    onClick={() => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setCameraMode(false); }}
                    className="mt-2 text-slate-400 text-xs font-medium hover:text-slate-600 transition-colors"
                  >Hủy</button>
                </div>
              ) : avatarDataUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={avatarDataUrl} alt="avatar"
                    className="w-28 h-28 rounded-full object-cover border-4 border-purple-400 shadow-xl"
                  />
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={retakePhoto}
                      className="text-purple-600 text-xs font-bold flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>Chụp lại
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="text-pink-600 text-xs font-bold flex items-center gap-1 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-200 hover:bg-pink-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">upload</span>Đổi ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 w-full">
                  <p className="text-[11px] text-slate-400 font-medium">Chọn ảnh đại diện (tùy chọn)</p>
                  <div className="flex gap-3 justify-center">
                    <button type="button" onClick={openCamera}
                      className="flex flex-col items-center gap-2 w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 justify-center hover:bg-purple-50 hover:border-purple-400 transition-all group"
                    >
                      <span className="material-symbols-outlined text-3xl text-purple-500 group-hover:scale-110 transition-transform">photo_camera</span>
                      <span className="text-[11px] font-bold text-purple-600">Chụp selfie</span>
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 w-28 h-28 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 border-2 border-dashed border-pink-300 justify-center hover:bg-pink-50 hover:border-pink-400 transition-all group"
                    >
                      <span className="material-symbols-outlined text-3xl text-pink-500 group-hover:scale-110 transition-transform">upload</span>
                      <span className="text-[11px] font-bold text-pink-600">Tải ảnh lên</span>
                    </button>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>

            {/* Các trường thông tin */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tên của bạn *</label>
                <input type="text" value={singerName} onChange={e => setSingerName(e.target.value)}
                  placeholder="Nguyễn Văn A" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
                />
              </div>
            {/* Tên bài hát */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tên bài hát *</label>
                <input type="text" value={songTitle} onChange={e => setSongTitle(e.target.value)}
                  placeholder="Ví dụ: Mong ước kỷ niệm xưa" required
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 text-sm font-medium transition-colors ${
                    songTitle.trim() && existingSongs.some(
                      s => s.id !== editingSong?.id && s.song_title.trim().toLowerCase() === songTitle.trim().toLowerCase()
                    )
                      ? 'border-amber-400 focus:ring-amber-400 bg-amber-50'
                      : 'border-slate-200 focus:ring-purple-400'
                  }`}
                />
                {/* Cảnh báo trùng lặp */}
                {(() => {
                  const dupes = existingSongs.filter(
                    s => s.id !== editingSong?.id && s.song_title.trim().toLowerCase() === songTitle.trim().toLowerCase()
                  );
                  if (!songTitle.trim() || dupes.length === 0) return null;
                  return (
                    <div className="mt-1.5 flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2">
                      <span className="text-amber-500 text-base mt-0.5">⚠️</span>
                      <div>
                        <p className="text-amber-700 text-xs font-black">Bài hát này đã có người đăng ký!</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {dupes.map(d => (
                            <li key={d.id} className="text-[11px] text-amber-600 flex items-center gap-1">
                              <span>{d.status === 'waiting' ? '⏳' : '✅'}</span>
                              <span className="font-bold">{d.singer_name}</span>
                              {d.class_name && <span className="text-amber-500">({d.class_name})</span>}
                              <span className="text-amber-400">{d.status === 'waiting' ? '— đang chờ' : '— đã hát'}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-amber-500 mt-1 italic">Bạn vẫn có thể đăng ký bài này nếu muốn song ca 🎤</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tên ca sĩ gốc</label>
                <input type="text" value={artist} onChange={e => setArtist(e.target.value)}
                  placeholder="Ví dụ: Như Quỳnh"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Lớp</label>
                <input type="text" value={className} onChange={e => setClassName(e.target.value)}
                  placeholder="Ví dụ: C5 - B12"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  💬 Lời nhắn <span className="text-slate-400 font-normal normal-case tracking-normal">(tùy chọn)</span>
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Muốn nói gì với khán giả? Tặng bài hát cho ai? 🎵"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-medium resize-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl font-medium text-center">{error}</p>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-95 transition-all text-base disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {submitting ? (
                editingSong ? (
                  <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>
                ) : (
                  <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang đăng ký...</>
                )
              ) : (
                editingSong ? (
                  <><span className="material-symbols-outlined text-[20px]">save</span>Lưu thay đổi</>
                ) : (
                  <><span className="material-symbols-outlined text-[20px]">mic</span>Đăng ký biểu diễn</>
                )
              )}
            </button>
          </form>
        </div>
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
  const [markingDoneId, setMarkingDoneId] = useState<string | null>(null);
  const [notePopupSong, setNotePopupSong] = useState<Song | null>(null);
  const [activeView, setActiveView] = useState<'queue' | 'ranking'>('queue');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [requeuingId, setRequeuingId] = useState<string | null>(null);
  const NOTE_LIMIT = 60;

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

  const handleMarkDone = async (song: Song) => {
    if (markingDoneId) return;
    setMarkingDoneId(song.id);
    try {
      await supabase
        .from('vannghe_songs')
        .update({ status: 'done' })
        .eq('id', song.id);
      fetchSongs();
    } finally {
      setMarkingDoneId(null);
    }
  };

  const handleDelete = async (songId: string) => {
    if (deletePassword !== '88888888') {
      setDeleteError('Sai mật khẩu!');
      return;
    }
    setDeletingId(songId);
    setDeleteError(null);
    try {
      await supabase.from('vannghe_songs').delete().eq('id', songId);
      setConfirmDeleteId(null);
      setDeletePassword('');
      fetchSongs();
    } finally {
      setDeletingId(null);
    }
  };

  const handleRequeue = async (song: Song) => {
    if (requeuingId) return;
    setRequeuingId(song.id);
    try {
      await supabase
        .from('vannghe_songs')
        .update({ status: 'waiting' })
        .eq('id', song.id);
      fetchSongs();
    } finally {
      setRequeuingId(null);
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
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/60 text-sm">
            <span className="font-black text-white text-lg">{waitingQueue.length}</span> bài chờ · <span className="font-black text-pink-300 text-lg">{doneList.length}</span> bài đã hát
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

      {/* Mobile tab switcher */}
      <div className="flex lg:hidden bg-white/10 rounded-2xl p-1 mb-5 gap-1">
        <button
          onClick={() => setActiveView('queue')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeView === 'queue'
              ? 'bg-white text-purple-700 shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">queue_music</span>
          Hàng chờ
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
            activeView === 'queue' ? 'bg-orange-100 text-orange-600' : 'bg-white/20 text-white'
          }`}>{waitingQueue.length}</span>
        </button>
        <button
          onClick={() => setActiveView('ranking')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeView === 'ranking'
              ? 'bg-white text-pink-700 shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span className="text-base">❤️</span>
          Bảng xếp hạng
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
            activeView === 'ranking' ? 'bg-pink-100 text-pink-600' : 'bg-white/20 text-white'
          }`}>{doneList.length}</span>
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
          <div className={activeView === 'ranking' ? 'hidden lg:block' : ''}>
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

                      {/* Badge ĐANG HÁT + nút XONG cho bài đầu */}
                      {idx === 0 ? (
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full animate-pulse">
                            ĐANG HÁT
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleMarkDone(song)}
                              disabled={markingDoneId === song.id}
                              className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-[11px] px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:scale-100"
                            >
                              {markingDoneId === song.id ? (
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              )}
                              Xong
                            </button>
                            {confirmDeleteId === song.id ? (
                              <div className="flex flex-col items-end gap-1 bg-red-50 border border-red-100 rounded-xl p-1.5 animate-in fade-in duration-200">
                                <input
                                  type="password"
                                  placeholder="Mật khẩu..."
                                  value={deletePassword}
                                  onChange={(e) => setDeletePassword(e.target.value)}
                                  className="px-2 py-0.5 text-[11px] border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-400 w-20 text-slate-800"
                                />
                                {deleteError && (
                                  <span className="text-[9px] text-red-600 font-bold">{deleteError}</span>
                                )}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(song.id)}
                                    disabled={deletingId === song.id}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded transition-all"
                                  >
                                    Xác nhận
                                  </button>
                                  <button
                                    onClick={() => {
                                      setConfirmDeleteId(null);
                                      setDeletePassword('');
                                      setDeleteError(null);
                                    }}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded transition-all"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingSong(song)}
                                  className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 hover:bg-blue-100 hover:text-blue-600 transition-all shrink-0"
                                  title="Chỉnh sửa tiết mục"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(song.id)}
                                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 hover:bg-red-100 hover:text-red-600 transition-all shrink-0"
                                  title="Xóa đăng ký"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="shrink-0 flex items-center gap-1.5">
                          {confirmDeleteId === song.id ? (
                            <div className="flex flex-col items-end gap-1 bg-red-50 border border-red-100 rounded-xl p-1.5 animate-in fade-in duration-200">
                              <input
                                type="password"
                                placeholder="Mật khẩu..."
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="px-2 py-0.5 text-[11px] border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-400 w-20 text-slate-800"
                              />
                              {deleteError && (
                                <span className="text-[9px] text-red-600 font-bold">{deleteError}</span>
                              )}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(song.id)}
                                  disabled={deletingId === song.id}
                                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded transition-all"
                                >
                                  Xác nhận
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmDeleteId(null);
                                    setDeletePassword('');
                                    setDeleteError(null);
                                  }}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded transition-all"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingSong(song)}
                                className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 hover:bg-blue-100 hover:text-blue-600 transition-all"
                                title="Chỉnh sửa tiết mục"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(song.id)}
                                className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 hover:bg-red-100 hover:text-red-600 transition-all"
                                title="Xóa đăng ký"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lời nhắn — hiển thị để MC đọc */}
                    {song.note && (
                      idx === 0 ? (
                        <div className="mt-3 flex items-start gap-2 bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-xl px-3 py-2.5">
                          <span className="text-orange-400 text-base shrink-0 mt-0.5">💬</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-0.5">Lời nhắn</p>
                            {song.note.length > NOTE_LIMIT ? (
                              <>
                                <p className="text-orange-700 text-sm font-semibold leading-snug italic">
                                  "{song.note.slice(0, NOTE_LIMIT)}..."
                                </p>
                                <button
                                  onClick={() => setNotePopupSong(song)}
                                  className="mt-1 text-[11px] font-black text-orange-500 underline hover:text-orange-700 transition-colors"
                                >Xem đầy đủ ↗</button>
                              </>
                            ) : (
                              <p className="text-orange-700 text-sm font-semibold leading-snug italic">"{song.note}"</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-start gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                          <span className="text-slate-300 text-sm shrink-0 mt-0.5">💬</span>
                          {song.note.length > NOTE_LIMIT ? (
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-500 text-xs italic leading-snug truncate">"{song.note.slice(0, NOTE_LIMIT)}..."</p>
                              <button
                                onClick={() => setNotePopupSong(song)}
                                className="text-[10px] font-bold text-purple-500 underline hover:text-purple-700 transition-colors mt-0.5"
                              >Xem thêm</button>
                            </div>
                          ) : (
                            <p className="text-slate-500 text-xs italic leading-snug">"{song.note}"</p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── CỘT PHẢI: Bài hát đã biểu diễn & bình chọn ── */}
          <div className={activeView === 'queue' ? 'hidden lg:block' : ''}>
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

                        {/* Actions: Delete + Heart */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {confirmDeleteId === song.id ? (
                            <div className="flex flex-col items-center gap-1 bg-red-50 border border-red-100 rounded-xl p-1.5 animate-in fade-in duration-200">
                              <input
                                type="password"
                                placeholder="Mật khẩu..."
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="px-2 py-0.5 text-[11px] border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-400 w-20 text-slate-800"
                              />
                              {deleteError && (
                                <span className="text-[9px] text-red-600 font-bold">{deleteError}</span>
                              )}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(song.id)}
                                  disabled={deletingId === song.id}
                                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded transition-all"
                                >
                                  Xác nhận
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmDeleteId(null);
                                    setDeletePassword('');
                                    setDeleteError(null);
                                  }}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded transition-all"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {/* Nút quay lại hàng chờ */}
                              <button
                                onClick={() => handleRequeue(song)}
                                disabled={requeuingId === song.id}
                                className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 hover:bg-purple-100 hover:text-purple-600 flex items-center justify-center transition-all border border-purple-50/50 shrink-0"
                                title="Hát lại (Chuyển về hàng chờ)"
                              >
                                {requeuingId === song.id ? (
                                  <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <span className="material-symbols-outlined text-[16px]">undo</span>
                                )}
                              </button>

                              {/* Nút xóa */}
                              <button
                                onClick={() => setConfirmDeleteId(song.id)}
                                className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all border border-red-50/50 shrink-0"
                                title="Xóa bài hát"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          )}

                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => handleHeart(song)}
                              disabled={isLiked || isHearting}
                              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md text-lg ${
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register Modal */}
      {(showModal || editingSong) && (
        <RegisterModal
          editingSong={editingSong || undefined}
          onClose={() => {
            setShowModal(false);
            setEditingSong(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingSong(null);
            fetchSongs();
          }}
          existingSongs={songs}
        />
      )}

      {/* Note Popup — xem lời nhắn đầy đủ */}
      {notePopupSong && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setNotePopupSong(null)}
          />
          {/* Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-base leading-tight truncate">🎵 {notePopupSong.song_title}</p>
                  <p className="text-white/80 text-xs mt-0.5">{notePopupSong.singer_name}
                    {notePopupSong.class_name && <span className="ml-1 opacity-70">· {notePopupSong.class_name}</span>}
                  </p>
                </div>
                <button
                  onClick={() => setNotePopupSong(null)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="px-5 py-5">
              <p className="text-[11px] font-black text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>💬</span> Lời nhắn của người biểu diễn
              </p>
              <blockquote className="text-slate-700 text-base font-medium leading-relaxed italic border-l-4 border-orange-300 pl-4">
                "{notePopupSong.note}"
              </blockquote>
            </div>
            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                onClick={() => setNotePopupSong(null)}
                className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-black py-2.5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm shadow-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
