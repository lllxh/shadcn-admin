import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { type Task } from './data/schema'
import { Tasks } from './index'
import { renderWithQuery } from '@/test-utils/query'

vi.mock('@tanstack/react-router', async (original) => ({
  ...(await original<typeof import('@tanstack/react-router')>()),
  getRouteApi: () => ({ useSearch: () => ({}), useNavigate: () => vi.fn() }),
}))
vi.mock('@/components/layout/header', () => ({ Header: () => null }))

const STORAGE_KEY = 'shadcn-admin:demo-tasks:v1'
const task: Task = {
  id: 'TASK-1',
  title: 'Existing task',
  status: 'todo',
  label: 'feature',
  priority: 'low',
}

describe('Tasks workflow', () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, JSON.stringify([task])))
  afterEach(() => localStorage.removeItem(STORAGE_KEY))

  it('creates, edits and deletes tasks through the real table and demo service', async () => {
    const screen = await renderWithQuery(<Tasks />)
    await expect
      .element(screen.getByRole('row', { name: /TASK-1/ }))
      .toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Create', exact: true })
    )
    await userEvent.fill(
      screen.getByRole('textbox', { name: 'Title' }),
      'New task'
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }))
    await userEvent.click(
      screen.getByRole('option', { name: 'Todo', exact: true })
    )
    await userEvent.click(
      screen.getByRole('radio', { name: 'Bug', exact: true })
    )
    await userEvent.click(
      screen.getByRole('radio', { name: 'Low', exact: true })
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('row', { name: /New task/ }))
      .toBeInTheDocument()

    await userEvent.click(
      screen
        .getByRole('row', { name: /TASK-1/ })
        .getByRole('button', { name: 'Open menu' })
    )
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Edit', exact: true })
    )
    await userEvent.fill(
      screen.getByRole('textbox', { name: 'Title' }),
      'Updated task'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('row', { name: /Updated task/ }))
      .toBeInTheDocument()

    await userEvent.click(
      screen
        .getByRole('row', { name: /TASK-1/ })
        .getByRole('button', { name: 'Open menu' })
    )
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await userEvent.click(
      screen
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Delete', exact: true })
    )
    await expect
      .element(screen.getByRole('alertdialog'))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('row', { name: /TASK-1/ }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('row', { name: /New task/ }))
      .toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([
      expect.objectContaining({ title: 'New task' }),
    ])
  })
})
