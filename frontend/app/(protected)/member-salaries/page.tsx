'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Calendar,
  Users,
  DollarSign,
  QrCode,
  Eye,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemberSalariesToDate } from '@/hooks/useSalaries';
import { useTeams } from '@/hooks/useTeams';
import { MemberToDateDetailDialog } from '@/components/forms/MemberToDateDetailDialog';
import { SalaryPaymentQrDialog } from '@/components/forms/SalaryPaymentQrDialog';
import { MemberSalaryToDateItem } from '@/services/salary.service';
import { SalaryRecord } from '@/types/models';
import { toast } from 'sonner';

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

export default function MemberSalariesToDatePage() {
  const [timeRange, setTimeRange] = useState<'ALL' | 'THIS_YEAR' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [debtFilter, setDebtFilter] = useState<'ALL' | 'HAS_DEBT' | 'PAID'>('ALL');
  const [search, setSearch] = useState<string>('');

  const [selectedMember, setSelectedMember] = useState<MemberSalaryToDateItem | null>(null);
  const [qrRecord, setQrRecord] = useState<SalaryRecord | null>(null);

  // Danh sách đội nhóm
  const { data: teams = [] } = useTeams();

  // Tính toán query params ngày
  const queryParams = useMemo(() => {
    const now = new Date();
    let fDate: string | undefined = undefined;
    let tDate: string | undefined = undefined;

    if (timeRange === 'THIS_YEAR') {
      fDate = new Date(now.getFullYear(), 0, 1).toISOString();
      tDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
    } else if (timeRange === 'THIS_MONTH') {
      fDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      tDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    } else if (timeRange === 'CUSTOM') {
      if (fromDate) fDate = new Date(fromDate).toISOString();
      if (toDate) tDate = new Date(toDate + 'T23:59:59.999Z').toISOString();
    }

    return {
      fromDate: fDate,
      toDate: tDate,
      teamId: teamId || undefined,
      search: search.trim() || undefined,
    };
  }, [timeRange, fromDate, toDate, teamId, search]);

  const { data, isLoading, refetch } = useMemberSalariesToDate(queryParams);

  // Lọc theo công nợ phía client
  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    return data.members.filter((m) => {
      if (debtFilter === 'HAS_DEBT') return m.remainingAmount > 0;
      if (debtFilter === 'PAID') return m.remainingAmount === 0 && m.totalAmount > 0;
      return true;
    });
  }, [data?.members, debtFilter]);

  // Xử lý mở VietQR thanh toán cho thành viên
  const handleOpenQr = (member: MemberSalaryToDateItem) => {
    if (!member.bankAccount) {
      toast.error('Thành viên này chưa cập nhật số tài khoản ngân hàng');
      return;
    }

    // Tạo đối tượng giả lập SalaryRecord để truyền vào SalaryPaymentQrDialog
    const fakeRecord: SalaryRecord = {
      id: `to_date_${member.memberId}`,
      memberId: member.memberId,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalSessions: member.totalEvents,
      baseAmount: member.remainingAmount,
      allowance: 0,
      bonus: 0,
      deduction: 0,
      totalAmount: member.remainingAmount,
      status: 'DRAFT',
      member: {
        id: member.memberId,
        memberCode: member.memberCode,
        fullName: member.fullName,
        bankAccount: member.bankAccount,
        bankName: member.bankName,
        bankCode: member.bankCode,
        bankBin: member.bankBin,
        status: member.status,
      } as any,
      details: [],
    };

    setQrRecord(fakeRecord);
  };

  // Xuất file CSV báo cáo thu nhập
  const handleExportCsv = () => {
    if (!filteredMembers || filteredMembers.length === 0) {
      toast.error('Không có dữ liệu để xuất file');
      return;
    }

    const headers = [
      'STT',
      'Mã thành viên',
      'Họ và tên',
      'Đội nhóm',
      'Số show',
      'Tổng tiền công (VNĐ)',
      'Đã thanh toán (VNĐ)',
      'Còn lại chưa chi (VNĐ)',
      'Số tài khoản',
      'Ngân hàng',
    ];

    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      `"${m.memberCode}"`,
      `"${m.fullName}"`,
      `"${m.teams.join(', ')}"`,
      m.totalEvents,
      m.totalAmount,
      m.paidAmount,
      m.remainingAmount,
      `"${m.bankAccount || ''}"`,
      `"${m.bankName || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_cao_luong_thanh_vien_den_hien_tai_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file báo cáo thu nhập thành viên thành công');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <TrendingUp className="size-7 text-amber-500" />
            Lương Thành Viên Đến Hiện Tại
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Tổng hợp tiền công biểu diễn, tiền đã thanh toán và công nợ còn lại của từng thành viên theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl text-xs gap-1.5 font-semibold h-9"
          >
            <RefreshCw className="size-3.5" />
            Làm mới
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-9 shadow-xs"
          >
            <Download className="size-3.5" />
            Xuất Excel / CSV
          </Button>
        </div>
      </div>

      {/* 2. Bốn Thẻ KPI Thống Kê Tổng Hợp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-border/70 bg-gradient-to-br from-amber-500/[0.08] via-card to-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tổng tiền công phát sinh</p>
              <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(data?.summary.grandTotalAmount ?? 0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {data?.summary.activeMembersWithEarnings ?? 0} thành viên có thu nhập
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <DollarSign className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-gradient-to-br from-emerald-500/[0.08] via-card to-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Đã thanh toán thực tế</p>
              <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(data?.summary.grandPaidAmount ?? 0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Đã chi trả qua VietQR / Tiền mặt</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-gradient-to-br from-rose-500/[0.08] via-card to-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Còn lại chưa thanh toán</p>
              <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(data?.summary.grandRemainingAmount ?? 0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Công nợ CLB cần chi trả</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-gradient-to-br from-blue-500/[0.08] via-card to-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tổng lượt đi show</p>
              <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {data?.summary.grandTotalEvents ?? 0} lượt
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Quy mô {data?.summary.totalMembers ?? 0} thành viên
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Bộ Lọc Thời Gian & Tìm Kiếm */}
      <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Pills Chọn Nhanh Khoảng Thời Gian */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-background border border-border overflow-x-auto max-w-full">
            <Button
              type="button"
              variant={timeRange === 'ALL' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('ALL')}
              className="h-7 text-xs px-3 rounded-xl font-semibold"
            >
              Toàn thời gian (Đến nay)
            </Button>
            <Button
              type="button"
              variant={timeRange === 'THIS_YEAR' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('THIS_YEAR')}
              className="h-7 text-xs px-3 rounded-xl font-semibold"
            >
              Năm nay (2026)
            </Button>
            <Button
              type="button"
              variant={timeRange === 'THIS_MONTH' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('THIS_MONTH')}
              className="h-7 text-xs px-3 rounded-xl font-semibold"
            >
              Tháng này
            </Button>
            <Button
              type="button"
              variant={timeRange === 'CUSTOM' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('CUSTOM')}
              className="h-7 text-xs px-3 rounded-xl font-semibold"
            >
              Tùy chọn ngày
            </Button>
          </div>

          {/* Lọc Trạng Thái Nợ */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-background border border-border">
            <Button
              type="button"
              variant={debtFilter === 'ALL' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDebtFilter('ALL')}
              className="h-7 text-xs px-2.5 rounded-xl font-semibold"
            >
              Tất cả ({data?.members.length ?? 0})
            </Button>
            <Button
              type="button"
              variant={debtFilter === 'HAS_DEBT' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDebtFilter('HAS_DEBT')}
              className="h-7 text-xs px-2.5 rounded-xl font-semibold text-rose-600 dark:text-rose-400"
            >
              Còn nợ lương ({data?.members.filter((m) => m.remainingAmount > 0).length ?? 0})
            </Button>
            <Button
              type="button"
              variant={debtFilter === 'PAID' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDebtFilter('PAID')}
              className="h-7 text-xs px-2.5 rounded-xl font-semibold text-emerald-600 dark:text-emerald-400"
            >
              Đã thanh toán đủ
            </Button>
          </div>
        </div>

        {/* Dòng thứ 2: Tùy chỉnh ngày & Đội nhóm & Tìm kiếm */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {timeRange === 'CUSTOM' && (
            <>
              <div>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-background"
                  placeholder="Từ ngày..."
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-background"
                  placeholder="Đến ngày..."
                />
              </div>
            </>
          )}

          <div>
            <Select value={teamId || '__all__'} onValueChange={(val) => setTeamId(val === '__all__' ? '' : val)}>
              <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
                <SelectValue placeholder="-- Tất cả đội nhóm --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__" className="text-xs">
                  Tất cả đội nhóm
                </SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã TV, SĐT..."
              className="h-9 text-xs pl-9 rounded-xl bg-background"
            />
          </div>
        </div>
      </div>

      {/* 4. Bảng Dữ Liệu Lương Thành Viên */}
      <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xs bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
              <TableHead className="min-w-[180px] text-xs font-bold">Thành viên</TableHead>
              <TableHead className="w-24 text-center text-xs font-bold">Số show</TableHead>
              <TableHead className="min-w-[140px] text-right text-xs font-bold">Tổng tiền công</TableHead>
              <TableHead className="min-w-[140px] text-right text-xs font-bold">Đã chi trả</TableHead>
              <TableHead className="min-w-[150px] text-right text-xs font-bold">Còn lại chưa chi</TableHead>
              <TableHead className="min-w-[180px] text-xs font-bold">Tài khoản ngân hàng</TableHead>
              <TableHead className="w-28 text-right text-xs font-bold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                  Đang tổng hợp dữ liệu thu nhập thành viên...
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                  Không tìm thấy thành viên nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member, idx) => {
                return (
                  <TableRow key={member.memberId} className="hover:bg-muted/20">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {member.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-foreground block">{member.fullName}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              ({member.memberCode})
                            </span>
                          </div>
                          {member.teams.length > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              {member.teams.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs font-bold text-foreground">
                      {member.totalEvents > 0 ? (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {member.totalEvents}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs text-foreground">
                      {formatCurrency(member.totalAmount)}
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(member.paidAmount)}
                    </TableCell>

                    <TableCell className="text-right">
                      {member.remainingAmount > 0 ? (
                        <span className="font-black text-xs text-rose-600 dark:text-rose-400">
                          {formatCurrency(member.remainingAmount)}
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          <CheckCircle2 className="size-3 mr-1" /> Đã chi đủ
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {member.bankAccount ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                            <span>{member.bankAccount}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                            {member.bankName || member.bankCode || 'Ngân hàng'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Chưa có STK</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {member.remainingAmount > 0 && member.bankAccount && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenQr(member)}
                            className="h-8 px-2 rounded-xl text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 text-xs font-bold gap-1 shadow-xs"
                            title="Quét VietQR chi trả nhanh"
                          >
                            <QrCode className="size-3.5" />
                            <span className="hidden sm:inline">QR</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                          className="h-8 px-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium gap-1"
                        >
                          <Eye className="size-3.5" />
                          <span className="hidden sm:inline">Chi tiết</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 5. Dialog Chi Tiết Từng Show Của Thành Viên */}
      <MemberToDateDetailDialog
        open={Boolean(selectedMember)}
        onOpenChange={(open) => !open && setSelectedMember(null)}
        member={selectedMember}
        onOpenQr={handleOpenQr}
      />

      {/* 6. Dialog Quét VietQR Thanh Toán Nhanh */}
      <SalaryPaymentQrDialog
        open={Boolean(qrRecord)}
        onOpenChange={(open) => !open && setQrRecord(null)}
        record={qrRecord}
        onConfirm={() => {
          setQrRecord(null);
          refetch();
        }}
      />
    </div>
  );
}
