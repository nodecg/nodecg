// Types
import { describe, test, expect } from 'vitest'
import type { Response } from 'express'

// Tested Module
import getMockRes from '../../../response/response.js'

describe('response - Provided (accepts arguments and returns expected values)', () => {
  test('allows custom properties', () => {
    interface User {
      id: string
      name: string
    }

    interface CustomResponse extends Response {
      user: User
    }

    const mockUser: User = {
      id: '123',
      name: 'Bob',
    }

    // default value is not provided, but is typed
    const { res: defaultRes } = getMockRes<CustomResponse>()
    expect(defaultRes.user).toBeUndefined()

    // allows setting a custom property
    const { res } = getMockRes<CustomResponse>({ sendDate: true, user: mockUser })

    // both properties are available
    expect(res.sendDate).toBe(true)
    expect(res.user).toBe(mockUser)
  })

  test('allows locals to be typed', () => {
    interface CustomResponse extends Response {
      locals: {
        sessionId?: string
        isPremiumUser?: boolean
      }
    }

    const { res } = getMockRes<CustomResponse>({
      locals: {
        sessionId: 'abcdef',
        isPremiumUser: false,
      },
    })

    expect(res.locals).toBeDefined()
    expect(res.locals.sessionId).toBe('abcdef')
    expect(res.locals.isPremiumUser).toBe(false)
  })
})
