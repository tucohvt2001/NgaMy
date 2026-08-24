'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Shield, Sparkles, Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMembers } from '@/hooks/useMembers';
import { usePositions } from '@/hooks/usePositions';
import { useTeams } from '@/hooks/useTeams';
import { AssignMemberInput } from '@/services/event.service';
import { Member, Position } from '@/types/models';

interface AssignmentRow {
  id: string; // unique local key
  memberId: string;
  positionIds: string[]; // Đánh dấu nhiều vị trí cho 1 người
  note: string;
}

interface AssignMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssignMemberInput[]) => void;
  isLoading?: boolean;
  existingAssignments?: { memberId: string; positionId: string; memberName?: string; positionName?: string }[];
}

export function AssignMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  existingAssignments = [],
}: AssignMemberDialogProps) {
  const { data: memberData } = useMembers({ page: 1, limit: 300, status: 'ACTIVE' });
  const { data: positions } = usePositions();
  const { data: teams } = useTeams();

  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Quick action states
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [bulkPositionId, setBulkPositionId] = useState<string>('');
  const [selectedBulkMemberIds, setSelectedBulkMemberIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'custom' | 'team' | 'bulk_role'>('custom');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setRows([
        {
          id: Math.random().toString(36).substring(7),
          memberId: '',
          positionIds: [],
          note: '',
        },
      ]);
      setError(null);
      setSelectedTeamId('');
      setBulkPositionId('');
      setSelectedBulkMemberIds([]);
      setActiveTab('custom');
    }
  }, [open]);

  const activeMembers: Member[] = memberData?.items ?? [];
  const activePositions: Position[] = positions?.filter((p) => p.isActive !== false) ?? [];

  // Tạo map các positionId mà thành viên đã được phân công trong sự kiện
  const existingPairSet = new Set(existingAssignments.map((a) => `${a.memberId}_${a.positionId}`));

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        memberId: '',
        positionIds: [],
        note: '',
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleMemberChange = (rowId: string, memberId: string) => {
    const member = activeMembers.find((m) => m.id === memberId);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          // Gợi ý tự động vị trí chuyên môn đầu tiên của thành viên nếu có
          const defaultPosIds =
            member?.positions && member.positions.length > 0
              ? [member.positions[0].id]
              : activePositions.length > 0
              ? [activePositions[0].id]
              : [];
          return {
            ...r,
            memberId,
            positionIds: defaultPosIds,
          };
        }
        return r;
      }),
    );
  };

  const handleTogglePosition = (rowId: string, positionId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const exists = r.positionIds.includes(positionId);
          const nextPositionIds = exists
            ? r.positionIds.filter((pId) => pId !== positionId)
            : [...r.positionIds, positionId];
          return { ...r, positionIds: nextPositionIds };
        }
        return r;
      }),
    );
  };

  const handleNoteChange = (rowId: string, note: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, note } : r)));
  };

  // Công cụ 1: Thêm nhanh toàn bộ thành viên của một đội
  const handleAddTeamMembers = () => {
    if (!selectedTeamId) return;
    const team = teams?.find((t) => t.id === selectedTeamId);
    if (!team) return;

    // Tìm các thành viên thuộc đội này
    const teamMembers = activeMembers.filter((m) => m.teams?.some((t) => t.id === selectedTeamId));

    const newRows: AssignmentRow[] = [];
    for (const member of teamMembers) {
      // Bỏ qua nếu đã có dòng cho thành viên này trong bảng
      if (rows.some((r) => r.memberId === member.id)) continue;

      const posIds =
        member.positions && member.positions.length > 0
          ? member.positions.map((p) => p.id)
          : activePositions.length > 0
          ? [activePositions[0].id]
          : [];

      newRows.push({
        id: Math.random().toString(36).substring(7),
        memberId: member.id,
        positionIds: posIds,
        note: `Đội ${team.name}`,
      });
    }

    if (newRows.length === 0) {
      setError('Tất cả thành viên trong đội này đã có trong danh sách phân công!');
      return;
    }

    setError(null);
    setRows((prev) => {
      const filtered = prev.filter((r) => r.memberId !== '');
      return [...filtered, ...newRows];
    });
    setActiveTab('custom');
  };

  // Công cụ 2: Thêm nhiều thành viên với cùng 1 vai trò
  const handleAddBulkByRole = () => {
    if (!bulkPositionId) {
      setError('Vui lòng chọn vai trò!');
      return;
    }
    if (selectedBulkMemberIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thành viên!');
      return;
    }

    const newRows: AssignmentRow[] = [];
    setRows((prev) => {
      let updated = [...prev.filter((r) => r.memberId !== '')];
      for (const mId of selectedBulkMemberIds) {
        const existingRowIndex = updated.findIndex((r) => r.memberId === mId);
        if (existingRowIndex >= 0) {
          // Thêm vai trò vào dòng đã có của thành viên nếu chưa có
          if (!updated[existingRowIndex].positionIds.includes(bulkPositionId)) {
            updated[existingRowIndex] = {
              ...updated[existingRowIndex],
              positionIds: [...updated[existingRowIndex].positionIds, bulkPositionId],
            };
          }
        } else {
          updated.push({
            id: Math.random().toString(36).substring(7),
            memberId: mId,
            positionIds: [bulkPositionId],
            note: '',
          });
        }
      }
      return updated;
    });

    setError(null);
    setSelectedBulkMemberIds([]);
    setActiveTab('custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validRows = rows.filter((r) => r.memberId.trim() !== '');

    if (validRows.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thành viên để phân công');
      return;
    }

    for (let i = 0; i < validRows.length; i++) {
      if (!validRows[i].positionIds || validRows[i].positionIds.length === 0) {
        const member = activeMembers.find((m) => m.id === validRows[i].memberId);
        setError(`Vui lòng đánh dấu ít nhất 1 vai trò cho thành viên "${member?.fullName || `Dòng ${i + 1}`}"`);
        return;
      }
    }

    // Kiểm tra xem có thành viên nào bị lặp lại ở nhiều dòng không
    const memberIdSet = new Set<string>();
    for (const r of validRows) {
      if (memberIdSet.has(r.memberId)) {
        const member = activeMembers.find((m) => m.id === r.memberId);
        setError(`Thành viên "${member?.fullName}" đang xuất hiện ở nhiều dòng. Bạn có thể chọn nhiều vai trò trong cùng 1 dòng duy nhất!`);
        return;
      }
      memberIdSet.add(r.memberId);
    }

    // Biến đổi các dòng sang phẳng danh sách phân công
    const assignments: AssignMemberInput[] = [];
    for (const r of validRows) {
      for (const posId of r.positionIds) {
        assignments.push({
          memberId: r.memberId,
          positionId: posId,
          note: r.note.trim() || undefined,
        });
      }
    }

    onSubmit(assignments);
  };

  // Đếm tổng số nhân sự và tổng số lượt vai trò
  const validRows = rows.filter((r) => r.memberId.trim() !== '');
  const totalUniqueMembers = validRows.length;
  const totalRoleAssignments = validRows.reduce((sum, r) => sum + r.positionIds.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-hidden flex flex-col p-0 gap-0 rounded-3xl">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-amber-500/10 via-background to-amber-500/5">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="size-5 text-amber-500" />
                Phân Công Nhân Sự Sự Kiện
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Tại cột <strong>&quot;Vai trò / Vị trí&quot;</strong>, bạn có thể <strong>đánh dấu nhiều vai trò cùng lúc</strong> cho 1 thành viên (vd: Lân đầu + Trống)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2.5 py-1">
                👤 Nhân sự: <strong className="ml-1 text-foreground">{totalUniqueMembers}</strong>
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 text-xs px-2.5 py-1">
                🎭 Tổng vai trò: <strong className="ml-1">{totalRoleAssignments}</strong>
              </Badge>
            </div>
          </div>

          {/* Tab điều hướng chế độ thêm */}
          <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t">
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'custom' ? 'default' : 'outline'}
              onClick={() => setActiveTab('custom')}
              className="text-xs rounded-xl"
            >
              <Plus className="mr-1.5 size-3.5" />
              Tùy chỉnh từng dòng (Đánh dấu nhiều vai trò)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'team' ? 'default' : 'outline'}
              onClick={() => setActiveTab('team')}
              className="text-xs rounded-xl"
            >
              <Users className="mr-1.5 size-3.5" />
              ⚡ Thêm theo Đội
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'bulk_role' ? 'default' : 'outline'}
              onClick={() => setActiveTab('bulk_role')}
              className="text-xs rounded-xl"
            >
              <Shield className="mr-1.5 size-3.5" />
              ⚡ 1 Vai trò cho nhiều người
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick tool 1: Thêm theo đội */}
          {activeTab === 'team' && (
            <div className="p-4 rounded-2xl border bg-muted/40 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <Label className="font-semibold text-sm">Chọn Đội để thêm tất cả thành viên trong đội:</Label>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="sm:w-72 bg-background rounded-xl">
                    <SelectValue placeholder="-- Chọn Đội --" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team._count?.members ?? 0} thành viên)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={handleAddTeamMembers} disabled={!selectedTeamId} className="rounded-xl">
                  Thêm thành viên đội vào danh sách
                </Button>
              </div>
            </div>
          )}

          {/* Quick tool 2: Gán 1 vai trò cho nhiều người */}
          {activeTab === 'bulk_role' && (
            <div className="p-4 rounded-2xl border bg-muted/40 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Vai trò phân công:</Label>
                  <Select value={bulkPositionId} onValueChange={setBulkPositionId}>
                    <SelectTrigger className="bg-background rounded-xl">
                      <SelectValue placeholder="-- Chọn vai trò --" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePositions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddBulkByRole}
                    disabled={!bulkPositionId || selectedBulkMemberIds.length === 0}
                    className="w-full rounded-xl"
                  >
                    Thêm {selectedBulkMemberIds.length} người vào danh sách
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Chọn danh sách thành viên:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-2xl bg-background">
                  {activeMembers.map((m) => {
                    const isSelected = selectedBulkMemberIds.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          setSelectedBulkMemberIds((prev) =>
                            isSelected ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                          );
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl text-left text-xs border transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10 font-medium text-primary'
                            : 'hover:bg-accent border-transparent'
                        }`}
                      >
                        <span className="truncate">
                          {m.fullName} ({m.memberCode})
                        </span>
                        {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bảng danh sách các dòng phân công (Combobox cho phép đánh dấu nhiều vai trò) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Danh sách nhân sự phân công ({rows.filter((r) => r.memberId).length} người):
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 text-xs rounded-xl">
                <Plus className="mr-1 size-3.5" />
                Thêm dòng
              </Button>
            </div>

            {rows.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-2xl text-muted-foreground text-sm">
                Chưa có dòng phân công nào. Bấm &quot;Thêm dòng&quot; hoặc chọn công cụ thêm nhanh ở trên.
              </div>
            ) : (
              <div className="border rounded-2xl divide-y bg-background overflow-hidden shadow-2xs">
                <div className="grid grid-cols-12 gap-2 p-2.5 bg-muted/60 text-xs font-semibold text-muted-foreground">
                  <div className="col-span-1 text-center">STT</div>
                  <div className="col-span-4">Thành viên *</div>
                  <div className="col-span-4">Vai trò / Vị trí * (Đánh dấu nhiều vai trò)</div>
                  <div className="col-span-2">Ghi chú</div>
                  <div className="col-span-1 text-right">Xóa</div>
                </div>

                <div className="divide-y max-h-72 overflow-y-auto">
                  {rows.map((row, idx) => {
                    const selectedMember = activeMembers.find((m) => m.id === row.memberId);
                    const selectedPositionNames = activePositions
                      .filter((p) => row.positionIds.includes(p.id))
                      .map((p) => p.name);

                    return (
                      <div key={row.id} className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-muted/20">
                        {/* STT */}
                        <div className="col-span-1 text-center text-xs text-muted-foreground font-medium">
                          {idx + 1}
                        </div>

                        {/* Chọn thành viên */}
                        <div className="col-span-4">
                          <Select
                            value={row.memberId}
                            onValueChange={(val) => handleMemberChange(row.id, val)}
                          >
                            <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
                              <SelectValue placeholder="Chọn thành viên..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {activeMembers.map((member) => {
                                const isSelectedInOtherRow =
                                  row.memberId !== member.id &&
                                  rows.some((r) => r.id !== row.id && r.memberId === member.id);
                                return (
                                  <SelectItem
                                    key={member.id}
                                    value={member.id}
                                    disabled={isSelectedInOtherRow}
                                    className="text-xs"
                                  >
                                    {member.fullName} ({member.memberCode})
                                    {isSelectedInOtherRow ? ' [Đã chọn ở dòng khác]' : ''}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {selectedMember?.teams && selectedMember.teams.length > 0 && (
                            <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                              {selectedMember.teams.map((t) => t.name).join(', ')}
                            </span>
                          )}
                        </div>

                        {/* COMBOBOX ĐÁNH DẤU NHIỀU VAI TRÒ (MULTI-SELECT CHECKBOXES) */}
                        <div className="col-span-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full h-9 justify-between font-normal text-xs rounded-xl px-2.5 bg-background border-border/80 hover:bg-accent"
                              >
                                <div className="truncate text-left flex items-center gap-1">
                                  {row.positionIds.length === 0 ? (
                                    <span className="text-muted-foreground">-- Chọn các vai trò --</span>
                                  ) : row.positionIds.length === 1 ? (
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-bold bg-amber-500/15 text-amber-900 dark:text-amber-200">
                                      {selectedPositionNames[0]}
                                    </Badge>
                                  ) : (
                                    <div className="flex items-center gap-1 overflow-hidden">
                                      <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200 shrink-0">
                                        {row.positionIds.length} vai trò
                                      </Badge>
                                      <span className="text-muted-foreground text-[11px] truncate">
                                        ({selectedPositionNames.join(', ')})
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <ChevronsUpDown className="size-3.5 opacity-50 shrink-0 ml-1" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-72 max-h-64 overflow-y-auto p-2 rounded-2xl shadow-xl border border-border"
                              align="start"
                              onWheel={(e) => e.stopPropagation()}
                            >
                              <div className="p-1 pb-2 border-b mb-1 flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">
                                  Đánh dấu vai trò đảm nhiệm:
                                </span>
                                {row.positionIds.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRows((prev) =>
                                        prev.map((r) => (r.id === row.id ? { ...r, positionIds: [] } : r)),
                                      )
                                    }
                                    className="text-[10px] text-muted-foreground hover:text-destructive font-medium"
                                  >
                                    Bỏ chọn
                                  </button>
                                )}
                              </div>
                              <div className="space-y-1">
                                {activePositions.map((pos) => {
                                  const isChecked = row.positionIds.includes(pos.id);
                                  const isAlreadyAssignedInEvent =
                                    row.memberId && existingPairSet.has(`${row.memberId}_${pos.id}`);

                                  return (
                                    <label
                                      key={pos.id}
                                      className={`flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors select-none ${
                                        isChecked
                                          ? 'bg-amber-500/15 font-bold text-amber-900 dark:text-amber-200'
                                          : 'hover:bg-muted/70 text-foreground'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={() => handleTogglePosition(row.id, pos.id)}
                                          className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black"
                                        />
                                        <span>{pos.name}</span>
                                      </div>
                                      {isAlreadyAssignedInEvent && (
                                        <span className="text-[9px] text-muted-foreground font-normal">
                                          (Đã có trong show)
                                        </span>
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Ghi chú */}
                        <div className="col-span-2">
                          <Input
                            placeholder="Ghi chú (tùy chọn)"
                            value={row.note}
                            onChange={(e) => handleNoteChange(row.id, e.target.value)}
                            className="h-9 text-xs rounded-xl bg-background"
                          />
                        </div>

                        {/* Nút xóa dòng */}
                        <div className="col-span-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(row.id)}
                            className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-xl">{error}</p>}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRows([])}
            disabled={rows.length === 0}
            className="text-xs text-muted-foreground rounded-xl"
          >
            Xóa tất cả dòng
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={rows.length === 0 || totalRoleAssignments === 0}
              className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-xs"
            >
              {isLoading ? 'Đang lưu...' : `Xác nhận phân công (${totalRoleAssignments} lượt vai trò)`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
