'use client';

import Image from 'next/image';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/types/enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardCharts, useDashboardSummary } from '@/hooks/useDashboard';
import { useTransactionSummary } from '@/hooks/useTransactions';
import { useAuthStore } from '@/stores/authStore';
import {
  Users,
  UsersRound,
  CalendarDays,
  Wallet,
  UserCheck,
  Activity,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}

const COLORS = ['#16a34a', '#dc2626', '#f59e0b'];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const canReadFinance = user?.permissions.includes('finance:read');

  const { data: summary, isLoading } = useDashboardSummary();
  const { data: charts } = useDashboardCharts(new Date().getFullYear());
  const { data: financeSummary } = useTransactionSummary();

  const summaryCards = [
    { label: 'Tổng thành viên', value: summary?.totalMembers ?? 0, icon: Users },
    { label: 'Thành viên hoạt động', value: summary?.activeMembers ?? 0, icon: UserCheck },
    { label: 'Số đội', value: summary?.totalTeams ?? 0, icon: UsersRound },
    { label: 'Buổi diễn tháng này', value: summary?.eventsThisMonth ?? 0, icon: CalendarDays },
    { label: 'Người tham gia tháng này', value: summary?.participantsThisMonth ?? 0, icon: Activity },
    {
      label: 'Tổng tiền công tháng này',
      value: formatCurrency(summary?.totalSalaryThisMonth ?? 0),
      icon: Wallet,
    },
    ...(canReadFinance
      ? [
          {
            label: 'Tồn quỹ CLB hiện tại',
            value: formatCurrency(financeSummary?.netBalance ?? 0),
            icon: ReceiptText,
          },
        ]
      : []),
  ];

  const memberStatusData = charts
    ? [
        { name: 'Đang hoạt động', value: charts.memberStatus.active },
        { name: 'Ngừng hoạt động', value: charts.memberStatus.inactive },
        { name: 'Đang nghỉ', value: charts.memberStatus.onLeave },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
        <Image
          src="/logo.jpg"
          alt="Nga My Thượng"
          width={64}
          height={64}
          className="rounded-full border-2 border-white shrink-0"
          priority
        />
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-white/90">Tổng quan hoạt động CLB Lân Sư Rồng Nga My Thượng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : card.value}</p>
              </div>
              <card.icon className="size-8 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Số buổi diễn theo tháng</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.eventsByMonth ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(m) => `T${m}`} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(m) => `Tháng ${m}`} />
                <Bar dataKey="count" fill="#2563eb" name="Số buổi diễn" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tiền công theo tháng</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.salaryByMonth ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(m) => `T${m}`} />
                <YAxis />
                <Tooltip
                  labelFormatter={(m) => `Tháng ${m}`}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Bar dataKey="total" fill="#16a34a" name="Tổng tiền công" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ chuyên cần</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{charts?.attendanceRate.rate ?? 0}%</p>
            <p className="text-sm text-muted-foreground">
              {charts?.attendanceRate.present ?? 0}/{charts?.attendanceRate.total ?? 0} buổi có mặt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái thành viên</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={memberStatusData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {memberStatusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {canReadFinance && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Biến động Thu - Chi Sổ Quỹ ({new Date().getFullYear()})</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  So sánh dòng tiền thu vào (xanh) và chi ra (đỏ) theo từng tháng
                </p>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeSummary?.monthlyStats ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={(m) => `T${m}`} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(m) => `Tháng ${m}`}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                  <Bar dataKey="income" fill="#16a34a" name="Tổng thu" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#dc2626" name="Tổng chi" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 5 LỊCH DIỄN SẮP TỚI */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <CalendarDays className="size-5 text-amber-600 dark:text-amber-400" />
                5 Lịch Diễn Sắp Tới
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Danh sách các buổi diễn gần nhất của CLB Lân Sư Rồng
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs gap-1">
              <Link href="/schedules">
                Xem tất cả lịch diễn <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!summary?.upcomingEvents || summary.upcomingEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Chưa có lịch diễn nào được tạo trong hệ thống.
              </div>
            ) : (
              <div className="divide-y rounded-lg border bg-muted/10 overflow-hidden">
                {summary.upcomingEvents.map((ev) => {
                  const evDate = new Date(ev.eventDate);
                  const isFuture = evDate.getTime() >= new Date().setHours(0, 0, 0, 0);

                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Box Ngày giờ */}
                        <div className="flex flex-col items-center justify-center size-12 rounded-xl bg-primary/10 border border-primary/20 shrink-0 text-center">
                          <span className="text-[10px] font-bold uppercase text-primary">
                            T{evDate.getMonth() + 1}
                          </span>
                          <span className="text-base font-black text-foreground leading-none">
                            {evDate.getDate()}
                          </span>
                        </div>

                        {/* Thông tin show */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-foreground hover:text-primary transition-colors">
                              {ev.name}
                            </span>
                            <span className="text-[11px] font-mono font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                              {ev.eventCode}
                            </span>
                            <Badge
                              variant={ev.status === 'CANCELLED' ? 'destructive' : 'secondary'}
                              className="text-[10px]"
                            >
                              {STATUS_LABELS[ev.status] || ev.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3 text-primary" />
                              {evDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 text-primary" />
                              {ev.location}
                            </span>
                            {ev.customerName && (
                              <span>
                                Khách: <strong>{ev.customerName}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Phía bên phải: Số người & Nút hành động */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1 justify-end">
                            <Users className="size-3.5 text-muted-foreground" />
                            {ev._count?.eventMembers ?? 0} người
                          </div>
                          {ev.contractValue ? (
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(ev.contractValue)}
                            </div>
                          ) : null}
                        </div>

                        <Button size="sm" variant="ghost" asChild className="h-8 text-xs">
                          <Link href={`/assignments?eventId=${ev.id}`}>
                            Phân công
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

