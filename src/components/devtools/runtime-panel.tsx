import { useEffect, useState } from 'react'
import { type RuntimeSnapshot, runtimeEvents } from '@/lib/devtools-events'
import { useDirection } from '@/context/direction-provider'
import { useFont } from '@/context/font-provider'
import { useTheme } from '@/context/theme-provider'

export function RuntimeInspection() {
  const { theme } = useTheme()
  const { font } = useFont()
  const { dir } = useDirection()

  useEffect(() => {
    const publish = () => {
      runtimeEvents.emit('state-update', { theme, font, direction: dir })
    }

    const unsubscribe = runtimeEvents.on('state-request', publish)
    publish()
    return unsubscribe
  }, [theme, font, dir])

  return null
}

export function RuntimeDevtoolsPanel() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null)

  useEffect(() => {
    const unsubscribe = runtimeEvents.on('state-update', (event) => {
      setSnapshot(event.payload)
    })
    // Panels can mount after the application has already published its state.
    runtimeEvents.emit('state-request', undefined)
    return unsubscribe
  }, [])

  return (
    <section
      aria-label='Application runtime'
      className='h-full overflow-auto p-4'
    >
      {snapshot ? (
        <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm'>
          <dt>Theme</dt>
          <dd>{snapshot.theme}</dd>
          <dt>Font</dt>
          <dd>{snapshot.font}</dd>
          <dt>Direction</dt>
          <dd>{snapshot.direction}</dd>
        </dl>
      ) : (
        <p role='status'>Waiting for application state…</p>
      )}
    </section>
  )
}
