import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountingService } from '../services/accountingService'

export function useInvoices(params = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => accountingService.getInvoices(params),
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: accountingService.createInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useMarkInvoiceSent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: accountingService.markSent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }) => accountingService.recordPayment(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useTransactions(params = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => accountingService.getTransactions(params),
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: accountingService.createTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useExpenses(params = {}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => accountingService.getExpenses(params),
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: accountingService.createExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: accountingService.deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })
}

export function useTrialBalance() {
  return useQuery({
    queryKey: ['trial-balance'],
    queryFn: accountingService.getTrialBalance,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountingService.getAccounts(),
    staleTime: 5 * 60 * 1000,
  })
}
