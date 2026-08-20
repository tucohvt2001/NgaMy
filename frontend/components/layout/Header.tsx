'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { ROLE_LABELS } from '@/types/enums';
import { RoleName } from '@/types/enums';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ onMenuClick, onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Bỏ qua lỗi logout phía server, vẫn xóa phiên đăng nhập cục bộ
    }
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="flex h-15 items-center justify-between border-b border-border/70 bg-card/75 backdrop-blur-xl px-3 sm:px-6 shadow-xs sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Nút menu trên Mobile (mở drawer) */}
        <Button variant="ghost" size="icon" className="md:hidden rounded-xl size-9" onClick={onMenuClick}>
          <Menu className="size-5" />
        </Button>

        {/* Nút thu gọn / mở rộng Sidebar trên Desktop */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex rounded-xl size-9 text-muted-foreground hover:text-foreground hover:bg-amber-500/10"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Mở rộng thanh menu (Sidebar)' : 'Thu gọn thanh menu (Sidebar)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="size-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
        )}

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">Hệ thống Quản lý Hoạt động</span>
          <span>•</span>
          <span>
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 h-10 rounded-full hover:bg-amber-500/10 transition-colors"
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-extrabold text-xs shadow-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-foreground">{user?.username}</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                {user ? ROLE_LABELS[user.roleName as RoleName] : ''}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1 rounded-2xl shadow-xl border-border/80">
          <DropdownMenuLabel className="p-2.5">
            <p className="text-xs font-bold text-foreground">{user?.username}</p>
            <p className="text-[11px] text-muted-foreground">{user?.email || 'Nội bộ CLB'}</p>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
              {user ? ROLE_LABELS[user.roleName as RoleName] : ''}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl cursor-pointer p-2 text-xs font-semibold"
          >
            <LogOut className="mr-2 size-4" />
            Đăng xuất khỏi hệ thống
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
