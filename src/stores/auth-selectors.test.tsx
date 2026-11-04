import { useSelector } from '@tanstack/react-store'
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { createAuthModel } from './auth-model'

describe('React auth selectors', () => {
  it('rerenders only when the selected slice changes', async () => {
    const { store, userStore, actions } = createAuthModel()
    const user = {
      accountNo: 'ACC-1',
      email: 'user@example.com',
      role: ['user'],
      exp: 1_700_000_000,
    }
    actions.setSession(user, 'token')

    const emailRender = vi.fn()
    const tokenRender = vi.fn()
    const emailHook = await renderHook(() => {
      emailRender()
      return useSelector(userStore, (currentUser) => currentUser?.email)
    })
    const tokenHook = await renderHook(() => {
      tokenRender()
      return useSelector(store, (state) => state.accessToken)
    })
    emailRender.mockClear()
    tokenRender.mockClear()

    await tokenHook.act(() => actions.setAccessToken('refreshed-token'))
    expect(tokenHook.result.current).toBe('refreshed-token')
    expect(tokenRender).toHaveBeenCalledOnce()
    expect(emailRender).not.toHaveBeenCalled()

    tokenRender.mockClear()
    await emailHook.act(() => actions.setUser({ ...user, role: ['admin'] }))
    expect(emailRender).not.toHaveBeenCalled()
    expect(tokenRender).not.toHaveBeenCalled()

    await emailHook.act(() =>
      actions.setUser({ ...user, email: 'updated@example.com' })
    )
    expect(emailHook.result.current).toBe('updated@example.com')
    expect(emailRender).toHaveBeenCalledOnce()
    expect(tokenRender).not.toHaveBeenCalled()

    await emailHook.unmount()
    emailRender.mockClear()
    await tokenHook.act(() => actions.setUser(null))
    expect(emailRender).not.toHaveBeenCalled()
  })
})
