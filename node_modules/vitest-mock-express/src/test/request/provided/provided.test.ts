// Types
import { describe, test, expect } from 'vitest'
import type { Request } from 'express-serve-static-core'

// Tested Module
import getMockReq from '../../../request/request.js'

describe('request - Provided (accepts arguments and returns expected values)', () => {
  test('it allows custom properties', () => {
    interface User {
      id: string
      name: string
    }

    interface CustomRequest extends Request {
      user: User
    }

    const mockUser: User = {
      id: '123',
      name: 'Bob',
    }

    const req = getMockReq<CustomRequest>({
      user: mockUser,
      query: {
        id: '123',
        limit: '10',
        page: '2',
      },
    })

    // req.user has the provided arguments
    expect(req.user).toBeDefined()
    expect(req.user).toBe(mockUser)

    // req.query has the provided arguments
    expect(req.query).toBeDefined()
    expect(req.query).toBeInstanceOf(Object)
    expect(Object.keys(req.query).length).toBe(3)
    expect(req.query['id']).toBe('123')
    expect(req.query['limit']).toBe('10')
    expect(req.query['page']).toBe('2')
  })
})
