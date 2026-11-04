import { useMemo } from 'react'
import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query'
import { type Task, type TaskWrite } from './schema'
import { tasksApi } from './tasks-api'

export const taskKeys = {
  all: ['tasks'] as const,
  list: () => [...taskKeys.all, 'list'] as const,
  writes: () => [...taskKeys.all, 'write'] as const,
}

// The service returns the whole collection. Filtering, sorting and pagination
// are client-side UI state, so they do not belong in this query key.
export const tasksQueryOptions = () =>
  queryOptions({
    queryKey: taskKeys.list(),
    queryFn: ({ signal }) => tasksApi.list(signal),
    staleTime: 30_000,
  })

export function taskWriteOptions(client: QueryClient) {
  return mutationOptions({
    mutationKey: taskKeys.writes(),
    mutationFn: (command: TaskWrite) => tasksApi.write(command),
    retry: false,
    onMutate: () => client.cancelQueries({ queryKey: taskKeys.list() }),
    onSuccess: (changed, command) => {
      client.setQueryData(tasksQueryOptions().queryKey, (previous) => {
        if (!previous) return undefined
        if (command.type === 'create') return [...changed, ...previous]
        if (command.type === 'delete') {
          return previous.filter((task) => !command.ids.includes(task.id))
        }
        return previous.map(
          (task) => changed.find((updated) => updated.id === task.id) ?? task
        )
      })
    },
    // Return the promise so pending feedback lasts through reconciliation.
    // Overlapping invalidations cancel earlier refetches; optimistic edits stay
    // visible independently of the confirmed cache until their writes settle.
    onSettled: () => client.invalidateQueries({ queryKey: taskKeys.list() }),
  })
}

export function useTaskWrite() {
  return useMutation(taskWriteOptions(useQueryClient()))
}

export function useOptimisticTasks(data: Task[] | undefined) {
  const pending = useMutationState({
    filters: { mutationKey: taskKeys.writes(), status: 'pending' },
    select: (mutation) => mutation.state.variables as TaskWrite,
  })

  // Optimistic edits are derived from pending mutations, never written into a
  // second store. A failed edit disappears automatically, revealing cached data.
  return useMemo(
    () =>
      data?.map((task) =>
        pending.reduce((current, command) => {
          if (command.type === 'update' && command.ids.includes(task.id)) {
            return { ...current, ...command.changes }
          }
          return current
        }, task)
      ),
    [data, pending]
  )
}
