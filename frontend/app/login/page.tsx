'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Award,
  CalendarDays,
  Maximize2,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/errors';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [mobileMode, setMobileMode] = useState<'contain' | 'cover'>('contain');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const result = await authService.login(values.identifier, values.password);
      setAuth(result);
      toast.success('Đăng nhập thành công');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Đăng nhập thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      onClick={() => setIsCardVisible((prev) => !prev)}
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-black select-none cursor-pointer"
      title={isCardVisible ? 'Chạm ra ngoài để xem trọn vẹn ảnh nền' : 'Chạm vào màn hình để mở đăng nhập'}
    >
      {/* ẢNH NỀN BANNER THÔNG MINH (Desktop: Full 100%, Mobile: Xem trọn vẹn không bị cắt) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* 1. Lớp nền mờ Ambient Glow tạo chiều sâu (Đặc biệt trên màn hình dọc Mobile) */}
        <Image
          src="/banner.jpg"
          alt="Thể Thao Nga My Ambient"
          fill
          priority
          sizes="100vw"
          className={`object-cover object-center transition-all duration-700 ease-out ${
            isCardVisible
              ? 'scale-105 filter blur-xs brightness-90 contrast-105'
              : 'scale-110 filter blur-xl brightness-50 contrast-125 opacity-70'
          }`}
        />

        {/* 2. Lớp ảnh chính: Trên Desktop luôn tràn viền (object-cover), trên Mobile khi ẩn form sẽ chuyển sang object-contain xem trọn vẹn 100% */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/banner.jpg"
            alt="Thể Thao Nga My Banner"
            fill
            priority
            sizes="100vw"
            className={`transition-all duration-700 ease-out ${
              isCardVisible
                ? 'object-cover object-center scale-[1.02] filter brightness-90 contrast-105'
                : mobileMode === 'contain'
                ? 'sm:object-cover object-contain object-center scale-100 filter brightness-100 contrast-105 drop-shadow-2xl'
                : 'object-cover object-center scale-100 filter brightness-100 contrast-105'
            }`}
          />
        </div>

        {/* Lớp phủ động: Khi ẩn Card thì mờ đi để lộ trọn vẹn ảnh banner rực rỡ */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            isCardVisible
              ? 'bg-gradient-to-b from-black/75 via-black/55 to-black/85 backdrop-blur-[2px] opacity-100'
              : 'bg-black/10 backdrop-blur-none opacity-20'
          }`}
        />
        <div
          className={`absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80 transition-opacity duration-700 ${
            isCardVisible ? 'opacity-100' : 'opacity-10'
          }`}
        />
      </div>

      {/* HEADER LOGO GÓC TRÁI (Desktop) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-6 left-6 z-10 hidden sm:flex items-center gap-3 backdrop-blur-md bg-black/40 border border-white/15 px-4 py-2 rounded-full shadow-xl cursor-default"
      >
        <Image
          src="/logo.jpg"
          alt="Logo Nga My"
          width={32}
          height={32}
          className="rounded-full ring-2 ring-amber-400"
        />
        <div className="leading-tight">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Thể Thao Nga My</p>
          <p className="text-[10px] text-gray-300">Đoàn Nghệ Thuật Lân Sư Rồng</p>
        </div>
      </div>

      {/* NÚT CHUYỂN CHẾ ĐỘ XEM TRÀN VIỀN / TOÀN CẢNH TRÊN MOBILE */}
      {!isCardVisible && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setMobileMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
          }}
          className="absolute top-6 right-6 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer hover:scale-105"
          title="Chuyển chế độ xem ảnh"
        >
          {mobileMode === 'contain' ? (
            <>
              <Maximize2 className="size-3.5 text-amber-400" />
              <span>Xem tràn viền</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 text-amber-400" />
              <span>Xem trọn vẹn 100%</span>
            </>
          )}
        </div>
      )}

      {/* NÚT HOẶC THANH GỢI Ý KHI ẨN CARD (Nằm sát đáy màn hình chính giữa) */}
      {!isCardVisible && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsCardVisible(true);
          }}
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-6 py-3 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-2xl border border-amber-400/60 text-amber-300 shadow-2xl shadow-black/80 hover:shadow-amber-500/30 text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 hover:scale-105 cursor-pointer animate-bounce"
        >
          <LogIn className="size-4 text-amber-400 stroke-[2.5]" />
          <span>Chạm vào màn hình để Đăng nhập</span>
        </div>
      )}

      {/* CARD ĐĂNG NHẬP GLASSMORPHISM TRUNG TÂM */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-md my-auto cursor-default transition-all duration-500 transform ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isCardVisible
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="relative backdrop-blur-2xl bg-black/70 sm:bg-black/80 border border-white/15 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-black/80 ring-1 ring-white/10">
          {/* Nút thu nhỏ/ẩn card góc trên bên phải */}
          <button
            type="button"
            onClick={() => setIsCardVisible(false)}
            title="Ẩn khung đăng nhập để xem ảnh nền"
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-all cursor-pointer"
          >
            <EyeOff className="size-4" />
          </button>

          {/* Header Card */}
          <div className="text-center space-y-3 mb-6">
            <div className="relative inline-block">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 opacity-70 blur-xs" />
              <Image
                src="/logo.jpg"
                alt="Logo Nga My"
                width={64}
                height={64}
                priority
                className="relative rounded-full ring-2 ring-amber-400/90 shadow-xl mx-auto"
              />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-semibold">
                <Sparkles className="size-3 text-amber-400 animate-pulse" />
                Hệ Thống Quản Lý Nội Bộ
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Thể Thao Nga My
              </h1>
              <p className="text-xs text-gray-300">
                Đăng nhập để quản lý lịch diễn, nhân sự & sổ quỹ
              </p>
            </div>
          </div>

          {/* Form đăng nhập */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Tên đăng nhập */}
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-semibold text-gray-200">
                Tên đăng nhập hoặc Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/80">
                  <User className="size-4" />
                </div>
                <Input
                  id="identifier"
                  placeholder="Nhập username hoặc email..."
                  className="pl-10 h-11 bg-white/10 hover:bg-white/15 focus:bg-white/20 border-white/15 focus:border-amber-400/80 text-white placeholder:text-gray-400 rounded-xl transition-all focus:ring-2 focus:ring-amber-400/20 text-sm"
                  autoComplete="username"
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && (
                <p className="text-xs text-rose-400 font-medium pl-1">{errors.identifier.message}</p>
              )}
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-gray-200">
                Mật khẩu
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/80">
                  <Lock className="size-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-white/10 hover:bg-white/15 focus:bg-white/20 border-white/15 focus:border-amber-400/80 text-white placeholder:text-gray-400 rounded-xl transition-all focus:ring-2 focus:ring-amber-400/20 text-sm"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400 font-medium pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Nút Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11.5 font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 gap-2 mt-3 active:scale-[0.99] border-none cursor-pointer"
            >
              {submitting ? (
                'Đang xác thực...'
              ) : (
                <>
                  Đăng Nhập Ngay
                  <ArrowRight className="size-4 stroke-[2.5]" />
                </>
              )}
            </Button>
          </form>

          {/* 3 Điểm nhấn dưới form */}
          <div className="grid grid-cols-3 gap-2 pt-5 mt-5 border-t border-white/10 text-center">
            <div className="space-y-0.5">
              <CalendarDays className="size-3.5 text-amber-400 mx-auto" />
              <p className="text-[10px] font-semibold text-gray-200">Lịch Diễn</p>
              <p className="text-[9px] text-gray-400">Tự động</p>
            </div>
            <div className="space-y-0.5">
              <Award className="size-3.5 text-amber-400 mx-auto" />
              <p className="text-[10px] font-semibold text-gray-200">Điểm Danh</p>
              <p className="text-[9px] text-gray-400">Chính xác</p>
            </div>
            <div className="space-y-0.5">
              <Shield className="size-3.5 text-amber-400 mx-auto" />
              <p className="text-[10px] font-semibold text-gray-200">Sổ Quỹ</p>
              <p className="text-[9px] text-gray-400">Minh bạch</p>
            </div>
          </div>

          {/* Gợi ý tương tác */}
          <div className="mt-4 pt-3 border-t border-white/5 text-center">
            <p className="text-[10px] text-amber-300/80 flex items-center justify-center gap-1">
              <Maximize2 className="size-3" />
              Chạm ra ngoài khung để ngắm ảnh nền
            </p>
          </div>
        </div>

        {/* Footer bản quyền */}
        <p className="text-center text-[11px] text-gray-400 mt-4 drop-shadow-sm">
          © {new Date().getFullYear()} Thể Thao Nga My. Mọi quyền được bảo lưu.
        </p>
      </div>
    </main>
  );
}
