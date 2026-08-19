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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardCharts, useDashboardSummary } from '@/hooks/useDashboard';
import { Users, UsersRound, CalendarDays, Wallet, UserCheck, Activity } from 'lucide-react';

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}

const COLORS = ['#16a34a', '#dc2626', '#f59e0b'];

export default function DashboardPage() {
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: charts } = useDashboardCharts(new Date().getFullYear());

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
      </div>
    </div>
  );
}
