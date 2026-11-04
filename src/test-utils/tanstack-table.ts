import { type ReactTable as Table } from '@tanstack/react-table'
import { vi } from 'vitest'
import { type DataTableFeatures } from '@/lib/table-features'

/**
 * Minimal TanStack Table mock for tests that only need selected row count and
 * `resetRowSelection` (e.g. multi-delete dialogs).
 */
export function createTableMock(rowCount = 2) {
  const rows = Array.from({ length: rowCount }, () => ({}))
  const resetRowSelection = vi.fn()
  const table = {
    getFilteredSelectedRowModel: () => ({ rows }),
    resetRowSelection,
  } as unknown as Table<DataTableFeatures, Record<string, unknown>>
  return { table, resetRowSelection }
}
