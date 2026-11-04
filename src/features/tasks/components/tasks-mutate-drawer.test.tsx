import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { type Task } from '../data/schema'
import { tasksApi } from '../data/tasks-api'
import { TasksMutateDrawer } from './tasks-mutate-drawer'
import { renderWithQuery as render } from '@/test-utils/query'

vi.mock('../data/tasks-api', () => ({ tasksApi: { write: vi.fn() } }))

const MOCK_TASK = {
  id: 'task-1',
  title: 'Existing task',
  status: 'in progress',
  label: 'feature',
  priority: 'medium',
} as const satisfies Task

describe('TasksMutateDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tasksApi.write).mockResolvedValue([MOCK_TASK])
  })

  it('renders create title and description', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /Create Task/i,
    })
    const desc = getByText(/Add a new task/i)

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
  })

  it('renders edit title, description, and prefilled title', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} currentRow={MOCK_TASK} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /Update Task/i,
    })
    const desc = getByText(/Update the task/i)

    const titleInput = getByRole('textbox', { name: /Title/i })
    const statusSelect = getByRole('combobox', { name: /Status/i })
    const labelRadio = getByRole('radio', { name: 'Feature' })
    const priorityRadio = getByRole('radio', { name: 'Medium' })

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
    await expect.element(titleInput).toHaveValue(MOCK_TASK.title)
    await expect
      .element(statusSelect)
      .toMatchTextContent(new RegExp(MOCK_TASK.status, 'i'))
    await expect.element(labelRadio).toBeChecked()
    await expect.element(priorityRadio).toBeChecked()
  })

  it('shows validation messages when submitting an empty form', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} />
    )

    const saveButton = getByRole('button', { name: /Save changes/i })
    await userEvent.click(saveButton)

    await expect.element(getByText(/Title is required.$/i)).toBeInTheDocument()
    await expect
      .element(getByText(/Please select a status.$/i))
      .toBeInTheDocument()
    await expect
      .element(getByText(/Please select a label.$/i))
      .toBeInTheDocument()
    await expect
      .element(getByText(/Please choose a priority.$/i))
      .toBeInTheDocument()
  })

  it('creates a task and closes only after the write succeeds', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <TasksMutateDrawer open onOpenChange={onOpenChange} />
    )

    const titleInput = getByRole('textbox', { name: /Title/i })
    await userEvent.fill(titleInput, 'New task title')

    const statusSelect = getByRole('combobox', { name: /Status/i })
    await userEvent.click(statusSelect)
    await userEvent.click(getByRole('option', { name: /Todo/i }))

    await userEvent.click(getByRole('radio', { name: /^Bug$/i }))
    await userEvent.click(getByRole('radio', { name: /^Low$/i }))

    const saveButton = getByRole('button', { name: /Save changes/i })
    await userEvent.click(saveButton)

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledOnce())
    expect(onOpenChange).toHaveBeenCalledWith(false)

    expect(tasksApi.write).toHaveBeenCalledOnce()
    expect(tasksApi.write).toHaveBeenCalledWith({
      type: 'create',
      values: {
        title: 'New task title',
        status: 'todo',
        label: 'bug',
        priority: 'low',
      },
    })
  })

  it('keeps the edited values and dialog open after a failed save, then retries', async () => {
    vi.mocked(tasksApi.write).mockRejectedValueOnce(new Error('Save failed'))
    const onOpenChange = vi.fn()
    const screen = await render(
      <TasksMutateDrawer
        open
        onOpenChange={onOpenChange}
        currentRow={MOCK_TASK}
      />
    )
    const title = screen.getByRole('textbox', { name: 'Title' })
    await userEvent.fill(title, 'Updated title')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Save failed')
    await expect.element(title).toHaveValue('Updated title')
    expect(onOpenChange).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(tasksApi.write).toHaveBeenLastCalledWith({
      type: 'update',
      ids: [MOCK_TASK.id],
      changes: {
        title: 'Updated title',
        status: MOCK_TASK.status,
        label: MOCK_TASK.label,
        priority: MOCK_TASK.priority,
      },
    })
  })

  it('closes when Close is clicked', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <TasksMutateDrawer open onOpenChange={onOpenChange} />
    )

    const closeButtons = getByRole('dialog')
      .getByRole('button', {
        name: /Close/i,
      })
      .all()
    expect(closeButtons).toHaveLength(2)
    await userEvent.click(closeButtons[1])

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets entered values when the sheet is closed and reopened', async () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type='button' onClick={() => setOpen(true)}>
            Reopen
          </button>
          <TasksMutateDrawer open={open} onOpenChange={setOpen} />
        </>
      )
    }

    const { getByRole } = await render(<Harness />)

    const titleInput = getByRole('textbox', { name: /Title/i })
    await userEvent.fill(titleInput, 'Draft title')
    await expect.element(titleInput).toHaveValue('Draft title')

    const statusSelect = getByRole('combobox', { name: /Status/i })
    await userEvent.click(statusSelect)
    await userEvent.click(getByRole('option', { name: /Todo/i }))
    await expect.element(statusSelect).toMatchTextContent(/Todo/i)

    const labelRadio = getByRole('radio', { name: /^Documentation$/i })
    await userEvent.click(labelRadio)
    await expect.element(labelRadio).toBeChecked()

    const priorityRadio = getByRole('radio', { name: /^High$/i })
    await userEvent.click(priorityRadio)
    await expect.element(priorityRadio).toBeChecked()

    const closeButtons = getByRole('dialog')
      .getByRole('button', {
        name: /Close/i,
      })
      .all()
    await userEvent.click(closeButtons[0])

    const reopenButton = getByRole('button', { name: /Reopen/i })
    await userEvent.click(reopenButton)

    await expect.element(titleInput).toHaveValue('')
    await expect.element(statusSelect).not.toMatchTextContent(/Todo/i)
    await expect.element(labelRadio).not.toBeChecked()
    await expect.element(priorityRadio).not.toBeChecked()
  })
})
