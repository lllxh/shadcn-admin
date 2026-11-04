import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { taskKeys } from '../data/queries'
import { type Task } from '../data/schema'
import { tasksApi } from '../data/tasks-api'
import { TasksList } from './tasks-list'
import { createTestQueryClient, renderWithQuery } from '@/test-utils/query'

vi.mock('../data/tasks-api', () => ({
  tasksApi: { list: vi.fn(), write: vi.fn() },
}))
// Exercise query lifecycle here; table routing and filtering have separate tests.
vi.mock('./tasks-table', () => ({
  TasksTable: ({ data }: { data: Task[] }) => (
    <ul>
      {data.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  ),
}))

const task: Task = {
  id: 'TASK-1',
  title: 'Saved task',
  status: 'todo',
  label: 'bug',
  priority: 'low',
}

describe('Task list server states', () => {
  beforeEach(() => vi.resetAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('shows initial loading, followed by the empty state', async () => {
    let resolve!: (tasks: Task[]) => void
    vi.mocked(tasksApi.list).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const screen = await renderWithQuery(<TasksList />)
    await expect
      .element(screen.getByRole('status', { name: 'Loading tasks' }))
      .toBeInTheDocument()
    resolve([])
    await expect
      .element(screen.getByText('No tasks yet. Create a task to get started.'))
      .toBeInTheDocument()
  })

  it('retries an initial error and renders recovered data', async () => {
    vi.mocked(tasksApi.list)
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValue([task])
    const screen = await renderWithQuery(<TasksList />)
    await expect
      .element(screen.getByRole('alert'))
      .toMatchTextContent(/Unable to load tasks/)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await expect.element(screen.getByText(task.title)).toBeInTheDocument()
  })

  it('retains cached rows during a background refetch and after its failure', async () => {
    let reject!: (reason: Error) => void
    vi.mocked(tasksApi.list).mockImplementation(
      () =>
        new Promise((_, fail) => {
          reject = fail
        })
    )
    const client = createTestQueryClient()
    client.setQueryData(taskKeys.list(), [task], {
      updatedAt: Date.now() - 60_000,
    })
    const screen = await renderWithQuery(<TasksList />, client)
    await expect.element(screen.getByText(task.title)).toBeInTheDocument()
    await expect
      .element(screen.getByRole('status'))
      .toMatchTextContent(/Refreshing tasks/)
    await expect
      .element(screen.getByRole('region', { name: 'Task list' }))
      .toHaveAttribute('aria-busy', 'true')
    reject(new Error('Service unavailable'))
    await expect
      .element(screen.getByRole('alert'))
      .toMatchTextContent(/Showing the last available data/)
    await expect.element(screen.getByText(task.title)).toBeInTheDocument()

    vi.mocked(tasksApi.list).mockResolvedValue([
      { ...task, title: 'Latest task' },
    ])
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await expect.element(screen.getByText('Latest task')).toBeInTheDocument()
    await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
    client.clear()
  })

  it('identifies stale cached data while idle', async () => {
    const client = createTestQueryClient()
    client.setQueryDefaults(taskKeys.list(), { refetchOnMount: false })
    client.setQueryData(taskKeys.list(), [task], {
      updatedAt: Date.now() - 60_000,
    })
    const screen = await renderWithQuery(<TasksList />, client)
    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent('Showing saved tasks. Refresh for the latest.')
    await expect.element(screen.getByText(task.title)).toBeInTheDocument()
    expect(tasksApi.list).not.toHaveBeenCalled()
    client.clear()
  })
})
