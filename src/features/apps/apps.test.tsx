import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { Apps } from './index'

const route = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  getRouteApi: () => ({
    useSearch: () => route.search,
    useNavigate: () => route.navigate,
  }),
}))

// The header requires unrelated layout providers; keep the actual search controls.
vi.mock('@/components/layout/header', () => ({ Header: () => null }))

// biome-ignore lint/style/useComponentExportOnlyModules: This component is only a browser test harness.
function AppsHarness() {
  const [search, setSearch] = useState<Record<string, unknown>>({})
  route.search = search
  const navigate: NavigateFn = ({ search: next }) => {
    setSearch((previous) =>
      typeof next === 'function'
        ? next(previous)
        : next === true
          ? previous
          : next
    )
  }
  route.navigate.mockImplementation(navigate)

  return (
    <>
      <Apps />
      <output aria-label='URL search'>{JSON.stringify(search)}</output>
    </>
  )
}

describe('App search pacing', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.useRealTimers())

  it('commits only the latest search and preserves a type filter changed while waiting', async () => {
    const screen = await render(<AppsHarness />)
    const input = screen.getByRole('textbox', { name: 'Filter apps' })
    vi.useFakeTimers()

    await userEvent.fill(input, 'Notion')
    await vi.advanceTimersByTimeAsync(200)
    await userEvent.fill(input, 'Figma')
    await expect.element(input).toHaveValue('Figma')
    await expect
      .element(screen.getByRole('heading', { name: 'Notion', exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('list'))
      .toHaveAttribute('aria-busy', 'true')
    expect(route.navigate).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('combobox').first())
    await userEvent.click(
      screen.getByRole('option', { name: 'Connected', exact: true })
    )
    await vi.advanceTimersByTimeAsync(300)
    await expect
      .element(screen.getByRole('heading', { name: 'Notion', exact: true }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('heading', { name: 'Figma', exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('list'))
      .toHaveAttribute('aria-busy', 'false')
    await expect
      .element(screen.getByRole('status', { name: 'URL search' }))
      .toHaveTextContent('{"type":"connected","filter":"Figma"}')
    expect(route.navigate).toHaveBeenCalledTimes(2)
  })

  it('clears the search and removes its URL parameter after the delay', async () => {
    const screen = await render(<AppsHarness />)
    const input = screen.getByRole('textbox', { name: 'Filter apps' })
    vi.useFakeTimers()

    await userEvent.fill(input, 'Figma')
    await vi.advanceTimersByTimeAsync(300)
    await expect
      .element(screen.getByRole('heading', { name: 'Notion', exact: true }))
      .not.toBeInTheDocument()

    await userEvent.fill(input, '')
    await vi.advanceTimersByTimeAsync(300)

    await expect
      .element(screen.getByRole('heading', { name: 'Notion', exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('status', { name: 'URL search' }))
      .toHaveTextContent('{}')
  })
})
