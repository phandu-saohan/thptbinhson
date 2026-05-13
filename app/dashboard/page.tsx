'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { LayoutDashboard, ReceiptText, ListTodo, FileBarChart, Settings, Plus, ArrowUpRight, ArrowDownRight, Edit2, Check, Download, QrCode, Search, Trash2, Bell, X, AlertCircle, CheckCircle2, Users, Shield, LayoutTemplate, Save, ClipboardList, Phone, Calendar, Upload } from 'lucide-react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Tab = 'overview' | 'transactions' | 'tasks' | 'users' | 'settings' | 'appearance' | 'registrations';
type TransactionType = 'IN' | 'OUT';

interface Registration {
  id: string;
  name: string;
  phone: string;
  will_attend: string;
  memory?: string;
  amount?: number;
  receipt_url?: string;
  created_at: string;
}


interface Transaction {
  id: string;
  date: string;
  name: string;
  phone?: string;
  amount: number;
  type: TransactionType;
  status: 'SUCCESS' | 'PENDING' | 'AI_VERIFYING';
  note?: string;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  progress: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type Permission = 'overview' | 'transactions' | 'tasks' | 'reports' | 'settings' | 'users' | 'appearance';
export type Role = 'ADMIN' | 'MEMBER' | 'FINANCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

const mockUsers: User[] = [
  { id: '1', name: 'Phan Du', email: 'phandu8899@gmail.com', role: 'ADMIN', permissions: ['overview', 'transactions', 'tasks', 'reports', 'settings', 'users', 'appearance'] },
  { id: '2', name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', role: 'FINANCE', permissions: ['overview', 'transactions', 'reports'] },
  { id: '3', name: 'Trần Thị B', email: 'tranthib@gmail.com', role: 'MEMBER', permissions: ['overview', 'tasks'] },
];

const mockTransactions: Transaction[] = [
  { id: '1', date: '14:22, 12/10', name: 'Nguyễn Hoàng Nam', phone: '091***4455', amount: 1500000, type: 'IN', status: 'SUCCESS' },
  { id: '2', date: '13:05, 12/10', name: 'Phạm Thanh Thủy', phone: '098***1122', amount: 1000000, type: 'IN', status: 'SUCCESS' },
  { id: '3', date: '10:45, 12/10', name: 'Đặt tiệc nhà hàng', amount: -15000000, type: 'OUT', status: 'SUCCESS', note: 'Thanh toán đợt 1 nhà hàng' },
  { id: '4', date: '09:12, 12/10', name: 'Lê Thị Minh Khai', phone: '097***3322', amount: 500000, type: 'IN', status: 'AI_VERIFYING' },
];

const mockTasks: Task[] = [
  { id: '1', title: 'Đặt tiệc Buffet tại nhà hàng', assignee: 'Lê Quốc Huy', dueDate: '15/10/2026', status: 'DONE', progress: 100, priority: 'HIGH' },
  { id: '2', title: 'Thiết kế backdrop & Standee', assignee: 'Nguyễn Hoàng Nam', dueDate: '20/10/2026', status: 'IN_PROGRESS', progress: 75, priority: 'MEDIUM' },
  { id: '3', title: 'Tìm mua quà tặng kỷ niệm', assignee: 'Phạm Thanh Thủy', dueDate: '25/10/2026', status: 'TODO', progress: 0, priority: 'LOW' },
  { id: '4', title: 'Liên hệ khách mời', assignee: 'Trần Quốc Bảo', dueDate: '10/11/2026', status: 'TODO', progress: 0, priority: 'HIGH' },
];

const reportData = [
  { name: 'Tháng 8', thu: 10, chi: 0 },
  { name: 'Tháng 9', thu: 45, chi: 15 },
  { name: 'Tháng 10', thu: 156, chi: 42 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Notifications
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'info' | 'success' | 'warning'}[]>([]);

  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Registrations
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regSearch, setRegSearch] = useState('');


  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [usersRes, tasksRes, transRes, regRes] = await Promise.all([
          supabase.from('app_users').select('*'),
          supabase.from('tasks').select('*'),
          supabase.from('transactions').select('*').order('created_at', { ascending: false }),
          supabase.from('registrations').select('*').order('created_at', { ascending: false })
        ]);
        
        if (isMounted) {
          if (!usersRes.error && usersRes.data) setUsers(usersRes.data as User[]);
          if (!tasksRes.error && tasksRes.data) {
            setTasks(tasksRes.data.map(t => ({
              id: t.id,
              title: t.title,
              assignee: t.assignee,
              dueDate: t.due_date,
              status: t.status,
              progress: t.progress,
              priority: t.priority
            })));
          }
          if (!transRes.error && transRes.data) setTransactions(transRes.data as Transaction[]);
          if (!regRes.error && regRes.data) setRegistrations(regRes.data as Registration[]);
        }
      } catch (e) {
        console.error("Lỗi khi kết nối Supabase:", e);
      }
    };
    fetchData();

    // Subscribe to realtime changes
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => fetchData())
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);


  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
      addNotification('Đã xóa người dùng thành công', 'success');
    } else {
      addNotification('Xóa người dùng thất bại', 'warning');
    }
  };

  const handleSaveUser = async (user: User) => {
    const isNew = !users.find(u => u.id === user.id) || !user.id;
    const reqData = {
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };
    
    // Check if new
    if (!isNew) {
      const { error } = await supabase.from('app_users').update(reqData).eq('id', user.id);
      if (!error) {
        setUsers(users.map(u => u.id === user.id ? { ...user, ...reqData } : u));
        addNotification('Đã cập nhật thông tin người dùng', 'success');
      }
    } else {
      const { data, error } = await supabase.from('app_users').insert([reqData]).select().single();
      if (!error && data) {
        setUsers([...users, data as User]);
        addNotification('Đã thêm người dùng mới', 'success');
      }
    }
    setEditingUser(null);
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleSaveTask = async (task: Task) => {
    const isNew = !tasks.find(t => t.id === task.id) || !task.id;
    const reqData = {
      title: task.title,
      assignee: task.assignee,
      due_date: task.dueDate,
      status: task.status,
      progress: task.progress,
      priority: task.priority
    };

    if (!isNew) {
      const { error } = await supabase.from('tasks').update(reqData).eq('id', task.id);
      if (!error) {
        setTasks(tasks.map(t => t.id === task.id ? { ...t, ...reqData, dueDate: reqData.due_date } : t));
      }
    } else {
      const { data, error } = await supabase.from('tasks').insert([reqData]).select().single();
      if (!error && data) {
        setTasks([...tasks, { ...data, dueDate: data.due_date } as Task]);
      }
    }
    setEditingTask(null);
  };

  // Transaction CRUD
  const handleSaveTransaction = async (tx: Transaction) => {
    const isNew = !tx.id;
    const reqData = {
      date: tx.date,
      name: tx.name,
      phone: tx.phone || undefined,
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      note: tx.note || undefined,
    };
    if (!isNew) {
      const { error } = await supabase.from('transactions').update(reqData).eq('id', tx.id);
      if (!error) {
        setTransactions(prev => prev.map(t => t.id === tx.id ? { ...tx, ...reqData } : t));
        addNotification('Đã cập nhật giao dịch', 'success');
      } else {
        addNotification('Cập nhật thất bại: ' + error.message, 'warning');
      }
    } else {
      const { data, error } = await supabase.from('transactions').insert([reqData]).select().single();
      if (!error && data) {
        setTransactions(prev => [data as Transaction, ...prev]);
        addNotification('Đã thêm giao dịch mới', 'success');
      } else {
        addNotification('Thêm thất bại: ' + (error?.message || ''), 'warning');
      }
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      addNotification('Đã xóa giao dịch', 'success');
    } else {
      addNotification('Xóa thất bại', 'warning');
    }
  };

  // Registration CRUD
  const handleDeleteRegistration = async (id: string) => {
    const { error } = await supabase.from('registrations').delete().eq('id', id);
    if (!error) {
      setRegistrations(prev => prev.filter(r => r.id !== id));
      addNotification('Đã xóa đăng ký', 'success');
    } else {
      addNotification('Xóa thất bại', 'warning');
    }
  };

  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);

  const handleSaveRegistration = async (reg: Registration) => {
    const isNew = !reg.id;
    const reqData = {
      name: reg.name,
      phone: reg.phone,
      will_attend: reg.will_attend,
      memory: reg.memory || undefined,
      amount: reg.amount || 0,
    };
    if (!isNew) {
      const { error } = await supabase.from('registrations').update(reqData).eq('id', reg.id);
      if (!error) {
        setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, ...reqData } : r));
        addNotification('Đã cập nhật đăng ký', 'success');
      } else {
        addNotification('Cập nhật thất bại: ' + error.message, 'warning');
      }
    } else {
      const { data, error } = await supabase.from('registrations').insert([reqData]).select().single();
      if (!error && data) {
        setRegistrations(prev => [data as Registration, ...prev]);
        addNotification('Đã thêm đăng ký mới', 'success');
      } else {
        addNotification('Thêm thất bại: ' + (error?.message || ''), 'warning');
      }
    }
    setEditingRegistration(null);
  };

  React.useEffect(() => {
    let isMounted = true;
    const verifyTransactionsWithAI = async () => {
      // In a real app we might not check NEXT_PUBLIC_GEMINI_API_KEY directly, but here we do to avoid errors if not set
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) return;
      
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const pendingTxs = transactions.filter(t => t.status === 'AI_VERIFYING');
      
      for (const t of pendingTxs) {
        try {
          // Simulate a bank SMS message that would be received from a webhook
          const fakeSms = `Techcombank: TK ...8012 nhan +${t.amount}VND luc ${t.date}. ND: Giao dich tu ${t.name} BS2006. SDT: ${t.phone}`;
          const prompt = `Bạn là hệ thống AI kế toán. Nhiệm vụ của bạn là đối chiếu tin nhắn SMS ngân hàng với giao dịch hệ thống ghi nhận:\n\n- SMS: "${fakeSms}"\n- Giao dịch: Tên: ${t.name}, Số tiền: ${t.amount} VNĐ, SĐT: ${t.phone}\n\nDựa vào thông tin trên, 2 thông tin có khớp nhau 100% không?`;
          
          const response = await ai.models.generateContent({
             model: "gemini-3.1-flash-lite",
             contents: prompt,
             config: {
               responseMimeType: "application/json",
               responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                     verified: { type: Type.BOOLEAN, description: "True nếu các thông tin tên và số tiền đều khớp nhau" },
                     confidence: { type: Type.NUMBER, description: "Độ tin cậy của kết quả từ 0 đến 100" }
                  },
                  required: ["verified", "confidence"]
               }
             }
          });
          
          const result = JSON.parse(response.text || '{}');
          if (result.verified && isMounted) {
            setTransactions(prev => prev.map(tx => tx.id === t.id ? { ...tx, status: 'SUCCESS', note: `AI Verified: ${result.confidence}% match` } : tx));
            addNotification(`Giao dịch của ${t.name} đã được AI xác minh thành công!`, 'success');
          }
        } catch (e) {
            console.error("AI Verify Error:", e);
        }
      }
    };
    
    // Simulate slight delay before AI starts processing to show the "Verifying" status in UI
    const timeout = setTimeout(() => {
        verifyTransactionsWithAI();
    }, 2500);
    
    // Check for high priority tasks
    const upcomingTasks = tasks.filter(t => t.status !== 'DONE' && t.priority === 'HIGH');
    if (upcomingTasks.length > 0) {
      setTimeout(() => {
         if (isMounted) addNotification(`Cảnh báo: Có ${upcomingTasks.length} công việc ưu tiên CẦN HOÀN THÀNH sớm!`, 'warning');
      }, 1000);
    }
    
    return () => {
       isMounted = false;
       clearTimeout(timeout);
    }
  }, [tasks, addNotification]);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(t => {
    const searchLower = transactionSearch.toLowerCase();
    const matchesSearch = t.name.toLowerCase().includes(searchLower) || 
                          t.date.toLowerCase().includes(searchLower) ||
                          t.amount.toString().includes(searchLower) ||
                          (t.note && t.note.toLowerCase().includes(searchLower)) ||
                          (t.phone && t.phone.toLowerCase().includes(searchLower));
    const matchesFilter = transactionFilter === 'ALL' || t.type === transactionFilter;
    return matchesSearch ? matchesFilter : false;
  });

  // Appearance Settings State — Media
  const [heroVideo, setHeroVideo] = useState('https://assets.mixkit.co/videos/preview/mixkit-sun-shining-through-the-leaves-of-a-tree-in-the-8238-large.mp4');
  const [heroImage, setHeroImage] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuDZoPSErlIW76V6LcqZOGcZpJBCnf6FZigCs3HEaMg2weA6-2IxA7FmMkWn8GKmrDp8x4eKykLkKi6pMMYAKte8jiSzDdEyMDQ3_L7ps_23KZSfnM4HRugAjjZ0GQJds-5oliYGXvrrUscfJnw1SQSYNjQmdnduHl9CuC1WYcQILIDNANUuoW2ApyVasYm_Huqdb93Q9mawRd4jS4Bz8ZBFgViVGlsvqlCJ6qXLpF8CyhowDZmAHPaNfRGpU_Dfsd3jG-fxFUfCEOUyo');
  const [photo1, setPhoto1] = useState('https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop');
  const [photo2, setPhoto2] = useState('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop');
  const [photo3, setPhoto3] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop');
  const [seoImage, setSeoImage] = useState('/logo.jpg');
  const [uploadingKey, setUploadingKey] = useState<string|null>(null);

  // Appearance Settings State — Trang Chủ Content
  const [siteTitle, setSiteTitle] = useState('Tìm Lại Thanh Xuân');
  const [siteSubtitle, setSiteSubtitle] = useState('(2003 – 2006)');
  const [siteTagline, setSiteTagline] = useState('"Trở Về - Kết Nối"');
  const [heroBadge, setHeroBadge] = useState('Thư Ngỏ Hội Khóa 2003–2006');
  const [eventDate, setEventDate] = useState('12/7');
  const [eventLocation, setEventLocation] = useState('Trường THPT Bình Sơn');
  const [letterOpening, setLetterOpening] = useState('Gửi những người bạn đã đi cùng nhau một đoạn thanh xuân,');
  const [bankName, setBankName] = useState('Ngân hàng Techcombank');
  const [bankAccount, setBankAccount] = useState('1902 3345 8880 12');
  const [bankHolder, setBankHolder] = useState('LE QUOC HUY');
  const [bankId2, setBankId2] = useState('TCB');
  const [bankNo2, setBankNo2] = useState('19023345888012');
  const [donationAmount, setDonationAmount] = useState('1000000');


  useEffect(() => {
    // Load from Supabase site_settings, fallback to localStorage
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*');
        if (data && data.length > 0) {
          const map: Record<string,string> = {};
          data.forEach((row: {key:string;value:string}) => { map[row.key] = row.value; });
          if (map['site_title']) setSiteTitle(map['site_title']);
          if (map['site_subtitle']) setSiteSubtitle(map['site_subtitle']);
          if (map['site_tagline']) setSiteTagline(map['site_tagline']);
          if (map['hero_badge']) setHeroBadge(map['hero_badge']);
          if (map['event_date']) setEventDate(map['event_date']);
          if (map['event_location']) setEventLocation(map['event_location']);
          if (map['letter_opening']) setLetterOpening(map['letter_opening']);
          if (map['bank_name']) setBankName(map['bank_name']);
          if (map['bank_account']) setBankAccount(map['bank_account']);
          if (map['bank_holder']) setBankHolder(map['bank_holder']);
          if (map['bank_id_qr']) setBankId2(map['bank_id_qr']);
          if (map['bank_no_qr']) setBankNo2(map['bank_no_qr']);
          if (map['donation_amount']) setDonationAmount(map['donation_amount']);
          if (map['hero_video']) setHeroVideo(map['hero_video']);
          if (map['photo1']) setPhoto1(map['photo1']);
          if (map['photo2']) setPhoto2(map['photo2']);
          if (map['photo3']) setPhoto3(map['photo3']);
          if (map['seo_image']) setSeoImage(map['seo_image']);
          if (map['hero_image']) setHeroImage(map['hero_image']);
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
          load('content_eventLocation', setEventLocation);
          load('content_letterOpening', setLetterOpening);
          load('content_bankName', setBankName);
          load('content_bankAccount', setBankAccount);
          load('content_bankHolder', setBankHolder);
          load('content_bankId2', setBankId2);
          load('content_bankNo2', setBankNo2);
          load('content_donationAmount', setDonationAmount);
        }
      } catch(e) {
        console.error('Lỗi tải cài đặt:', e);
      }
    };
    loadSettings();
  }, []);


  const handleSaveAppearance = async () => {
    const entries = [
      ['site_title', siteTitle], ['site_subtitle', siteSubtitle], ['site_tagline', siteTagline],
      ['hero_badge', heroBadge], ['event_date', eventDate], ['event_location', eventLocation],
      ['letter_opening', letterOpening], ['bank_name', bankName], ['bank_account', bankAccount],
      ['bank_holder', bankHolder], ['bank_id_qr', bankId2], ['bank_no_qr', bankNo2],
      ['donation_amount', donationAmount], ['hero_video', heroVideo], ['hero_image', heroImage],
      ['photo1', photo1], ['photo2', photo2], ['photo3', photo3], ['seo_image', seoImage],
    ];
    try {
      for (const [key, value] of entries) {
        await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      }
      // Also save to localStorage as fallback
      localStorage.setItem('appearance_heroVideo', heroVideo);
      localStorage.setItem('appearance_photo1', photo1);
      localStorage.setItem('appearance_photo2', photo2);
      localStorage.setItem('content_siteTitle', siteTitle);
      localStorage.setItem('content_siteSubtitle', siteSubtitle);
      localStorage.setItem('content_siteTagline', siteTagline);
      localStorage.setItem('content_heroBadge', heroBadge);
      localStorage.setItem('content_eventDate', eventDate);
      localStorage.setItem('content_eventLocation', eventLocation);
      localStorage.setItem('content_letterOpening', letterOpening);
      localStorage.setItem('content_bankName', bankName);
      localStorage.setItem('content_bankAccount', bankAccount);
      localStorage.setItem('content_bankHolder', bankHolder);
      localStorage.setItem('content_bankId2', bankId2);
      localStorage.setItem('content_bankNo2', bankNo2);
      localStorage.setItem('content_donationAmount', donationAmount);
      addNotification('✅ Đã lưu toàn bộ cấu hình trang chủ!', 'success');
    } catch(e) {
      console.error(e);
      addNotification('Lỗi khi lưu, vui lòng thử lại!', 'warning');
    }
  };

  const handleImageUpload = async (file: File, settingKey: string, setter: (url: string) => void) => {
    setUploadingKey(settingKey);
    const BUCKET = 'site-assets';
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${settingKey}-${Date.now()}.${ext}`;

      // Try uploading first
      let uploadResult = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true, contentType: file.type });

      // If bucket doesn't exist → auto-create it, then retry
      if (uploadResult.error && (uploadResult.error.message.toLowerCase().includes('bucket') || uploadResult.error.message.toLowerCase().includes('not found'))) {
        addNotification('⏳ Đang tạo storage bucket lần đầu...', 'info');
        const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 10485760,
        });
        if (createErr && !createErr.message.toLowerCase().includes('already exists')) {
          throw new Error('Không thể tự tạo bucket. Vào Supabase → Storage → New Bucket → đặt tên "site-assets" → bật Public → Save.');
        }
        // Retry upload after bucket created
        uploadResult = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true, contentType: file.type });
      }

      if (uploadResult.error) throw uploadResult.error;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(uploadResult.data.path);
      setter(publicUrl);
      await supabase.from('site_settings').upsert({ key: settingKey, value: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      addNotification('✅ Đã upload và lưu hình ảnh thành công!', 'success');
    } catch(e: any) {
      console.error(e);
      addNotification('❌ ' + (e.message || 'Upload thất bại. Kiểm tra Supabase Storage.'), 'warning');
    } finally {
      setUploadingKey(null);
    }
  };



  // QR Settings State
  const [bankId, setBankId] = useState('TCB'); // Techcombank
  const [accountNo, setAccountNo] = useState('19023345888012');
  const [accountName, setAccountName] = useState('LE QUOC HUY');
  const [defaultAmount, setDefaultAmount] = useState('1000000');
  const [defaultSyntax, setDefaultSyntax] = useState('BS2006 [HO TEN] [SDT]');
  
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${defaultAmount}&addInfo=${encodeURIComponent(defaultSyntax)}&accountName=${encodeURIComponent(accountName)}`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight">BS2003-2006</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">20 Năm Ngày Trở Về</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20} />} label="Tổng quan" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavItem icon={<ReceiptText size={20} />} label="Thu - Chi" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
          <NavItem icon={<ClipboardList size={20} />} label="Đăng Ký" active={activeTab === 'registrations'} onClick={() => setActiveTab('registrations')} badge={registrations.filter(r => r.will_attend === 'yes').length} />
          <NavItem icon={<ListTodo size={20} />} label="Công việc" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavItem icon={<Users size={20} />} label="Quản trị viên" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <NavItem icon={<LayoutTemplate size={20} />} label="Giao diện" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
          <NavItem icon={<Settings size={20} />} label="Thiết lập" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="p-6 bg-slate-950/40 text-xs">
          <div className="flex items-center space-x-2 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>AI Gemini: Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex justify-between items-center p-8 pb-4 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === 'overview' && 'Trang tổng quan'}
              {activeTab === 'transactions' && 'Quản lý Thu - Chi'}
              {activeTab === 'registrations' && 'Danh sách Đăng Ký Tham Dự'}
              {activeTab === 'tasks' && 'Tiến độ công việc'}
              {activeTab === 'users' && 'Quản lý Người dùng & Phân quyền'}
              {activeTab === 'appearance' && 'Cấu hình Giao diện & Hiển thị'}
              {activeTab === 'settings' && 'Thiết lập hệ thống & QR Code'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Quản lý tài chính & triển khai sự kiện kỷ niệm 20 năm</p>
          </div>
          <div className="flex items-center space-x-3">
             <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{session?.user?.email || 'Admin'}</p>
                <p className="text-xs text-slate-500">Quản trị viên</p>
             </div>
             <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-300">
               {session?.user?.email?.charAt(0).toUpperCase() || 'A'}
             </div>
             <button onClick={handleLogout} className="ml-4 text-slate-500 hover:text-red-500 transition px-2">
               Đăng xuất
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col">
          {activeTab === 'overview' && (
            <>
              {/* Dashboard Cards Grid */}
              <div className="grid grid-cols-4 gap-6 shrink-0">
                <DashboardCard title="Tổng thu dự kiến" value="240.0M" trend="↑ 12% so với tuần trước" trendPositive={true} />
                <DashboardCard title="Thực thu (Đã xác minh)" value="156.4M" progress={65} />
                <DashboardCard title="Đã chi tiêu" value="42.8M" subtitle="22 khoản mục đã thanh toán" />
                <div className="bg-orange-50 p-6 rounded-2xl shadow-sm border border-orange-200 flex flex-col justify-center">
                   <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Cảnh báo ngân sách</p>
                   <p className="text-lg font-bold text-orange-900 mt-2">Vượt trần 02 mục</p>
                   <p className="text-xs text-orange-700 mt-1 italic leading-relaxed">Hạng mục: Thuê sân khấu & Ăn uống</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold flex items-center text-slate-800">
                       <QrCode className="h-5 w-5 mr-2 text-blue-500" /> 
                       Nhật ký đóng góp mới nhất
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold uppercase flex items-center">
                      <Check className="w-3 h-3 mr-1" />
                      AI Verified
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <TransactionTable transactions={transactions.filter(t => t.type === 'IN')} onRowClick={setSelectedTransaction} />
                  </div>
                </div>
                
                <div className="flex flex-col space-y-6">
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                     <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                     <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">QR Đóng Góp</h4>
                     <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                       <img src={qrUrl} alt="QR Code" className="w-36 h-36 object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                     </div>
                     <p className="mt-4 text-[11px] text-center text-slate-500 uppercase tracking-widest leading-relaxed">
                        Bank: {bankId}<br/>
                        STK: {accountNo}
                     </p>
                   </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'transactions' && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
               <div className="p-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                  <div className="flex space-x-2">
                     <button onClick={() => setTransactionFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${transactionFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Tất cả</button>
                     <button onClick={() => setTransactionFilter('IN')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${transactionFilter === 'IN' ? 'bg-slate-800 text-white shadow-sm hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Thu khoản</button>
                     <button onClick={() => setTransactionFilter('OUT')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${transactionFilter === 'OUT' ? 'bg-slate-800 text-white shadow-sm hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Chi phí</button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Tìm tên, ngày, số tiền..."
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-slate-700 placeholder-slate-400"
                      />
                    </div>
                    <button
                      onClick={() => setEditingTransaction({ id: '', date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }), name: '', phone: '', amount: 0, type: 'IN', status: 'SUCCESS', note: '' })}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition">
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm bản ghi
                    </button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto">
                 {filteredTransactions.length > 0 ? (
                   <TransactionTable transactions={filteredTransactions} onRowClick={setSelectedTransaction} onEdit={setEditingTransaction} onDelete={handleDeleteTransaction} />
                 ) : (
                   <div className="flex flex-col flex-1 h-full items-center justify-center p-12 text-slate-400 mt-10">
                     <Search className="w-10 h-10 mb-4 text-slate-300" />
                     <p className="text-sm font-medium">Không tìm thấy giao dịch nào phù hợp</p>
                   </div>
                 )}
               </div>
            </div>
          )}


          {activeTab === 'registrations' && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Có tham dự</p>
                      <p className="text-2xl font-black text-emerald-600">{registrations.filter(r => r.will_attend === 'yes').length}</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 text-center">
                      <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">Không về</p>
                      <p className="text-2xl font-black text-rose-600">{registrations.filter(r => r.will_attend === 'no').length}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Tổng đăng ký</p>
                      <p className="text-2xl font-black text-blue-600">{registrations.length}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Đã đóng góp</p>
                      <p className="text-xl font-black text-amber-700">{registrations.filter(r => r.amount && r.amount > 0).reduce((s, r) => s + (r.amount || 0), 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm tên, số điện thoại..."
                        value={regSearch}
                        onChange={e => setRegSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                      />
                    </div>
                    <button
                      onClick={() => setEditingRegistration({ id: '', name: '', phone: '', will_attend: 'yes', memory: '', amount: 0, created_at: '' })}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm mới
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 sticky top-0 text-[10px] font-bold text-slate-500 border-b border-slate-100 tracking-wider uppercase">
                    <tr>
                      <th className="px-6 py-4">Họ và tên</th>
                      <th className="px-6 py-4">Số điện thoại</th>
                      <th className="px-6 py-4">Tham dự</th>
                      <th className="px-6 py-4 text-right">Đóng góp</th>
                      <th className="px-6 py-4 text-center">Biên lai</th>
                      <th className="px-6 py-4">Kỷ niệm chia sẻ</th>
                      <th className="px-6 py-4">Ngày đăng ký</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrations
                      .filter(r => {
                        const q = regSearch.toLowerCase();
                        return r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q);
                      })
                      .map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">{r.name.charAt(0).toUpperCase()}</div>
                              <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-slate-600">{r.phone}</td>
                          <td className="px-6 py-4">
                            {r.will_attend === 'yes'
                              ? <span className="text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 font-bold uppercase">Có về ✓</span>
                              : <span className="text-[10px] px-2.5 py-1 bg-rose-50 text-rose-600 rounded-md border border-rose-200 font-bold uppercase">Không về</span>
                            }
                          </td>
                          <td className="px-6 py-4 text-right">
                            {r.amount && r.amount > 0
                              ? <span className="text-sm font-black text-emerald-700">+{r.amount.toLocaleString('vi-VN')}đ</span>
                              : <span className="text-xs text-slate-300 italic">—</span>
                            }
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.receipt_url ? (
                              <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors" title="Xem biên lai">
                                <ReceiptText size={18} />
                              </a>
                            ) : (
                              <span className="text-slate-300 italic">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 max-w-[250px] truncate">{r.memory || <span className="italic text-slate-300">—</span>}</td>
                          <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingRegistration(r)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Sửa"
                              ><Edit2 size={15} /></button>
                              <button
                                onClick={() => { if (confirm(`Xóa đăng ký của ${r.name}?`)) handleDeleteRegistration(r.id); }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Xóa"
                              ><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {registrations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <ClipboardList className="w-10 h-10 mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Chưa có ai đăng ký tham dự</p>
                  </div>
                )}
              </div>

              {/* Modal Thêm / Sửa đăng ký */}
              {editingRegistration && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-lg">
                        {editingRegistration.id ? 'Chỉnh sửa đăng ký' : 'Thêm đăng ký mới'}
                      </h3>
                      <button onClick={() => setEditingRegistration(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Họ và Tên *</label>
                          <input
                            type="text"
                            value={editingRegistration.name}
                            onChange={e => setEditingRegistration({ ...editingRegistration, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Nguyễn Văn A"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Số điện thoại *</label>
                          <input
                            type="text"
                            value={editingRegistration.phone}
                            onChange={e => setEditingRegistration({ ...editingRegistration, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                            placeholder="0901234567"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tham dự</label>
                          <select
                            value={editingRegistration.will_attend}
                            onChange={e => setEditingRegistration({ ...editingRegistration, will_attend: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="yes">Có về ✓</option>
                            <option value="no">Không về</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Số tiền đóng góp (VNĐ)</label>
                          <input
                            type="number"
                            value={editingRegistration.amount || 0}
                            onChange={e => setEditingRegistration({ ...editingRegistration, amount: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Kỷ niệm chia sẻ</label>
                        <textarea
                          value={editingRegistration.memory || ''}
                          onChange={e => setEditingRegistration({ ...editingRegistration, memory: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                          placeholder="Kỷ niệm đáng nhớ..."
                        />
                      </div>
                    </div>
                    <div className="p-6 pt-0 flex justify-end gap-3">
                      <button
                        onClick={() => setEditingRegistration(null)}
                        className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                      >Hủy</button>
                      <button
                        onClick={() => {
                          if (!editingRegistration.name || !editingRegistration.phone) {
                            alert('Vui lòng nhập Họ tên và Số điện thoại!');
                            return;
                          }
                          handleSaveRegistration(editingRegistration);
                        }}
                        className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Save size={15} />
                        {editingRegistration.id ? 'Lưu thay đổi' : 'Thêm đăng ký'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-2 gap-8 shrink-0 pb-10">
               <div className="space-y-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                     <Settings className="w-5 h-5 mr-2 text-slate-400" />
                     Thiết lập mã QR Code & Nhận tiền
                   </h3>
                   
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mã Ngân Hàng (Bank ID)</label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                         value={bankId}
                         onChange={(e) => setBankId(e.target.value)}
                         placeholder="TCB, VCB, MB..."
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Số Tài Khoản</label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                         value={accountNo}
                         onChange={(e) => setAccountNo(e.target.value)}
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tên Người Thụ Hưởng</label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                         value={accountName}
                         onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mức đóng mặc định (VNĐ)</label>
                         <input 
                           type="number" 
                           className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                           value={defaultAmount}
                           onChange={(e) => setDefaultAmount(e.target.value)}
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cú pháp chuyển khoản</label>
                         <input 
                           type="text" 
                           className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                           value={defaultSyntax}
                           onChange={(e) => setDefaultSyntax(e.target.value)}
                         />
                       </div>
                     </div>
                   </div>
                   <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                      <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow hover:bg-blue-700 transition">
                         Lưu cấu hình
                      </button>
                   </div>
                 </div>
               </div>

               <div>
                 <div className="bg-slate-100/50 p-8 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                    <p className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-widest">Preview Form Mã QR</p>
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-72 flex flex-col items-center border border-slate-100">
                        <div className="w-full text-center mb-4">
                           <p className="text-xs text-slate-500 font-medium">Ngân hàng thụ hưởng</p>
                           <p className="font-bold text-slate-900 border-b border-slate-100 pb-2">{bankId} - {accountNo}</p>
                           <p className="font-semibold text-slate-800 mt-2">{accountName}</p>
                        </div>
                        <div className="bg-white p-2 border border-slate-100 rounded-xl shadow-sm mb-4">
                          <img src={qrUrl} alt="QR Code Preview" className="w-48 h-48 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        
                        <p className="text-xl font-black text-blue-600">
                           {parseInt(defaultAmount || '0').toLocaleString('vi-VN')} đ
                        </p>
                        <div className="mt-4 w-full bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                           <p className="text-[10px] text-slate-500 uppercase mb-1 font-semibold">Cú pháp (Memo)</p>
                           <p className="text-xs font-mono text-slate-800">{defaultSyntax}</p>
                        </div>
                    </div>
                    
                    <button className="mt-8 flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition">
                      <Download className="w-4 h-4 mr-2" />
                      Tải xuống mã QR
                    </button>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
               <div className="p-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                  <div className="flex space-x-2">
                     <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-slate-700 transition">Tất cả ({tasks.length})</button>
                     <button className="px-4 py-2 bg-white text-slate-600 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition">Đang xử lý ({tasks.filter(t => t.status === 'IN_PROGRESS').length})</button>
                     <button className="px-4 py-2 bg-white text-slate-600 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition">Hoàn thành ({tasks.filter(t => t.status === 'DONE').length})</button>
                  </div>
                  <button 
                    onClick={() => setEditingTask({ id: '', title: '', assignee: '', dueDate: '', status: 'TODO', progress: 0, priority: 'MEDIUM' })}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm công việc
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                  <div className="grid grid-cols-3 gap-6">
                     <TaskColumn title="Cần làm" count={tasks.filter(t => t.status === 'TODO').length} tasks={tasks.filter(t => t.status === 'TODO')} onEdit={setEditingTask} onDelete={handleDeleteTask} />
                     <TaskColumn title="Đang thực hiện" count={tasks.filter(t => t.status === 'IN_PROGRESS').length} tasks={tasks.filter(t => t.status === 'IN_PROGRESS')} onEdit={setEditingTask} onDelete={handleDeleteTask} />
                     <TaskColumn title="Đã hoàn thành" count={tasks.filter(t => t.status === 'DONE').length} tasks={tasks.filter(t => t.status === 'DONE')} onEdit={setEditingTask} onDelete={handleDeleteTask} />
                  </div>
               </div>
            </div>
          )}


          {activeTab === 'users' && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
               <div className="p-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                  <div className="flex space-x-2">
                     <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-slate-700 transition">Tất cả ({users.length})</button>
                  </div>
                  <button 
                    onClick={() => setEditingUser({ id: '', name: '', email: '', role: 'MEMBER', permissions: ['overview'] })}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm người dùng
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 sticky top-0 text-[10px] font-bold text-slate-500 border-b border-slate-100 tracking-wider uppercase">
                     <tr>
                       <th className="px-6 py-4 font-bold">Người dùng</th>
                       <th className="px-6 py-4 font-bold">Vai trò</th>
                       <th className="px-6 py-4 font-bold">Quyền truy cập modules</th>
                       <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {users.map(u => (
                       <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                         <td className="px-6 py-4">
                           <div className="flex items-center space-x-3">
                             <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                               {u.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                               <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                               <p className="text-xs text-slate-500">{u.email}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                             u.role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                             u.role === 'FINANCE' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                             'bg-blue-50 text-blue-600 border border-blue-200'
                           }`}>
                             {u.role}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex flex-wrap gap-1 max-w-[200px]">
                             {u.permissions.map(p => (
                               <span key={p} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{p}</span>
                             ))}
                           </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => setEditingUser(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 size={16} /></button>
                             <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={16} /></button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              {/* CMS Header */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <LayoutTemplate className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Quản lý Nội dung & Hình ảnh</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Chỉnh sửa nội dung trang chủ — hình ảnh upload sẽ thay thế ngay lập tức</p>
                    </div>
                  </div>
                  <button onClick={handleSaveAppearance} className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition gap-2">
                    <Save className="w-4 h-4" />
                    Lưu tất cả
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
               <div className="space-y-5 max-w-3xl mx-auto">

  
               {/* SECTION 1: Hình ảnh Hero Banner */}
               <div className="border border-slate-200 rounded-2xl overflow-hidden">
                 <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                   <span className="text-base">🖼️</span>
                   <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Hình ảnh Hero (Ảnh nền đầu trang)</h4>
                   <span className="ml-auto text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">QUAN TRỌNG</span>
                 </div>
                 <div className="p-5 space-y-4">
                   <ImageUploadField
                     label="Ảnh nền Hero Banner"
                     hint="Hiển thị phía sau Logo & tiêu đề chính (Khuyến nghị: 1920×1080px)"
                     currentUrl={heroImage}
                     settingKey="hero_image"
                     uploading={uploadingKey === 'hero_image'}
                     onFileSelect={(file) => handleImageUpload(file, 'hero_image', setHeroImage)}
                     onUrlChange={setHeroImage}
                   />
                 </div>
               </div>

               {/* SECTION 2: Album ảnh kỷ niệm */}
               <div className="border border-slate-200 rounded-2xl overflow-hidden">
                 <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                   <span className="text-base">📸</span>
                   <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Album Ảnh Kỷ Niệm (Trang chủ)</h4>
                 </div>
                 <div className="p-5">
                   <div className="grid grid-cols-3 gap-4">
                     <ImageUploadField
                       label="Ảnh kỷ niệm 1"
                       hint="Ảnh sân trường / lớp học"
                       currentUrl={photo1}
                       settingKey="photo1"
                       uploading={uploadingKey === 'photo1'}
                       onFileSelect={(file) => handleImageUpload(file, 'photo1', setPhoto1)}
                       onUrlChange={setPhoto1}
                     />
                     <ImageUploadField
                       label="Ảnh kỷ niệm 2"
                       hint="Ảnh hành lang / sự kiện"
                       currentUrl={photo2}
                       settingKey="photo2"
                       uploading={uploadingKey === 'photo2'}
                       onFileSelect={(file) => handleImageUpload(file, 'photo2', setPhoto2)}
                       onUrlChange={setPhoto2}
                     />
                     <ImageUploadField
                       label="Ảnh kỷ niệm 3"
                       hint="Ảnh nhóm / tốt nghiệp"
                       currentUrl={photo3}
                       settingKey="photo3"
                       uploading={uploadingKey === 'photo3'}
                       onFileSelect={(file) => handleImageUpload(file, 'photo3', setPhoto3)}
                       onUrlChange={setPhoto3}
                     />
                   </div>
                 </div>
               </div>

               {/* SECTION 3: Hero Text Content */}
               <div className="border border-slate-200 rounded-2xl overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                   <span className="text-base">✍️</span>
                   <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Nội dung Tiêu đề & Slogan</h4>
                 </div>
                 <div className="p-5 space-y-4">
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Badge nhỏ phía trên tiêu đề</label>
                     <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={heroBadge} onChange={e => setHeroBadge(e.target.value)} placeholder="Thư Ngỏ Hội Khóa 2003–2006" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tiêu đề chính (H1)</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={siteTitle} onChange={e => setSiteTitle(e.target.value)} placeholder="Tìm Lại Thanh Xuân" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phụ đề (năm khoá)</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={siteSubtitle} onChange={e => setSiteSubtitle(e.target.value)} placeholder="(2003 – 2006)" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tagline / Slogan</label>
                     <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={siteTagline} onChange={e => setSiteTagline(e.target.value)} placeholder='"Trở Về - Kết Nối"' />
                   </div>
                 </div>
               </div>

               {/* SECTION 4: Thông tin sự kiện */}
               <div className="border border-slate-200 rounded-2xl overflow-hidden">
                 <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                   <span className="text-base">📅</span>
                   <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Thông tin Sự kiện & Thư Ngỏ</h4>
                 </div>
                 <div className="p-5 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ngày tổ chức (VD: 12/7)</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={eventDate} onChange={e => setEventDate(e.target.value)} placeholder="12/7" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Địa điểm tổ chức</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Trường THPT Bình Sơn" />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Câu mở đầu Thư Ngỏ</label>
                     <textarea rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" value={letterOpening} onChange={e => setLetterOpening(e.target.value)} placeholder="Gửi những người bạn đã đi cùng nhau một đoạn thanh xuân," />
                   </div>
                 </div>
               </div>

               {/* SECTION 5: Thông tin ngân hàng */}
               <div className="border border-slate-200 rounded-2xl overflow-hidden">
                 <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                   <span className="text-base">🏦</span>
                   <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Thông tin Ngân hàng & QR Đóng góp</h4>
                 </div>
                 <div className="p-5 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tên ngân hàng hiển thị</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ngân hàng Techcombank" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tên người thụ hưởng</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={bankHolder} onChange={e => setBankHolder(e.target.value.toUpperCase())} placeholder="LE QUOC HUY" />
                     </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Bank ID (VietQR)</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono" value={bankId2} onChange={e => setBankId2(e.target.value.toUpperCase())} placeholder="TCB" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Số TK hiển thị</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="1902 3345 8880 12" />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">STK cho QR</label>
                       <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono" value={bankNo2} onChange={e => setBankNo2(e.target.value)} placeholder="19023345888012" />
                     </div>
                   </div>
                   <div className="flex gap-4 items-end">
                     <div className="flex-1">
                       <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mức đóng góp mặc định (VNĐ)</label>
                       <input type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={donationAmount} onChange={e => setDonationAmount(e.target.value)} placeholder="1000000" />
                     </div>
                     <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300">
                       <img src={`https://img.vietqr.io/image/${bankId2}-${bankNo2}-compact2.png?amount=${donationAmount}&addInfo=Dong+gop+quy+hoi&accountName=${encodeURIComponent(bankHolder)}`} alt="QR Preview" className="w-16 h-16 object-contain rounded-lg border border-white shadow" />
                       <div>
                         <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Xem trước QR</p>
                         <p className="text-xs font-bold text-slate-900">{bankHolder}</p>
                         <p className="text-[10px] font-mono text-slate-600">{bankId2} · {bankAccount}</p>
                         <p className="text-xs text-emerald-600 font-semibold mt-0.5">{parseInt(donationAmount || '0').toLocaleString('vi-VN')} đ</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* SECTION 6: Video nền */}
               <div className="border border-slate-200 rounded-2xl overflow-hidden">
                 <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                   <span className="text-base">🎬</span>
                   <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Video nền (tùy chọn)</h4>
                 </div>
                 <div className="p-5 space-y-3">
                   <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">URL Video .mp4 (bỏ trống nếu dùng ảnh)</label>
                   <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={heroVideo} onChange={e => setHeroVideo(e.target.value)} placeholder="https://example.com/video.mp4" />
                   {heroVideo && <div className="mt-2 w-full h-28 bg-black rounded-lg overflow-hidden"><video src={heroVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" /></div>}
                 </div>
               </div>

               {/* SECTION 7: Hình ảnh Meta SEO */}
               <div className="border border-slate-200 rounded-2xl overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                   <span className="text-base">🌐</span>
                   <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Hình ảnh Meta SEO (Facebook/Zalo)</h4>
                 </div>
                 <div className="p-5 space-y-4">
                   <ImageUploadField
                     label="Ảnh đại diện khi chia sẻ link"
                     hint="Khuyến nghị: 1200×630px (Landscape) để hiển thị đẹp nhất trên Mạng xã hội"
                     currentUrl={seoImage}
                     settingKey="seo_image"
                     uploading={uploadingKey === 'seo_image'}
                     onFileSelect={(file) => handleImageUpload(file, 'seo_image', setSeoImage)}
                     onUrlChange={setSeoImage}
                   />
                 </div>
               </div>

               {/* Bottom save */}
               <div className="pt-2 pb-6 flex justify-end gap-3">
                 <div className="text-xs text-slate-400 flex items-center gap-1.5 mr-auto">
                   <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                   Tất cả thay đổi lưu lên Supabase — trang chủ cập nhật ngay
                 </div>
                 <button onClick={handleSaveAppearance} className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition gap-2">
                   <Save className="w-4 h-4" />
                   Lưu Tất Cả Thay Đổi
                 </button>
               </div>
              </div>
             </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskModal 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
          onSave={handleSaveTask} 
        />
      )}

      {/* User Edit Modal */}
      {editingUser && (
        <UserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onSave={handleSaveUser} 
        />
      )}

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-start p-4 rounded-xl shadow-lg border w-80 transform transition-all duration-300 animate-in slide-in-from-right-8 fade-in ${
            n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            n.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="mr-3 mt-0.5">
              {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {n.type === 'warning' && <AlertCircle className="w-5 h-5 text-orange-500" />}
              {n.type === 'info' && <Bell className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug pr-2">
              {n.message}
            </div>
            <button onClick={() => setNotifications(prev => prev.filter(nx => nx.id !== n.id))} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <TransactionModal 
        transaction={selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
      />

      {editingTransaction && (
        <TransactionFormModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={handleSaveTransaction}
        />
      )}
    </div>
  );
}

function TaskModal({ task, onClose, onSave }: { task: Task, onClose: () => void, onSave: (task: Task) => void }) {
  const [editedTask, setEditedTask] = useState<Task>(task);

  if (!editedTask) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{editedTask.id ? 'Sửa công việc' : 'Thêm công việc'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tên công việc</label>
            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={editedTask.title} onChange={e => setEditedTask({...editedTask, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Người phụ trách</label>
              <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={editedTask.assignee} onChange={e => setEditedTask({...editedTask, assignee: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ngày đến hạn</label>
              <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={editedTask.dueDate} onChange={e => setEditedTask({...editedTask, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Trạng thái</label>
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={editedTask.status} onChange={e => setEditedTask({...editedTask, status: e.target.value as any})}>
                <option value="TODO">Cần làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="DONE">Hoàn thành</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mức độ ưu tiên</label>
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={editedTask.priority || 'MEDIUM'} onChange={e => setEditedTask({...editedTask, priority: e.target.value as any})}>
                <option value="LOW">Thấp (Low)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HIGH">Cao (High)</option>
              </select>
            </div>
          </div>
          <div>
             <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tiến độ ({editedTask.progress}%)</label>
             <input type="range" min="0" max="100" className="w-full accent-blue-600" value={editedTask.progress} onChange={e => setEditedTask({...editedTask, progress: parseInt(e.target.value)})} />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg" onClick={onClose}>Hủy</button>
          <button className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => onSave(editedTask)}>Lưu thay đổi</button>
        </div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active = false, onClick, badge }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, badge?: number }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
        active ? 'bg-blue-600/10 text-blue-600 shadow-sm shadow-blue-500/5' : 'hover:bg-slate-800 text-slate-400'
      }`}
    >
      {icon}
      <span className="font-semibold text-sm flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>
      )}
    </div>
  );
}

function DashboardCard({ title, value, trend, trendPositive, progress, subtitle }: { title: string, value: string, trend?: string, trendPositive?: boolean, progress?: number, subtitle?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{value}</p>
      {trend && <p className={`mt-2 text-xs font-semibold flex items-center ${trendPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</p>}
      {progress !== undefined && (
        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

function TransactionTable({ transactions, onRowClick, onEdit, onDelete }: { transactions: Transaction[], onRowClick?: (t: Transaction) => void, onEdit?: (t: Transaction) => void, onDelete?: (id: string) => void }) {
  return (
    <table className="w-full text-left">
      <thead className="bg-slate-50 sticky top-0 text-[10px] font-bold text-slate-500 border-b border-slate-100 tracking-wider uppercase">
        <tr>
          <th className="px-6 py-4">Thời gian</th>
          <th className="px-6 py-4">Loại</th>
          <th className="px-6 py-4">Nội dung / Người góp</th>
          <th className="px-6 py-4">Chi tiết</th>
          <th className="px-6 py-4 text-right">Số tiền</th>
          <th className="px-6 py-4">Trạng thái</th>
          {(onEdit || onDelete) && <th className="px-6 py-4 text-right">Thác tác</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {transactions.map(t => (
          <tr key={t.id} onClick={() => onRowClick && onRowClick(t)} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
            <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">{t.date}</td>
            <td className="px-6 py-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {t.type === 'IN' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
              </div>
            </td>
            <td className="px-6 py-4">
              <p className="font-bold text-slate-900 text-sm">{t.name}</p>
              {t.note && <p className="text-xs text-slate-500 mt-0.5 w-48 truncate">{t.note}</p>}
            </td>
            <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
              {t.phone || '-'}
            </td>
            <td className={`px-6 py-4 text-right font-black text-sm whitespace-nowrap ${t.type === 'IN' ? 'text-emerald-700' : 'text-rose-600'}`}>
              {t.type === 'IN' ? '+' : '-'}{Math.abs(t.amount).toLocaleString('vi-VN')}đ
            </td>
            <td className="px-6 py-4">
              {t.status === 'SUCCESS' && <span className="text-[10px] px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 font-bold tracking-widest uppercase">Hoàn tất</span>}
              {t.status === 'PENDING' && <span className="text-[10px] px-2.5 py-1.5 bg-slate-50 text-slate-500 rounded-md border border-slate-200 font-bold tracking-widest uppercase">Chờ</span>}
              {t.status === 'AI_VERIFYING' && <span className="text-[10px] px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200 font-bold tracking-widest uppercase flex items-center w-max"><div className="w-1 h-1 bg-amber-500 rounded-full mr-1.5 animate-ping"></div>Chờ AI duyệt</span>}
            </td>
            {(onEdit || onDelete) && (
              <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 size={14}/></button>}
                  {onDelete && <button onClick={() => { if(confirm(`Xóa giao dịch của ${t.name}?`)) onDelete(t.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"><Trash2 size={14}/></button>}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TransactionFormModal({ transaction, onClose, onSave }: { transaction: Transaction, onClose: () => void, onSave: (t: Transaction) => void }) {
  const [form, setForm] = useState<Transaction>(transaction);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Vui lòng nhập tên!');
    if (!form.amount || form.amount === 0) return alert('Vui lòng nhập số tiền!');
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-900">{form.id ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Loại giao dịch</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value as TransactionType})}>
                <option value="IN">↑ Thu khoản</option>
                <option value="OUT">↓ Chi phí</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Trạng thái</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                <option value="SUCCESS">Hoàn tất</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="AI_VERIFYING">Chờ AI duyệt</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tên người / Nội dung *</label>
            <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nguyễn Văn A / Đặt tiệc nhà hàng..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Số tiền (VNĐ) *</label>
              <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})} placeholder="1000000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Số điện thoại</label>
              <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} placeholder="091***1234" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ngày / Thời gian</label>
            <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} placeholder="14:22, 12/10" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ghi chú</label>
            <textarea rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" value={form.note || ''} onChange={e => setForm({...form, note: e.target.value})} placeholder="Nội dung chuyển khoản, mô tả..." />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition" onClick={onClose}>Hủy</button>
          <button disabled={saving} className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-60" onClick={handleSave}>
            {saving ? 'Đang lưu...' : (form.id ? 'Lưu thay đổi' : 'Thêm giao dịch')}
          </button>
        </div>
      </div>
    </div>
  );
}


function TaskColumn({ title, count, tasks, onEdit, onDelete }: { title: string, count: number, tasks: Task[], onEdit: (task: Task) => void, onDelete: (id: string) => void }) {
  return (
    <div className="bg-slate-100/50 rounded-2xl p-4 flex flex-col border border-slate-200/60">
       <div className="flex items-center justify-between mb-4 px-2">
         <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
         <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">{count}</span>
       </div>
       <div className="space-y-3 flex-1 overflow-y-auto">
         {tasks.map(t => (
           <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                 <div className="flex space-x-2">
                   <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                     t.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                     t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                   }`}>
                     {t.status === 'DONE' ? 'Hoàn thành' : t.status === 'IN_PROGRESS' ? 'Đang làm' : 'Cần làm'}
                   </span>
                   {t.priority && (
                     <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                        t.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                        t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        'bg-slate-50 text-slate-500 border border-slate-200'
                     }`}>
                        {t.priority}
                     </span>
                   )}
                 </div>
                 <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                   <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={14} /></button>
                 </div>
              </div>
              <h4 className="font-bold text-slate-800 text-sm leading-snug mb-3">{t.title}</h4>
              {t.status !== 'DONE' && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1.5">
                    <span>Tiến độ thực hiện</span>
                    <span className="font-bold text-slate-700">{t.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div className={`h-full rounded-full transition-all duration-300 ${t.progress >= 75 ? 'bg-emerald-500' : t.progress >= 25 ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${t.progress}%` }}></div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                 <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-white ring-2 ring-slate-50">
                     {t.assignee.substring(0, 2).toUpperCase()}
                   </div>
                   <span className="text-xs font-medium text-slate-600">{t.assignee}</span>
                 </div>
                 <div className="text-[10px] font-semibold text-slate-400">{t.dueDate}</div>
              </div>
           </div>
         ))}
       </div>
    </div>
  );
}

function TransactionModal({ transaction, onClose }: { transaction: Transaction | null, onClose: () => void }) {
  if (!transaction) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
         <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
           <X className="w-5 h-5" />
         </button>
         <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            Chi tiết giao dịch {transaction.type === 'IN' ? 'Thu' : 'Chi'}
         </h3>
         <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
               <span className="text-xs text-slate-500 font-medium">Thời gian</span>
               <span className="text-sm font-semibold text-slate-800">{transaction.date}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
               <span className="text-xs text-slate-500 font-medium">Đối tượng</span>
               <span className="text-sm font-bold text-slate-900">{transaction.name}</span>
            </div>
            {transaction.phone && (
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                 <span className="text-xs text-slate-500 font-medium">Số điện thoại</span>
                 <span className="text-sm font-mono text-slate-600">{transaction.phone}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
               <span className="text-xs text-slate-500 font-medium">Số tiền</span>
               <span className={`text-lg font-black ${transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                 {transaction.type === 'IN' ? '+' : ''}{transaction.amount.toLocaleString('vi-VN')} đ
               </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
               <span className="text-xs text-slate-500 font-medium">Trạng thái</span>
               <span>
                  {transaction.status === 'SUCCESS' && <span className="text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 font-bold tracking-widest uppercase">Hoàn tất</span>}
                  {transaction.status === 'AI_VERIFYING' && <span className="text-[10px] px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 font-bold tracking-widest uppercase flex items-center w-max"><div className="w-1 h-1 bg-amber-500 rounded-full mr-1.5 animate-ping"></div>Chờ duyệt</span>}
               </span>
            </div>
             {transaction.note && (
              <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <span className="flex items-center text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-widest">
                   {transaction.note.includes('AI') ? <Check className="w-3 h-3 text-emerald-500 mr-1" /> : null}
                   Ghi chú / Thông tin thêm
                 </span>
                 <p className="text-sm text-slate-700 font-medium">{transaction.note}</p>
              </div>
            )}
         </div>
      </div>
    </div>
  )
}

function UserModal({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: (user: User) => void }) {
  const [editedUser, setEditedUser] = useState<User>(user);

  if (!editedUser) return null;

  const roles: Role[] = ['ADMIN', 'FINANCE', 'MEMBER'];
  const availablePermissions: {id: Permission, label: string}[] = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'transactions', label: 'Thu - Chi' },
    { id: 'tasks', label: 'Công việc' },
    { id: 'reports', label: 'Báo cáo' },
    { id: 'users', label: 'Quản trị viên' },
    { id: 'settings', label: 'Thiết lập' }
  ];

  const handleRoleChange = (newRole: Role) => {
    let defaultPerms: Permission[] = ['overview'];
    if (newRole === 'ADMIN') {
      defaultPerms = ['overview', 'transactions', 'tasks', 'reports', 'settings', 'users'];
    } else if (newRole === 'FINANCE') {
      defaultPerms = ['overview', 'transactions', 'reports'];
    } else if (newRole === 'MEMBER') {
      defaultPerms = ['overview', 'tasks'];
    }
    setEditedUser({ ...editedUser, role: newRole, permissions: defaultPerms });
  };

  const togglePermission = (perm: Permission) => {
    if (editedUser.permissions.includes(perm)) {
      setEditedUser({ ...editedUser, permissions: editedUser.permissions.filter(p => p !== perm) });
    } else {
      setEditedUser({ ...editedUser, permissions: [...editedUser.permissions, perm] });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{editedUser.id ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tên người dùng</label>
            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editedUser.name} onChange={e => setEditedUser({...editedUser, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email</label>
            <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editedUser.email} onChange={e => setEditedUser({...editedUser, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vai trò</label>
            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editedUser.role} onChange={e => handleRoleChange(e.target.value as Role)}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
             <label className="block text-xs font-semibold text-slate-600 uppercase mb-2 mt-4 text-center">Quyền truy cập modules</label>
             <div className="flex flex-wrap gap-2">
               {availablePermissions.map(p => {
                 const hasAccess = editedUser.permissions.includes(p.id);
                 return (
                   <button 
                     key={p.id} 
                     onClick={() => togglePermission(p.id)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                       hasAccess 
                         ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                         : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                     }`}
                   >
                     {p.label}
                   </button>
                 );
               })}
             </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3">
          <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition" onClick={onClose}>Hủy</button>
          <button className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition" onClick={() => onSave(editedUser)}>Lưu lại</button>
        </div>
      </div>
    </div>
  )
}


function ImageUploadField({
  label, hint, currentUrl, settingKey, uploading, onFileSelect, onUrlChange
}: {
  label: string;
  hint?: string;
  currentUrl: string;
  settingKey: string;
  uploading: boolean;
  onFileSelect: (file: File) => void;
  onUrlChange: (url: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</p>
          {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {uploading ? (
            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang upload...</>
          ) : (
            <><Upload size={12} /> Chọn ảnh</>
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelect(f); e.target.value=''; }} />
      </div>
      {/* Preview */}
      <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 h-36 flex items-center justify-center">
        {currentUrl ? (
          <>
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-50 transition">
                <Upload size={12} /> Thay ảnh
              </button>
              <button type="button" onClick={() => onUrlChange('')} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-red-600 transition">
                <Trash2 size={12} /> Xóa
              </button>
            </div>
          </>
        ) : (
          <div className="text-center cursor-pointer" onClick={() => inputRef.current?.click()}>
            <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Nhấn để chọn ảnh</p>
            <p className="text-[10px] text-slate-300">JPG, PNG, WEBP</p>
          </div>
        )}
      </div>
      {/* URL fallback */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Hoặc dán URL ảnh vào đây..."
          value={currentUrl}
          onChange={e => onUrlChange(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
        />
      </div>
    </div>
  );
}

