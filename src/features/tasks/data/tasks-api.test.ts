import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type TaskInput } from './schema'
import { tasksApi } from './tasks-api'

const STORAGE_KEY = 'shadcn-admin:demo-tasks:v1'
const values: TaskInput = {
  title: 'New task',
  status: 'todo',
  label: 'feature',
  priority: 'low',
}

describe('Tasks demo service', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.removeItem(STORAGE_KEY)
  })

  it('seeds unique records, persists CRUD and supports an empty collection', async () => {
    const initial = tasksApi.list()
    await vi.runAllTimersAsync()
    const seeded = await initial
    expect(new Set(seeded.map((task) => task.id)).size).toBe(seeded.length)

    const create = tasksApi.write({ type: 'create', values })
    await vi.runAllTimersAsync()
    const [created] = await create
    expect(created).toMatchObject(values)

    const update = tasksApi.write({
      type: 'update',
      ids: [created.id],
      changes: { title: 'Saved title' },
    })
    await vi.runAllTimersAsync()
    expect(await update).toEqual([{ ...created, title: 'Saved title' }])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0].title).toBe(
      'Saved title'
    )

    const deletion = tasksApi.write({
      type: 'delete',
      ids: [created.id, ...seeded.map((task) => task.id)],
    })
    await vi.runAllTimersAsync()
    await deletion
    const empty = tasksApi.list()
    await vi.runAllTimersAsync()
    expect(await empty).toEqual([])
  })

  it('does not overwrite simultaneous creates', async () => {
    const writes = Promise.all([
      tasksApi.write({ type: 'create', values: { ...values, title: 'First' } }),
      tasksApi.write({
        type: 'create',
        values: { ...values, title: 'Second' },
      }),
    ])
    await vi.runAllTimersAsync()
    await writes
    const list = tasksApi.list()
    await vi.runAllTimersAsync()
    expect((await list).slice(0, 2).map((task) => task.title)).toEqual([
      'Second',
      'First',
    ])
  })

  it('aborts reads and rejects invalid bulk writes without changing persistence', async () => {
    const controller = new AbortController()
    const read = tasksApi.list(controller.signal)
    const aborted = expect(read).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await aborted

    const invalid = tasksApi.write({ type: 'delete', ids: ['missing'] })
    const rejected = expect(invalid).rejects.toThrow('no longer exists')
    await vi.runAllTimersAsync()
    await rejected
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
