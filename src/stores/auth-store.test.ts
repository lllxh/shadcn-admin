import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getCookie, setCookie } from '@/lib/cookies'
import { createBrowserAuthModel } from './auth-store'
import { clearCookies } from '@/test-utils/cookies'

const models: ReturnType<typeof createBrowserAuthModel>[] = []

function createTestModel() {
  const model = createBrowserAuthModel()
  models.push(model)
  return { authStore: model.store, authActions: model.actions }
}

const sampleUser = {
  accountNo: 'ACC-1',
  email: 'user@example.com',
  role: ['user'],
  exp: 1_700_000_000,
}

describe('authStore persistence', () => {
  beforeEach(() => {
    clearCookies()
  })

  afterEach(() => {
    for (const model of models) model.dispose()
    models.length = 0
  })

  it('starts with an empty access token when nothing is persisted', async () => {
    const { authStore } = createTestModel()

    expect(authStore.state.accessToken).toBe('')
    expect(authStore.state.user).toBeNull()
  })

  it('persists access token so a new store instance reads it back', async () => {
    const { authActions } = createTestModel()
    authActions.setAccessToken('session-token')

    const { authStore: afterReload } = createTestModel()

    expect(afterReload.state.accessToken).toBe('session-token')
  })

  it('clears persisted access token when resetAccessToken is used', async () => {
    const { authActions } = createTestModel()
    authActions.setAccessToken('to-clear')
    authActions.resetAccessToken()

    const { authStore: afterReload } = createTestModel()

    expect(afterReload.state.accessToken).toBe('')
  })

  it('updates the signed-in user via setUser', async () => {
    const { authStore, authActions } = createTestModel()

    authActions.setUser({ ...sampleUser })

    expect(authStore.state.user).toEqual(sampleUser)
  })

  it('persists the completed session after a batched sign-in', async () => {
    const { authStore, authActions } = createTestModel()
    authActions.setSession(sampleUser, 'session-token')

    expect(authStore.state).toEqual({
      user: sampleUser,
      accessToken: 'session-token',
    })
    expect(getCookie('thisisjustarandomstring')).toBe('"session-token"')
  })

  it.each(['malformed', '123', 'null', '{}'])(
    'discards an invalid persisted token: %s',
    async (value) => {
      setCookie('thisisjustarandomstring', value)
      const { authStore } = createTestModel()

      expect(authStore.state.accessToken).toBe('')
      expect(getCookie('thisisjustarandomstring')).toBeUndefined()
    }
  )

  it('reset clears user and access token and drops persistence', async () => {
    const { authStore, authActions } = createTestModel()
    authActions.setAccessToken('will-be-cleared')
    authActions.setUser({ ...sampleUser })

    authActions.reset()

    expect(authStore.state.user).toBeNull()
    expect(authStore.state.accessToken).toBe('')

    const { authStore: afterReload } = createTestModel()

    expect(afterReload.state.user).toBeNull()
    expect(afterReload.state.accessToken).toBe('')
  })
})
