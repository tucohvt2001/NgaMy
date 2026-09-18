'use client';

import React from 'react';
import Image from 'next/image';
import { Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { BookingForm } from '@/components/public/BookingForm';

export default function PublicBookingPage() {
  return (
    <div className="min-h-screen relative text-white flex flex-col selection:bg-amber-500/40">
      {/* 1. BACKGROUND HÌNH ẢNH MÚA LÂN AI HOÀNH TRÁNG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/images/lion_dance_hero.jpg"
          alt="Lân Sư Rồng Background"
          fill
          className="object-cover object-center brightness-60"
          priority
        />
        {/* Lớp phủ gradient làm nổi nội dung */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90 backdrop-blur-[1px]" />
      </div>

      {/* 2. HEADER */}
      <header className="relative z-10 w-full border-b border-white/10 bg-black/50 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-3xl mx-auto flex items-center justify-center sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative size-8 sm:size-9 rounded-full overflow-hidden border-2 border-amber-400 shadow-md">
              <Image
                src="/icon.jpg"
                alt="Nga My Thượng Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-yellow-300 via-amber-400 to-red-400 bg-clip-text text-transparent uppercase">
                  NGA MY THƯỢNG
                </span>
                <span className="text-xs">🦁</span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">
                Đoàn Nghệ Thuật Lân Sư Rồng
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MAIN FORM CARD RỘNG RÃI & SANG TRỌNG */}
      <main className="relative z-10 flex-1 max-w-3xl sm:max-w-4xl w-full mx-auto px-4 py-8 sm:py-10 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-red-600/30 via-amber-500/30 to-red-600/30 border border-amber-400/50 text-yellow-300 text-xs sm:text-sm font-bold backdrop-blur-md shadow-sm">
            <Flame className="size-3.5 text-red-500 fill-red-500" />
            <span>ĐĂNG KÝ BIỂU DIỄN & TRANG TRÍ LÂN SƯ RỒNG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight drop-shadow-md">
            Đặt Lịch Sự Kiện Trực Tuyến
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Quý khách điền thông tin bên dưới, hệ thống hỗ trợ tìm kiếm vị trí bản đồ / GPS nhanh chóng.
          </p>
        </div>

        <Card className="p-6 sm:p-8 md:p-10 rounded-3xl border-2 border-amber-500/50 bg-black/80 backdrop-blur-xl shadow-2xl shadow-amber-500/10">
          <BookingForm />
        </Card>
      </main>

      {/* 4. FOOTER */}
      <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-400 mt-auto">
        <p className="text-[11px]">
          © Đoàn Nghệ Thuật Lân Sư Rồng Nga My Thượng • Đem may mắn & tài lộc đến mọi sự kiện
        </p>
      </footer>
    </div>
  );
}
