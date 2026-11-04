import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { tasksQueryOptions, useOptimisticTasks } from '../data/queries'
import { TasksTable } from './tasks-table'

export function TasksList() {
  const query = useQuery(tasksQueryOptions())
  const tasks = useOptimisticTasks(query.data)

  if (tasks === undefined) {
    if (query.isError) {
      return (
        <Alert variant='destructive' role='alert'>
          <AlertTitle>Unable to load tasks</AlertTitle>
          <AlertDescription>
            <p>{query.error.message}</p>
            <Button variant='outline' onClick={() => void query.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )
    }
    return (
      <div role='status' aria-label='Loading tasks' className='grid gap-4'>
        <p className='text-sm text-muted-foreground'>
          {query.isPaused ? 'Offline. Waiting to reconnect.' : 'Loading tasks…'}
        </p>
        <Skeleton className='h-9 w-64' />
        <Skeleton className='h-80 w-full' />
      </div>
    )
  }

  return (
    <section
      aria-label='Task list'
      aria-busy={query.isFetching}
      className='flex flex-1 flex-col gap-4'
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p role='status' className='text-sm text-muted-foreground'>
          {query.isFetching
            ? 'Refreshing tasks…'
            : query.isPaused
              ? 'Offline. Showing saved tasks.'
              : query.isStale
                ? 'Showing saved tasks. Refresh for the latest.'
                : null}
        </p>
        <Button
          variant='outline'
          size='sm'
          disabled={query.isFetching || query.isPaused}
          onClick={() => void query.refetch()}
        >
          Refresh
        </Button>
      </div>
      {query.isError && (
        <Alert variant='destructive' role='alert'>
          <AlertTitle>Unable to refresh tasks</AlertTitle>
          <AlertDescription>
            Showing the last available data. {query.error.message}
          </AlertDescription>
        </Alert>
      )}
      {tasks.length === 0 ? (
        <p className='py-12 text-center text-muted-foreground'>
          No tasks yet. Create a task to get started.
        </p>
      ) : (
        <TasksTable data={tasks} />
      )}
    </section>
  )
}
