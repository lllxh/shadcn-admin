import {
  type Task,
  type TaskWrite,
  taskInputSchema,
  taskSchema,
} from './schema'
import { tasks as seedTasks } from './tasks'

// Demo service persistence, not a client-state store. Replace this module with
// HTTP calls when a backend contract is available; consumers only use Query.
const STORAGE_KEY = 'shadcn-admin:demo-tasks:v1'

async function waitForService(signal?: AbortSignal) {
  signal?.throwIfAborted()
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, 300)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
  if (!navigator.onLine) throw new Error('You are offline. Please reconnect.')
}

function readTasks(): Task[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) return taskSchema.array().parse(JSON.parse(saved))

  return taskSchema.array().parse(seedTasks)
}

export const tasksApi = {
  async list(signal?: AbortSignal): Promise<Task[]> {
    await waitForService(signal)
    const tasks = readTasks()
    signal?.throwIfAborted()
    return tasks
  },

  async write(command: TaskWrite): Promise<Task[]> {
    await waitForService()
    const tasks = readTasks()
    let next: Task[]
    let changed: Task[]

    if (command.type === 'create') {
      const task = {
        ...taskInputSchema.parse(command.values),
        id: `TASK-${crypto.randomUUID()}`,
      }
      changed = [task]
      next = [task, ...tasks]
    } else {
      const ids = new Set(command.ids)
      if (!ids.size || [...ids].some((id) => !tasks.some((t) => t.id === id))) {
        throw new Error(
          'A selected task no longer exists. Refresh and try again.'
        )
      }
      if (command.type === 'delete') {
        changed = []
        next = tasks.filter((task) => !ids.has(task.id))
      } else {
        const changes = taskInputSchema.partial().parse(command.changes)
        next = tasks.map((task) =>
          ids.has(task.id) ? { ...task, ...changes } : task
        )
        changed = next.filter((task) => ids.has(task.id))
      }
    }

    // Persist only after the whole command validates, including bulk writes.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return changed
  },
}
