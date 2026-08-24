'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showFloatingBanner, setShowFloatingBanner] = useState(false);

  useEffect(() => {
    // Kiểm tra xem đã chạy ở chế độ App Standalone chưa
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Kiểm tra thiết bị iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Bắt sự kiện beforeinstallprompt trên Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Hiển thị banner cài đặt sau 3 giây nếu chưa cài app
      if (!isStandaloneMode) {
        setTimeout(() => setShowFloatingBanner(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowFloatingBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // Nếu đang mở dưới dạng App độc lập rồi thì ẩn
  if (isStandalone) return null;

  return (
    <>
      {/* 1. Nút cài đặt nhanh trên Header hoặc Floating Banner */}
      {showFloatingBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
          <div className="p-3.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Smartphone className="size-5" />
              </div>
              <div>
                <p className="font-bold text-foreground">Cài đặt App trên điện thoại</p>
                <p className="text-[11px] text-muted-foreground">Mở nhanh, mượt mà và tiện lợi hơn</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1 shadow-xs"
              >
                <Download className="size-3.5" /> Cài đặt
              </Button>
              <button
                onClick={() => setShowFloatingBanner(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal hướng dẫn cài đặt trên iPhone / iPad (iOS Safari) */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-md rounded-3xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Smartphone className="size-5 text-amber-500" />
              Cài đặt App trên iPhone / iPad
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs text-muted-foreground pt-1">
            <p>Để cài đặt ứng dụng CLB Nga My Thượng vào màn hình chính iPhone:</p>
            <div className="space-y-2.5 p-3 rounded-2xl bg-muted/40 border">
              <div className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p>
                  Bấm vào nút <strong>Chia sẻ (Share)</strong> <Share2 className="size-3.5 inline mx-1 text-primary" /> ở thanh công cụ dưới cùng của trình duyệt Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p>
                  Cuộn xuống và chọn mục <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong> <PlusSquare className="size-3.5 inline mx-1 text-primary" />.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p>
                  Bấm nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải để hoàn tất!
                </p>
              </div>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <Button size="sm" onClick={() => setShowIOSGuide(false)} className="rounded-xl text-xs">
              Đã hiểu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
