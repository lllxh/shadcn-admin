import { useQuery } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  taskKeys,
  tasksQueryOptions,
  taskWriteOptions,
  useOptimisticTasks,
  useTaskWrite,
} from './queries'
import { type Task } from './schema'
import { tasksApi } from './tasks-api'
import { createTestQueryClient, renderWithQuery } from '@/test-utils/query'

vi.mock('./tasks-api', () => ({ tasksApi: { list: vi.fn(), write: vi.fn() } }))

const task: Task = {
  id: 'TASK-1',
  title: 'Existing',
  label: 'feature',
  status: 'todo',
  priority: 'low',
}

// biome-ignore lint/style/useComponentExportOnlyModules: Browser test harness.
function Harness() {
  const query = useQuery(tasksQueryOptions())
  const data = useOptimisticTasks(query.data)
  const mutation = useTaskWrite()
  return (
    <>
      <p>{data?.[0]?.label}</p>
      <button
        type='button'
        onClick={() =>
          mutation.mutate({
            type: 'update',
            ids: [task.id],
            changes: { label: 'bug' },
          })
        }
      >
        Change label
      </button>
      {mutation.isError && <p role='alert'>{mutation.error.message}</p>}
    </>
  )
}

describe('Tasks query cache', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(tasksApi.list).mockResolvedValue([task])
  })
  afterEach(() => vi.restoreAllMocks())

  it('deduplicates consumers and passes through the cancellation signal', async () => {
    const client = createTestQueryClient()
    await Promise.all([
      client.fetchQuery(tasksQueryOptions()),
      client.fetchQuery(tasksQueryOptions()),
    ])
    expect(tasksApi.list).toHaveBeenCalledOnce()
    expect(tasksApi.list).toHaveBeenCalledWith(expect.any(AbortSignal))
    client.clear()
  })

  it('shows an optimistic edit without modifying confirmed cache, then rolls back on failure', async () => {
    let reject!: (reason: Error) => void
    vi.mocked(tasksApi.write).mockImplementation(
      () =>
        new Promise((_, fail) => {
          reject = fail
        })
    )
    const client = createTestQueryClient()
    client.setQueryData(taskKeys.list(), [task])
    const screen = await renderWithQuery(<Harness />, client)
    await userEvent.click(screen.getByRole('button', { name: 'Change label' }))
    await expect
      .element(screen.getByText('bug', { exact: true }))
      .toBeInTheDocument()
    expect(client.getQueryData(taskKeys.list())).toEqual([task])

    reject(new Error('Write failed'))
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Write failed')
    await expect
      .element(screen.getByText('feature', { exact: true }))
      .toBeInTheDocument()
    client.clear()
  })

  it('reconciles only the tasks list after concurrent writes', async () => {
    const client = createTestQueryClient()
    client.setQueryData(taskKeys.list(), [task])
    client.setQueryData(['users', 'list'], ['unchanged'])
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const resolvers: Array<(tasks: Task[]) => void> = []
    vi.mocked(tasksApi.write).mockImplementation(
      () => new Promise((resolve) => resolvers.push(resolve))
    )
    const first = client
      .getMutationCache()
      .build(client, taskWriteOptions(client))
    const second = client
      .getMutationCache()
      .build(client, taskWriteOptions(client))
    const a = first.execute({
      type: 'create',
      values: { ...task, title: 'First' },
    })
    const b = second.execute({
      type: 'create',
      values: { ...task, title: 'Second' },
    })
    await vi.waitFor(() => expect(resolvers).toHaveLength(2))
    resolvers[0]([{ ...task, id: 'first', title: 'First' }])
    resolvers[1]([{ ...task, id: 'second', title: 'Second' }])
    await Promise.all([a, b])

    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenNthCalledWith(1, { queryKey: taskKeys.list() })
    expect(invalidate).toHaveBeenNthCalledWith(2, { queryKey: taskKeys.list() })
    expect(
      client.getQueryData<Task[]>(taskKeys.list())?.map((item) => item.id)
    ).toEqual(['second', 'first', task.id])
    expect(client.getQueryState(['users', 'list'])?.isInvalidated).toBe(false)
    client.clear()
  })
})
