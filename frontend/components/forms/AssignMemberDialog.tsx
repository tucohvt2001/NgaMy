'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMembers } from '@/hooks/useMembers';
import { usePositions } from '@/hooks/usePositions';
import { AssignMemberInput } from '@/services/event.service';

const assignSchema = z.object({
  memberId: z.string().min(1, 'Vui lòng chọn thành viên'),
  positionId: z.string().min(1, 'Vui lòng chọn vị trí'),
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface AssignMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssignMemberInput) => void;
  isLoading?: boolean;
}

export function AssignMemberDialog({ open, onOpenChange, onSubmit, isLoading }: AssignMemberDialogProps) {
  const { data: memberData } = useMembers({ page: 1, limit: 200, status: 'ACTIVE' });
  const { data: positions } = usePositions();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignFormValues>({ resolver: zodResolver(assignSchema) });

  const submitHandler = (values: AssignFormValues) => {
    setError(null);
    onSubmit(values);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Phân công thành viên</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label>Thành viên</Label>
            <Controller
              control={control}
              name="memberId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberData?.items.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName} ({member.memberCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.memberId && <p className="text-sm text-destructive">{errors.memberId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Vị trí</Label>
            <Controller
              control={control}
              name="positionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions?.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.positionId && <p className="text-sm text-destructive">{errors.positionId.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Phân công'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
