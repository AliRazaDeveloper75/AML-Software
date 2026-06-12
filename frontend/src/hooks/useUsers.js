import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../services/usersService'

export function useUsers(params = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersService.getUsers(params),
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersService.inviteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersService.deactivateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useReactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersService.reactivateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: usersService.getRoles,
    staleTime: 10 * 60 * 1000,
  })
}

export function useOrg() {
  return useQuery({
    queryKey: ['org'],
    queryFn: usersService.getOrg,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateOrg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersService.updateOrg,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org'] }),
  })
}

export function useOrgStats() {
  return useQuery({
    queryKey: ['org-stats'],
    queryFn: usersService.getOrgStats,
    staleTime: 5 * 60 * 1000,
  })
}
