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
  ClipboardList,
  CheckSquare,
  FileClock,
  Wallet,
  BarChart3,
  X,
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
    ],
  },
  {
    title: 'Tài chính',
    items: [{ href: '/salaries', label: 'Tiền công', icon: Wallet, permission: 'salary:read' }],
  },
  {
    title: 'Báo cáo',
    items: [{ href: '/reports', label: 'Báo cáo', icon: BarChart3, permission: 'report:read' }],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  return (
    <div className="flex h-full flex-col bg-background text-foreground border-r">
      <div className="flex items-center justify-between gap-2 px-4 py-4 border-b">
        <span className="flex items-center gap-2 text-base font-bold leading-tight">
          <Image src="/logo.jpg" alt="Nga My Thượng" width={36} height={36} className="rounded-full" />
          CLB Lân Sư Rồng Nga My Thượng
        </span>
        {onClose && (
          <button onClick={onClose} className="md:hidden" aria-label="Đóng menu">
            <X className="size-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group, idx) => {
          const items = group.items.filter((item) => !item.permission || hasPermission(item.permission));
          if (items.length === 0) return null;
          return (
            <div key={idx}>
              {group.title && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">{group.title}</p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
