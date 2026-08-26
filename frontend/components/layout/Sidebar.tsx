'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Briefcase,
  KeyRound,
  CalendarDays,
  CalendarHeart,
  ClipboardList,
  CheckSquare,
  FileClock,
  Wallet,
  TrendingUp,
  Coins,
  ReceiptText,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  { items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'Quản lý nhân sự',
    items: [
      { href: '/members', label: 'Thành viên', icon: Users, permission: 'member:read' },
      { href: '/teams', label: 'Đội / Nhóm', icon: UsersRound, permission: 'team:read' },
      { href: '/roles', label: 'Chức vụ', icon: Briefcase, permission: 'position:read' },
      { href: '/accounts', label: 'Tài khoản', icon: KeyRound, permission: 'account:read' },
    ],
  },
  {
    title: 'Hoạt động',
    items: [
      { href: '/schedules', label: 'Lịch diễn', icon: CalendarDays, permission: 'event:read' },
      { href: '/assignments', label: 'Phân công', icon: ClipboardList, permission: 'assignment:read' },
      { href: '/attendance', label: 'Chấm công', icon: CheckSquare, permission: 'attendance:read' },
      { href: '/leaves', label: 'Nghỉ phép', icon: FileClock, permission: 'leave:read' },
      { href: '/event-types', label: 'Loại show', icon: CalendarHeart, permission: 'event:read' },
    ],
  },
  {
    title: 'Tài chính',
    items: [
      { href: '/transactions', label: 'Sổ quỹ thu chi', icon: ReceiptText, permission: 'finance:read' },
      { href: '/salaries', label: 'Bảng lương tháng', icon: Wallet, permission: 'salary:read' },
      { href: '/member-salaries', label: 'Lương đến hiện tại', icon: TrendingUp, permission: 'salary:read' },
      { href: '/salary-rates', label: 'Thiết lập lương', icon: Coins, permission: 'salary:read' },
    ],
  },
  {
    title: 'Báo cáo',
    items: [{ href: '/reports', label: 'Báo cáo', icon: BarChart3, permission: 'report:read' }],
  },
];

interface SidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-card/85 backdrop-blur-xl text-foreground border-r border-border/80 shadow-xs select-none transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* 1. Header Brand & Logo */}
      <div
        className={cn(
          'flex items-center gap-3 px-3.5 py-4 border-b border-border/60',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <Link
          href="/dashboard"
          className={cn('flex items-center gap-2.5 group', isCollapsed && 'justify-center')}
          title="Thể Thao Nga My - Đoàn Lân Sư Rồng"
        >
          <div className="relative shrink-0">
            <div className="absolute -inset-0.5 rounded-full bg-amber-500 opacity-60 blur-[2px] group-hover:opacity-100 transition-opacity" />
            <Image
              src="/logo.jpg"
              alt="Thể Thao Nga My"
              width={34}
              height={34}
              className="relative rounded-full ring-2 ring-amber-400 object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="leading-tight overflow-hidden transition-opacity duration-200">
              <span className="block text-sm font-extrabold tracking-tight text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                Thể Thao Nga My
              </span>
              <span className="block text-[10px] font-medium text-muted-foreground truncate">
                Đoàn Lân Sư Rồng
              </span>
            </div>
          )}
        </Link>

        {/* Nút đóng trên Mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted md:hidden"
            aria-label="Đóng menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* 2. Danh sách Navigation Links */}
      <nav className={cn('flex-1 overflow-y-auto py-4 space-y-4', isCollapsed ? 'px-2' : 'px-3')}>
        {navGroups.map((group, idx) => {
          const items = group.items.filter((item) => !item.permission || hasPermission(item.permission));
          if (items.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {group.title && (
                isCollapsed ? (
                  <div className="my-2 border-t border-border/40 mx-2" title={group.title} />
                ) : (
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {group.title}
                  </p>
                )
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={item.label}
                      className={cn(
                        'flex items-center rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group',
                        isCollapsed
                          ? 'justify-center size-10 mx-auto p-0'
                          : 'gap-2.5 px-3 py-2',
                        active
                          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-black font-bold shadow-md shadow-amber-500/25'
                          : 'text-foreground/75 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'size-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                          active ? 'text-black' : 'text-muted-foreground group-hover:text-amber-600'
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* 3. Footer và Nút thu gọn / mở rộng nhanh */}
      <div className={cn('p-2.5 border-t border-border/60 space-y-2', isCollapsed ? 'text-center' : '')}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-1 p-1.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground truncate px-1">CLB Nga My Thượng</span>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex items-center justify-center size-7 rounded-lg hover:bg-amber-500/15 text-muted-foreground hover:text-foreground transition-colors"
                title="Thu gọn menu"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
          </div>
        ) : (
          onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center size-10 mx-auto rounded-xl hover:bg-amber-500/15 text-muted-foreground hover:text-amber-600 transition-colors"
              title="Mở rộng menu"
            >
              <ChevronRight className="size-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
