'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRoles } from '@/hooks/useAccounts';
import { Account } from '@/types/models';
import { ROLE_LABELS, RoleName } from '@/types/enums';
import { AccountInput } from '@/services/account.service';

const accountSchema = z.object({
  username: z.string().min(3, 'Tối thiểu 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().optional(),
  roleId: z.string().min(1, 'Vui lòng chọn vai trò'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
  onSubmit: (values: AccountInput) => void;
  isLoading?: boolean;
}

export function AccountFormDialog({ open, onOpenChange, account, onSubmit, isLoading }: AccountFormDialogProps) {
  const { data: roles } = useRoles();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({ resolver: zodResolver(accountSchema) });

  useEffect(() => {
    if (open) {
      reset({
        username: account?.username ?? '',
        email: account?.email ?? '',
        password: '',
        roleId: account?.roleId ?? '',
      });
    }
  }, [open, account, reset]);

  const submitHandler = (values: AccountFormValues) => {
    onSubmit(values as AccountInput);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? 'Cập nhật tài khoản' : 'Thêm tài khoản'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input id="username" disabled={!!account} {...register('username')} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{account ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}</Label>
            <Input id="password" type="password" {...register('password')} />
          </div>
          <div className="space-y-2">
            <Label>Vai trò</Label>
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {ROLE_LABELS[role.name as RoleName] ?? role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.roleId && <p className="text-sm text-destructive">{errors.roleId.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
