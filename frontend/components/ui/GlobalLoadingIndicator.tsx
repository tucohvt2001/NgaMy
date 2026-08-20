'use client';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useLoadingStore } from '@/stores/loadingStore';

export function GlobalLoadingIndicator() {
  const isAxiosLoading = useLoadingStore((state) => state.isLoading);
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isLoading = isAxiosLoading || isFetching > 0 || isMutating > 0;

  if (!isLoading) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] flex flex-col justify-between overflow-hidden">
      {/* Thanh chạy tiến trình ở mép trên màn hình */}
      <div className="relative h-1 w-full overflow-hidden bg-primary/10">
        <div className="absolute inset-y-0 left-0 w-full animate-[loading-bar_1.5s_infinite_linear] bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 shadow-sm" />
      </div>

      {/* Floating loading badge ở góc dưới bên phải */}
      <div className="p-4 flex justify-end">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/20 bg-background/95 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Loader2 className="size-3.5 animate-spin text-amber-500" />
          <span>Đang xử lý dữ liệu...</span>
        </div>
      </div>
    </div>
  );
}
