import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { TasksProvider } from '@/features/tasks/components/tasks-provider'
import { TasksTable } from '@/features/tasks/components/tasks-table'
import { type Task } from '@/features/tasks/data/schema'
import { UsersProvider } from '@/features/users/components/users-provider'
import { UsersTable } from '@/features/users/components/users-table'
import { type User } from '@/features/users/data/schema'

const route = vi.hoisted(() => ({ search: {}, navigate: vi.fn() }))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  getRouteApi: () => ({
    useSearch: () => route.search,
    useNavigate: () => route.navigate,
  }),
}))

const users: User[] = Array.from({ length: 12 }, (_, index) => {
  const name = `user-${String(12 - index).padStart(2, '0')}`
  return {
    id: name,
    username: name,
    firstName: name,
    lastName: 'Example',
    email: `${name}@example.com`,
    phoneNumber: '+19999999999',
    status: index % 2 === 0 ? 'active' : 'inactive',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
})

// biome-ignore lint/style/useComponentExportOnlyModules: This component is only a browser test harness.
function UsersHarness({ data = users }: { data?: User[] }) {
  const [search, setSearch] = useState<Record<string, unknown>>({})
  const navigate: NavigateFn = ({ search: next }) => {
    setSearch((previous) =>
      typeof next === 'function'
        ? next(previous)
        : next === true
          ? previous
          : next
    )
  }

  return (
    <UsersProvider>
      <UsersTable data={data} search={search} navigate={navigate} />
      <output aria-label='URL search'>{JSON.stringify(search)}</output>
    </UsersProvider>
  )
}

describe('Table v9 interactions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('paginates users and keeps the page in URL state', async () => {
    const screen = await render(<UsersHarness />)
    await expect.element(screen.getByText('user-12')).toBeInTheDocument()
    expect(screen.getByRole('row').all()).toHaveLength(11)

    await userEvent.click(
      screen.getByRole('button', { name: 'Go to next page' })
    )

    await expect.element(screen.getByText('user-02')).toBeInTheDocument()
    await expect.element(screen.getByText('user-12')).not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('status', { name: 'URL search' }))
      .toMatchTextContent('"page":2')
    expect(screen.getByRole('row').all()).toHaveLength(3)
  })

  it('filters users by username and synchronizes the URL', async () => {
    const screen = await render(<UsersHarness />)
    await userEvent.fill(screen.getByPlaceholder('Filter users...'), 'user-03')

    await expect.element(screen.getByText('user-03')).toBeInTheDocument()
    await expect.element(screen.getByText('user-12')).not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('status', { name: 'URL search' }))
      .toMatchTextContent('"username":"user-03"')
    expect(screen.getByRole('row').all()).toHaveLength(2)
  })

  it('sorts users through the actual column menu', async () => {
    const screen = await render(<UsersHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Username' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Asc' }))

    await expect
      .element(screen.getByRole('row').all()[1])
      .toMatchTextContent('user-01')
  })

  it('selects the current page and clears the selection', async () => {
    const screen = await render(<UsersHarness />)
    const selectAll = screen.getByRole('checkbox', { name: 'Select all' })
    await userEvent.click(selectAll)

    await expect.element(selectAll).toBeChecked()
    await expect
      .element(
        screen.getByRole('toolbar', {
          name: 'Bulk actions for 10 selected users',
        })
      )
      .toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Clear selection' })
    )
    await expect.element(selectAll).not.toBeChecked()
    await expect.element(screen.getByRole('toolbar')).not.toBeInTheDocument()
  })

  it('updates column visibility through the column menu', async () => {
    const screen = await render(<UsersHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Email' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Hide' }))

    await expect
      .element(screen.getByRole('columnheader', { name: 'Email' }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByText('user-12@example.com'))
      .not.toBeInTheDocument()
  })

  it('updates the rendered rows when data is replaced', async () => {
    const screen = await render(<UsersHarness />)
    expect(screen.getByRole('row').all()).toHaveLength(11)

    await screen.rerender(<UsersHarness data={users.slice(0, 2)} />)

    await expect.element(screen.getByText('user-11')).toBeInTheDocument()
    expect(screen.getByRole('row').all()).toHaveLength(3)
    await expect.element(screen.getByText('user-10')).not.toBeInTheDocument()
  })

  it('filters users by a faceted status and can reset the filter', async () => {
    const screen = await render(<UsersHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Status' }))
    await userEvent.click(screen.getByRole('option', { name: /^Active/ }))
    await userEvent.keyboard('{Escape}')

    await expect.element(screen.getByText('user-12')).toBeInTheDocument()
    await expect.element(screen.getByText('user-11')).not.toBeInTheDocument()
    expect(screen.getByRole('row').all()).toHaveLength(7)

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await expect.element(screen.getByText('user-11')).toBeInTheDocument()
    expect(screen.getByRole('row').all()).toHaveLength(11)
  })

  it('filters tasks by both title and ID', async () => {
    const data: Task[] = [
      {
        id: 'TASK-1',
        title: 'Alpha',
        status: 'todo',
        label: 'feature',
        priority: 'high',
      },
      {
        id: 'TASK-2',
        title: 'Beta',
        status: 'done',
        label: 'bug',
        priority: 'low',
      },
    ]
    const screen = await render(
      <TasksProvider>
        <TasksTable data={data} />
      </TasksProvider>
    )
    const filter = screen.getByPlaceholder('Filter by title or ID...')

    await userEvent.fill(filter, 'Beta')
    await expect.element(screen.getByText('TASK-2')).toBeInTheDocument()
    await expect.element(screen.getByText('TASK-1')).not.toBeInTheDocument()

    await userEvent.fill(filter, 'TASK-1')
    await expect.element(screen.getByText('TASK-1')).toBeInTheDocument()
    await expect.element(screen.getByText('TASK-2')).not.toBeInTheDocument()
  })
})
