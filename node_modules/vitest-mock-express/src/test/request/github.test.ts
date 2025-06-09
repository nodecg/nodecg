// Types
import { describe, test, expect } from 'vitest'
import type { Request } from 'express'

// Tested Module
import getMockReq from '../../request/request.js'

describe('request - GitHub Issues', () => {
  test('issue #6', () => {
    enum AppOS {
      Android = '1',
    }

    const req = getMockReq({
      query: {
        os: AppOS.Android,
        sellerId: '12345',
      },
      headers: {
        Authorization: 'valid-token',
      },
    })

    // req.query has the provided arguments
    expect(req.query).toBeDefined()
    expect(req.query).toBeInstanceOf(Object)
    expect(Object.keys(req.query).length).toBe(2)
    expect(req.query['os']).toBe(AppOS.Android)
    expect(req.query['sellerId']).toBe('12345')

    // req.headers has the provided arguments
    expect(req.headers).toBeDefined()
    expect(req.headers).toBeInstanceOf(Object)
    expect(Object.keys(req.headers).length).toBe(1)
    expect(req.headers['Authorization']).toBe('valid-token')
  })

  test('issue #27', () => {
    interface CustomRequest extends Request {
      locals: unknown
      customProperty: string
    }

    const req = getMockReq<CustomRequest>({
      locals: { var: 'hi there' },
      customProperty: 'value',
    })

    // req.locals has the provided arguments
    expect(req.locals).toBeDefined()
    expect(req.locals).toEqual({ var: 'hi there' })

    // req.customProperty has the provided arguments
    expect(req.customProperty).toBeDefined()
    expect(req.customProperty).toEqual('value')
  })
})
