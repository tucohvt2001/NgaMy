'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Shield, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  positionId: string;
  note: string;
}

interface AssignMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssignMemberInput[]) => void;
  isLoading?: boolean;
  existingMemberIds?: string[];
}

export function AssignMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  existingMemberIds = [],
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
          positionId: '',
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

  // Lấy các thành viên đã được chọn trong các hàng hoặc đã có trong sự kiện
  const selectedMemberIdsInRows = rows.map((r) => r.memberId).filter(Boolean);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        memberId: '',
        positionId: '',
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
          const defaultPositionId =
            r.positionId ||
            (member?.positions && member.positions.length > 0 ? member.positions[0].id : '') ||
            (activePositions.length > 0 ? activePositions[0].id : '');
          return {
            ...r,
            memberId,
            positionId: defaultPositionId,
          };
        }
        return r;
      }),
    );
  };

  const handlePositionChange = (rowId: string, positionId: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, positionId } : r)));
  };

  const handleNoteChange = (rowId: string, note: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, note } : r)));
  };

  // Thêm nhanh toàn bộ thành viên của một đội
  const handleAddTeamMembers = () => {
    if (!selectedTeamId) return;
    const team = teams?.find((t) => t.id === selectedTeamId);
    if (!team) return;

    // Tìm các thành viên thuộc đội này
    const teamMembers = activeMembers.filter((m) => m.teams?.some((t) => t.id === selectedTeamId));

    const newRows: AssignmentRow[] = [];
    for (const member of teamMembers) {
      // Bỏ qua nếu thành viên đã có trong sự kiện hoặc đã có trong danh sách phân công hiện tại
      if (existingMemberIds.includes(member.id) || selectedMemberIdsInRows.includes(member.id)) {
        continue;
      }
      const positionId =
        (member.positions && member.positions.length > 0 ? member.positions[0].id : '') ||
        (activePositions.length > 0 ? activePositions[0].id : '');

      newRows.push({
        id: Math.random().toString(36).substring(7),
        memberId: member.id,
        positionId,
        note: `Đội ${team.name}`,
      });
    }

    if (newRows.length === 0) {
      setError('Tất cả thành viên trong đội này đã được phân công hoặc đã có trong danh sách!');
      return;
    }

    setError(null);
    setRows((prev) => {
      const filtered = prev.filter((r) => r.memberId !== '');
      return [...filtered, ...newRows];
    });
    setActiveTab('custom');
  };

  // Thêm nhiều thành viên với cùng 1 vai trò
  const handleAddBulkByRole = () => {
    if (!bulkPositionId) {
      setError('Vui lòng chọn vai trò!');
      return;
    }
    if (selectedBulkMemberIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 thành viên!');
      return;
    }

    const newRows: AssignmentRow[] = selectedBulkMemberIds.map((mId) => ({
      id: Math.random().toString(36).substring(7),
      memberId: mId,
      positionId: bulkPositionId,
      note: '',
    }));

    setError(null);
    setRows((prev) => {
      const filtered = prev.filter((r) => r.memberId !== '');
      return [...filtered, ...newRows];
    });
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
      if (!validRows[i].positionId) {
        setError(`Vui lòng chọn vai trò cho dòng số ${i + 1}`);
        return;
      }
    }

    // Kiểm tra trùng lặp trong chính danh sách gửi lên
    const memberIdSet = new Set<string>();
    for (const r of validRows) {
      if (memberIdSet.has(r.memberId)) {
        const member = activeMembers.find((m) => m.id === r.memberId);
        setError(`Thành viên "${member?.fullName || r.memberId}" bị trùng lặp nhiều lần trong danh sách!`);
        return;
      }
      memberIdSet.add(r.memberId);
    }

    const assignments: AssignMemberInput[] = validRows.map((r) => ({
      memberId: r.memberId,
      positionId: r.positionId,
      note: r.note.trim() || undefined,
    }));

    onSubmit(assignments);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold">Phân công nhân sự sự kiện</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Thêm nhiều thành viên và vai trò cùng một lúc để tiết kiệm thao tác
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-xs px-2.5 py-1">
                Đã chọn: <span className="font-bold ml-1">{rows.filter((r) => r.memberId).length}</span> thành viên
              </Badge>
            </div>
          </div>

          {/* Tab điều hướng chế độ thêm */}
          <div className="flex gap-2 mt-4 pt-2 border-t">
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'custom' ? 'default' : 'outline'}
              onClick={() => setActiveTab('custom')}
              className="text-xs"
            >
              <Plus className="mr-1.5 size-3.5" />
              Tùy chỉnh từng dòng
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'team' ? 'default' : 'outline'}
              onClick={() => setActiveTab('team')}
              className="text-xs"
            >
              <Users className="mr-1.5 size-3.5" />
              ⚡ Thêm theo Đội
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'bulk_role' ? 'default' : 'outline'}
              onClick={() => setActiveTab('bulk_role')}
              className="text-xs"
            >
              <Shield className="mr-1.5 size-3.5" />
              ⚡ Gán 1 vai trò cho nhiều người
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick tool 1: Thêm theo đội */}
          {activeTab === 'team' && (
            <div className="p-4 rounded-lg border bg-muted/40 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <Label className="font-semibold text-sm">Chọn Đội để thêm tất cả thành viên trong đội:</Label>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="sm:w-72 bg-background">
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
                <Button type="button" onClick={handleAddTeamMembers} disabled={!selectedTeamId}>
                  Thêm thành viên đội vào danh sách
                </Button>
              </div>
            </div>
          )}

          {/* Quick tool 2: Gán 1 vai trò cho nhiều người */}
          {activeTab === 'bulk_role' && (
            <div className="p-4 rounded-lg border bg-muted/40 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Vai trò phân công:</Label>
                  <Select value={bulkPositionId} onValueChange={setBulkPositionId}>
                    <SelectTrigger className="bg-background">
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
                    className="w-full"
                  >
                    Thêm {selectedBulkMemberIds.length} người vào danh sách
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Chọn danh sách thành viên:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-background">
                  {activeMembers
                    .filter((m) => !existingMemberIds.includes(m.id) && !selectedMemberIdsInRows.includes(m.id))
                    .map((m) => {
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
                          className={`flex items-center justify-between p-2 rounded text-left text-xs border transition-colors ${
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

          {/* Bảng danh sách các dòng phân công */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Danh sách phân công:</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 text-xs">
                <Plus className="mr-1 size-3.5" />
                Thêm dòng
              </Button>
            </div>

            {rows.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground text-sm">
                Chưa có dòng phân công nào. Bấm &quot;Thêm dòng&quot; hoặc chọn công cụ thêm nhanh ở trên.
              </div>
            ) : (
              <div className="border rounded-md divide-y bg-background overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-2.5 bg-muted/60 text-xs font-semibold text-muted-foreground">
                  <div className="col-span-1 text-center">STT</div>
                  <div className="col-span-4">Thành viên *</div>
                  <div className="col-span-3">Vai trò / Vị trí *</div>
                  <div className="col-span-3">Ghi chú</div>
                  <div className="col-span-1 text-right">Xóa</div>
                </div>

                <div className="divide-y max-h-72 overflow-y-auto">
                  {rows.map((row, idx) => {
                    const selectedMember = activeMembers.find((m) => m.id === row.memberId);
                    return (
                      <div key={row.id} className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-muted/20">
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
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Chọn thành viên..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {activeMembers.map((member) => {
                                const isAlreadyInEvent = existingMemberIds.includes(member.id);
                                const isSelectedInOtherRow =
                                  row.memberId !== member.id && selectedMemberIdsInRows.includes(member.id);
                                return (
                                  <SelectItem
                                    key={member.id}
                                    value={member.id}
                                    disabled={isAlreadyInEvent || isSelectedInOtherRow}
                                    className="text-xs"
                                  >
                                    {member.fullName} ({member.memberCode})
                                    {isAlreadyInEvent
                                      ? ' [Đã có trong sự kiện]'
                                      : isSelectedInOtherRow
                                      ? ' [Đã chọn ở dòng khác]'
                                      : ''}
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

                        {/* Chọn vai trò */}
                        <div className="col-span-3">
                          <Select
                            value={row.positionId}
                            onValueChange={(val) => handlePositionChange(row.id, val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Chọn vai trò..." />
                            </SelectTrigger>
                            <SelectContent>
                              {activePositions.map((position) => (
                                <SelectItem key={position.id} value={position.id} className="text-xs">
                                  {position.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Ghi chú */}
                        <div className="col-span-3">
                          <Input
                            placeholder="Ghi chú (tùy chọn)"
                            value={row.note}
                            onChange={(e) => handleNoteChange(row.id, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* Nút xóa */}
                        <div className="col-span-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(row.id)}
                            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-md">{error}</p>}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRows([])}
            disabled={rows.length === 0}
            className="text-xs text-muted-foreground"
          >
            Xóa tất cả dòng
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={rows.length === 0}
            >
              {isLoading ? 'Đang lưu...' : `Xác nhận phân công (${rows.filter((r) => r.memberId).length})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
