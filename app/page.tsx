'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';


// ── FinanceStatisticsBlock: Block thống kê thu chi (bao gồm Danh sách đăng ký) ──
function FinanceStatisticsBlock() {
  const [incomes, setIncomes] = React.useState<{name:string;phone:string;will_attend:string;amount?:number;created_at:string;memory?:string}[]>([]);
  const [expenses, setExpenses] = React.useState<{id:string;date:string;name:string;amount:number;type:string;note:string;created_at:string}[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeStatTab, setActiveStatTab] = React.useState<'IN' | 'OUT'>('IN');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('type', 'OUT').order('created_at', { ascending: false })
    ]).then(([regsRes, transRes]) => {
      if (regsRes.data) setIncomes(regsRes.data);
      if (transRes.data) setExpenses(transRes.data);
      setLoading(false);
    });
  }, []);

  const filteredIncomes = incomes.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.memory && t.memory.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredExpenses = expenses.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const attending = incomes.filter(r => r.will_attend === 'yes').length;
  const totalAmount = incomes.filter(r => r.amount && r.amount > 0).reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h3 className="font-headline text-3xl text-primary">Thống kê chi tiết</h3>
          {activeStatTab === 'IN' && (
            <div className="flex gap-3">
              <span className="bg-primary-fixed text-on-primary-fixed text-label-sm px-4 py-2 rounded-full font-bold">{attending} sẽ về</span>
              {totalAmount > 0 && (
                <span className="bg-secondary-fixed text-on-secondary-fixed text-label-sm px-4 py-2 rounded-full font-bold">
                  {totalAmount.toLocaleString('vi-VN')}đ đóng góp
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setActiveStatTab('IN')}
              className={`flex-1 md:px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeStatTab === 'IN' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Hành khách trên tàu (Thu)
            </button>
            <button 
              onClick={() => setActiveStatTab('OUT')}
              className={`flex-1 md:px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeStatTab === 'OUT' ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Các khoản chi
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm tên, nội dung..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeStatTab === 'IN' ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-label-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Thành viên</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Đóng góp</th>
                <th className="px-6 py-4 hidden md:table-cell whitespace-nowrap">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                      <p>Không tìm thấy dữ liệu nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-title text-on-surface font-medium whitespace-nowrap">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.will_attend === 'yes'
                        ? <span className="text-label-sm px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full border border-secondary-fixed-dim/30 font-bold whitespace-nowrap">Sẽ về</span>
                        : <span className="text-label-sm px-3 py-1 bg-surface-container-highest text-on-surface-variant rounded-full border border-outline-variant/20 font-bold whitespace-nowrap">Vắng mặt</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.amount && r.amount > 0
                        ? <span className="font-bold text-primary whitespace-nowrap">+{r.amount.toLocaleString('vi-VN')}đ</span>
                        : <span className="text-on-surface-variant/40">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-xs text-slate-400 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-label-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Thời gian</th>
                <th className="px-6 py-4 whitespace-nowrap">Nội dung chi</th>
                <th className="px-6 py-4 whitespace-nowrap">Ghi chú</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                      <p>Không tìm thấy dữ liệu nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {t.date || new Date(t.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{t.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {t.note || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
                      <span className="text-secondary">
                        {Math.abs(t.amount).toLocaleString('vi-VN')}đ
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function DangKyPage() {
  const [formData, setFormData] = useState({ name: '', phone: '', willAttend: 'yes', memory: '' });
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'finance'>('home');
  const [isScrolled, setIsScrolled] = useState(false);

  // Receipt upload & AI scan state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState<{ name?: string; phone?: string; amount?: string; saved?: boolean } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Appearance State — Media
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
    if (formData.name && formData.phone) {
      try {
        const donatedAmount = aiResult?.amount
          ? parseInt(aiResult.amount.replace(/\D/g, '') || '0')
          : 0;

        // 1. Insert registration
        const { error: regError } = await supabase.from('registrations').insert([{
          name: formData.name,
          phone: formData.phone,
          will_attend: formData.willAttend,
          memory: formData.memory,
          amount: donatedAmount
        }]);
        if (regError) throw regError;

        // 2. If they donated, auto-create a transaction record
        if (donatedAmount > 0) {
          const now = new Date();
          const dateStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}, ${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}`;
          await supabase.from('transactions').insert([{
            date: dateStr,
            name: formData.name,
            phone: formData.phone,
            amount: donatedAmount,
            type: 'IN',
            status: 'AI_VERIFYING',
            note: `Đóng góp quỹ hội — đăng ký từ trang chủ (AI đọc biên lai)`
          }]);
        }

        setSubmitted(true);
      } catch (err) {
        console.error('Lỗi khi gửi đăng ký:', err);
        alert('Đã xảy ra lỗi khi gửi đăng ký, vui lòng thử lại!');
      }
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

  // AI scan receipt using Gemini Flash (qua server route)
  const handleAiScan = async () => {
    if (!receiptFile) return;
    setAiScanning(true);
    setAiError(null);
    setAiResult(null);

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(receiptFile);
      });

      const mimeType = receiptFile.type || 'image/jpeg';

      // Gọi server route — key ẩn phía server, không lộ ra browser
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType }),
      });

      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.error || `Lỗi server ${response.status}`);
      }

      const parsed = json.data;
      setAiResult(parsed);


      // Auto-fill form fields if AI found data
      const updatedName = parsed.name && !formData.name ? parsed.name : formData.name;
      const updatedPhone = parsed.phone && !formData.phone ? parsed.phone : formData.phone;
      setFormData(prev => ({
        ...prev,
        name: updatedName,
        phone: updatedPhone,
      }));

      // === TỰ ĐỘNG CẬP NHẬT SỐ TIỀN VÀO DB ===
      const parsedAmount = parseInt((parsed.amount || '').replace(/\D/g, '') || '0');
      if (parsedAmount > 0) {
        const nameToUse = updatedName || formData.name;
        const phoneToUse = updatedPhone || formData.phone;

        const now = new Date();
        const dateStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}, ${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}`;

        if (phoneToUse) {
          // 1. Tìm registration theo số điện thoại
          const { data: existingReg } = await supabase
            .from('registrations')
            .select('id, amount')
            .eq('phone', phoneToUse)
            .maybeSingle();

          if (existingReg) {
            // Đã có → cập nhật amount
            const { error: updateErr } = await supabase
              .from('registrations')
              .update({ amount: parsedAmount })
              .eq('id', existingReg.id);

            if (updateErr) {
              console.error('Update registration error:', updateErr);
              // RLS có thể chặn update → thử cách khác: ghi note vào aiError
              setAiError(`⚠️ AI đọc được ${parsedAmount.toLocaleString('vi-VN')}đ nhưng chưa lưu tự động. Nhấn "Đăng ký" để xác nhận.`);
            } else {
              // 2. Insert transaction record mới
              await supabase.from('transactions').insert([{
                date: dateStr,
                name: nameToUse || existingReg.id,
                phone: phoneToUse,
                amount: parsedAmount,
                type: 'IN',
                status: 'AI_VERIFYING',
                note: `Đóng góp quỹ hội — AI đọc biên lai (${parsedAmount.toLocaleString('vi-VN')}đ)`,
              }]);

              setAiResult(prev => prev ? { ...prev, saved: true } : prev);
              setAiError(null);
            }
          } else {
            // Chưa có registration → số tiền lưu khi nhấn "Đăng ký"
            // Không set saved = true
          }
        }
      }


    } catch (err: any) {
      console.error('AI scan error:', err);
      if (err.message?.includes('API Key') || err.message?.includes('API_KEY')) {
        setAiError('Chưa cấu hình Gemini API Key. Vui lòng điền thủ công.');
      } else if (err.message?.includes('quota') || err.message?.includes('QUOTA')) {
        setAiError('API đã hết quota hôm nay. Vui lòng điền thủ công.');
      } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setAiError('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.');
      } else {
        setAiError(`AI lỗi: ${err.message || 'Không xác định'}. Vui lòng điền thủ công.`);
      }
    } finally {
      setAiScanning(false);
    }
  };





  const chartData = [
    { name: 'T1', thu: 15, chi: 0 },
    { name: 'T2', thu: 25, chi: 5 },
    { name: 'T3', thu: 40, chi: 10 },
    { name: 'T4', thu: 80, chi: 35 },
    { name: 'T5', thu: 120, chi: 60 },
  ];
  
  const expenseData = [
    { name: 'Tiệc kỷ niệm', value: 40 },
    { name: 'Chụp hình/Video', value: 15 },
    { name: 'Sân khấu & Âm thanh', value: 20 },
    { name: 'Quà lưu niệm', value: 10 },
    { name: 'Quỹ dự phòng', value: 15 },
  ];
  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#64748b'];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      {/* TopAppBar */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-md shadow-primary/5 top-0 z-50 sticky">
        <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop py-stack-sm w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl md:text-3xl text-primary tracking-tight">THPT BÌNH SƠN (2003-2006)</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('home')}
              className={`font-bold transition-all px-2 py-1 ${activeTab === 'home' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-primary-container/10 rounded'}`}
            >Thư ngỏ</button>
            <button 
              onClick={() => setActiveTab('plan')}
              className={`font-bold transition-all px-2 py-1 ${activeTab === 'plan' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-primary-container/10 rounded'}`}
            >Kế hoạch</button>
            <button 
              onClick={() => setActiveTab('finance')}
              className={`font-bold transition-all px-2 py-1 ${activeTab === 'finance' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-primary-container/10 rounded'}`}
            >Tài chính</button>
          </nav>
          <a 
            href="/login"
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-title active:scale-95 transition-transform duration-200 hidden sm:flex items-center justify-center"
          >Đăng nhập</a>
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        {/* Hero Section: The Departure */}
        <section className="relative mb-stack-lg rounded-xl overflow-hidden min-h-[530px] flex items-center justify-center text-center p-8">
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
          <div className="relative z-10 max-w-5xl w-full flex flex-col items-center">
            <div className="flex flex-col items-center mb-6">
              <Image
                src="/logo-binhson.jpg"
                alt="Logo Bình Sơn"
                width={140}
                height={140}
                className="object-contain drop-shadow-2xl rounded-full bg-white/10 p-2"
                unoptimized
              />
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-white mb-6 drop-shadow-lg text-center">Chuyến tàu thanh xuân<br />Kỷ niệm 20 năm ngày ra trường</h2>
            <p className="text-primary-fixed text-xl md:text-2xl italic whitespace-nowrap">"Thời gian trôi qua kẽ tay, nhưng kỷ ức còn đọng lại trên sân trường cũ..."</p>
          </div>
        </section>

      {/* Main Content */}
      <div id="content" className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-30 pb-16 md:pb-8">
        
        {/* Tab 1: Thư Ngỏ & Đăng Ký */}
        {activeTab === 'home' && (
          <>
            <div className="animate-in fade-in duration-700">
            {/* The Memory Album: Staggered Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-stack-lg">
              {/* Letter Section 1: The Gateway */}
              <div className="md:col-span-7 glass-card rounded-xl p-stack-md scrapbook-rotate-left">
                <div className="mb-stack-md rounded-lg overflow-hidden h-64 relative">
                  <Image 
                    src={photo1}
                    alt="School gates"
                    fill
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    unoptimized
                  />
                </div>
                <h3 className="font-title text-xl text-primary mb-2">Sân trường năm ấy</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Hai mươi năm — một khoảng thời gian đủ dài để một đứa trẻ trưởng thành, để những ước mơ ngây ngô ngày nào giờ đã thành hình hài thực tế. Bạn còn nhớ không, cái nắng của những ngày tháng 5 oi ả nơi cổng trường cũ?
                </p>
              </div>

              {/* Visual Highlight: The Desk */}
              <div className="md:col-span-5 glass-card rounded-xl p-stack-md scrapbook-rotate-right flex flex-col justify-center border-l-4 border-tertiary-fixed-dim">
                <div className="relative">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim text-5xl absolute -top-8 -left-4 opacity-50">format_quote</span>
                  <blockquote className="text-2xl font-headline text-primary italic relative z-10 py-4">
                    "Những chỗ ngồi trống, những dòng chữ khắc vội trên bàn gỗ... nay chỉ còn là kỷ niệm."
                  </blockquote>
                </div>
              </div>

              {/* Letter Section 2: Classrooms */}
              <div className="md:col-span-4 glass-card rounded-xl p-stack-md flex flex-col gap-4">
                <div className="relative h-48 w-full">
                  <Image 
                    src={photo2}
                    alt="Classroom window"
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                </div>
                <div className="p-2">
                  <h3 className="font-title text-lg text-secondary mb-2">Hành lang vắng</h3>
                  <p className="text-on-surface-variant text-sm">Tiếng cười đùa vang vọng hành lang, những giờ kiểm tra căng thẳng, và cả những rung động đầu đời chưa kịp ngỏ lời.</p>
                </div>
              </div>

              {/* Letter Section 3: The Letter Content */}
              <div className="md:col-span-8 glass-card rounded-xl p-stack-lg border-t-4 border-primary">
                <div className="flex flex-col gap-stack-md">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary bg-primary-fixed p-3 rounded-full">history_edu</span>
                    <div>
                      <h3 className="font-title text-xl text-primary">Tâm thư gửi bạn bè</h3>
                      <p className="text-on-surface-variant mt-2 leading-relaxed">
                        Chúng ta đã đi qua những năm tháng rực rỡ nhất của tuổi trẻ. Có người đã gặt hái được những thành công vang dội, có người đang bình yên với hạnh phúc giản đơn. Nhưng dù bạn là ai, đang ở đâu, chuyến tàu 2006-2026 này vẫn luôn có một chỗ ngồi dành riêng cho bạn.
                      </p>
                    </div>
                  </div>
                  <hr className="border-outline-variant/30"/>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <span className="font-title text-on-surface">20 năm ngày trở về</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <span className="font-title text-on-surface">Gặp lại thầy cô, bạn cũ</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <span className="font-title text-on-surface">Ôn lại kỷ niệm xưa</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <span className="font-title text-on-surface">Viết tiếp chương mới</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Letter Section 4: The Golden Ticket */}
              <div className="md:col-span-12 glass-card rounded-xl p-stack-lg bg-gradient-to-r from-surface-container-lowest to-secondary-fixed/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <span className="material-symbols-outlined text-[200px]">confirmation_number</span>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="max-w-xl">
                    <h2 className="font-headline text-3xl text-primary mb-2">Tấm vé quay ngược thời gian</h2>
                    <p className="text-on-surface-variant">Đừng để những bộn bề lo toan làm lỡ chuyến tàu quan trọng nhất của thanh xuân. Hãy để ngày {eventDate} là ngày chúng ta lại được là những cô cậu học trò vô tư lự.</p>
                  </div>
                  <div className="flex flex-col gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => document.getElementById('registration-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-primary text-on-primary font-bold py-4 px-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >Xác nhận tham gia ngay</button>
                    <p className="text-label-sm text-center text-on-surface-variant">Hơn 100+ bạn đã đăng ký</p>
                  </div>
                </div>
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
                <div className="bg-surface-container rounded-xl p-6 md:p-10 border border-outline-variant/20 relative">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-4xl font-headline flex flex-col md:flex-row items-center justify-center text-primary tracking-tight gap-4">
                      <span className="w-14 h-14 bg-primary-fixed text-on-primary-fixed rounded-full flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-3xl">edit_note</span>
                      </span>
                      <span>Xác nhận tham dự của bạn</span>
                    </h2>
                    <p className="text-on-surface-variant mt-4 font-body max-w-3xl md:whitespace-nowrap mx-auto">Vui lòng điền thông tin và đóng góp quỹ hội để BTC chuẩn bị đón tiếp chu đáo nhất</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Form */}
                    <div className="flex flex-col justify-center">
                      <form onSubmit={handleSubmit} className="space-y-6">
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
                        className="w-full py-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] mt-4"
                      >
                        <span>Gửi Đăng Ký Ngay</span>
                        <span className="material-symbols-outlined">send</span>
                      </button>
                    </form>
                    </div>

                    {/* QR Code and Payment */}
                    <div className="flex flex-col items-center justify-center bg-surface rounded-xl p-8 border border-outline-variant/30">
                      <div className="flex items-center justify-center space-x-3 mb-6">
                         <span className="material-symbols-outlined text-primary">credit_card</span>
                         <h3 className="text-xl font-bold text-on-surface font-title">Thông tin đóng góp</h3>
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
                            <p className="text-[10px] text-on-surface-variant mt-0.5">Tùy chọn — AI sẽ tự điền tên & SĐT cho bạn</p>
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
                            {!aiResult && !aiScanning && (
                              <button type="button" onClick={handleAiScan}
                                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98]">
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                Nhờ AI đọc biên lai
                              </button>
                            )}
                            {aiScanning && (
                              <div className="w-full py-2.5 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center gap-2 text-violet-700 text-sm font-semibold">
                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                AI đang phân tích ảnh...
                              </div>
                            )}
                            {aiResult && (
                              <div className={`border rounded-xl p-3 space-y-2 transition-all ${aiResult.saved ? 'bg-emerald-50 border-emerald-300' : 'bg-violet-50 border-violet-200'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${aiResult.saved ? 'text-emerald-700' : 'text-violet-700'}`}>
                                  <span className="material-symbols-outlined text-[12px]">{aiResult.saved ? 'check_circle' : 'auto_awesome'}</span>
                                  {aiResult.saved ? '✅ AI đọc & đã lưu vào hệ thống' : 'AI đã đọc được — xác nhận thông tin'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {aiResult.name && (
                                    <button type="button" onClick={() => setFormData(p => ({...p, name: aiResult!.name || p.name}))}
                                      className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-[14px]">person</span> {aiResult.name}
                                    </button>
                                  )}
                                  {aiResult.phone && (
                                    <button type="button" onClick={() => setFormData(p => ({...p, phone: aiResult!.phone || p.phone}))}
                                      className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-[14px]">phone</span> {aiResult.phone}
                                    </button>
                                  )}
                                  {aiResult.amount && parseInt(aiResult.amount.replace(/\D/g,'')||'0') > 0 && (
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm ${aiResult.saved ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-300 text-emerald-800'}`}>
                                      💰 {parseInt(aiResult.amount.replace(/\D/g,'')||'0').toLocaleString('vi-VN')}đ
                                      {aiResult.saved && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">ĐÃ LƯU</span>}
                                    </span>
                                  )}
                                </div>
                                {aiResult.saved ? (
                                  <p className="text-[10px] text-emerald-600 font-semibold">✓ Số tiền đã được cập nhật vào cột đóng góp của bạn.</p>
                                ) : (
                                  <p className="text-[10px] text-violet-600 italic">Nhấn vào badge tên/SĐT để áp dụng vào form ↑</p>
                                )}
                              </div>
                            )}

                            {aiError && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                                <span className="material-symbols-outlined text-amber-500 text-lg">error</span>
                                <p className="text-xs text-amber-700 font-medium">{aiError}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>


          </>
        )}


        {/* Tab 2: Kế Hoạch Chuyến Tàu */}
        {activeTab === 'plan' && (
          <div className="animate-in fade-in duration-700">
            <div className="text-center mb-12">
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-3 block">Lịch trình chi tiết</span>
              <h2 className="text-4xl font-headline text-primary tracking-tight">Hành Trình Hội Ngộ</h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="relative border-l-2 border-slate-100 pl-8 md:pl-12 space-y-8">
                
                <div className="relative">
                  <div className="absolute -left-10 md:-left-14 w-8 h-8 bg-primary-fixed text-on-primary-fixed rounded-full flex items-center justify-center ring-4 ring-white">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                  </div>
                  <div className="glass-card p-6 md:p-8 rounded-xl hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <h3 className="text-xl font-title text-primary">Đón tiếp & Check-in</h3>
                      <span className="inline-block px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-sm font-bold mt-2 md:mt-0 tracking-wider w-max">08:00 - 09:00</span>
                    </div>
                    <p className="text-on-surface-variant mb-4">Tập trung tại cổng trường cũ. Gặp gỡ, trò chuyện và cùng nhau tham quan lại các lớp học, sân trường một thời gắn bó.</p>
                    <div className="flex items-center text-sm font-medium text-on-surface-variant bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20">
                      <span className="material-symbols-outlined text-sm mr-2 opacity-50">location_on</span>
                      Trường THPT Bình Sơn
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-10 md:-left-14 w-8 h-8 bg-secondary-fixed text-on-secondary-fixed rounded-full flex items-center justify-center ring-4 ring-white">
                    <span className="material-symbols-outlined text-sm">event</span>
                  </div>
                  <div className="glass-card p-6 md:p-8 rounded-xl hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <h3 className="text-xl font-title text-primary">Lễ Kỷ Niệm 20 Năm</h3>
                      <span className="inline-block px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-sm font-bold mt-2 md:mt-0 tracking-wider w-max">09:00 - 11:30</span>
                    </div>
                    <p className="text-slate-600 mb-4">Chương trình mít tinh chính thức ôn lại kỷ niệm. Tri ân thầy cô giáo cũ và chia sẻ những câu chuyện truyền cảm hứng.</p>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li className="flex items-center"><span className="material-symbols-outlined text-sm text-primary mr-2">check_circle</span> Văn nghệ chào mừng từ các lớp</li>
                      <li className="flex items-center"><span className="material-symbols-outlined text-sm text-primary mr-2">check_circle</span> Phát biểu tri ân thầy cô</li>
                      <li className="flex items-center"><span className="material-symbols-outlined text-sm text-primary mr-2">check_circle</span> Tặng quà lưu niệm và chụp ảnh tập thể toàn khóa</li>
                    </ul>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-10 md:-left-14 w-8 h-8 bg-tertiary-fixed text-on-tertiary-fixed rounded-full flex items-center justify-center ring-4 ring-white">
                    <span className="material-symbols-outlined text-sm">restaurant</span>
                  </div>
                  <div className="glass-card p-6 md:p-8 rounded-xl hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <h3 className="text-xl font-title text-primary">Tiệc Giao Lưu Cùng Nhau</h3>
                      <span className="inline-block px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-sm font-bold mt-2 md:mt-0 tracking-wider w-max">11:30 - 14:00</span>
                    </div>
                    <p className="text-on-surface-variant mb-4">Di chuyển đến nhà hàng dự tiệc mặn. Thưởng thức bữa trưa ấm cúng, nâng ly chúc mừng và tiếp tục hàn huyên chia sẻ.</p>
                    <div className="flex items-center text-sm font-medium text-on-surface-variant bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20">
                      <span className="material-symbols-outlined text-sm mr-2 opacity-50">restaurant_menu</span>
                      Nhà hàng Biển Đông (Dự kiến)
                    </div>
                  </div>
                </div>

              </div>
            </div>
            </div>

        )}

        {/* Tab 3: Tài Chính Thu Chi */}
        {activeTab === 'finance' && (
          <div className="animate-in fade-in duration-700 mb-12 glass-card p-6 md:p-10 rounded-xl">
            <div className="text-center mb-12">
              <span className="text-primary font-bold uppercase tracking-widest text-sm mb-3 block">Minh Bạch Dự Án</span>
              <h2 className="text-4xl font-headline text-primary tracking-tight">Kế Hoạch Tài Chính</h2>
              <p className="text-on-surface-variant mt-4 max-w-lg mx-auto">Cập nhật dự toán và tình hình đóng góp từ các thành viên khóa 2003-2006</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
               <div className="bg-primary-fixed/30 rounded-xl p-6 border border-primary-fixed-dim/50 text-center">
                  <p className="text-label-sm font-bold text-primary uppercase tracking-wider mb-2">Đã đóng góp</p>
                  <p className="text-4xl font-headline text-primary">85<span className="text-lg font-body text-on-surface-variant">Người</span></p>
               </div>
               <div className="bg-secondary-fixed/30 rounded-xl p-6 border border-secondary-fixed-dim/50 text-center">
                  <p className="text-label-sm font-bold text-secondary uppercase tracking-wider mb-2">Tổng quỹ hiện tại</p>
                  <p className="text-4xl font-headline text-secondary">120<span className="text-lg font-body text-on-surface-variant">Tr</span></p>
               </div>
               <div className="bg-tertiary-fixed/30 rounded-xl p-6 border border-tertiary-fixed-dim/50 text-center">
                  <p className="text-label-sm font-bold text-tertiary uppercase tracking-wider mb-2">Dự toán tổng chi</p>
                  <p className="text-4xl font-headline text-tertiary">180<span className="text-lg font-body text-on-surface-variant">Tr</span></p>
               </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
               <div className="space-y-6">
                 <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-4">Biểu Đồ Thu Chi Theo Tháng (Triệu VNĐ)</h3>
                 <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                       <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                       <Bar dataKey="thu" name="Tổng thu" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                       <Bar dataKey="chi" name="Tổng chi" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>
               <div className="space-y-6">
                 <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-4">Cơ Cấu Chi Phí Dự Kiến (%)</h3>
                 <div className="flex items-center space-x-6">
                   <div className="w-1/2 h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {expenseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        </RechartsPieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="w-1/2 space-y-3">
                     {expenseData.map((item, index) => (
                       <div key={index} className="flex items-center justify-between text-sm">
                         <div className="flex items-center">
                           <div className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                           <span className="text-slate-600 font-medium truncate pr-2">{item.name}</span>
                         </div>
                         <span className="font-bold text-slate-900 shrink-0">{item.value}%</span>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="mt-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
               <h4 className="font-bold text-slate-900 mb-2">💡 Ghi chú:</h4>
               <p className="text-sm text-slate-600 leading-relaxed">Mọi thu chi sẽ được sao kê minh bạch và cập nhật thường xuyên trên hệ thống kế toán nội bộ của Ban Tổ Chức. Cảm ơn sự đồng hành và đóng góp của tất cả các bạn để Hội khóa thành công rực rỡ.</p>
            </div>

            {/* Block thống kê Thu / Chi */}
            <FinanceStatisticsBlock />


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
            className={`flex flex-col items-center justify-center gap-0.5 px-5 py-1.5 rounded-xl transition-all ${activeTab === 'finance' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            <span className="text-[11px] font-bold">Tài chính</span>
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
          <div className="flex gap-6">
            <a className="text-on-surface-variant hover:text-primary underline transition-opacity hover:opacity-80 text-sm" href="#">Ban liên lạc</a>
            <a className="text-on-surface-variant hover:text-primary underline transition-opacity hover:opacity-80 text-sm" href="#">Lịch trình</a>
            <a className="text-on-surface-variant hover:text-primary underline transition-opacity hover:opacity-80 text-sm" href="#">Hỗ trợ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
