import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teamService, TeamInput } from '@/services/team.service';
import { getErrorMessage } from '@/lib/errors';

export function useTeams() {
  return useQuery({ queryKey: ['teams'], queryFn: () => teamService.list() });
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => teamService.getMembers(teamId as string),
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TeamInput) => teamService.create(input),
    onSuccess: () => {
      toast.success('Tạo đội/nhóm thành công');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TeamInput> }) => teamService.update(id, input),
    onSuccess: () => {
      toast.success('Cập nhật đội/nhóm thành công');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamService.remove(id),
    onSuccess: () => {
      toast.success('Xóa đội/nhóm thành công');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
