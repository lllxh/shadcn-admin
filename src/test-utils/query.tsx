import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from 'vitest-browser-react'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  })
}

export function renderWithQuery(
  ui: ReactNode,
  client = createTestQueryClient()
) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}
