import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { memberService, MemberInput, MemberListParams } from '@/services/member.service';
import { getErrorMessage } from '@/lib/errors';

export function useMembers(params: MemberListParams) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => memberService.list(params),
  });
}

export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => memberService.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberInput) => memberService.create(input),
    onSuccess: () => {
      toast.success('Tạo thành viên thành công');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MemberInput> }) => memberService.update(id, input),
    onSuccess: () => {
      toast.success('Cập nhật thành viên thành công');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => memberService.remove(id),
    onSuccess: () => {
      toast.success('Vô hiệu hóa thành viên thành công');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
