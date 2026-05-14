'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';


import { supabase } from '@/lib/supabaseClient';


// ── FinanceStatisticsBlock: Block thống kê thu chi (bao gồm Danh sách đăng ký) ──
function FinanceStatisticsBlock() {
  const [incomes, setIncomes] = React.useState<{name:string;phone:string;will_attend:string;amount?:number;created_at:string;memory?:string;class_c?:string;class_b?:string}[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [classCFilter, setClassCFilter] = React.useState('');
  const [classBFilter, setClassBFilter] = React.useState('');

  React.useEffect(() => {
    supabase.from('registrations').select('*').order('created_at', { ascending: false })
      .then((regsRes) => {
        if (regsRes.data) setIncomes(regsRes.data);
        setLoading(false);
      });
  }, []);

  const getClasses = (row: any) => {
    if (row.class_c || row.class_b) {
      return { cleanName: row.name, classC: row.class_c || '', classB: row.class_b || '' };
    }
    const match = row.name.match(/\((.*?)\)$/);
    if (!match) return { cleanName: row.name, classC: '', classB: '' };
    const classesStr = match[1];
    const parts = classesStr.split(' | ');
    let classC = '';
    let classB = '';
    parts.forEach((p: string) => {
      if (p.startsWith('Lớp C: ')) classC = p.replace('Lớp C: ', '');
      if (p.startsWith('Lớp B: ')) classB = p.replace('Lớp B: ', '');
    });
    return { cleanName: row.name.replace(` (${classesStr})`, '').trim(), classC, classB };
  };

  const filteredIncomes = incomes.filter(t => {
    const { cleanName, classC, classB } = getClasses(t);
    const matchesSearch = cleanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.memory && t.memory.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesClassC = classCFilter === '' || classC === classCFilter;
    const matchesClassB = classBFilter === '' || classB === classBFilter;
    return matchesSearch && matchesClassC && matchesClassB;
  });

  const attending = incomes.filter(r => r.will_attend === 'yes').length;
  const totalIncome = incomes.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="mt-6 md:mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

      {/* Summary row */}
      <div className="grid grid-cols-2 border-b border-slate-100">
        <div className="p-4 md:p-6 text-center border-r border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hành khách</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-primary">{attending}<span className="text-sm text-slate-400 font-medium ml-1">sẽ về</span></p>
        </div>
        <div className="p-4 md:p-6 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng đóng góp</p>
          <p className="text-xl md:text-2xl font-bold tracking-tight text-emerald-600">{totalIncome > 0 ? totalIncome.toLocaleString('vi-VN') + 'đ' : '—'}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="p-3 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 px-2">
          <span className="material-symbols-outlined text-primary">groups</span>
          Danh sách hành khách ({incomes.length})
        </h3>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-56">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
          <select
            value={classCFilter}
            onChange={(e) => setClassCFilter(e.target.value)}
            className="w-full md:w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer"
          >
            <option value="">Lớp C</option>
            {Array.from({ length: 13 }, (_, i) => `C${i + 1}`).map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            value={classBFilter}
            onChange={(e) => setClassBFilter(e.target.value)}
            className="w-full md:w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer"
          >
            <option value="">Lớp B</option>
            {Array.from({ length: 15 }, (_, i) => `B${i + 1}`).map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {/* Content */}
      <div className="overflow-x-auto md:overflow-x-visible">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <table className="w-full text-left hidden md:table">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Thành viên</th>
                  <th className="px-6 py-3 text-center">Lớp C</th>
                  <th className="px-6 py-3 text-center">Lớp B</th>
                  <th className="px-6 py-3 text-center">Tham dự</th>
                  <th className="px-6 py-3 text-right">Đóng góp</th>
                  <th className="px-6 py-3 hidden lg:table-cell">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncomes.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Chưa có dữ liệu</td></tr>
                ) : (
                  filteredIncomes.map((r, idx) => {
                    const { cleanName, classC, classB } = getClasses(r);
                    return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                            {cleanName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800 text-sm">{cleanName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center text-sm text-slate-600 font-medium">{classC || '-'}</td>
                      <td className="px-6 py-3 text-center text-sm text-slate-600 font-medium">{classB || '-'}</td>
                      <td className="px-6 py-3 text-center">
                        {r.will_attend === 'yes'
                          ? <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Sẽ về</span>
                          : <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">Vắng</span>
                        }
                      </td>
                      <td className="px-6 py-3 text-right">
                        {r.amount && r.amount > 0
                          ? <span className="font-bold text-emerald-600 text-sm">+{r.amount.toLocaleString('vi-VN')}đ</span>
                          : <span className="text-slate-300 text-sm">—</span>
                        }
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredIncomes.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Chưa có dữ liệu</div>
              ) : (
                filteredIncomes.map((r, idx) => {
                  const { cleanName, classC, classB } = getClasses(r);
                  return (
                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                            {cleanName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-sm truncate">{cleanName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {classC ? `Lớp C: ${classC}` : ''} {classC && classB ? '•' : ''} {classB ? `Lớp B: ${classB}` : ''}
                              {!classC && !classB ? 'Hành khách' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {r.amount && r.amount > 0
                            ? <p className="font-black text-emerald-600 text-sm">+{r.amount.toLocaleString('vi-VN')}đ</p>
                            : <p className="text-slate-300 text-xs">—</p>
                          }
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {r.will_attend === 'yes'
                          ? <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold uppercase tracking-wider">Sẽ về</span>
                          : <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase tracking-wider">Vắng</span>
                        }
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Contact Committee Data ──
const contactData = [
  { group: 'Trưởng Ban liên lạc', representatives: ['Hiếu: 0972.612.979', 'Lệ: 0976.976.959'] },
  { group: '12C1', representatives: ['Nhật: 0918.905.309', 'Cường: 0914.142.252'] },
  { group: '12C2', representatives: ['Mỹ: 0938.507.988', 'Thư: 0962.222.989'] },
  { group: '12C3', representatives: ['Thạnh: 0388.233.299'] },
  { group: '12C4', representatives: ['Hiếu: 0972.612.979'] },
  { group: '12C5', representatives: ['Tuân: 0935.263.911'] },
  { group: '12C6', representatives: ['Hải: 0916.768.676'] },
  { group: '12C7', representatives: ['Phát: 0888.188.928'] },
  { group: '12C8', representatives: ['Trình: 0974.745.483'] },
  { group: '12C9', representatives: ['Tùng: 0934.885.537'] },
  { group: '12C10', representatives: ['Thư: 0988.761.357'] },
  { group: '12C11', representatives: ['Kiều: 0973.697.736'] },
  { group: '12C12', representatives: ['Quý: 0974.489.461'] },
  { group: '12C13', representatives: ['Phước: 0935.478.464'] },
  { group: '10-11B1', representatives: ['Quyên: 0973.117.337'] },
  { group: '10-11B2', representatives: ['Du: 0933.413.486'] },
  { group: '10-11B3', representatives: ['Chương: 0389.834.350'] },
  { group: '10-11B4', representatives: ['Hải: 0916.768.676', 'Phát: 0888.188.928'] },
  { group: '10-11B5', representatives: ['Oanh: 0979.529.986'] },
  { group: '10-11B6', representatives: ['Nhi: 0914.991.683'] },
  { group: '10-11B7', representatives: ['Cường: 0914.142.252'] },
  { group: '10-11B8', representatives: ['Viễn: 0368.671.004'] },
  { group: '10-11B9', representatives: ['Trình: 0974.745.483'] },
  { group: '10-11B10', representatives: ['Thư: 0988.761.357'] },
  { group: '10-11B11', representatives: ['Tùng: 0934.885.537'] },
  { group: '10-11B12', representatives: ['Tuân: 0935.263.911'] },
  { group: '10-11B13', representatives: ['Kiều: 0973.697.736'] },
  { group: '10-11B14', representatives: ['Phước: 0935.478.464'] },
  { group: '10-11B15', representatives: ['Vân: 0888.697.307'] },
];

export default function DangKyPage() {
  const [formData, setFormData] = useState({ name: '', phone: '', willAttend: 'yes', memory: '', classC: '', classB: '' });
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'finance' | 'contacts'>('home');
  const [isScrolled, setIsScrolled] = useState(false);

  // Receipt upload & AI scan state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState<{ name?: string; phone?: string; amount?: string; saved?: boolean } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Appearance State — Media
  const [logoImage, setLogoImage] = useState('/logo.png');
  const [heroVideo, setHeroVideo] = useState('https://assets.mixkit.co/videos/preview/mixkit-sun-shining-through-the-leaves-of-a-tree-in-the-8238-large.mp4');
  const [heroImage, setHeroImage] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuDZoPSErlIW76V6LcqZOGcZpJBCnf6FZigCs3HEaMg2weA6-2IxA7FmMkWn8GKmrDp8x4eKykLkKi6pMMYAKte8jiSzDdEyMDQ3_L7ps_23KZSfnM4HRugAjjZ0GQJds-5oliYGXvrrUscfJnw1SQSYNjQmdnduHl9CuC1WYcQILIDNANUuoW2ApyVasYm_Huqdb93Q9mawRd4jS4Bz8ZBFgViVGlsvqlCJ6qXLpF8CyhowDZmAHPaNfRGpU_Dfsd3jG-fxFUfCEOUyo');
  const [photo1, setPhoto1] = useState('https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop');
  const [photo2, setPhoto2] = useState('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop');
  const [photo3, setPhoto3] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop');

  // Appearance State — Content
  const [siteTitle, setSiteTitle] = useState('Tìm Lại Thanh Xuân');
  const [siteSubtitle, setSiteSubtitle] = useState('(2003 – 2006)');
  const [siteTagline, setSiteTagline] = useState('"Trở Về - Kết Nối"');
  const [heroBadge, setHeroBadge] = useState('Thư Ngỏ Hội Khóa 2003–2006');
  const [eventDate, setEventDate] = useState('12/7');
  const [letterOpening, setLetterOpening] = useState('Gửi những người bạn đã đi cùng nhau một đoạn thanh xuân,');
  const [bankName, setBankName] = useState('Ngân hàng Techcombank');
  const [bankAccount, setBankAccount] = useState('1902 3345 8880 12');
  const [bankHolder, setBankHolder] = useState('LE QUOC HUY');
  const [bankId2, setBankId2] = useState('TCB');
  const [bankNo2, setBankNo2] = useState('19023345888012');
  const [donationAmount, setDonationAmount] = useState('1000000');


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Load settings from Supabase first, fallback to localStorage
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*');
        if (data && data.length > 0) {
          const map: Record<string,string> = {};
          data.forEach((row: {key:string;value:string}) => { map[row.key] = row.value; });
          if (map['logo_image']) setLogoImage(map['logo_image']);
          if (map['hero_image']) setHeroImage(map['hero_image']);
          if (map['hero_video']) setHeroVideo(map['hero_video']);
          if (map['photo1']) setPhoto1(map['photo1']);
          if (map['photo2']) setPhoto2(map['photo2']);
          if (map['photo3']) setPhoto3(map['photo3']);
          if (map['site_title']) setSiteTitle(map['site_title']);
          if (map['site_subtitle']) setSiteSubtitle(map['site_subtitle']);
          if (map['site_tagline']) setSiteTagline(map['site_tagline']);
          if (map['hero_badge']) setHeroBadge(map['hero_badge']);
          if (map['event_date']) setEventDate(map['event_date']);
          if (map['letter_opening']) setLetterOpening(map['letter_opening']);
          if (map['bank_name']) setBankName(map['bank_name']);
          if (map['bank_account']) setBankAccount(map['bank_account']);
          if (map['bank_holder']) setBankHolder(map['bank_holder']);
          if (map['bank_id_qr']) setBankId2(map['bank_id_qr']);
          if (map['bank_no_qr']) setBankNo2(map['bank_no_qr']);
          if (map['donation_amount']) setDonationAmount(map['donation_amount']);
        } else {
          // Fallback to localStorage
          const load = (key: string, setter: (v: string) => void) => { const v = localStorage.getItem(key); if (v) setter(v); };
          load('appearance_heroVideo', setHeroVideo);
          load('appearance_photo1', setPhoto1);
          load('appearance_photo2', setPhoto2);
          load('content_siteTitle', setSiteTitle);
          load('content_siteSubtitle', setSiteSubtitle);
          load('content_siteTagline', setSiteTagline);
          load('content_heroBadge', setHeroBadge);
          load('content_eventDate', setEventDate);
          load('content_letterOpening', setLetterOpening);
          load('content_bankName', setBankName);
          load('content_bankAccount', setBankAccount);
          load('content_bankHolder', setBankHolder);
          load('content_bankId2', setBankId2);
          load('content_bankNo2', setBankNo2);
          load('content_donationAmount', setDonationAmount);
        }
      } catch(e) {
        console.error('Lỗi tải settings:', e);
      }
    };
    loadSettings();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (!receiptFile) {
      alert('Vui lòng đính kèm ảnh biên lai chuyển khoản để hoàn tất đăng ký!');
      return;
    }

    try {
      setAiScanning(true);
      let donatedAmount = parseInt(donationAmount || '0');

      // 1. Bỏ qua AI Scan (đã được yêu cầu lược bỏ)
      /* 
      if (receiptFile) {
        // ... logic AI đã bị loại bỏ ...
      }
      */

      // 1.5. Upload ảnh lên Supabase Storage
      let uploadedReceiptUrl = '';
      if (receiptFile) {
        try {
          const fileExt = receiptFile.name.split('.').pop();
          const fileName = `receipt-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('site-assets')
            .upload(`receipts/${fileName}`, receiptFile);
            
          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage.from('site-assets').getPublicUrl(`receipts/${fileName}`);
            uploadedReceiptUrl = publicUrlData.publicUrl;
          } else {
             console.error('Lỗi upload ảnh:', uploadErr);
          }
        } catch(err) {
          console.error('Lỗi quá trình upload:', err);
        }
      }

      // 2. Ghi nhận đăng ký
      const { data: existingReg } = await supabase
        .from('registrations')
        .select('id, amount, receipt_url')
        .eq('phone', formData.phone)
        .maybeSingle();

      if (existingReg) {
         // Cập nhật
         const { error: updateErr } = await supabase
           .from('registrations')
           .update({ 
             name: formData.name,
             class_c: formData.classC,
             class_b: formData.classB,
             will_attend: formData.willAttend,
             memory: formData.memory,
             amount: donatedAmount > 0 ? donatedAmount : existingReg.amount,
             receipt_url: uploadedReceiptUrl || existingReg.receipt_url
           })
           .eq('id', existingReg.id);
         if (updateErr) throw updateErr;
      } else {
         // Thêm mới
         const { error: regError } = await supabase.from('registrations').insert([{
           name: formData.name,
           class_c: formData.classC,
           class_b: formData.classB,
           phone: formData.phone,
           will_attend: formData.willAttend,
           memory: formData.memory,
           amount: donatedAmount,
           receipt_url: uploadedReceiptUrl
         }]);
         if (regError) throw regError;
      }

      // 3. Ghi nhận khoản thu
      if (donatedAmount > 0) {
        const now = new Date();
        const dateStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}, ${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}`;
        const noteMsg = receiptFile 
          ? `Đóng góp quỹ hội — đăng ký từ trang chủ (AI đọc biên lai ${donatedAmount.toLocaleString('vi-VN')}đ)`
          : `Đóng góp quỹ hội — đăng ký từ trang chủ`;

        await supabase.from('transactions').insert([{
          date: dateStr,
          name: formData.name,
          class_c: formData.classC,
          class_b: formData.classB,
          phone: formData.phone,
          amount: donatedAmount,
          type: 'IN',
          status: 'PENDING',
          note: noteMsg
        }]);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Lỗi khi gửi đăng ký:', err);
      alert('Đã xảy ra lỗi khi gửi đăng ký, vui lòng thử lại!');
    } finally {
      setAiScanning(false);
    }
  };

  // Handle receipt image selection
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setAiResult(null);
    setAiError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setHeroImage(localUrl);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await supabase.from('site_settings').upsert({ key: 'hero_image', value: base64 }, { onConflict: 'key' });
      } catch (err) {
        console.error('Failed to save hero image:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setLogoImage(localUrl);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await supabase.from('site_settings').upsert({ key: 'logo_image', value: base64 }, { onConflict: 'key' });
      } catch (err) {
        console.error('Failed to save logo image:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      {/* TopAppBar */}
      <header className="bg-surface/80 backdrop-blur-2xl border-b border-outline-variant/20 shadow-sm top-0 z-50 sticky transition-all duration-300">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 w-full max-w-7xl mx-auto">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 md:gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoImage} alt="logo" className="w-9 h-9 md:w-11 md:h-11 rounded-full object-cover shrink-0 shadow-sm border border-outline-variant/30 group-hover:scale-105 transition-transform duration-300" />
            <div className="flex flex-col justify-center">
              <h1 className="font-headline text-lg md:text-2xl text-primary tracking-tight leading-none group-hover:text-primary-fixed-dim transition-colors">THPT BÌNH SƠN</h1>
              <p className="text-[10px] md:text-xs text-on-surface-variant font-medium md:tracking-widest md:uppercase mt-0.5 opacity-80">Hội khóa 2003–2006</p>
            </div>
          </div>

          {/* Desktop Navigation (Pill shape) */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-container-lowest/50 p-1.5 rounded-full border border-outline-variant/30 shadow-inner">
            <button 
              onClick={() => setActiveTab('home')}
              className={`font-bold transition-all duration-300 px-6 py-2 rounded-full text-sm flex items-center gap-2 ${activeTab === 'home' ? 'bg-primary text-white shadow-md scale-100' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 scale-95 hover:scale-100'}`}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Thư ngỏ
            </button>
            <button 
              onClick={() => setActiveTab('plan')}
              className={`font-bold transition-all duration-300 px-6 py-2 rounded-full text-sm flex items-center gap-2 ${activeTab === 'plan' ? 'bg-primary text-white shadow-md scale-100' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 scale-95 hover:scale-100'}`}
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              Kế hoạch
            </button>
            <button 
              onClick={() => setActiveTab('finance')}
              className={`font-bold transition-all duration-300 px-6 py-2 rounded-full text-sm flex items-center gap-2 ${activeTab === 'finance' ? 'bg-primary text-white shadow-md scale-100' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 scale-95 hover:scale-100'}`}
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              Tài chính
            </button>
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`font-bold transition-all duration-300 px-6 py-2 rounded-full text-sm flex items-center gap-2 ${activeTab === 'contacts' ? 'bg-primary text-white shadow-md scale-100' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5 scale-95 hover:scale-100'}`}
            >
              <span className="material-symbols-outlined text-[18px]">people</span>
              Ban liên lạc
            </button>
          </nav>

          {/* Login Button */}
          <a 
            href="/login"
            className="group relative overflow-hidden bg-primary text-on-primary px-5 md:px-7 py-2 md:py-2.5 rounded-full font-title text-sm md:text-base active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30"
          >
            <span className="relative z-10 font-bold tracking-wide">Đăng nhập</span>
            <span className="material-symbols-outlined text-[18px] relative z-10 group-hover:translate-x-1 transition-transform hidden md:inline-block">login</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
          </a>
        </div>
      </header>

      {/* Hero Section: Edge-to-edge */}
      <section className="relative w-full overflow-hidden min-h-[420px] md:min-h-[530px] flex items-center justify-center text-center p-4 md:p-8 group">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroImage}
            alt="Nostalgic railway"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-primary/80"></div>
        </div>
        
        {/* Upload Button overlay */}
        <label className="absolute top-4 right-4 md:top-8 md:right-8 z-30 bg-black/40 hover:bg-black/70 text-white px-4 py-2 rounded-full cursor-pointer backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-sm shadow-lg border border-white/20">
          <span className="material-symbols-outlined text-lg">photo_camera</span>
          <span className="hidden md:block font-medium">Thay ảnh bìa</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
        </label>

        <div className="relative z-10 max-w-5xl w-full flex flex-col items-center">
          <div className="flex flex-col items-center mb-4 md:mb-6">
            <label className="relative group/logo cursor-pointer block">
              <Image
                src={logoImage}
                alt="Logo Bình Sơn"
                width={180}
                height={180}
                className="object-contain drop-shadow-2xl bg-white/10 p-2 w-36 h-36 md:w-[180px] md:h-[180px] transition-all group-hover/logo:opacity-80"
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">upload</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoImageUpload} />
            </label>
          </div>
          <h2 className="font-display text-3xl md:text-6xl text-white mb-2 md:mb-3 drop-shadow-lg text-center leading-tight">
            Chuyến tàu thanh xuân
          </h2>
          <p className="font-display text-lg md:text-3xl text-white/90 mb-4 md:mb-6 drop-shadow text-center font-medium tracking-wide">
            Kỷ niệm 20 năm ngày ra trường
          </p>
          <div className="mt-2 md:mt-4 inline-flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-2 md:px-10 md:py-3 rounded-full border border-white/30 shadow-2xl animate-bounce-slow">
            <span className="material-symbols-outlined text-white text-lg md:text-2xl">calendar_month</span>
            <span className="text-white text-lg md:text-3xl font-black tracking-widest drop-shadow-md">NGÀY 11-12/07/2026</span>
          </div>
        </div>
      </section>

      <main className="max-w-container-max mx-auto px-3 md:px-margin-desktop py-4 md:py-stack-lg">

      {/* Main Content */}
      <div id="content" className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-30 pb-16 md:pb-8">
        
        {/* Tab 1: Thư Ngỏ & Đăng Ký */}
        {activeTab === 'home' && (
          <>
          <div className="animate-in fade-in duration-700">
              <div className="max-w-4xl mx-auto space-y-12">
                
                {/* Letter Header */}
                <div className="text-center space-y-4">
                  <span className="material-symbols-outlined text-primary text-5xl mb-2 opacity-50">history_edu</span>
                  <h3 className="font-headline text-2xl md:text-4xl text-primary italic leading-tight">
                    "Gửi những người bạn đã đi cùng nhau một đoạn thanh xuân,"
                  </h3>
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div className="glass-card p-8 rounded-2xl border-l-4 border-primary bg-gradient-to-br from-white to-primary/5 shadow-xl shadow-primary/5 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                    <p className="text-on-surface-variant leading-relaxed text-lg relative z-10">
                      Đã gần 20 năm kể từ ngày chuyến tàu mang tên <span className="text-primary font-bold">“2003-2006”</span> rời sân ga THPT Bình Sơn năm ấy – nơi có tiếng trống quen thuộc, những buổi sáng vội vàng, những giờ ra chơi ồn ào, và những gương mặt mà chỉ cần nhìn lại là thấy lòng mình ấm lên.
                    </p>
                  </div>
                  <div className="relative h-72 rounded-2xl overflow-hidden shadow-2xl scrapbook-rotate-right transform hover:rotate-0 transition-transform duration-500">
                    <Image src={photo1} alt="Kỷ niệm" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                      <p className="text-white font-title italic text-sm">Sân ga thanh xuân 2003-2006</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-10 rounded-2xl relative overflow-hidden border border-outline-variant/30">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl -mr-24 -mt-24" />
                  <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                      <h4 className="font-title text-2xl text-secondary flex items-center gap-3">
                        <span className="material-symbols-outlined">train</span>
                        Khóa 2003–2006 của chúng ta đặc biệt lắm.
                      </h4>
                      <p className="text-on-surface-variant leading-relaxed text-lg italic border-l-4 border-secondary/30 pl-6 py-2 bg-secondary/5 rounded-r-xl">
                        Chúng ta từng ngồi chung “toa” suốt năm 10 – 11, nhưng lên 12 lại mỗi đứa mỗi “toa”.<br/>
                        Có người chuyển lớp, có người chuyển trường, có người đi xa…<br/>
                        Và rồi thời gian cứ thế cuốn mỗi đứa vào một hành trình khác nhau.
                      </p>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                      <p className="text-on-surface-variant leading-relaxed text-lg flex items-start gap-4">
                        <span className="material-symbols-outlined text-primary mt-1">favorite</span>
                        <span>
                          Nhưng có những điều, dù đi bao lâu cũng không mất. Những nụ cười năm ấy – Những ánh mắt quen thuộc – Những cảm giác gần gũi Khi gặp lại người bạn cũ!
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Highlight Quote */}
                <div className="bg-primary text-on-primary p-12 rounded-[2rem] text-center shadow-2xl relative group overflow-hidden border border-white/10">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary opacity-90" />
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-2xl md:text-4xl font-headline leading-tight">
                      Ngày <span className="text-secondary-fixed font-bold underline underline-offset-8 decoration-secondary-fixed/50">12/7</span>, chúng ta sẽ có một cơ hội hiếm hoi – một ngày để trở về, để kết nối, để ghép lại những mảnh ký ức, để sống thêm một lần nữa những điều đẹp nhất của tuổi học trò. Hội khóa 2003–2006 không chỉ là một buổi họp mặt. Đó là ngày đoàn tàu thanh xuân của chúng ta tập hợp lại đầy đủ, để nhắc rằng: <span className="text-secondary-fixed">Chúng ta đã từng là một phần của nhau – và mãi là của nhau.</span>
                    </h3>
                    <div className="w-20 h-1 bg-white/30 mx-auto rounded-full" />
                    <p className="text-xl md:text-2xl opacity-90 font-medium font-title">
                      Nếu bạn đã từng nghĩ "để khi khác"… Thì đây chính là "khi khác" mà chúng ta đã chờ rất lâu.
                    </p>
                  </div>
                </div>

                {/* Closing Sections */}
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="glass-card p-8 rounded-2xl flex flex-col gap-6 border-b-4 border-orange-500 bg-orange-50/20">
                      <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-orange-600 text-3xl">favorite</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho chính mình - những tháng năm học trò.</p>
                        <p className="text-on-surface-variant leading-relaxed font-medium">Hãy dành một ngày cho những người bạn từng rất thân - rồi xa nhau lúc nào không hay.</p>
                      </div>
                   </div>
                   <div className="glass-card p-8 rounded-2xl flex flex-col gap-6 border-b-4 border-primary bg-primary/5">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-lg font-medium">
                        Hãy cùng nối lại những toa tàu, viết hành trình cho chuyến tàu <span className="text-primary font-bold">"2003-2006"</span> ngày ấy.
                      </p>
                   </div>
                </div>

                {/* Final Call to Action */}
                <div className="text-center space-y-10 py-12 border-t border-outline-variant/30 relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-background px-6">
                    <span className="material-symbols-outlined text-primary/30 text-4xl">local_shipping</span>
                  </div>
                  
                  <p className="text-2xl md:text-3xl font-headline text-primary font-bold max-w-2xl mx-auto leading-relaxed">
                    Hãy cùng nối lại những toa tàu, viết hành trình cho chuyến tàu “2003-2006” ngày ấy.
                  </p>
                  
                  <button 
                    onClick={() => document.getElementById('registration-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group bg-primary text-white font-title text-xl py-6 px-12 md:px-20 rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary-container hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto"
                  >
                    Xác nhận tham gia ngay
                    <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
                  </button>
                </div>

              </div>
            </div>
{/* Registration Section */}
            <div id="registration-section" className="mt-16 mb-20 relative">
              {submitted ? (
                /* ===== THANK YOU SCREEN ===== */
                <div className="relative bg-primary rounded-xl overflow-hidden shadow-2xl">
                  {/* Decorative background elements */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                  </div>

                  <div className="relative z-10 px-6 md:px-12 py-12 md:py-16 text-center flex flex-col items-center">
                    {/* Success icon */}
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mx-auto">
                        <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
                      </div>
                      <div className="absolute inset-0 w-24 h-24 bg-white/20 rounded-full mx-auto animate-ping" style={{animationDuration:'2s'}} />
                    </div>

                    {/* Headline */}
                    <span className="text-secondary-fixed text-label-sm font-bold uppercase tracking-[0.3em] mb-4 block">Đăng ký hoàn thành</span>
                    <h3 className="text-4xl md:text-5xl font-display text-white mb-4 tracking-tight">
                      Cảm ơn, <span className="text-secondary-fixed">{formData.name}</span>!
                    </h3>
                    <p className="text-primary-fixed text-lg mb-12 font-medium">
                      {formData.phone}
                      {aiResult?.amount && parseInt(aiResult.amount.replace(/\D/g,'') || '0') > 0
                        ? ` · Đóng góp: ${parseInt(aiResult.amount.replace(/\D/g,'')||'0').toLocaleString('vi-VN')}đ ✓`
                        : ''
                      }
                    </p>

                    {/* Poetic divider */}
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-white to-transparent mb-12" />

                    {/* The poetic message */}
                    <div className="max-w-2xl mx-auto space-y-6">
                      <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed italic font-headline">
                        "Chúng ta sẽ chờ bạn.<br className="hidden md:block" />
                        Và thanh xuân cũng đang chờ bạn nữa."
                      </p>
                      <div className="w-8 h-px bg-white/40 mx-auto" />
                      <p className="text-lg md:text-xl text-primary-fixed font-medium leading-relaxed">
                        Hẹn gặp lại vào ngày <span className="text-secondary-fixed font-bold">{eventDate}</span>.
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

                    {/* Event info pills */}
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                      <span className="flex items-center gap-2 bg-white/10 text-white/80 text-label-sm px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        Ngày {eventDate}
                      </span>
                      <span className="flex items-center gap-2 bg-white/10 text-white/80 text-label-sm px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        Trường THPT Bình Sơn
                      </span>
                    </div>

                    {/* BTC signature */}
                    <p className="text-primary-fixed/50 text-[10px] uppercase tracking-[0.3em] font-bold">
                      Ban Tổ Chức Hội Khóa 2003–2006
                    </p>
                  </div>
                </div>

              ) : (
                <div className="bg-surface-container rounded-xl p-3 md:p-10 border border-outline-variant/30 shadow-sm">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-4xl font-headline flex flex-col md:flex-row items-center justify-center text-primary tracking-tight gap-4">
                      <span className="w-14 h-14 bg-primary-fixed text-on-primary-fixed rounded-full flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-3xl">edit_note</span>
                      </span>
                      <span>Xác nhận tham dự của bạn</span>
                    </h2>
                    <p className="text-on-surface-variant mt-4 font-body max-w-3xl md:whitespace-nowrap mx-auto">Vui lòng điền thông tin và đóng góp quỹ hội để BTC chuẩn bị đón tiếp chu đáo nhất</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
                    {/* Form */}
                    <div className="flex flex-col justify-center">
                      <form id="registration-form" onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-label-sm font-bold text-on-surface mb-2 uppercase tracking-wide">Họ và tên *</label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-on-surface font-body placeholder-on-surface-variant/40"
                          placeholder="VD: Nguyễn Văn A"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="classC" className="block text-label-sm font-bold text-on-surface mb-2 uppercase tracking-wide">Lớp C</label>
                          <select
                            id="classC"
                            value={formData.classC}
                            onChange={(e) => setFormData({...formData, classC: e.target.value})}
                            className="w-full px-5 py-4 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-on-surface font-body appearance-none cursor-pointer"
                          >
                            <option value="">Chọn lớp</option>
                            {Array.from({ length: 13 }, (_, i) => `C${i + 1}`).map(cls => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="classB" className="block text-label-sm font-bold text-on-surface mb-2 uppercase tracking-wide">Lớp B</label>
                          <select
                            id="classB"
                            value={formData.classB}
                            onChange={(e) => setFormData({...formData, classB: e.target.value})}
                            className="w-full px-5 py-4 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-on-surface font-body appearance-none cursor-pointer"
                          >
                            <option value="">Chọn lớp</option>
                            {Array.from({ length: 15 }, (_, i) => `B${i + 1}`).map(cls => (
                              <option key={cls} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-label-sm font-bold text-on-surface mb-2 uppercase tracking-wide">Số điện thoại *</label>
                        <input
                          type="tel"
                          id="phone"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-on-surface font-body placeholder-on-surface-variant/40"
                          placeholder="VD: 0912 345 678"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface mb-2 uppercase tracking-wide">Bạn sẽ về trường chứ?</label>
                        <div className="flex flex-col space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input type="radio" name="willAttend" value="yes" checked={formData.willAttend === 'yes'} onChange={(e) => setFormData({...formData, willAttend: e.target.value})} className="w-5 h-5 text-primary focus:ring-primary border-outline-variant" />
                            <span className="text-on-surface font-body">Chắc chắn có!</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input type="radio" name="willAttend" value="no" checked={formData.willAttend === 'no'} onChange={(e) => setFormData({...formData, willAttend: e.target.value})} className="w-5 h-5 text-primary focus:ring-primary border-outline-variant" />
                            <span className="text-on-surface font-body">Tiếc quá, mình bận mất rồi</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="memory" className="block text-label-sm font-bold text-on-surface mb-2 uppercase tracking-wide">Vài dòng kỷ niệm của bạn</label>
                        <textarea
                          id="memory"
                          rows={3}
                          value={formData.memory}
                          onChange={(e) => setFormData({...formData, memory: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-on-surface font-body placeholder-on-surface-variant/40 resize-none"
                          placeholder="Chia sẻ một kỷ niệm đáng nhớ nhất của bạn nhé..."
                        />
                      </div>


                      <button
                        type="submit"
                        disabled={aiScanning}
                        className={`w-full py-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-lg hidden md:flex items-center justify-center space-x-2 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] mt-4 ${aiScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {aiScanning ? (
                          <>
                            <span>Đang xử lý...</span>
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          </>
                        ) : (
                          <>
                            <span>Gửi Đăng Ký Ngay</span>
                            <span className="material-symbols-outlined">send</span>
                          </>
                        )}
                      </button>
                    </form>
                    </div>

                    {/* QR Code and Payment */}
                    <div className="flex flex-col items-center justify-center bg-surface rounded-xl p-4 md:p-8 border border-outline-variant/30 shadow-sm">
                      <div className="flex items-center justify-center space-x-3 mb-6">
                         <span className="material-symbols-outlined text-primary">credit_card</span>
                         <h3 className="text-xl font-bold text-on-surface font-title">Thông tin đóng góp</h3>
                      </div>
                      <div className="w-full text-center mb-4">
                        <label className="block text-label-sm font-bold text-on-surface mb-2 uppercase tracking-wide">Số tiền đóng góp (VNĐ)</label>
                        <input
                          type="text"
                          value={donationAmount ? parseInt(donationAmount.replace(/\D/g, '') || '0').toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            setDonationAmount(rawValue);
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-primary font-body text-center font-bold text-lg"
                          placeholder="Nhập số tiền..."
                        />
                        <p className="text-[10px] text-on-surface-variant mt-2 italic">Mã QR sẽ tự động cập nhật theo số tiền bạn nhập</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl shadow-lg border border-outline-variant/20 mb-6 relative group transform hover:scale-[1.02] transition-transform">
                        <Image
                           src={`https://img.vietqr.io/image/${bankId2}-${bankNo2}-compact2.png?amount=${donationAmount}&addInfo=${encodeURIComponent(formData.name && formData.phone ? `${formData.name} - ${formData.phone}` : 'Dong gop quy hoi')}&accountName=${encodeURIComponent(bankHolder)}`}
                           alt="QR Code Thanh Toán"
                           width={240}
                           height={240}
                           className="rounded-xl"
                           unoptimized
                        />
                      </div>
                      <div className="w-full text-center space-y-1">
                         <div className="mt-4 inline-block bg-primary-fixed/30 px-4 py-3 rounded-xl border border-primary-fixed-dim/50 w-full">
                            <p className="text-[10px] font-bold text-primary uppercase mb-1">Nội dung chuyển khoản</p>
                            <p className="text-sm font-mono font-bold text-on-surface tracking-tight">{formData.name && formData.phone ? `${formData.name} - ${formData.phone}` : '[Họ Tên] - [Số điện thoại]'}</p>
                         </div>
                      </div>

                      {/* Receipt Upload + AI Scan - in payment column */}
                      <div className="w-full mt-4 rounded-xl border-2 border-dashed border-primary-fixed-dim bg-primary-fixed/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-label-sm font-bold text-on-surface uppercase tracking-wide flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-xl">camera_alt</span>
                              Ảnh biên lai chuyển khoản
                            </p>
                            <p className="text-[10px] text-rose-500 mt-0.5">Bắt buộc — Dùng để đối soát và ghi nhận đóng góp</p>
                          </div>
                          {receiptPreview && (
                            <button
                              type="button"
                              onClick={() => { setReceiptFile(null); setReceiptPreview(null); setAiResult(null); setAiError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                              className="text-slate-400 hover:text-rose-500 transition"
                            ><span className="material-symbols-outlined text-sm">close</span></button>
                          )}
                        </div>
                        {!receiptPreview ? (
                          <label className="flex flex-col items-center justify-center w-full h-28 bg-white border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-primary-fixed/30 transition-all group">
                            <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-primary mb-2 transition">photo_camera</span>
                            <span className="text-xs text-slate-400 font-medium">Chụp hoặc chọn ảnh biên lai</span>
                            <span className="text-[10px] text-slate-300 mt-0.5">JPG, PNG, WEBP</span>
                            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceiptChange} />
                          </label>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                              <img src={receiptPreview} alt="Biên lai" className="w-full h-full object-contain" />
                            </div>
                            {aiError && (
                              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-rose-500 text-xl mt-0.5 shrink-0">cancel</span>
                                <div>
                                  <p className="text-xs font-bold text-rose-700 mb-0.5 uppercase tracking-wide">⚠️ Ảnh chuyển khoản không hợp lệ</p>
                                  <p className="text-xs text-rose-600">{aiError}</p>
                                  <p className="text-[10px] text-rose-400 mt-1 italic">Vui lòng bấm ✕ để xóa ảnh và tải lên ảnh biên lai đúng.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Mobile Submit Button (shows below QR on mobile) */}
                  <button
                    type="submit"
                    form="registration-form"
                    disabled={aiScanning}
                    className={`w-full mt-6 py-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-lg flex md:hidden items-center justify-center space-x-2 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] ${aiScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {aiScanning ? (
                      <>
                        <span>Đang xử lý...</span>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      </>
                    ) : (
                      <>
                        <span>Gửi Đăng Ký Ngay</span>
                        <span className="material-symbols-outlined">send</span>
                      </>
                    )}
                  </button>

                </div>
              )}
            </div>


          </>
        )}


        {/* Tab 2: Kế Hoạch Chuyến Tàu */}
        {activeTab === 'plan' && (
          <div className="animate-in fade-in duration-700 space-y-12 mb-16">
            <div className="text-center mb-12">
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-3 block">Lịch trình chi tiết</span>
              <h2 className="text-4xl font-headline text-primary tracking-tight">Hành Trình Hội Ngộ</h2>
              <p className="text-on-surface-variant mt-4 max-w-lg mx-auto italic">"Trở về để kết nối - Kết nối để sẻ chia"</p>
            </div>

            {/* Hoạt động bên lề */}
            <div className="max-w-4xl mx-auto bg-primary/5 rounded-3xl p-8 border border-primary/10">
              <h3 className="font-title text-xl text-primary mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined">volunteer_activism</span>
                Hoạt động bên lề sự kiện
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-orange-600 text-xl">person_search</span>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">Thăm hỏi các thầy cô giáo cũ, tri ân những người đưa đò thầm lặng.</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-600 text-xl">handshake</span>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">Thăm hỏi và động viên các bạn có hoàn cảnh khó khăn trong niên khóa.</p>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-16">
              {/* Day 1 */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <div className="bg-white border-2 border-primary px-6 py-2 rounded-full shadow-sm">
                    <span className="text-primary font-black uppercase tracking-widest text-sm">Ngày trước sự kiện: 11/7/2026</span>
                  </div>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div className="relative border-l-2 border-primary/20 pl-8 md:pl-12 ml-4">
                  <div className="relative">
                    <div className="absolute -left-[41px] md:-left-[57px] w-4 h-4 bg-primary rounded-full ring-4 ring-white shadow-sm"></div>
                    <div className="glass-card p-6 md:p-8 rounded-2xl border border-outline-variant/30 hover:shadow-xl transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-primary">Gặp gỡ tiền sự kiện</h3>
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-black mt-2 md:mt-0 tracking-wider">09:00 - 11:00</span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed">Nhận áo đồng phục, tham quan và cùng nhau trang trí lại lớp học năm xưa – nơi lưu giữ những ký ức thanh xuân.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day 2 */}
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <div className="bg-primary text-white px-6 py-2 rounded-full shadow-md">
                    <span className="font-black uppercase tracking-widest text-sm">Ngày sự kiện chính: 12/7/2026</span>
                  </div>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div className="relative border-l-2 border-primary/20 pl-8 md:pl-12 ml-4 space-y-8">
                  {[
                    { time: '07:30 - 08:00', title: 'Đón tiếp – “Ký ức vui vẻ”', desc: 'Chào đón quý thầy cô và cựu học sinh, giao lưu thân mật, thưởng thức cà phê sáng tại sân trường.', icon: 'coffee' },
                    { time: '08:00 - 08:20', title: 'Văn nghệ khai màn', desc: 'Những tiết mục đặc sắc chào mừng ngày hội ngộ.', icon: 'music_note' },
                    { time: '08:20 - 08:40', title: 'Khai mạc chương trình', desc: 'Tuyên bố lý do, giới thiệu đại biểu và bắt đầu buổi lễ.', icon: 'campaign' },
                    { time: '08:40 - 08:50', title: 'Tri ân thầy cô', desc: 'Đại diện học sinh phát biểu cảm nghĩ và lòng biết ơn sâu sắc.', icon: 'auto_awesome' },
                    { time: '08:50 - 09:00', title: 'Hành trình ký ức', desc: 'Trình chiếu video kỷ niệm – những hình ảnh xưa và nay đầy xúc động.', icon: 'movie' },
                    { time: '09:00 - 09:15', title: 'Lễ tri ân', desc: 'Tặng hoa và giao lưu chia sẻ cùng quý thầy cô giáo.', icon: 'volunteer_activism' },
                    { time: '09:15 - 09:25', title: 'Quỹ khuyến học', desc: 'Trao Quỹ khuyến học cho nhà trường nhằm hỗ trợ các thế hệ đàn em.', icon: 'school' },
                    { time: '09:25 - 09:40', title: 'Vinh danh nhà tài trợ', desc: 'Tặng hoa, kỷ niệm chương cho các Nhà tài trợ đồng hành cùng chương trình.', icon: 'workspace_premium' },
                    { time: '09:40 - 09:50', title: 'Gắn kết tập thể', desc: 'Vinh danh lớp có số lượng thành viên tham dự đông nhất.', icon: 'groups' },
                    { time: '09:50 - 10:00', title: 'Kết nối truyền thống', desc: 'Trao cờ luân lưu cho khóa tiếp theo (2004-2007).', icon: 'flag' },
                    { time: '10:00 - 10:10', title: 'Phát biểu của Nhà trường', desc: 'Đại diện Ban Giám hiệu Nhà trường phát biểu chúc mừng.', icon: 'mic' },
                    { time: '10:10 - 10:50', title: 'Trở về lớp cũ (khối 11)', desc: 'Ngồi lại chỗ xưa, ôn lại những kỷ niệm thân thương cùng bạn bè lớp 11.', icon: 'meeting_room' },
                    { time: '10:50 - 11:30', title: 'Trở về lớp cũ (khối 12)', desc: 'Tiếp nối hành trình ký ức, gặp lại những gương mặt gắn bó năm cuối cấp.', icon: 'history' },
                    { time: '11:30 - 14:00', title: 'Tiệc thân mật & Văn nghệ', desc: 'Giao lưu, chia sẻ, thưởng thức bữa trưa ấm cúng và chương trình văn nghệ.', icon: 'restaurant' },
                    { time: '14:00', title: 'Chụp ảnh lưu niệm – Bế mạc', desc: 'Ghi lại khoảnh khắc hội ngộ cuối cùng và khép lại chương trình.', icon: 'photo_camera' },
                  ].map((item, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[41px] md:-left-[57px] w-4 h-4 bg-white border-2 border-primary rounded-full group-hover:bg-primary transition-colors shadow-sm"></div>
                      <div className="glass-card p-4 md:p-6 rounded-2xl border border-outline-variant/30 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-primary/5 transition-colors">
                            <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                              <h4 className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors leading-tight">
                                {item.title}
                              </h4>
                              <span className="text-[10px] md:text-xs font-black text-slate-400 whitespace-nowrap bg-slate-50 px-3 py-1 rounded-full border border-slate-100 group-hover:text-primary group-hover:border-primary/20 transition-all w-fit">
                                {item.time}
                              </span>
                            </div>
                            <p className="text-on-surface-variant text-sm leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tài Chính Thu Chi */}
        {activeTab === 'finance' && (
          <div className="animate-in fade-in duration-700 mb-6 md:mb-12 glass-card p-3 md:p-10 rounded-xl">
            <div className="text-center mb-12">
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-3 block">Minh Bạch Dự Án</span>
              <h2 className="text-4xl font-headline text-primary tracking-tight">Kế Hoạch Tài Chính</h2>
              <p className="text-on-surface-variant mt-4 max-w-lg mx-auto">Cập nhật dự toán và tình hình đóng góp từ các thành viên khóa 2003-2006</p>
            </div>


            
            <div className="mt-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
               <h4 className="font-bold text-slate-900 mb-2">💡 Ghi chú:</h4>
               <p className="text-sm text-slate-600 leading-relaxed">Mọi thu chi sẽ được sao kê minh bạch và cập nhật thường xuyên trên hệ thống kế toán nội bộ của Ban Tổ Chức. Cảm ơn sự đồng hành và đóng góp của tất cả các bạn để Hội khóa thành công rực rỡ.</p>
            </div>

            {/* Block thống kê Thu / Chi */}
            <FinanceStatisticsBlock />


          </div>
        )}
        
        {/* Tab 4: Ban liên lạc */}
        {activeTab === 'contacts' && (
          <div className="animate-in fade-in duration-700">
            <div className="text-center mb-12">
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-3 block">Kết nối đồng đội</span>
              <h2 className="text-4xl font-headline text-primary tracking-tight">Ban liên lạc các lớp</h2>
              <p className="text-on-surface-variant mt-4 max-w-lg mx-auto">Danh sách đại diện các lớp phụ trách kết nối thành viên và hỗ trợ thông tin Hội khóa</p>
            </div>

            <div className="max-w-4xl mx-auto md:bg-white md:rounded-2xl md:shadow-xl md:shadow-primary/5 md:border md:border-slate-100 overflow-hidden">
              {/* Desktop Table View */}
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  <tr className="bg-primary/5 text-primary">
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-sm border-b border-primary/10">Ban liên lạc / Lớp</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-sm border-b border-primary/10">Đại diện & Số điện thoại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contactData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`font-bold ${item.group === 'Trưởng Ban liên lạc' ? 'text-primary text-base' : 'text-slate-700 text-sm'}`}>
                          {item.group}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {item.representatives.map((rep, rIdx) => {
                            const [name, phone] = rep.split(': ');
                            return (
                              <div key={rIdx} className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                                <span className="material-symbols-outlined text-xs text-primary/60">phone_in_talk</span>
                                <span className="font-black text-slate-900">{name}</span>: 
                                <a href={`tel:${phone ? phone.replace(/\./g, '') : ''}`} className="text-primary hover:underline transition-all">
                                  {phone}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {contactData.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-3">
                      <span className={`font-black uppercase tracking-wider text-xs ${item.group === 'Trưởng Ban liên lạc' ? 'text-primary' : 'text-slate-400'}`}>
                        {item.group}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-primary">groups</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {item.representatives.map((rep, rIdx) => {
                        const [name, phone] = rep.split(': ');
                        return (
                          <div key={rIdx} className="flex items-center justify-between gap-4">
                            <span className="font-bold text-slate-800 text-sm">{name}</span>
                            <a href={`tel:${phone ? phone.replace(/\./g, '') : ''}`} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold shadow-sm shadow-primary/20 active:scale-95 transition-all">
                              <span className="material-symbols-outlined text-[12px]">call</span>
                              {phone}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 bg-primary/5 p-8 rounded-2xl border border-primary/10 text-center">
              <h4 className="font-bold text-primary mb-3">Bạn chưa tìm thấy đại diện lớp mình?</h4>
              <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
                Nếu lớp bạn chưa có đại diện trong danh sách này hoặc bạn muốn tham gia hỗ trợ Ban liên lạc, 
                vui lòng liên hệ trực tiếp với Trưởng Ban liên lạc để được cập nhật thông tin.
              </p>
            </div>
          </div>
        )}

      </div>
      </main>


      {/* BottomNavBar */}
      <nav className="md:hidden bg-surface/95 backdrop-blur-lg border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,53,127,0.1)] bottom-0 rounded-t-xl z-50 fixed w-full">
        <div className="flex justify-around items-center w-full py-2 px-4 pb-safe">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-0.5 px-5 py-1.5 rounded-xl transition-all ${activeTab === 'home' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[22px]">mail</span>
            <span className="text-[11px] font-bold">Thư ngỏ</span>
          </button>
          <button 
            onClick={() => setActiveTab('plan')}
            className={`flex flex-col items-center justify-center gap-0.5 px-5 py-1.5 rounded-xl transition-all ${activeTab === 'plan' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[22px]">map</span>
            <span className="text-[11px] font-bold">Kế hoạch</span>
          </button>
          <button 
            onClick={() => setActiveTab('finance')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${activeTab === 'finance' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            <span className="text-[11px] font-bold">Tài chính</span>
          </button>
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${activeTab === 'contacts' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[22px]">people</span>
            <span className="text-[11px] font-bold">Liên lạc</span>
          </button>
        </div>
      </nav>


      {/* Footer */}
      <footer className="bg-surface-container-high border-t border-outline-variant mt-20 pb-20 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-stack-md px-margin-mobile md:px-margin-desktop py-stack-lg w-full max-w-container-max mx-auto">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-title text-xl text-primary font-bold">Chuyến tàu thanh xuân</span>
            <p className="font-body text-sm text-on-surface-variant mt-2 text-center md:text-left">2026 Chuyến tàu thanh xuân - Niên khóa 2006-2026</p>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a className="text-on-surface-variant hover:text-primary underline transition-opacity hover:opacity-80 text-sm" href="#">Ban liên lạc</a>
            <a className="text-on-surface-variant hover:text-primary underline transition-opacity hover:opacity-80 text-sm" href="#">Lịch trình</a>
            <a className="text-on-surface-variant hover:text-primary underline transition-opacity hover:opacity-80 text-sm" href="#">Hỗ trợ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


