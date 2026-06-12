import { useQuery, useMutation } from '@tanstack/react-query'
import { billingService } from '../services/billingService'

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: billingService.getSubscription,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBillingInvoices() {
  return useQuery({
    queryKey: ['billing-invoices'],
    queryFn: billingService.getInvoices,
  })
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: billingService.createCheckoutSession,
  })
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: billingService.getBillingPortal,
  })
}
