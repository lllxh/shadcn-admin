import { getCookie, removeCookie, setCookie } from '@/lib/cookies'
import { createAuthModel } from './auth-model'

const ACCESS_TOKEN = 'thisisjustarandomstring'

function readAccessToken(): string {
  const cookie = getCookie(ACCESS_TOKEN)
  if (!cookie) return ''

  try {
    const value: unknown = JSON.parse(cookie)
    if (typeof value === 'string') return value
  } catch {
    // A malformed cookie should not prevent the application from starting.
  }

  removeCookie(ACCESS_TOKEN)
  return ''
}

export function createBrowserAuthModel() {
  const model = createAuthModel(readAccessToken())
  let persistedToken = model.store.state.accessToken
  const persistence = model.store.subscribe(({ accessToken }) => {
    if (accessToken === persistedToken) return

    if (accessToken) {
      setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
    } else {
      removeCookie(ACCESS_TOKEN)
    }
    persistedToken = accessToken
  })

  return { ...model, dispose: () => persistence.unsubscribe() }
}

// Browser application instance. The model itself has no browser or React imports.
const model = createBrowserAuthModel()
export const authUserStore = model.userStore
export const authActions = model.actions

if (import.meta.hot) {
  import.meta.hot.dispose(model.dispose)
}
