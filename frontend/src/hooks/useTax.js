import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taxService } from '../services/taxService'

export function useVATReturns() {
  return useQuery({
    queryKey: ['vat-returns'],
    queryFn: taxService.getVATReturns,
  })
}

export function useComputeVAT(periodStart, periodEnd) {
  return useQuery({
    queryKey: ['vat-compute', periodStart, periodEnd],
    queryFn: () => taxService.computeVAT(periodStart, periodEnd),
    enabled: !!(periodStart && periodEnd),
    staleTime: 2 * 60 * 1000,
  })
}

export function useGenerateVATReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: taxService.generateVATReturn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vat-returns'] }),
  })
}

export function useFileVATReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ftaReference }) => taxService.fileVATReturn(id, ftaReference),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vat-returns'] }),
  })
}

export function useCTReturns() {
  return useQuery({
    queryKey: ['ct-returns'],
    queryFn: taxService.getCTReturns,
  })
}

export function useComputeCT(taxYear) {
  return useQuery({
    queryKey: ['ct-compute', taxYear],
    queryFn: () => taxService.computeCT(taxYear),
    enabled: !!taxYear,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGenerateCTReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: taxService.generateCTReturn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ct-returns'] }),
  })
}

export function useFileCTReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, mofReference }) => taxService.fileCTReturn(id, mofReference),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ct-returns'] }),
  })
}
