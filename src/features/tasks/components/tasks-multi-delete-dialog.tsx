import { type RowData } from '@tanstack/react-table'
import { type DataTableFeatures } from '@/lib/table-features'

;('use client')

import { useState } from 'react'
import { type ReactTable as Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useTaskWrite } from '../data/queries'
import { type Task } from '../data/schema'

type TaskMultiDeleteDialogProps<TData extends RowData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<DataTableFeatures, TData>
}

const CONFIRM_WORD = 'DELETE'

export function TasksMultiDeleteDialog<TData extends RowData>({
  open,
  onOpenChange,
  table,
}: TaskMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const mutation = useTaskWrite()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = () => {
    if (mutation.isPending) return
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Please type "${CONFIRM_WORD}" to confirm.`)
      return
    }

    mutation.mutate(
      {
        type: 'delete',
        ids: selectedRows.map((row) => (row.original as Task).id),
      },
      {
        onSuccess: () => {
          setValue('')
          table.resetRowSelection()
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) return
        setValue('')
        mutation.reset()
        onOpenChange(next)
      }}
      isLoading={mutation.isPending}
      form='tasks-multi-delete-form'
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete {selectedRows.length}{' '}
          {selectedRows.length > 1 ? 'tasks' : 'task'}
        </span>
      }
      desc={
        <form
          id='tasks-multi-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Are you sure you want to delete the selected tasks? <br />
            This action cannot be undone.
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>Confirm by typing "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${CONFIRM_WORD}" to confirm.`}
              autoFocus
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText={mutation.isPending ? 'Deleting…' : 'Delete'}
      destructive
    >
      {mutation.isError && (
        <Alert variant='destructive' role='alert'>
          <AlertDescription>{mutation.error.message}</AlertDescription>
        </Alert>
      )}
    </ConfirmDialog>
  )
}
