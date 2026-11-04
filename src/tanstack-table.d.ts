import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TFeatures, TData, TValue> {
    className?: string // apply to both th and td
    tdClassName?: string
    thClassName?: string
  }
}
