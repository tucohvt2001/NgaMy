import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { transactionService } from '@/services/transaction.service';
import { TransactionInput, TransactionQueryParams, BulkRewardInput } from '@/types/models';
import { getErrorMessage } from '@/lib/errors';

const QUERY_KEY = 'transactions';
const SUMMARY_KEY = 'transactions-summary';

export function useTransactions(params?: TransactionQueryParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => transactionService.list(params),
  });
}

export function useTransactionSummary(params?: { fromDate?: string; toDate?: string; year?: number }) {
  return useQuery({
    queryKey: [SUMMARY_KEY, params],
    queryFn: () => transactionService.getSummary(params),
  });
}

export function useTransaction(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => transactionService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => transactionService.create(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUMMARY_KEY] });
      const isIncome = data.type === 'INCOME';
      toast.success(
        isIncome
          ? `Lập phiếu thu [${data.code}] thành công!`
          : `Lập phiếu chi [${data.code}] thành công!`,
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể tạo phiếu giao dịch'));
    },
  });
}

export function useCreateBulkReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkRewardInput) => transactionService.createBulkReward(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUMMARY_KEY] });
      const codeStr = data.transaction?.code ? `[${data.transaction.code}] ` : '';
      toast.success(`Đã lập phiếu chi khen thưởng ${codeStr}cho ${data.memberCount} thành viên thành công!`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể lập phiếu khen thưởng'));
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
      transactionService.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUMMARY_KEY] });
      toast.success(`Cập nhật phiếu [${data.code}] thành công!`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật phiếu giao dịch'));
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUMMARY_KEY] });
      toast.success('Đã xóa phiếu giao dịch thành công!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Không thể xóa phiếu giao dịch'));
    },
  });
}
