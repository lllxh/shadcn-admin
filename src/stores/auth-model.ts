import { batch, createStore } from '@tanstack/store'

export interface AuthUser {
  readonly accountNo: string
  readonly email: string
  readonly role: readonly string[]
  readonly exp: number
}

interface AuthState {
  readonly user: AuthUser | null
  readonly accessToken: string
}

// Create one model per application (or per request when rendering on a server).
export function createAuthModel(accessToken = '') {
  const store = createStore<AuthState>({ user: null, accessToken })
  const userStore = createStore(() => store.state.user)

  const actions = {
    setUser(user: AuthUser | null) {
      store.setState((state) =>
        state.user === user ? state : { ...state, user }
      )
    },
    setAccessToken(accessToken: string) {
      store.setState((state) =>
        state.accessToken === accessToken ? state : { ...state, accessToken }
      )
    },
    resetAccessToken() {
      actions.setAccessToken('')
    },
    setSession(user: AuthUser, accessToken: string) {
      batch(() => {
        actions.setUser(user)
        actions.setAccessToken(accessToken)
      })
    },
    reset() {
      batch(() => {
        actions.setUser(null)
        actions.resetAccessToken()
      })
    },
  }

  return { store, userStore, actions }
}
