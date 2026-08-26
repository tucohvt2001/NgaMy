import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  salaryService,
  CalculateSalaryInput,
  CalculateMonthInput,
  SalaryConfigInput,
  SalaryListParams,
} from '@/services/salary.service';
import { getErrorMessage } from '@/lib/errors';

export function useSalaries(params: SalaryListParams) {
  return useQuery({
    queryKey: ['salaries', params],
    queryFn: () => salaryService.list(params),
  });
}

export function useSalaryDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['salaries', id],
    queryFn: () => salaryService.getById(id as string),
    enabled: !!id,
  });
}

export function useMemberSalariesToDate(params?: {
  fromDate?: string;
  toDate?: string;
  teamId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['membersSalariesToDate', params],
    queryFn: () => salaryService.getMembersToDate(params),
  });
}

export function useCalculateSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CalculateSalaryInput) => salaryService.calculate(input),
    onSuccess: () => {
      toast.success('Tính tiền công thành công');
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCalculateMonth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CalculateMonthInput) => salaryService.calculateMonth(input),
    onSuccess: (data) => {
      toast.success(`Đã tự động tính tiền công cho ${data.length} thành viên trong tháng`);
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useConfirmSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salaryService.confirm(id),
    onSuccess: () => {
      toast.success('Xác nhận bảng lương thành công');
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSalaryConfigs() {
  return useQuery({ queryKey: ['salaryConfigs'], queryFn: () => salaryService.listConfigs() });
}

export function useCreateSalaryConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalaryConfigInput) => salaryService.createConfig(input),
    onSuccess: () => {
      toast.success('Tạo cấu hình tiền công thành công');
      queryClient.invalidateQueries({ queryKey: ['salaryConfigs'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useBatchSavePositionConfigs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (configs: Array<{ positionId: string; amount: number; note?: string | null }>) =>
      salaryService.batchSavePositionConfigs(configs),
    onSuccess: () => {
      toast.success('Lưu định mức tiền công theo vị trí thành công');
      queryClient.invalidateQueries({ queryKey: ['salaryConfigs'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useBatchSaveMatrixConfigs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      configs: Array<{ eventType: string; positionId: string; amount: number; note?: string | null }>,
    ) => salaryService.batchSaveMatrixConfigs(configs),
    onSuccess: () => {
      toast.success('Thiết lập lương theo loại show & vị trí thành công');
      queryClient.invalidateQueries({ queryKey: ['salaryConfigs'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSaveEventRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { eventId: string; amount: number; note?: string | null }) =>
      salaryService.saveEventRate(data),
    onSuccess: () => {
      toast.success('Thiết lập lương show diễn thành công');
      queryClient.invalidateQueries({ queryKey: ['salaryConfigs'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveSalaryConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salaryService.removeConfig(id),
    onSuccess: () => {
      toast.success('Xóa cấu hình tiền công thành công');
      queryClient.invalidateQueries({ queryKey: ['salaryConfigs'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

