import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useDebouncedSearch } from './use-debounced-search'

afterEach(() => vi.useRealTimers())

describe('useDebouncedSearch', () => {
  it('updates the draft immediately and commits only the latest value after 300ms of quiet', async () => {
    const onSearch = vi.fn()
    const { result, act } = await renderHook(() =>
      useDebouncedSearch('', onSearch)
    )
    vi.useFakeTimers()

    await act(() => result.current.updateSearchTerm('first'))
    expect(result.current.searchTerm).toBe('first')
    expect(result.current.isPending).toBe(true)

    await act(() => vi.advanceTimersByTimeAsync(200))
    await act(() => result.current.updateSearchTerm('final'))
    await act(() => vi.advanceTimersByTimeAsync(299))
    expect(onSearch).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('final')
    expect(result.current.isPending).toBe(false)
  })

  it('cancels a pending search and restores the committed input', async () => {
    const onSearch = vi.fn()
    const { result, act } = await renderHook(() =>
      useDebouncedSearch('saved', onSearch)
    )
    vi.useFakeTimers()

    await act(() => result.current.updateSearchTerm('discarded'))
    await act(() => result.current.cancelSearch())
    await act(() => vi.advanceTimersByTimeAsync(300))

    expect(result.current.searchTerm).toBe('saved')
    expect(result.current.isPending).toBe(false)
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('replaces the draft and cancels pending work when the committed value changes', async () => {
    const onSearch = vi.fn()
    let value = 'initial'
    const { result, act, rerender } = await renderHook(() =>
      useDebouncedSearch(value, onSearch)
    )
    vi.useFakeTimers()

    await act(() => result.current.updateSearchTerm('discarded'))
    value = 'restored'
    await rerender()
    await act(() => vi.advanceTimersByTimeAsync(300))

    expect(result.current.searchTerm).toBe('restored')
    expect(result.current.isPending).toBe(false)
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('cancels pending navigation when unmounted', async () => {
    const onSearch = vi.fn()
    const { result, act, unmount } = await renderHook(() =>
      useDebouncedSearch('', onSearch)
    )
    vi.useFakeTimers()

    await act(() => result.current.updateSearchTerm('discarded'))
    await unmount()
    await vi.advanceTimersByTimeAsync(300)

    expect(onSearch).not.toHaveBeenCalled()
  })
})
