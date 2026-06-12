import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'

export function useOrgStats() {
  return useQuery({
    queryKey: ['org-stats'],
    queryFn: dashboardService.getOrgStats,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAlertSummary() {
  return useQuery({
    queryKey: ['alert-summary'],
    queryFn: dashboardService.getAlertSummary,
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,  // poll every 30s for live dashboard
  })
}

export function useRecentFlagged() {
  return useQuery({
    queryKey: ['recent-flagged'],
    queryFn: dashboardService.getRecentFlagged,
    staleTime: 30 * 1000,
  })
}

export function useUnreviewedCount() {
  return useQuery({
    queryKey: ['unreviewed-count'],
    queryFn: dashboardService.getUnreviewedCount,
    refetchInterval: 30 * 1000,
  })
}

export function useNotificationCount() {
  return useQuery({
    queryKey: ['notification-count'],
    queryFn: dashboardService.getNotificationCount,
    refetchInterval: 60 * 1000,
  })
}
