import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 seconds
      retry: (failureCount, error) => {
        // Don't retry on 401/403/404
        const status = error?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

export default queryClient
