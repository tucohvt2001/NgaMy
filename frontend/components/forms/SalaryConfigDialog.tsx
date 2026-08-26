'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Shield,
  Calendar,
  User,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Info,
  CheckCircle2,
  DollarSign,
  Layers,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePositions } from '@/hooks/usePositions';
import { useMembers } from '@/hooks/useMembers';
import { useEvents } from '@/hooks/useEvents';
import {
  useSalaryConfigs,
  useBatchSavePositionConfigs,
  useSaveEventRate,
  useCreateSalaryConfig,
  useRemoveSalaryConfig,
} from '@/hooks/useSalaries';
import { Position } from '@/types/models';

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

interface SalaryConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
}

export function SalaryConfigDialog({ open, onOpenChange, canManage = true }: SalaryConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<'positions' | 'events' | 'members'>('positions');

  // Dữ liệu danh mục
  const { data: positionsData } = usePositions();
  const { data: membersData } = useMembers({ page: 1, limit: 300, status: 'ACTIVE' });
  const { data: eventsData } = useEvents({ page: 1, limit: 100 });
  const { data: configsData } = useSalaryConfigs();

  const positions = useMemo(() => positionsData || [], [positionsData]);
  const configs = useMemo(() => configsData || [], [configsData]);
  const activePositions = useMemo(() => positions.filter((p) => p.isActive !== false), [positions]);

  // Mutations
  const batchSavePositionsMutation = useBatchSavePositionConfigs();
  const saveEventRateMutation = useSaveEventRate();
  const createConfigMutation = useCreateSalaryConfig();
  const removeConfigMutation = useRemoveSalaryConfig();

  // State Tab 1: Mức lương theo vị trí (Position Rates)
  const [positionRates, setPositionRates] = useState<Record<string, { amount: number; note: string }>>({});
  const [bulkPositionAmount, setBulkPositionAmount] = useState<string>('');

  // State Tab 2: Mức tiền công theo mỗi show (Event Rates)
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventAmount, setEventAmount] = useState<number>(0);
  const [eventNote, setEventNote] = useState<string>('');

  // State Tab 3: Mức lương riêng theo thành viên (Member Rates)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberAmount, setMemberAmount] = useState<number>(0);
  const [memberNote, setMemberNote] = useState<string>('');

  // Khởi tạo dữ liệu positionRates từ cấu hình hiện tại
  useEffect(() => {
    if (open && activePositions.length > 0) {
      const initialMap: Record<string, { amount: number; note: string }> = {};

      for (const pos of activePositions) {
        // Tìm config hiện tại cho position này (không gắn member, không gắn event)
        const cfg = configs.find((c) => c.positionId === pos.id && !c.memberId && !c.eventId);
        initialMap[pos.id] = {
          amount: cfg?.amount ?? 0,
          note: cfg?.note ?? '',
        };
      }
      setPositionRates(initialMap);
      setBulkPositionAmount('');
      setSelectedEventId('');
      setEventAmount(0);
      setEventNote('');
      setSelectedMemberId('');
      setMemberAmount(0);
      setMemberNote('');
    }
  }, [open, positions, configs]);

  // Cập nhật mức lương 1 vị trí
  const handlePositionRateChange = (posId: string, field: 'amount' | 'note', value: any) => {
    setPositionRates((prev) => ({
      ...prev,
      [posId]: {
        ...prev[posId],
        [field]: value,
      },
    }));
  };

  // Áp dụng đồng giá cho tất cả vị trí
  const handleApplyBulkPositionAmount = () => {
    const val = Number(bulkPositionAmount) || 0;
    if (val <= 0) return;
    setPositionRates((prev) => {
      const next = { ...prev };
      for (const posId of Object.keys(next)) {
        next[posId] = { ...next[posId], amount: val };
      }
      return next;
    });
  };

  // Lưu toàn bộ định mức theo vị trí
  const handleSaveAllPositions = () => {
    const payload = Object.entries(positionRates).map(([positionId, data]) => ({
      positionId,
      amount: data.amount,
      note: data.note.trim() || undefined,
    }));
    batchSavePositionsMutation.mutate(payload);
  };

  // Lưu định mức cho 1 show cụ thể
  const handleSaveEventRate = () => {
    if (!selectedEventId || eventAmount <= 0) return;
    saveEventRateMutation.mutate(
      {
        eventId: selectedEventId,
        amount: eventAmount,
        note: eventNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSelectedEventId('');
          setEventAmount(0);
          setEventNote('');
        },
      },
    );
  };

  // Lưu định mức riêng cho 1 thành viên
  const handleSaveMemberRate = () => {
    if (!selectedMemberId || memberAmount <= 0) return;
    createConfigMutation.mutate(
      {
        memberId: selectedMemberId,
        amount: memberAmount,
        note: memberNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSelectedMemberId('');
          setMemberAmount(0);
          setMemberNote('');
        },
      },
    );
  };

  // Danh sách các cấu hình sự kiện hiện tại
  const eventConfigs = useMemo(() => {
    return configs.filter((c) => c.eventId && !c.memberId);
  }, [configs]);

  // Danh sách các cấu hình thành viên riêng hiện tại
  const memberConfigs = useMemo(() => {
    return configs.filter((c) => c.memberId && !c.eventId);
  }, [configs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl">
        {/* 1. Header */}
        <DialogHeader className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-background to-amber-500/5 border-b border-border/80 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Settings className="size-5 text-amber-500" />
                Thiết Lập Định Mức Lương & Tiền Công
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Cài đặt mức tiền công mặc định <strong>theo vị trí biểu diễn</strong>, <strong>theo từng show</strong> hoặc <strong>theo thành viên</strong>
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/70 border border-border/80 self-start sm:self-auto">
              <Button
                type="button"
                variant={activeTab === 'positions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('positions')}
                className={`rounded-xl text-xs font-bold gap-1.5 transition-all ${activeTab === 'positions'
                  ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Shield className="size-3.5" />
                Theo Vị Trí ({activePositions.length})
              </Button>

              <Button
                type="button"
                variant={activeTab === 'events' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('events')}
                className={`rounded-xl text-xs font-bold gap-1.5 transition-all ${activeTab === 'events'
                  ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Calendar className="size-3.5" />
                Theo Mỗi Show ({eventConfigs.length})
              </Button>

              <Button
                type="button"
                variant={activeTab === 'members' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('members')}
                className={`rounded-xl text-xs font-bold gap-1.5 transition-all ${activeTab === 'members'
                  ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <User className="size-3.5" />
                Theo Thành Viên ({memberConfigs.length})
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 2. Body Tabs */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: ĐỊNH MỨC THEO VỊ TRÍ / VAI TRÒ */}
          {/* ========================================================================= */}
          {activeTab === 'positions' && (
            <div className="space-y-4">
              {/* Alert giải thích cơ chế ưu tiên */}
              <div className="p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cơ chế tự động tính tiền công theo vai trò:</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Khi thành viên tham gia biểu diễn vị trí nào (Lân đầu, Lân đuôi, Đánh trống, Chiêng, Hậu cần...), hệ thống sẽ tự động áp mức tiền công của vị trí đó vào bảng lương tháng nếu show diễn chưa được đặt mức giá riêng.
                  </p>
                </div>
              </div>

              {/* Công cụ đặt giá nhanh */}
              {canManage && (
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    <span className="text-xs font-semibold text-foreground">Đặt nhanh đồng giá cho tất cả vai trò:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-40">
                      <MoneyInput
                        placeholder="Nhập mức tiền..."
                        value={bulkPositionAmount ? Number(bulkPositionAmount) : ''}
                        onChange={(val) => setBulkPositionAmount(String(val))}
                        className="h-8 text-xs rounded-xl font-semibold"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyBulkPositionAmount}
                      disabled={!bulkPositionAmount || Number(bulkPositionAmount) <= 0}
                      className="h-8 text-xs rounded-xl"
                    >
                      Áp dụng cho tất cả
                    </Button>
                  </div>
                </div>
              )}

              {/* Bảng danh sách các vị trí */}
              <div className="rounded-2xl border border-border/80 overflow-hidden shadow-xs bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                      <TableHead className="min-w-[160px] text-xs font-bold">Vị trí / Vai trò</TableHead>
                      <TableHead className="min-w-[180px] text-xs font-bold">Mức tiền công / Show (VNĐ) *</TableHead>
                      <TableHead className="min-w-[200px] text-xs font-bold">Ghi chú định mức</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePositions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                          Chưa có danh mục vị trí nào trong hệ thống.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activePositions.map((pos, idx) => {
                        const current = positionRates[pos.id] || { amount: 0, note: '' };
                        return (
                          <TableRow key={pos.id} className="hover:bg-muted/20">
                            <TableCell className="text-center font-mono text-xs text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-bold px-2.5 py-1 bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30"
                                >
                                  {pos.name}
                                </Badge>
                                {pos.description && (
                                  <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                    {pos.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <MoneyInput
                                disabled={!canManage}
                                value={current.amount || ''}
                                onChange={(val) => handlePositionRateChange(pos.id, 'amount', val)}
                                placeholder="0"
                                className="h-9 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-xl bg-background"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                disabled={!canManage}
                                value={current.note}
                                onChange={(e) => handlePositionRateChange(pos.id, 'note', e.target.value)}
                                placeholder="Ghi chú (vd: Show tiêu chuẩn, diễn 2 bài...)"
                                className="h-9 text-xs rounded-xl bg-background"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Nút lưu Tab 1 */}
              {canManage && (
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleSaveAllPositions}
                    isLoading={batchSavePositionsMutation.isPending}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Save className="size-4" />
                    Lưu toàn bộ định mức theo vai trò
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ĐỊNH MỨC THEO MỖI SHOW / SỰ KIỆN */}
          {/* ========================================================================= */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/[0.06] border border-blue-500/30 flex items-start gap-3 text-xs text-blue-950 dark:text-blue-200">
                <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Thiết lập lương riêng cho từng show diễn đặc thù:</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Đối với các show lớn, show tỉnh xa hoặc show VIP có mức chi trả cao hơn thông thường, bạn có thể thiết lập mức tiền công chung cho show đó tại đây. Mức này sẽ có <strong>độ ưu tiên cao hơn</strong> mức lương theo vai trò.
                  </p>
                </div>
              </div>

              {/* Form thêm định mức cho show */}
              {canManage && (
                <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className="size-4 text-amber-500" />
                    <Label className="font-bold text-xs text-foreground">Thiết lập tiền công cho show diễn:</Label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Chọn show diễn *</Label>
                      <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
                          <SelectValue placeholder="-- Chọn show diễn --" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {eventsData?.items.map((ev) => (
                            <SelectItem key={ev.id} value={ev.id} className="text-xs">
                              {ev.eventCode} - {ev.name} ({formatDate(ev.eventDate)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Mức tiền công chung (VNĐ/người) *</Label>
                      <MoneyInput
                        value={eventAmount || ''}
                        onChange={(val) => setEventAmount(val)}
                        placeholder="Nhập số tiền..."
                        className="h-9 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-xl bg-background"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Ghi chú</Label>
                      <Input
                        value={eventNote}
                        onChange={(e) => setEventNote(e.target.value)}
                        placeholder="vd: Hỗ trợ tiền xăng xe, ăn uống..."
                        className="h-9 text-xs rounded-xl bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEventRate}
                      disabled={!selectedEventId || eventAmount <= 0}
                      isLoading={saveEventRateMutation.isPending}
                      className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5 shadow-xs"
                    >
                      <Save className="size-3.5" />
                      Lưu định mức show
                    </Button>
                  </div>
                </div>
              )}

              {/* Danh sách các show đã thiết lập mức tiền công riêng */}
              <div className="rounded-2xl border border-border/80 overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                      <TableHead className="min-w-[200px] text-xs font-bold">Tên show diễn</TableHead>
                      <TableHead className="min-w-[140px] text-xs font-bold">Ngày diễn</TableHead>
                      <TableHead className="min-w-[140px] text-xs font-bold">Mức tiền công / Người</TableHead>
                      <TableHead className="min-w-[180px] text-xs font-bold">Ghi chú</TableHead>
                      {canManage && <TableHead className="w-16 text-right text-xs font-bold">Xóa</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventConfigs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center text-xs text-muted-foreground">
                          Chưa có show diễn nào có cơ chế lương riêng.
                        </TableCell>
                      </TableRow>
                    ) : (
                      eventConfigs.map((cfg, idx) => (
                        <TableRow key={cfg.id} className="hover:bg-muted/20">
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-xs text-foreground block">
                              {cfg.event?.name || 'Sự kiện'}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {cfg.event?.eventCode}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {cfg.event?.eventDate ? formatDate(cfg.event.eventDate) : '-'}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(cfg.amount)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {cfg.note || '-'}
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeConfigMutation.mutate(cfg.id)}
                                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ĐỊNH MỨC THEO THÀNH VIÊN ĐẶC THÙ */}
          {/* ========================================================================= */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/[0.06] border border-purple-500/30 flex items-start gap-3 text-xs text-purple-950 dark:text-purple-200">
                <Info className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Định mức tiền công cố định cho thành viên riêng biệt:</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Dành cho các Huấn luyện viên, Đội trưởng hoặc nghệ nhân biểu diễn có mức tiền công cố định theo từng buổi diễn mà không phụ thuộc vào vị trí.
                  </p>
                </div>
              </div>

              {/* Form thêm định mức cho thành viên */}
              {canManage && (
                <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className="size-4 text-amber-500" />
                    <Label className="font-bold text-xs text-foreground">Thiết lập mức lương cho thành viên:</Label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Chọn thành viên *</Label>
                      <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                        <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
                          <SelectValue placeholder="-- Chọn thành viên --" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {membersData?.items.map((m) => (
                            <SelectItem key={m.id} value={m.id} className="text-xs">
                              {m.fullName} ({m.memberCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Mức tiền công cố định (VNĐ) *</Label>
                      <MoneyInput
                        value={memberAmount || ''}
                        onChange={(val) => setMemberAmount(val)}
                        placeholder="Nhập số tiền..."
                        className="h-9 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-xl bg-background"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Ghi chú định mức</Label>
                      <Input
                        value={memberNote}
                        onChange={(e) => setMemberNote(e.target.value)}
                        placeholder="vd: Nghệ nhân đặc thù, mức hỗ trợ..."
                        className="h-9 text-xs rounded-xl bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveMemberRate}
                      disabled={!selectedMemberId || memberAmount <= 0}
                      isLoading={createConfigMutation.isPending}
                      className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5 shadow-xs"
                    >
                      <Save className="size-3.5" />
                      Lưu định mức thành viên
                    </Button>
                  </div>
                </div>
              )}

              {/* Bảng danh sách thành viên có định mức riêng */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Danh sách thành viên có định mức riêng:</Label>
                <div className="rounded-2xl border border-border/80 overflow-hidden shadow-xs bg-card">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                        <TableHead className="min-w-[200px] text-xs font-bold">Thành viên</TableHead>
                        <TableHead className="min-w-[140px] text-xs font-bold">Mức tiền công / Show</TableHead>
                        <TableHead className="min-w-[180px] text-xs font-bold">Ghi chú</TableHead>
                        {canManage && <TableHead className="w-16 text-right text-xs font-bold">Xóa</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberConfigs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canManage ? 5 : 4} className="h-24 text-center text-xs text-muted-foreground">
                            Chưa có thành viên nào được cài đặt định mức tiền công riêng.
                          </TableCell>
                        </TableRow>
                      ) : (
                        memberConfigs.map((cfg, idx) => (
                          <TableRow key={cfg.id} className="hover:bg-muted/20">
                            <TableCell className="text-center font-mono text-xs text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-xs text-foreground block">
                                {cfg.member?.fullName || 'Thành viên'}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {cfg.member?.memberCode}
                              </span>
                            </TableCell>
                            <TableCell className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(cfg.amount)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {cfg.note || '-'}
                            </TableCell>
                            {canManage && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeConfigMutation.mutate(cfg.id)}
                                  className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Footer */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
