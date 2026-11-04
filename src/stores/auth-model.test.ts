import { describe, expect, it, vi } from 'vitest'
import { createAuthModel } from './auth-model'

const user = Object.freeze({
  accountNo: 'ACC-1',
  email: 'user@example.com',
  role: Object.freeze(['user']),
  exp: 1_700_000_000,
})

describe('createAuthModel', () => {
  it('creates isolated models without browser persistence', () => {
    const first = createAuthModel('initial-token')
    const second = createAuthModel()

    first.actions.setUser(user)

    expect(first.store.state).toEqual({ user, accessToken: 'initial-token' })
    expect(second.store.state).toEqual({ user: null, accessToken: '' })
  })

  it('replaces snapshots immutably and preserves unchanged slices', () => {
    const { store, actions } = createAuthModel()
    const initial = Object.freeze(store.state)
    actions.setUser(user)
    const signedIn = Object.freeze(store.state)
    actions.setAccessToken('token')

    expect(initial).toEqual({ user: null, accessToken: '' })
    expect(signedIn).toEqual({ user, accessToken: '' })
    expect(store.state).not.toBe(signedIn)
    expect(store.state.user).toBe(signedIn.user)
    expect(store.state.accessToken).toBe('token')
  })

  it('derives the current user and ignores token-only writes', () => {
    const { userStore, actions } = createAuthModel()
    const listener = vi.fn()
    const subscription = userStore.subscribe(listener)

    expect(userStore.state).toBeNull()
    actions.setSession(user, 'token')
    expect(userStore.state).toBe(user)
    expect(listener).toHaveBeenCalledExactlyOnceWith(user)

    listener.mockClear()
    actions.setAccessToken('refreshed-token')
    expect(listener).not.toHaveBeenCalled()

    actions.reset()
    expect(userStore.state).toBeNull()
    expect(listener).toHaveBeenCalledExactlyOnceWith(null)
    subscription.unsubscribe()
  })

  it('notifies subscribers once per session transition with the final state', () => {
    const { store, userStore, actions } = createAuthModel()
    const listener = vi.fn()
    const userListener = vi.fn(() => store.state)
    const subscription = store.subscribe(listener)
    const userSubscription = userStore.subscribe(userListener)

    actions.setSession(user, 'token')
    expect(listener).toHaveBeenCalledExactlyOnceWith({
      user,
      accessToken: 'token',
    })
    expect(userListener).toHaveReturnedWith({ user, accessToken: 'token' })

    listener.mockClear()
    userListener.mockClear()
    actions.reset()
    expect(listener).toHaveBeenCalledExactlyOnceWith({
      user: null,
      accessToken: '',
    })
    expect(userListener).toHaveReturnedWith({ user: null, accessToken: '' })

    subscription.unsubscribe()
    userSubscription.unsubscribe()
  })

  it('does not notify for unchanged values or after unsubscribing', () => {
    const { store, actions } = createAuthModel()
    const listener = vi.fn()
    const subscription = store.subscribe(listener)

    actions.reset()
    expect(listener).not.toHaveBeenCalled()
    subscription.unsubscribe()
    actions.setSession(user, 'token')
    expect(listener).not.toHaveBeenCalled()
  })
})
