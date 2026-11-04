import { useEffect, useState } from 'react'
import { useDebouncer } from '@tanstack/react-pacer/debouncer'

export function useDebouncedSearch(
  value: string,
  onSearch: (value: string) => void
) {
  const [searchTerm, setSearchTerm] = useState(value)
  const { cancel, maybeExecute, state } = useDebouncer(
    onSearch,
    { wait: 300 },
    (state) => ({ isPending: state.isPending })
  )

  useEffect(() => {
    cancel()
    setSearchTerm(value)
  }, [value, cancel])

  return {
    searchTerm,
    isPending: state.isPending,
    updateSearchTerm: (next: string) => {
      setSearchTerm(next)
      maybeExecute(next)
    },
    cancelSearch: () => {
      cancel()
      setSearchTerm(value)
    },
  }
}
