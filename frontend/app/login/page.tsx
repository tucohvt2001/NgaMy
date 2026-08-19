'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield, Award, CalendarDays } from 'lucide-react';
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
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* CỘT TRÁI: BANNER NGHỆ THUẬT LÂN SƯ RỒNG (Hiển thị trên màn hình từ lg trở lên) */}
      <section className="relative hidden lg:col-span-7 xl:col-span-7 lg:flex flex-col justify-between p-8 xl:p-12 overflow-hidden bg-black text-white">
        {/* Ảnh Banner nền */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/banner-login.png"
            alt="CLB Lân Sư Rồng Nga My Thượng Banner"
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
            className="object-cover object-center scale-[1.02] hover:scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Lớp gradient overlay để text nổi bật và chuyển tiếp mượt sang cột form */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/90" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60" />
        </div>

        {/* Header trên banner */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 backdrop-blur-md bg-black/40 border border-white/10 px-4 py-2 rounded-full shadow-lg">
            <Image
              src="/logo.jpg"
              alt="Logo Nga My Thượng"
              width={36}
              height={36}
              className="rounded-full ring-2 ring-amber-400/80"
            />
            <div>
              <p className="text-xs font-bold tracking-wider text-amber-400 uppercase">Nga My Thượng</p>
              <p className="text-[11px] text-gray-300">Đoàn Nghệ Thuật Lân Sư Rồng</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-medium backdrop-blur-md">
            <Sparkles className="size-3.5 text-amber-400 animate-pulse" />
            Hệ thống Quản lý Nội bộ
          </div>
        </div>

        {/* Footer & Giới thiệu trên banner */}
        <div className="relative z-10 space-y-6 max-w-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md text-xs font-medium text-amber-200 border border-white/10">
              <Shield className="size-3.5 text-amber-400" />
              Đoàn kết • Kỷ luật • Tinh hoa võ thuật
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white drop-shadow-md leading-tight">
              Bảo tồn & Phát huy <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
                Nghệ Thuật Lân Sư Rồng
              </span>
            </h2>
            <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
              Giải pháp số hóa toàn diện quản lý nhân sự, lịch biểu diễn, chấm công và tài chính cho CLB Nga My Thượng.
            </p>
          </div>

          {/* 3 Thẻ thống kê / điểm nổi bật */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
              <CalendarDays className="size-4 text-amber-400 mb-1" />
              <p className="text-xs font-semibold text-white">Lịch Diễn</p>
              <p className="text-[11px] text-gray-400">Phân công tự động</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
              <Award className="size-4 text-amber-400 mb-1" />
              <p className="text-xs font-semibold text-white">Điểm Danh</p>
              <p className="text-[11px] text-gray-400">Chấm công chính xác</p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
              <Shield className="size-4 text-amber-400 mb-1" />
              <p className="text-xs font-semibold text-white">Thù Lao</p>
              <p className="text-[11px] text-gray-400">Bảng lương minh bạch</p>
            </div>
          </div>
        </div>
      </section>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
      <section className="col-span-1 lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 xl:p-12 relative">
        {/* Banner nhỏ trên mobile */}
        <div className="lg:hidden relative w-full h-40 rounded-2xl overflow-hidden mb-6 shadow-md border">
          <Image
            src="/banner-login.png"
            alt="Banner Nga My Thượng"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.jpg" alt="Logo" width={36} height={36} className="rounded-full ring-2 ring-amber-400" />
              <div>
                <p className="text-xs font-bold text-amber-300">CLB LÂN SƯ RỒNG NGA MY THƯỢNG</p>
                <p className="text-[10px] text-gray-200">Hệ thống quản lý nội bộ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung chính giữa */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          {/* Header Form */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="hidden lg:inline-flex mb-1">
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={56}
                height={56}
                className="rounded-full ring-2 ring-primary/20 shadow-md"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Đăng nhập hệ thống</h1>
            <p className="text-sm text-muted-foreground">
              Chào mừng bạn quay trở lại! Vui lòng nhập tài khoản để tiếp tục.
            </p>
          </div>

          {/* Form đăng nhập */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Tên đăng nhập */}
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium">
                Tên đăng nhập hoặc Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="size-4" />
                </div>
                <Input
                  id="identifier"
                  placeholder="vd: superadmin hoặc admin"
                  className="pl-9 h-11 transition-all focus:ring-2 focus:ring-amber-500/20"
                  autoComplete="username"
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
            </div>

            {/* Mật khẩu */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="size-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-10 h-11 transition-all focus:ring-2 focus:ring-amber-500/20"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Nút Submit */}
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm shadow-md hover:shadow-lg transition-all gap-2 mt-2"
              disabled={submitting}
            >
              {submitting ? (
                'Đang xác thực...'
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CLB Lân Sư Rồng Nga My Thượng. Mọi quyền được bảo lưu.
        </div>
      </section>
    </main>
  );
}
