import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { DatePicker } from './date-picker'

// biome-ignore lint/style/useComponentExportOnlyModules: This component is only a browser test harness.
function DatePickerHarness() {
  const [date, setDate] = useState<Date | undefined>(new Date(2024, 0, 15))
  return <DatePicker selected={date} onSelect={setDate} />
}

async function openDatePicker() {
  const screen = await render(<DatePickerHarness />)
  await userEvent.click(screen.getByRole('button', { name: 'Jan 15, 2024' }))
  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Choose the Year' }),
    '2024'
  )
  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Choose the Month' }),
    '0'
  )
  return screen
}

describe('DayPicker v10 integration', () => {
  it('renders the month grid and selects a date', async () => {
    const screen = await openDatePicker()

    await expect
      .element(screen.getByRole('grid', { name: 'January 2024' }))
      .toHaveClass('w-full', 'border-collapse')
    await userEvent.click(
      screen.getByRole('button', { name: 'Saturday, January 20th, 2024' })
    )

    await expect
      .element(screen.getByRole('button', { name: 'Jan 20, 2024' }))
      .toBeInTheDocument()
  })

  it('navigates months without changing the selected date', async () => {
    const screen = await openDatePicker()
    await userEvent.click(
      screen.getByRole('button', { name: 'Go to the Next Month' })
    )

    await expect
      .element(screen.getByRole('grid', { name: 'February 2024' }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Jan 15, 2024' }))
      .toBeInTheDocument()
  })
})
