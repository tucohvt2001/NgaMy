'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Copy,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  MapPin,
  Check,
  RotateCcw,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvents, useEventMembers, useBatchAssignMembers } from '@/hooks/useEvents';
import { EventMember } from '@/types/models';
import { AssignMemberInput } from '@/services/event.service';
import { toast } from 'sonner';

interface CopyEventLineupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEventId: string;
  targetEventName?: string;
  existingCount?: number;
}

interface GroupedSourceMember {
  memberId: string;
  member: EventMember['member'];
  roles: Array<{
    positionId: string;
    positionName: string;
    note: string | null;
  }>;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export function CopyEventLineupDialog({
  open,
  onOpenChange,
  targetEventId,
  targetEventName,
  existingCount = 0,
}: CopyEventLineupDialogProps) {
  const { data: eventsData, isLoading: loadingEvents } = useEvents({ page: 1, limit: 100 });
  const [sourceEventId, setSourceEventId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);

  const { data: sourceMembers, isLoading: loadingMembers } = useEventMembers(sourceEventId || undefined);
  const batchAssignMutation = useBatchAssignMembers(targetEventId);

  // Lọc danh sách show có thể sao chép (loại trừ show hiện tại, show đã hủy và show đã hoàn thành)
  const availableEvents = useMemo(() => {
    return (eventsData?.items ?? []).filter(
      (e) => e.id !== targetEventId && e.status !== 'CANCELLED' && e.status !== 'COMPLETED'
    );
  }, [eventsData?.items, targetEventId]);

  // Gom nhóm danh sách nhân sự của show nguồn
  const groupedSourceMembers: GroupedSourceMember[] = useMemo(() => {
    if (!sourceMembers || sourceMembers.length === 0) return [];
    const map = new Map<string, GroupedSourceMember>();

    for (const item of sourceMembers) {
      if (!item.memberId) continue;
      if (!map.has(item.memberId)) {
        map.set(item.memberId, {
          memberId: item.memberId,
          member: item.member,
          roles: [],
        });
      }
      map.get(item.memberId)!.roles.push({
        positionId: item.positionId,
        positionName: item.position?.name || 'Thành viên',
        note: item.note ?? null,
      });
    }

    return Array.from(map.values());
  }, [sourceMembers]);

  // Khi đổi show nguồn hoặc mở modal, mặc định chọn tất cả thành viên của show nguồn đó
  useEffect(() => {
    if (groupedSourceMembers.length > 0) {
      setSelectedMemberIds(new Set(groupedSourceMembers.map((g) => g.memberId)));
    } else {
      setSelectedMemberIds(new Set());
    }
  }, [groupedSourceMembers]);

  // Reset khi mở dialog
  useEffect(() => {
    if (open) {
      setReplaceExisting(existingCount > 0 ? false : true);
    } else {
      setSourceEventId('');
      setSelectedMemberIds(new Set());
    }
  }, [open, existingCount]);

  const selectedSourceEvent = useMemo(() => {
    return availableEvents.find((e) => e.id === sourceEventId);
  }, [availableEvents, sourceEventId]);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedMemberIds(new Set(groupedSourceMembers.map((g) => g.memberId)));
  };

  const deselectAll = () => {
    setSelectedMemberIds(new Set());
  };

