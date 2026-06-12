import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { amlService } from '../services/amlService'

export function useAlerts(params = {}) {
  return useQuery({
    queryKey: ['aml-alerts', params],
    queryFn: () => amlService.getAlerts(params),
  })
}

export function useAlertSummary() {
  return useQuery({
    queryKey: ['aml-alert-summary'],
    queryFn: amlService.getAlertSummary,
    staleTime: 60 * 1000,
  })
}

export function useResolveAlert(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => amlService.resolveAlert(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aml-alerts'] })
      qc.invalidateQueries({ queryKey: ['aml-alert-summary'] })
    },
  })
}

export function useAssignAlert(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId) => amlService.assignAlert(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aml-alerts'] }),
  })
}

export function useScreenings(params = {}) {
  return useQuery({
    queryKey: ['aml-screenings', params],
    queryFn: () => amlService.getScreenings(params),
  })
}

export function useWatchlists() {
  return useQuery({
    queryKey: ['watchlists'],
    queryFn: amlService.getWatchlists,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTransactionRules() {
  return useQuery({
    queryKey: ['transaction-rules'],
    queryFn: amlService.getRules,
  })
}

export function useToggleRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: amlService.toggleRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transaction-rules'] }),
  })
}
