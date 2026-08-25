'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Coins,
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
  Copy,
  SlidersHorizontal,
  Table as TableIcon,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePositions } from '@/hooks/usePositions';
import { useMembers } from '@/hooks/useMembers';
import { useEvents } from '@/hooks/useEvents';
import {
  useSalaryConfigs,
  useBatchSaveMatrixConfigs,
  useBatchSavePositionConfigs,
  useSaveEventRate,
  useCreateSalaryConfig,
  useRemoveSalaryConfig,
} from '@/hooks/useSalaries';
import { useAuthStore } from '@/stores/authStore';
import { EVENT_TYPES, EVENT_TYPE_LABELS, EventType } from '@/types/enums';
import { Position } from '@/types/models';
import { toast } from 'sonner';

import { useEventTypes } from '@/hooks/useEventTypes';

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export default function SalaryRatesPage() {
  const user = useAuthStore((state) => state.user);
  const canManage = user?.permissions.includes('salary:manage');

  const [activeMainTab, setActiveMainTab] = useState<'matrix' | 'positions' | 'events' | 'members'>('matrix');
  const [selectedEventType, setSelectedEventType] = useState<string>('KHAI_TRUONG');
  const [viewMode, setViewMode] = useState<'single_type' | 'full_matrix'>('single_type');

  // Dữ liệu danh mục
  const { data: dbEventTypes = [] } = useEventTypes({ isActive: true });
  const { data: positionsData } = usePositions();
  const { data: membersData } = useMembers({ page: 1, limit: 300, status: 'ACTIVE' });
  const { data: eventsData } = useEvents({ page: 1, limit: 100 });
  const { data: configsData } = useSalaryConfigs();

  const eventTypeList = useMemo(() => {
    if (dbEventTypes.length > 0) {
      return dbEventTypes.map((et) => ({ code: et.code, name: et.name, color: et.color }));
    }
    return EVENT_TYPES.map((t) => ({ code: t, name: EVENT_TYPE_LABELS[t] || t, color: '#f59e0b' }));
  }, [dbEventTypes]);

  // Mutations
  const batchSaveMatrixMutation = useBatchSaveMatrixConfigs();
  const batchSavePositionsMutation = useBatchSavePositionConfigs();
  const saveEventRateMutation = useSaveEventRate();
  const createConfigMutation = useCreateSalaryConfig();
  const removeConfigMutation = useRemoveSalaryConfig();

  // State ma trận: matrixRates[eventType][positionId] = { amount, note }
  const [matrixRates, setMatrixRates] = useState<Record<string, Record<string, { amount: number; note: string }>>>({});
  const [bulkAmount, setBulkAmount] = useState<string>('');
  const [copySourceType, setCopySourceType] = useState<string>('');

  // State Tab vị trí mặc định
  const [defaultPositionRates, setDefaultPositionRates] = useState<Record<string, { amount: number; note: string }>>({});

  // State Tab show cụ thể
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventAmount, setEventAmount] = useState<number>(0);
  const [eventNote, setEventNote] = useState<string>('');

  // State Tab thành viên
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberAmount, setMemberAmount] = useState<number>(0);
  const [memberNote, setMemberNote] = useState<string>('');

  const positions = useMemo(() => positionsData || [], [positionsData]);
  const configs = useMemo(() => configsData || [], [configsData]);
  const activePositions = useMemo(() => positions.filter((p) => p.isActive !== false), [positions]);

  const lastSyncHashRef = useRef<string>('');

  // Đồng bộ dữ liệu config từ server vào state một cách an toàn
  useEffect(() => {
    if (activePositions.length === 0 || eventTypeList.length === 0) return;

    const currentHash = JSON.stringify(configs) + '_' + JSON.stringify(activePositions) + '_' + JSON.stringify(eventTypeList);
    if (lastSyncHashRef.current === currentHash) return;
    lastSyncHashRef.current = currentHash;

    // 1. Ma trận Type x Position
    const newMatrix: Record<string, Record<string, { amount: number; note: string }>> = {};
    for (const item of eventTypeList) {
      const type = item.code;
      newMatrix[type] = {};
      for (const pos of activePositions) {
        const cfg = configs.find(
          (c) => c.eventType === type && c.positionId === pos.id && !c.memberId && !c.eventId,
        );
        newMatrix[type][pos.id] = {
          amount: cfg?.amount ?? 0,
          note: cfg?.note ?? '',
        };
      }
    }
    setMatrixRates(newMatrix);

    // 2. Mức lương mặc định theo vị trí (không theo eventType)
    const newDefaultPos: Record<string, { amount: number; note: string }> = {};
    for (const pos of activePositions) {
      const cfg = configs.find((c) => !c.eventType && c.positionId === pos.id && !c.memberId && !c.eventId);
      newDefaultPos[pos.id] = {
        amount: cfg?.amount ?? 0,
        note: cfg?.note ?? '',
      };
    }
    setDefaultPositionRates(newDefaultPos);
  }, [configs, activePositions, eventTypeList]);

  // Thay đổi giá của 1 ô trong ma trận
  const handleMatrixCellChange = (
    eventType: string,
    positionId: string,
    field: 'amount' | 'note',
    value: any,
  ) => {
    setMatrixRates((prev) => ({
      ...prev,
      [eventType]: {
        ...prev[eventType],
        [positionId]: {
          ...(prev[eventType]?.[positionId] || { amount: 0, note: '' }),
          [field]: value,
        },
      },
    }));
  };

  const currentTypeName = useMemo(() => {
    const found = eventTypeList.find((e) => e.code === selectedEventType);
    return found?.name || selectedEventType;
  }, [eventTypeList, selectedEventType]);

  // Đặt nhanh đồng giá cho Loại show đang chọn
  const handleApplyBulkForType = () => {
    const val = Number(bulkAmount) || 0;
    if (val <= 0) return;

    setMatrixRates((prev) => {
      const currentTypeMap = { ...(prev[selectedEventType] || {}) };
      for (const pos of activePositions) {
        currentTypeMap[pos.id] = {
          ...(currentTypeMap[pos.id] || { note: '' }),
          amount: val,
        };
      }
      return { ...prev, [selectedEventType]: currentTypeMap };
    });
    toast.info(`Đã áp dụng mức ${formatCurrency(val)} cho tất cả vai trò trong loại show ${currentTypeName}`);
  };

  // Sao chép mức giá từ 1 loại show khác
  const handleCopyFromOtherType = () => {
    if (!copySourceType || copySourceType === selectedEventType) return;
    const sourceRates = matrixRates[copySourceType];
    if (!sourceRates) return;

    const sourceName = eventTypeList.find((e) => e.code === copySourceType)?.name || copySourceType;

    setMatrixRates((prev) => ({
      ...prev,
      [selectedEventType]: JSON.parse(JSON.stringify(sourceRates)),
    }));
    toast.success(`Đã sao chép định mức từ "${sourceName}" sang "${currentTypeName}"`);
  };

  // Lưu ma trận (1 loại show hoặc toàn bộ)
  const handleSaveMatrix = (onlySelectedType = false) => {
    const payload: Array<{ eventType: string; positionId: string; amount: number; note?: string }> = [];

    const typesToSave = onlySelectedType ? [selectedEventType] : eventTypeList.map((e) => e.code);

    for (const type of typesToSave) {
      const typeMap = matrixRates[type] || {};
      for (const pos of activePositions) {
        const item = typeMap[pos.id];
        if (item) {
          payload.push({
            eventType: type,
            positionId: pos.id,
            amount: Number(item.amount) || 0,
            note: item.note?.trim() || undefined,
          });
        }
      }
    }

    batchSaveMatrixMutation.mutate(payload);
  };

  // Lưu định mức mặc định theo vị trí
  const handleSaveDefaultPositions = () => {
    const payload = Object.entries(defaultPositionRates).map(([positionId, data]) => ({
      positionId,
      amount: data.amount,
      note: data.note?.trim() || undefined,
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

  const eventConfigs = useMemo(() => configs.filter((c) => c.eventId && !c.memberId), [configs]);
  const memberConfigs = useMemo(() => configs.filter((c) => c.memberId && !c.eventId), [configs]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Coins className="size-7 text-amber-500" />
            Thiết Lập Mức Lương
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Bảng giá tiền công chuẩn theo từng <strong>Loại show</strong> (Khai trương, Trung thu, Tết...) và <strong>Vị trí vai trò</strong> (Lân đầu, Lân đuôi, Trống, Chiêng...)
          </p>
        </div>

        {/* Tab chuyển đổi Module */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border/80 shadow-xs self-start sm:self-auto overflow-x-auto max-w-full">
          <Button
            type="button"
            variant={activeMainTab === 'matrix' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('matrix')}
            className={`rounded-xl text-xs font-bold gap-1.5 shrink-0 ${activeMainTab === 'matrix'
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Layers className="size-3.5" />
            Theo Loại Show & Vị Trí
          </Button>

          <Button
            type="button"
            variant={activeMainTab === 'positions' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('positions')}
            className={`rounded-xl text-xs font-bold gap-1.5 shrink-0 ${activeMainTab === 'positions'
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Shield className="size-3.5" />
            Vị Trí Mặc Định
          </Button>

          <Button
            type="button"
            variant={activeMainTab === 'events' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('events')}
            className={`rounded-xl text-xs font-bold gap-1.5 shrink-0 ${activeMainTab === 'events'
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Calendar className="size-3.5" />
            Show Cụ Thể ({eventConfigs.length})
          </Button>

          <Button
            type="button"
            variant={activeMainTab === 'members' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('members')}
            className={`rounded-xl text-xs font-bold gap-1.5 shrink-0 ${activeMainTab === 'members'
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <User className="size-3.5" />
            Thành Viên Riêng ({memberConfigs.length})
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MA TRẬN THEO LOẠI SHOW & VỊ TRÍ (CHÍNH) */}
      {/* ========================================================================= */}
      {activeMainTab === 'matrix' && (
        <div className="space-y-4">
          {/* Card Hướng dẫn & Cơ chế tự động */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-card to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground">
                  Tự động áp dụng tiền công theo Loại Show & Vai trò
                </h3>
                <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                  Khi tạo sự kiện mới và chọn <strong>Loại show</strong> (Khai trương, Trung thu, Tết...), hệ thống sẽ <strong>tự động tra cứu bảng giá này</strong> và điền sẵn mức thù lao tương ứng cho từng vai trò khi chấm công & tất toán show.
                </p>
              </div>
            </div>

            {/* Nút chuyển chế độ xem */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/80 border border-border shrink-0 self-start sm:self-auto">
              <Button
                type="button"
                variant={viewMode === 'single_type' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('single_type')}
                className="h-7 text-xs px-2.5 rounded-lg font-semibold"
              >
                <SlidersHorizontal className="size-3.5 mr-1" />
                Từng loại show
              </Button>
              <Button
                type="button"
                variant={viewMode === 'full_matrix' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('full_matrix')}
                className="h-7 text-xs px-2.5 rounded-lg font-semibold"
              >
                <TableIcon className="size-3.5 mr-1" />
                Toàn bộ ma trận
              </Button>
            </div>
          </div>

          {/* CHẾ ĐỘ 1: CHỌN TỪNG LOẠI SHOW (DỄ NHẬP & TRỰC QUAN) */}
          {viewMode === 'single_type' && (
            <div className="space-y-4">
              {/* Tab ngang chọn Loại Show */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                {eventTypeList.map((type) => {
                  const isSelected = selectedEventType === type.code;
                  return (
                    <button
                      key={type.code}
                      type="button"
                      onClick={() => setSelectedEventType(type.code)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all border flex items-center gap-2 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/20 scale-[1.02]'
                          : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <span
                        className="size-2 rounded-full inline-block"
                        style={{ backgroundColor: type.color || '#f59e0b' }}
                      />
                      <span>{type.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Thanh công cụ tiện ích cho loại show đang chọn */}
              {canManage && (
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Đặt nhanh đồng giá */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Đặt nhanh đồng giá:</span>
                      <div className="w-36">
                        <MoneyInput
                          placeholder="Mức tiền..."
                          value={bulkAmount ? Number(bulkAmount) : ''}
                          onChange={(val) => setBulkAmount(String(val))}
                          className="h-8 text-xs rounded-xl font-semibold bg-background"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleApplyBulkForType}
                        disabled={!bulkAmount || Number(bulkAmount) <= 0}
                        className="h-8 text-xs rounded-xl"
                      >
                        Áp dụng
                      </Button>
                    </div>

                    <div className="hidden sm:block h-5 w-px bg-border" />

                    {/* Sao chép từ loại show khác */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Sao chép giá từ:</span>
                      <Select value={copySourceType} onValueChange={setCopySourceType}>
                        <SelectTrigger className="h-8 w-44 text-xs rounded-xl bg-background">
                          <SelectValue placeholder="-- Chọn nguồn --" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypeList
                            .filter((t) => t.code !== selectedEventType)
                            .map((t) => (
                              <SelectItem key={t.code} value={t.code} className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="size-1.5 rounded-full inline-block"
                                    style={{ backgroundColor: t.color || '#f59e0b' }}
                                  />
                                  <span>{t.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyFromOtherType}
                        disabled={!copySourceType}
                        className="h-8 text-xs rounded-xl gap-1"
                      >
                        <Copy className="size-3.5" />
                        Sao chép
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleSaveMatrix(true)}
                    isLoading={batchSaveMatrixMutation.isPending}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Save className="size-4" />
                    Lưu giá {currentTypeName}
                  </Button>
                </div>
              )}

              {/* Bảng giá các vai trò trong Loại show đang chọn */}
              <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xs bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                      <TableHead className="min-w-[180px] text-xs font-bold">Vị trí / Vai trò</TableHead>
                      <TableHead className="min-w-[200px] text-xs font-bold">
                        Thiết lập lương trong show {currentTypeName} (VNĐ) *
                      </TableHead>
                      <TableHead className="min-w-[220px] text-xs font-bold">Ghi chú định mức</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePositions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                          Chưa có danh mục vị trí vai trò nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activePositions.map((pos, idx) => {
                        const current = matrixRates[selectedEventType]?.[pos.id] || { amount: 0, note: '' };
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
                                  <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                                    {pos.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <MoneyInput
                                disabled={!canManage}
                                value={current.amount || ''}
                                onChange={(val) =>
                                  handleMatrixCellChange(selectedEventType, pos.id, 'amount', val)
                                }
                                placeholder="0"
                                className="h-9 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-xl bg-background"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                disabled={!canManage}
                                value={current.note}
                                onChange={(e) =>
                                  handleMatrixCellChange(selectedEventType, pos.id, 'note', e.target.value)
                                }
                                placeholder="Ghi chú (vd: Diễn 2 bài lân, đánh trống khai tiệc...)"
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
            </div>
          )}

          {/* CHẾ ĐỘ 2: TOÀN BỘ MA TRẬN (DÀNH CHO SO SÁNH TỔNG QUAN) */}
          {viewMode === 'full_matrix' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">
                  Ma trận so sánh và nhập giá cho toàn bộ loại show:
                </span>
                {canManage && (
                  <Button
                    type="button"
                    onClick={() => handleSaveMatrix(false)}
                    isLoading={batchSaveMatrixMutation.isPending}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Save className="size-4" />
                    Lưu toàn bộ Ma Trận
                  </Button>
                )}
              </div>

              <div className="rounded-3xl border border-border/80 overflow-x-auto shadow-xs bg-card">
                <Table className="border-collapse min-w-[900px]">
                  <TableHeader className="bg-muted/60">
                    <TableRow>
                      <TableHead className="w-12 text-center text-xs font-bold sticky left-0 bg-card z-10">
                        STT
                      </TableHead>
                      <TableHead className="min-w-[150px] text-xs font-bold sticky left-12 bg-card z-10">
                        Vai trò / Vị trí
                      </TableHead>
                      {eventTypeList.map((type) => (
                        <TableHead key={type.code} className="min-w-[140px] text-center text-xs font-bold">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className="size-2 rounded-full inline-block"
                              style={{ backgroundColor: type.color || '#f59e0b' }}
                            />
                            <span>{type.name}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePositions.map((pos, idx) => (
                      <TableRow key={pos.id} className="hover:bg-muted/20">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground sticky left-0 bg-card z-10">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="sticky left-12 bg-card z-10">
                          <span className="font-bold text-xs text-foreground block">{pos.name}</span>
                        </TableCell>
                        {eventTypeList.map((type) => {
                          const current = matrixRates[type.code]?.[pos.id] || { amount: 0, note: '' };
                          return (
                            <TableCell key={type.code} className="p-2">
                              <MoneyInput
                                disabled={!canManage}
                                value={current.amount || ''}
                                onChange={(val) => handleMatrixCellChange(type.code, pos.id, 'amount', val)}
                                placeholder="0"
                                className="h-8 text-xs font-bold text-center text-emerald-600 dark:text-emerald-400 rounded-xl bg-background"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VỊ TRÍ MẶC ĐỊNH (KHI SHOW KHÔNG CÓ LOẠI ĐẶC THÙ) */}
      {/* ========================================================================= */}
      {activeMainTab === 'positions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex items-start gap-3 text-xs">
            <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">Thiết lập lương theo vị trí:</p>
              <p className="text-muted-foreground mt-0.5">
                Áp dụng khi sự kiện không được phân loại cụ thể hoặc cho các buổi biểu diễn thông thường.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xs bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                  <TableHead className="min-w-[180px] text-xs font-bold">Vị trí vai trò</TableHead>
                  <TableHead className="min-w-[200px] text-xs font-bold">Mức tiền công mặc định (VNĐ) *</TableHead>
                  <TableHead className="min-w-[220px] text-xs font-bold">Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePositions.map((pos, idx) => {
                  const current = defaultPositionRates[pos.id] || { amount: 0, note: '' };
                  return (
                    <TableRow key={pos.id} className="hover:bg-muted/20">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs font-bold px-2.5 py-1 bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30"
                        >
                          {pos.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <MoneyInput
                          disabled={!canManage}
                          value={current.amount || ''}
                          onChange={(val) =>
                            setDefaultPositionRates((prev) => ({
                              ...prev,
                              [pos.id]: { ...(prev[pos.id] || { note: '' }), amount: val },
                            }))
                          }
                          placeholder="0"
                          className="h-9 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-xl bg-background"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          disabled={!canManage}
                          value={current.note}
                          onChange={(e) =>
                            setDefaultPositionRates((prev) => ({
                              ...prev,
                              [pos.id]: { ...(prev[pos.id] || { amount: 0 }), note: e.target.value },
                            }))
                          }
                          placeholder="Ghi chú..."
                          className="h-9 text-xs rounded-xl bg-background"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {canManage && (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={handleSaveDefaultPositions}
                isLoading={batchSavePositionsMutation.isPending}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Save className="size-4" />
                Lưu định mức vai trò mặc định
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHOW CỤ THỂ */}
      {/* ========================================================================= */}
      {activeMainTab === 'events' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-blue-500/[0.06] border border-blue-500/30 flex items-start gap-3 text-xs text-blue-950 dark:text-blue-200">
            <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Thiết lập lương riêng cho từng show diễn ngoại lệ:</p>
              <p className="text-muted-foreground mt-0.5">
                Dành cho các show diễn VIP, show tỉnh xa có thỏa thuận thù lao riêng cao hơn bảng giá chuẩn.
              </p>
            </div>
          </div>

          {canManage && (
            <div className="p-4 rounded-3xl border border-border/80 bg-card shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-amber-500" />
                <Label className="font-bold text-xs text-foreground">Cài đặt thù lao riêng cho show:</Label>
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
                  <Label className="text-[11px] text-muted-foreground">Mức thù lao chung (VNĐ/người) *</Label>
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

          <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xs bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                  <TableHead className="min-w-[200px] text-xs font-bold">Tên show diễn</TableHead>
                  <TableHead className="min-w-[140px] text-xs font-bold">Ngày diễn</TableHead>
                  <TableHead className="min-w-[140px] text-xs font-bold">Mức thù lao / Người</TableHead>
                  <TableHead className="min-w-[180px] text-xs font-bold">Ghi chú</TableHead>
                  {canManage && <TableHead className="w-16 text-right text-xs font-bold">Xóa</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center text-xs text-muted-foreground">
                      Chưa có show diễn nào được thiết lập lương riêng.
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
                      <TableCell className="text-xs text-muted-foreground">{cfg.note || '-'}</TableCell>
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
      {/* TAB 4: THÀNH VIÊN RIÊNG */}
      {/* ========================================================================= */}
      {activeMainTab === 'members' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-purple-500/[0.06] border border-purple-500/30 flex items-start gap-3 text-xs text-purple-950 dark:text-purple-200">
            <Info className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Thiết lập lương cố định theo từng thành viên:</p>
              <p className="text-muted-foreground mt-0.5">
                Dành cho các Huấn luyện viên, Đội trưởng hoặc nghệ nhân biểu diễn đặc thù có mức chi trả cố định theo buổi diễn.
              </p>
            </div>
          </div>

          {canManage && (
            <div className="p-4 rounded-3xl border border-border/80 bg-card shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-amber-500" />
                <Label className="font-bold text-xs text-foreground">Cài đặt lương riêng cho thành viên:</Label>
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
                  <Label className="text-[11px] text-muted-foreground">Ghi chú</Label>
                  <Input
                    value={memberNote}
                    onChange={(e) => setMemberNote(e.target.value)}
                    placeholder="vd: Nghệ nhân đặc thù..."
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

          <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xs bg-card">
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
                      <TableCell className="text-xs text-muted-foreground">{cfg.note || '-'}</TableCell>
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
    </div>
  );
}
