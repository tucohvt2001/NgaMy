import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bankService } from '@/services/bank.service';

export function useBanks(params?: { search?: string; transferOnly?: boolean }) {
  return useQuery({
    queryKey: ['banks', params],
    queryFn: () => bankService.getBanks(params),
    staleTime: 1000 * 60 * 60, // Cache 1 giờ vì danh sách ngân hàng ít thay đổi
  });
}

export function useSyncBanks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => bankService.syncBanks(),
    onSuccess: (data) => {
      toast.success(`Đã đồng bộ thành công ${data.length} ngân hàng từ VietQR!`);
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể đồng bộ danh sách ngân hàng');
    },
  });
}