  const handleApply = () => {
    if (!sourceEventId) {
      toast.error('Vui lòng chọn show mẫu để sao chép');
      return;
    }

    if (selectedMemberIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thành viên trong đội hình');
      return;
    }

    // Tạo danh sách assignments phẳng (hỗ trợ đa vai trò)
    const assignmentsToSubmit: AssignMemberInput[] = [];

    for (const gm of groupedSourceMembers) {
      if (selectedMemberIds.has(gm.memberId)) {
        for (const role of gm.roles) {
          assignmentsToSubmit.push({
            memberId: gm.memberId,
            positionId: role.positionId,
            status: 'ASSIGNED',
            note: role.note,
          });
        }
      }
    }

    batchAssignMutation.mutate(
      {
        assignments: assignmentsToSubmit,
        replaceExisting,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  // Tổng số lượt vai trò đang được chọn
  const totalSelectedRoles = useMemo(() => {
    let count = 0;
    for (const gm of groupedSourceMembers) {
      if (selectedMemberIds.has(gm.memberId)) {
        count += gm.roles.length;
      }
    }
    return count;
  }, [groupedSourceMembers, selectedMemberIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            <Copy className="size-5 text-amber-500" />
            Sao Chép & Lấy Đội Hình Show Khác
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Lấy toàn bộ hoặc một phần đội hình đã diễn ở show trước để áp dụng nhanh cho{' '}
            <strong className="text-foreground">{targetEventName || 'sự kiện này'}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 1. Chọn Show Mẫu */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>1. Chọn Show Mẫu Có Sẵn Đội Hình</span>
              <span className="text-rose-500">*</span>
            </label>

            <Select value={sourceEventId} onValueChange={setSourceEventId}>
              <SelectTrigger className="w-full rounded-2xl h-11 text-xs font-semibold">
                <SelectValue placeholder="-- Nhấp để chọn show mẫu (theo ngày hoặc mã) --" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {availableEvents.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {ev.eventCode}
                      </span>
                      <span>-</span>
                      <span className="font-semibold">{ev.name}</span>
                      <span className="text-muted-foreground text-[11px]">({formatDate(ev.eventDate)})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSourceEvent && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-amber-600" />
                  <span className="font-semibold">{formatDate(selectedSourceEvent.eventDate)}</span>
                  <span>•</span>
                  <MapPin className="size-3.5 text-amber-600" />
                  <span className="truncate max-w-[240px]">{selectedSourceEvent.location}</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-background/60 font-mono">
                  {groupedSourceMembers.length} nhân sự ({sourceMembers?.length ?? 0} vai trò)
                </Badge>
              </div>
            )}
          </div>

          {/* 2. Preview & Chọn Thành Viên */}
          {sourceEventId && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>2. Đội Hình Tham Khảo</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Đã chọn: {selectedMemberIds.size}/{groupedSourceMembers.length} người ({totalSelectedRoles} lượt vai trò)
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="h-7 text-[11px] px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                  >
                    Chọn tất cả
                  </Button>
                  <span className="text-muted-foreground">•</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deselectAll}
                    className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>

              {loadingMembers ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Đang tải danh sách đội hình show mẫu...
                </div>
              ) : groupedSourceMembers.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed text-center text-xs text-muted-foreground">
                  Show mẫu này chưa có thành viên nào được phân công. Vui lòng chọn show khác.
                </div>
              ) : (
                <div className="border rounded-2xl divide-y max-h-60 overflow-y-auto bg-card">
                  {groupedSourceMembers.map((gm) => {
                    const isChecked = selectedMemberIds.has(gm.memberId);
                    return (
                      <div
                        key={gm.memberId}
                        onClick={() => toggleMember(gm.memberId)}
                        className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isChecked ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'opacity-60 hover:opacity-100 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleMember(gm.memberId)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-md"
                          />
                          <div className="size-7 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {gm.member?.fullName?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-foreground truncate">
                              {gm.member?.fullName || 'Thành viên'}{' '}
                              <span className="text-[10px] font-mono text-muted-foreground font-normal">
                                ({gm.member?.memberCode || ''})
                              </span>
                            </div>
                            {gm.member?.phone && (
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {gm.member.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Các vai trò */}
                        <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
                          {gm.roles.map((r, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30 font-medium py-0 px-1.5"
                            >
                              {r.positionName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Tùy Chọn Áp Dụng */}
          {sourceEventId && groupedSourceMembers.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-muted/30 border space-y-2 text-xs">
              <span className="font-bold text-foreground block">3. Chế độ áp dụng vào show hiện tại:</span>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="replaceMode"
                    checked={!replaceExisting}
                    onChange={() => setReplaceExisting(false)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-foreground">Gộp thêm vào đội hình hiện tại</span>
                    <p className="text-[11px] text-muted-foreground">
                      Giữ nguyên {existingCount} nhân sự đã có trong show này và bổ sung thêm các thành viên được chọn.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="replaceMode"
                    checked={replaceExisting}
                    onChange={() => setReplaceExisting(true)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      Thay thế toàn bộ đội hình hiện tại
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Xóa toàn bộ phân công cũ của show này và thay bằng đội hình được chọn bên trên.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={batchAssignMutation.isPending}
            className="rounded-xl text-xs h-9"
          >
            Hủy
          </Button>

          <Button
            type="button"
            onClick={handleApply}
            disabled={
              !sourceEventId ||
              selectedMemberIds.size === 0 ||
              batchAssignMutation.isPending ||
              loadingMembers
            }
            className="rounded-xl text-xs h-9 bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5 shadow-xs shadow-amber-500/20"
          >
            <Sparkles className="size-3.5" />
            {batchAssignMutation.isPending
              ? 'Đang lưu đội hình...'
              : `Lưu & Áp Dụng (${selectedMemberIds.size} người)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
