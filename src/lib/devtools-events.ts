import { EventClient } from '@tanstack/devtools-event-client'
import { type useDirection } from '@/context/direction-provider'
import { type useFont } from '@/context/font-provider'
import { type useTheme } from '@/context/theme-provider'

export type RuntimeSnapshot = {
  theme: ReturnType<typeof useTheme>['theme']
  font: ReturnType<typeof useFont>['font']
  direction: ReturnType<typeof useDirection>['dir']
}

type RuntimeEvents = {
  'state-request': undefined
  'state-update': RuntimeSnapshot
}

export const runtimeEvents = new EventClient<RuntimeEvents>({
  pluginId: 'shadcn-admin',
})
