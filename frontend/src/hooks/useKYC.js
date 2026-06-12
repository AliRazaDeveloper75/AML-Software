import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kycService } from '../services/kycService'

export function useCustomers(params = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => kycService.getCustomers(params),
  })
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => kycService.getCustomer(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: kycService.createCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => kycService.updateCustomer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] })
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useScreenCustomer(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => kycService.screenCustomer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', id] }),
  })
}

export function useApproveCustomer(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notes) => kycService.approveCustomer(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] })
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useRejectCustomer(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason) => kycService.rejectCustomer(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] })
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useCustomerTimeline(id) {
  return useQuery({
    queryKey: ['customer-timeline', id],
    queryFn: () => kycService.getTimeline(id),
    enabled: !!id,
  })
}

export function useUploadDocument(customerId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: kycService.uploadDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      if (customerId) qc.invalidateQueries({ queryKey: ['customer', customerId] })
    },
  })
}

export function useSumsubLink(id) {
  return useMutation({
    mutationFn: () => kycService.getSumsubLink(id),
  })
}

export function useSuspendCustomer(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason) => kycService.suspendCustomer(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] })
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
