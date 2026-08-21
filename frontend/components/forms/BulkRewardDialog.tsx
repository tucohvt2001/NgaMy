'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Award,
  Gift,
  Sparkles,
  Users,
  Check,
  Copy,
  Download,
  CreditCard,
  Building2,
  AlertCircle,
  Calendar,
  Wallet,
  QrCode,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMembers } from '@/hooks/useMembers';
import { useTeams } from '@/hooks/useTeams';
import { useCreateBulkReward } from '@/hooks/useTransactions';
import { BulkRewardPaymentItem, Member } from '@/types/models';

interface BulkRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MemberRewardRow {
  selected: boolean;
  member: Member;
  amount: number;
  note: string;
}

function formatCurrency(val: number) {
  return (val || 0).toLocaleString('vi-VN') + ' đ';
}

const QUICK_SUGGESTIONS = [
  'Thưởng nóng giải đấu Lân Sư Rồng',
  'Thưởng Tết & Lì xì đầu xuân',
  'Khen thưởng hoàn thành xuất sắc show diễn',
  'Khen thưởng cống hiến & đóng góp CLB',
  'Thưởng chuyên cần & tinh thần tập luyện',
];

export function BulkRewardDialog({ open, onOpenChange }: BulkRewardDialogProps) {
  const [step, setStep] = useState<'form' | 'qr_list'>('form');
  const [title, setTitle] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [notes, setNotes] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('__all__');
  const [searchMember, setSearchMember] = useState('');
  const [bulkAmountInput, setBulkAmountInput] = useState<string>('200000');

  // Quản lý trạng thái thưởng của từng thành viên
  const [memberRows, setMemberRows] = useState<Record<string, { selected: boolean; amount: number; note: string }>>({});

  // Kết quả sau khi tạo xong (để hiển thị danh sách QR nếu là chuyển khoản)
  const [createdPaymentItems, setCreatedPaymentItems] = useState<BulkRewardPaymentItem[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedQrPreview, setSelectedQrPreview] = useState<BulkRewardPaymentItem | null>(null);

  const { data: teamsData } = useTeams();
  const { data: membersData, isLoading: loadingMembers } = useMembers({ limit: 100 });
  const bulkRewardMutation = useCreateBulkReward();

  const allMembers = membersData?.items ?? [];

  // Lọc danh sách thành viên hiển thị
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      if (m.status !== 'ACTIVE') return false; // Chỉ khen thưởng thành viên đang hoạt động
      if (teamFilter !== '__all__' && !m.teams?.some((t) => t.id === teamFilter)) return false;
      if (searchMember.trim()) {
        const q = searchMember.trim().toLowerCase();
        return (
          m.fullName.toLowerCase().includes(q) ||
          m.memberCode.toLowerCase().includes(q) ||
          (m.phone && m.phone.includes(q))
        );
      }
      return true;
    });
  }, [allMembers, teamFilter, searchMember]);

  // Các thành viên được chọn
  const selectedCount = Object.values(memberRows).filter((r) => r.selected).length;
  const totalRewardAmount = Object.entries(memberRows)
    .filter(([_, r]) => r.selected)
    .reduce((sum, [_, r]) => sum + (Number(r.amount) || 0), 0);

  // Chọn / Bỏ chọn một người
  const toggleMember = (memberId: string) => {
    setMemberRows((prev) => {
      const existing = prev[memberId];
      const nextSelected = !(existing?.selected ?? false);
      const defaultAmt = Number(bulkAmountInput) > 0 ? Number(bulkAmountInput) : 200000;
      return {
        ...prev,
        [memberId]: {
          selected: nextSelected,
          amount: existing?.amount && existing.amount > 0 ? existing.amount : defaultAmt,
          note: existing?.note || '',
        },
      };
    });
  };

  // Cập nhật số tiền riêng của một người
  const updateMemberAmount = (memberId: string, amount: number) => {
    setMemberRows((prev) => {
      const existing = prev[memberId];
      return {
        ...prev,
        [memberId]: {
          selected: true, // Khi gõ số tiền, tự động tick chọn người này
          amount: Math.max(0, amount),
          note: existing?.note || '',
        },
      };
    });
  };

  // Chọn tất cả thành viên đang được lọc
  const handleSelectAllFiltered = () => {
    setMemberRows((prev) => {
      const next = { ...prev };
      const defaultAmt = Number(bulkAmountInput) > 0 ? Number(bulkAmountInput) : 200000;
      filteredMembers.forEach((m) => {
        next[m.id] = {
          selected: true,
          amount: next[m.id]?.amount && next[m.id].amount > 0 ? next[m.id].amount : defaultAmt,
          note: next[m.id]?.note || '',
        };
      });
      return next;
    });
  };

  // Bỏ chọn tất cả thành viên đang được lọc
  const handleDeselectAllFiltered = () => {
    setMemberRows((prev) => {
      const next = { ...prev };
      filteredMembers.forEach((m) => {
        if (next[m.id]) {
          next[m.id] = { ...next[m.id], selected: false };
        }
      });
      return next;
    });
  };

  // Áp dụng số tiền chung cho các thành viên đang được chọn
  const handleApplyBulkAmount = () => {
    const amt = Number(bulkAmountInput);
    if (!amt || amt <= 0) {
      toast.error('Vui lòng nhập mức tiền thưởng hợp lệ');
      return;
    }
    setMemberRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id].selected) {
          next[id] = { ...next[id], amount: amt };
        }
      });
      return next;
    });
    toast.success(`Đã áp dụng ${formatCurrency(amt)} cho tất cả người được chọn`);
  };

  // Xử lý Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Vui lòng nhập lý do/tiêu đề khen thưởng');
      return;
    }

    const items = Object.entries(memberRows)
      .filter(([_, r]) => r.selected && Number(r.amount) > 0)
      .map(([memberId, r]) => ({
        memberId,
        amount: Math.round(Number(r.amount)),
        note: r.note?.trim() || undefined,
      }));

    if (items.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thành viên và nhập số tiền thưởng');
      return;
    }

    const validDate = transactionDate || new Date().toISOString().slice(0, 10);

    bulkRewardMutation.mutate(
      {
        title: title.trim(),
        transactionDate: validDate,
        paymentMethod,
        notes: notes.trim() || undefined,
        items,
      },
      {
        onSuccess: (res) => {
          if (paymentMethod === 'BANK_TRANSFER' && res.paymentItems && res.paymentItems.length > 0) {
            setCreatedPaymentItems(res.paymentItems);
            setStep('qr_list');
          } else {
            onOpenChange(false);
            resetForm();
          }
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'Không thể lập phiếu khen thưởng';
          toast.error(msg);
        },
      }
    );
  };

  const resetForm = () => {
    setStep('form');
    setTitle('');
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('CASH');
    setNotes('');
    setMemberRows({});
    setCreatedPaymentItems([]);
    setSelectedQrPreview(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Đã sao chép ${label}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl flex flex-col max-h-[92vh]">
        {/* ======================= MÀN HÌNH 1: FORM LẬP PHIẾU KHEN THƯỞNG ======================= */}
        {step === 'form' ? (
          <>
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-orange-500/10 border-b border-border/70 shrink-0">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <div className="size-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Award className="size-4.5" />
                  </div>
                  Lập Phiếu Chi Khen Thưởng Hàng Loạt
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Tự động sinh phiếu chi khen thưởng, lì xì, thưởng nóng cho nhiều thành viên cùng lúc
                </p>
              </DialogHeader>
            </div>

            {/* Body Scrollable */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* 1. THÔNG TIN KHEN THƯỞNG */}
              <div className="p-4 rounded-2xl bg-card border shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-xs flex items-center gap-1.5 text-foreground uppercase tracking-wide">
                    <Gift className="size-3.5 text-amber-500" /> 1. Nội dung khen thưởng
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-500/10 border-amber-300">
                    Danh mục: Chi khen thưởng
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rewardTitle" className="text-xs font-semibold">
                    Lý do / Tiêu đề khen thưởng *
                  </Label>
                  <Input
                    id="rewardTitle"
                    placeholder="Ví dụ: Thưởng nóng đạt Giải Nhất Hội thi Lân Sư Rồng..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-xs rounded-xl font-medium"
                    required
                  />

                  {/* Gợi ý lý do nhanh */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="size-3 text-amber-500" /> Gợi ý nhanh:
                    </span>
                    {QUICK_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTitle(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border/50"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="txDate" className="text-xs font-semibold flex items-center gap-1">
                      <Calendar className="size-3 text-muted-foreground" /> Ngày chi tiền *
                    </Label>
                    <Input
                      id="txDate"
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <Wallet className="size-3 text-muted-foreground" /> Hình thức chi trả *
                    </Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v as 'CASH' | 'BANK_TRANSFER')}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH" className="text-xs">
                          💵 Tiền mặt (Trao tay)
                        </SelectItem>
                        <SelectItem value="BANK_TRANSFER" className="text-xs">
                          🏦 Chuyển khoản (Có mã VietQR)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 2. DANH SÁCH THÀNH VIÊN NHẬN THƯỞNG */}
              <div className="p-4 rounded-2xl bg-card border shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2">
                  <h3 className="font-bold text-xs flex items-center gap-1.5 text-foreground uppercase tracking-wide">
                    <Users className="size-3.5 text-amber-500" /> 2. Danh sách nhận khen thưởng ({selectedCount} người đã chọn)
                  </h3>

                  {/* Thanh công cụ áp dụng số tiền chung */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden sm:inline">Mức thưởng chung:</span>
                    <div className="w-32 sm:w-36">
                      <MoneyInput
                        value={bulkAmountInput ? Number(bulkAmountInput) : ''}
                        onChange={(val) => setBulkAmountInput(String(val))}
                        placeholder="200,000"
                        className="h-8 text-xs text-amber-600 rounded-lg"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyBulkAmount}
                      className="h-8 text-[11px] px-2.5 rounded-lg"
                      title="Điền số tiền này cho tất cả người được tick chọn"
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>

                {/* Bộ lọc theo đội & tìm kiếm thành viên */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Tìm thành viên..."
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      className="h-8 pl-8 text-xs rounded-xl bg-background"
                    />
                  </div>

                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="h-8 w-full sm:w-36 text-xs rounded-xl bg-background">
                      <SelectValue placeholder="Lọc theo đội" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__" className="text-xs">Tất cả đội</SelectItem>
                      {teamsData?.map((team) => (
                        <SelectItem key={team.id} value={team.id} className="text-xs">
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllFiltered}
                      className="h-8 text-[11px] text-emerald-600 px-2 rounded-lg"
                    >
                      <CheckSquare className="size-3.5 mr-1" /> Chọn hết
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAllFiltered}
                      className="h-8 text-[11px] text-muted-foreground px-2 rounded-lg"
                    >
                      <Square className="size-3.5 mr-1" /> Bỏ chọn
                    </Button>
                  </div>
                </div>

                {/* Danh sách thành viên (Table / Row Items) */}
                <div className="max-h-60 overflow-y-auto divide-y divide-border/60 border rounded-xl bg-background">
                  {loadingMembers ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">Đang tải danh sách nhân sự...</div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                      Không tìm thấy thành viên nào phù hợp.
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const rowData = memberRows[member.id];
                      const isSelected = Boolean(rowData?.selected);
                      const currentAmt = rowData?.amount !== undefined ? rowData.amount : (Number(bulkAmountInput) || 200000);

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-2 sm:p-2.5 text-xs transition-colors gap-2 cursor-pointer ${
                            isSelected ? 'bg-amber-500/10' : 'hover:bg-muted/40'
                          }`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('.amount-input-container')) return;
                            if ((e.target as HTMLElement).tagName === 'INPUT') return;
                            toggleMember(member.id);
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleMember(member.id)}
                              className="size-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground truncate">{member.fullName}</span>
                                <span className="font-mono text-[10px] text-muted-foreground px-1 bg-muted rounded">
                                  {member.memberCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span>{member.teams?.map((t) => t.name).join(', ') || 'Chưa phân đội'}</span>
                                {member.bankAccount ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                                    • {member.bank?.shortName || member.bankName}: {member.bankAccount}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/60 italic">• Chưa có TK</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Ô nhập số tiền riêng */}
                          <div
                            className="flex items-center gap-1.5 shrink-0 amount-input-container"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">Tiền thưởng:</span>
                            <div className="w-28 sm:w-32">
                              <MoneyInput
                                value={currentAmt > 0 ? currentAmt : ''}
                                placeholder="0"
                                onChange={(val) => updateMemberAmount(member.id, val)}
                                className={`h-8 text-xs ${
                                  isSelected ? 'text-amber-700 dark:text-amber-300 bg-background border-amber-400' : 'opacity-60 bg-muted/30'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. TỔNG KẾT NGÂN SÁCH KHEN THƯỞNG */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                    TỔNG NGÂN SÁCH KHEN THƯỞNG:
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Đã chọn <strong>{selectedCount}</strong> thành viên nhận thưởng
                  </p>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(totalRewardAmount)}
                </div>
              </div>
            </form>

            {/* Footer */}
            <DialogFooter className="p-4 bg-muted/10 border-t border-border/80 flex flex-row items-center justify-between shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs"
              >
                Hủy bỏ
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={bulkRewardMutation.isPending || selectedCount === 0}
                className="rounded-xl text-xs gap-1.5 font-bold shadow-sm"
              >
                {bulkRewardMutation.isPending ? 'Đang lập phiếu...' : (
                  <>
                    <Award className="size-4" />
                    Xác Nhận Lập Phiếu Chi Khen Thưởng ({selectedCount} thành viên)
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ======================= MÀN HÌNH 2: DANH SÁCH MÃ VIETQR CHUYỂN KHOẢN ======================= */
          <>
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/15 via-background to-teal-500/10 border-b border-border/70 shrink-0">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <QrCode className="size-4.5" />
                  </div>
                  Danh Sách Mã VietQR Chuyển Khoản Khen Thưởng
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Đã lập thành công phiếu chi khen thưởng. Quét mã VietQR bên dưới để chuyển khoản chính xác cho từng người:
                </p>
              </DialogHeader>
            </div>

            {/* Body: Danh sách QR của từng người */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 max-h-[65vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {createdPaymentItems.map((item) => {
                  const hasBank = Boolean(item.bankAccount);
                  const bankCodeOrBin = item.bankBin || item.bankCode || item.bankName || 'MB';
                  const transferContent = `Khen thuong ${item.memberName}`.trim();
                  const qrUrl = hasBank
                    ? `https://img.vietqr.io/image/${bankCodeOrBin}-${item.bankAccount}-compact2.png?amount=${item.amount}&addInfo=${encodeURIComponent(
                        transferContent
                      )}&accountName=${encodeURIComponent(item.memberName)}`
                    : null;

                  return (
                    <div
                      key={item.memberId}
                      className="p-3.5 rounded-2xl border bg-card shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        {/* Thông tin người nhận */}
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              {item.memberName}
                              <span className="font-mono text-[10px] text-muted-foreground px-1 bg-muted rounded">
                                {item.memberCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {item.code}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground">Thưởng</span>
                            <div className="font-black text-xs text-amber-600 dark:text-amber-400">
                              {formatCurrency(item.amount)}
                            </div>
                          </div>
                        </div>

                        {/* Mã QR hoặc Báo chưa có TK */}
                        {hasBank && qrUrl ? (
                          <div className="pt-2 flex items-center gap-3">
                            <div className="relative size-20 shrink-0 bg-white rounded-xl border p-0.5 overflow-hidden shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={qrUrl}
                                alt={`VietQR ${item.memberName}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="text-[11px] space-y-1 min-w-0 flex-1">
                              <div className="text-muted-foreground truncate">
                                Ngân hàng: <strong>{item.bankName}</strong>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-bold text-foreground truncate">{item.bankAccount}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-5 text-muted-foreground hover:text-foreground"
                                  onClick={() => copyToClipboard(item.bankAccount!, 'STK')}
                                >
                                  {copiedText === item.bankAccount ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                </Button>
                              </div>
                              <p className="text-[10px] font-mono text-muted-foreground truncate" title={transferContent}>
                                CK: {transferContent}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center space-y-1 bg-muted/20 rounded-xl mt-2">
                            <p className="text-xs text-rose-500 font-semibold">Chưa có thông tin ngân hàng</p>
                            <p className="text-[10px] text-muted-foreground">Vui lòng chi trả trực tiếp bằng tiền mặt</p>
                          </div>
                        )}
                      </div>

                      {hasBank && qrUrl && (
                        <div className="pt-2 border-t flex items-center justify-between">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedQrPreview(item)}
                            className="h-6 text-[10px] text-amber-600 px-2 rounded-lg"
                          >
                            Phóng to mã QR
                          </Button>
                          <a
                            href={qrUrl}
                            download={`VietQR-${item.memberName}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <Download className="size-3" /> Tải ảnh
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="p-4 bg-muted/10 border-t border-border/80 flex flex-row items-center justify-between shrink-0">
              <span className="text-xs text-muted-foreground">
                Tổng cộng: <strong>{createdPaymentItems.length}</strong> thành viên trong phiếu chi
              </span>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
                className="rounded-xl text-xs font-bold"
              >
                Hoàn Tất
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {/* Modal phóng to xem mã QR */}
      {selectedQrPreview && (
        <Dialog open={!!selectedQrPreview} onOpenChange={(v) => !v && setSelectedQrPreview(null)}>
          <DialogContent className="max-w-xs p-5 rounded-3xl text-center space-y-3">
            <h4 className="font-bold text-sm text-foreground">
              Mã VietQR Thưởng: {selectedQrPreview.memberName}
            </h4>
            <div className="relative size-56 mx-auto bg-white rounded-2xl border p-1 shadow-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.vietqr.io/image/${
                  selectedQrPreview.bankBin || selectedQrPreview.bankCode || 'MB'
                }-${selectedQrPreview.bankAccount}-compact2.png?amount=${selectedQrPreview.amount}&addInfo=${encodeURIComponent(
                  `Khen thuong ${selectedQrPreview.memberName}`
                )}&accountName=${encodeURIComponent(selectedQrPreview.memberName)}`}
                alt="QR Preview"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div className="font-bold text-base text-amber-600">
                {formatCurrency(selectedQrPreview.amount)}
              </div>
              <p>{selectedQrPreview.bankName} - {selectedQrPreview.bankAccount}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedQrPreview(null)}
              className="w-full rounded-xl text-xs"
            >
              Đóng
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
