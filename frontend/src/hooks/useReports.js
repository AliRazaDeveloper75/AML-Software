import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsService } from '../services/reportsService'

export function useReports(params = {}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportsService.getReports(params),
  })
}

export function useGenerateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reportsService.generateReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: reportsService.downloadReport,
  })
}
