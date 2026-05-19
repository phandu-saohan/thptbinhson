'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

interface PhotoMemory {
  id: string;
  uploader_name: string;
  image_url: string;
  description: string;
  likes: number;
  hearts: number;
  created_at: string;
}

export default function MemoriesGalleryBlock() {
  const [memories, setMemories] = useState<PhotoMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [interacted, setInteracted] = useState<Record<string, boolean>>({});
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [memoryToDelete, setMemoryToDelete] = useState<PhotoMemory | null>(null);
  const [deleteInputName, setDeleteInputName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load memories
  const loadMemories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('photo_memories')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setMemories(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMemories();

    // Subscribe to realtime changes for likes/hearts updates
    const channel = supabase
      .channel('public:photo_memories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_memories' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMemories(prev => {
            // Prevent duplicate keys if loadMemories fetched it at the same time
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [payload.new as PhotoMemory, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setMemories(prev => prev.map(m => m.id === payload.new.id ? payload.new as PhotoMemory : m));
        } else if (payload.eventType === 'DELETE') {
          setMemories(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    // Load user interactions from localStorage
    const storedInteractions: Record<string, boolean> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('interacted_')) {
        storedInteractions[key] = true;
      }
    }
    setInteracted(storedInteractions);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(f => f.size <= 5 * 1024 * 1024); // max 5MB
      
      if (validFiles.length < filesArray.length) {
        alert('Một số ảnh lớn hơn 5MB đã bị bỏ qua để tiết kiệm dung lượng.');
      }
      
      setUploadFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    if (!uploaderName.trim()) {
      alert('Vui lòng nhập tên người đăng ảnh.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      for (const file of uploadFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `memories/${fileName}`;
        
        // Upload image
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('site-assets')
          .getPublicUrl(filePath);
          
        // Insert DB record
        const { error: insertError } = await supabase
          .from('photo_memories')
          .insert([{
            uploader_name: uploaderName,
            image_url: publicUrlData.publicUrl,
            description: description
          }]);
          
        if (insertError) throw insertError;
      }
      
      // Cleanup on success
      setShowUploadModal(false);
      setUploadFiles([]);
      setDescription('');
      loadMemories(); // Refresh list to ensure we have the latest
    } catch (err) {
      console.error('Upload error:', err);
      alert('Đã xảy ra lỗi trong quá trình tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInteract = async (id: string, type: 'likes' | 'hearts', currentVal: number) => {
    // Basic local storage check to prevent spam
    const stored = localStorage.getItem(`interacted_${type}_${id}`);
    if (stored) return; // already interacted

    // Optimistic update
    setMemories(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, [type]: currentVal + 1 };
      }
      return m;
    }));
    
    localStorage.setItem(`interacted_${type}_${id}`, 'true');
    setInteracted(prev => ({ ...prev, [`interacted_${type}_${id}`]: true }));

    // Update DB
    await supabase.from('photo_memories')
      .update({ [type]: currentVal + 1 })
      .eq('id', id);
  };

  const confirmDelete = async () => {
    if (!memoryToDelete) return;
    if (deleteInputName !== memoryToDelete.uploader_name) {
      alert('Tên người đăng không khớp!');
      return;
    }
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('photo_memories').delete().eq('id', memoryToDelete.id);
      if (error) throw error;
      setMemoryToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa ảnh. Vui lòng đảm bảo bạn đã cấp quyền DELETE (Public delete) trong Supabase.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 mb-16">
      <div className="text-center mb-8">
        <span className="text-primary font-bold uppercase tracking-widest text-sm mb-3 block">Ký ức khó quên</span>
        <h2 className="text-4xl font-headline text-primary tracking-tight">Ảnh Kỷ Niệm</h2>
        <p className="text-on-surface-variant mt-4 max-w-lg mx-auto">Nơi lưu giữ và chia sẻ những khoảnh khắc thanh xuân tươi đẹp nhất của chúng ta.</p>
        
        <button 
          onClick={() => setShowUploadModal(true)}
          className="mt-6 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
        >
          <span className="material-symbols-outlined">add_photo_alternate</span>
          Đóng góp ảnh của bạn
        </button>
      </div>

      {loading && memories.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">photo_library</span>
          <p className="text-slate-500 font-medium">Chưa có ảnh kỷ niệm nào. Hãy là người đầu tiên đóng góp nhé!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {memories.map((mem) => (
            <div key={mem.id} className="break-inside-avoid bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
              <div className="relative w-full">
                {/* Auto height based on width in Next.js Image usually requires a wrapper or just img tag for masonry */}
                <img 
                  src={mem.image_url} 
                  alt={mem.description || 'Kỷ niệm'} 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                {mem.description && (
                  <p className="text-sm text-slate-700 mb-3 italic">"{mem.description}"</p>
                )}
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">account_circle</span>
                    {mem.uploader_name}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleInteract(mem.id, 'likes', mem.likes)}
                      className={`flex items-center gap-1 transition-colors ${interacted[`interacted_likes_${mem.id}`] ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                      <span className="text-xs font-bold">{mem.likes > 0 ? mem.likes : ''}</span>
                    </button>
                    <button 
                      onClick={() => handleInteract(mem.id, 'hearts', mem.hearts)}
                      className={`flex items-center gap-1 transition-colors ${interacted[`interacted_hearts_${mem.id}`] ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">favorite</span>
                      <span className="text-xs font-bold">{mem.hearts > 0 ? mem.hearts : ''}</span>
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button 
                      onClick={() => { setMemoryToDelete(mem); setDeleteInputName(''); }}
                      className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Xóa ảnh này"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => !isUploading && setShowUploadModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Đóng góp ảnh kỷ niệm</h3>
              <button disabled={isUploading} onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tên người đăng <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={uploaderName}
                  onChange={e => setUploaderName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A (12A1)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  disabled={isUploading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả (tùy chọn)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Kỷ niệm gắn liền với những bức ảnh này..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-24"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Chọn ảnh (tối đa 5MB/ảnh)</label>
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined text-4xl text-primary mb-2">cloud_upload</span>
                  <p className="text-sm font-medium text-slate-600">Bấm để chọn ảnh từ máy của bạn</p>
                  <p className="text-xs text-slate-400 mt-1">Hỗ trợ JPG, PNG, WEBP</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </div>

              {uploadFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {uploadFiles.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="Preview" />
                      {!isUploading && (
                        <button 
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleUpload}
                disabled={isUploading || uploadFiles.length === 0}
                className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Tải lên {uploadFiles.length} ảnh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {memoryToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => !isDeleting && setMemoryToDelete(null)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col p-6 text-center">
            <span className="material-symbols-outlined text-red-500 text-5xl mb-4">warning</span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Xóa ảnh kỷ niệm?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Để xác nhận đây là ảnh của bạn, vui lòng nhập chính xác tên người đăng: <br/>
              <strong className="text-slate-900 text-lg">{memoryToDelete.uploader_name}</strong>
            </p>
            
            <input 
              type="text"
              value={deleteInputName}
              onChange={(e) => setDeleteInputName(e.target.value)}
              placeholder="Nhập tên người đăng để xác nhận..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none mb-6 text-center"
              disabled={isDeleting}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setMemoryToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting || deleteInputName !== memoryToDelete.uploader_name}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-md shadow-red-500/20 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
