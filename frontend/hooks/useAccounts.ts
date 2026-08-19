import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { accountService, AccountInput } from '@/services/account.service';
import { getErrorMessage } from '@/lib/errors';

export function useAccounts(page = 1, limit = 20) {
  return useQuery({ queryKey: ['accounts', page, limit], queryFn: () => accountService.list(page, limit) });
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: () => accountService.listRoles() });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInput) => accountService.create(input),
    onSuccess: () => {
      toast.success('Tạo tài khoản thành công');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AccountInput> }) =>
      accountService.update(id, input),
    onSuccess: () => {
      toast.success('Cập nhật tài khoản thành công');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.remove(id),
    onSuccess: () => {
      toast.success('Vô hiệu hóa tài khoản thành công');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
