import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitoringService } from '../services/monitoringService'

export function useMonitoringRules(params = {}) {
  return useQuery({
    queryKey: ['monitoring-rules', params],
    queryFn: () => monitoringService.getRules(params),
  })
}

export function useToggleMonitoringRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: monitoringService.toggleRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitoring-rules'] }),
  })
}

export function useMonitoringAlerts(params = {}) {
  return useQuery({
    queryKey: ['monitoring-alerts', params],
    queryFn: () => monitoringService.getAlerts(params),
    refetchInterval: 30 * 1000,
  })
}

export function useReviewMonitoringAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => monitoringService.reviewAlert(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitoring-alerts'] }),
  })
}

export function useUnreviewedCount() {
  return useQuery({
    queryKey: ['monitoring-unreviewed-count'],
    queryFn: monitoringService.getUnreviewedCount,
    refetchInterval: 30 * 1000,
  })
}
