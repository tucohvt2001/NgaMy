'use client';

import { useState } from 'react';
import { Plus, Pencil, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { AccountFormDialog } from '@/components/forms/AccountFormDialog';
import { useAccounts, useCreateAccount, useRemoveAccount, useUpdateAccount } from '@/hooks/useAccounts';
import { Account } from '@/types/models';
import { ROLE_LABELS, RoleName } from '@/types/enums';
import { AccountInput } from '@/services/account.service';
import { PaginationBar } from '@/components/tables/PaginationBar';

export default function AccountsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAccounts(page, 10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmAccount, setConfirmAccount] = useState<Account | null>(null);

  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const removeMutation = useRemoveAccount();

  const handleSubmit = (values: AccountInput) => {
    if (editingAccount) {
      const { username: _username, ...rest } = values;
      void _username;
      const input = rest.password ? rest : { ...rest, password: undefined };
      updateMutation.mutate({ id: editingAccount.id, input }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tài khoản</h1>
          <p className="text-muted-foreground">Quản lý tài khoản đăng nhập và phân quyền</p>
        </div>
        <Button
          onClick={() => {
            setEditingAccount(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Thêm tài khoản
        </Button>
      </div>

      <div className="rounded-md border bg-background">
        {isLoading ? (
          <LoadingState />
        ) : !data || data.items.length === 0 ? (
          <EmptyState label="Chưa có tài khoản nào" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.username}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.role ? ROLE_LABELS[account.role.name as RoleName] : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'success' : 'secondary'}>
                        {account.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingAccount(account);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmAccount(account)}>
                        <Ban className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editingAccount}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!confirmAccount}
        onOpenChange={(open) => !open && setConfirmAccount(null)}
        title="Vô hiệu hóa tài khoản"
        description={`Bạn có chắc muốn vô hiệu hóa tài khoản "${confirmAccount?.username}"?`}
        onConfirm={() => {
          if (confirmAccount) {
            removeMutation.mutate(confirmAccount.id, { onSuccess: () => setConfirmAccount(null) });
          }
        }}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}
