'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, Loader2, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Nếu đã đăng nhập rồi thì chuyển thẳng vào dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Chuyển lỗi tiếng Anh sang tiếng Việt thân thiện
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Quá nhiều lần thử. Vui lòng đợi vài phút rồi thử lại.');
        }
        throw error;
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
      
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to home */}
      <div className="relative z-10 p-6">
        <a
          href="/"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Về trang chủ</span>
        </a>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          
          {/* Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
            
            {/* Logo & Title */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-5 overflow-hidden border-2 border-amber-200/30">
                <Image
                  src="/logo.jpg"
                  alt="Logo Bình Sơn"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Cổng Quản Trị
              </h1>
              <p className="text-slate-400 text-sm mt-1.5 font-medium">
                Hội Khóa Bình Sơn · 2003 – 2006
              </p>
              <div className="flex items-center justify-center space-x-1.5 mt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-widest">
                  Chỉ dành cho Ban Tổ Chức
                </span>
              </div>
            </div>

            {/* Error alert */}
            {error && (
              <div className="mb-6 flex items-start space-x-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-rose-400 text-xs font-bold">!</span>
                </div>
                <p className="text-rose-300 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                    placeholder="admin@binhson.edu.vn"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-amber-400/80 hover:text-amber-300 transition-colors font-medium"
                  onClick={() => setError('Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.')}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <span>Đăng Nhập</span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Bảo mật bởi{' '}
                <span className="text-slate-500 font-semibold">Supabase Auth</span>
                {' '}· Dữ liệu được mã hóa end-to-end
              </p>
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-slate-600 text-xs mt-6">
            Trường THPT Bình Sơn · Khóa 2003 – 2006 · Hội Khóa 20 Năm
          </p>
        </div>
      </div>
    </div>
  );
}
