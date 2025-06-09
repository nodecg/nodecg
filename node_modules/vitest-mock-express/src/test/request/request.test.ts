// Tested Module
import { describe, test, expect } from 'vitest'
import getMockReq from '../../request/request.js'

const DEFAULT_REQ_KEY_LENGTH = 80

describe('request - General', () => {
  test('it returns expected object', () => {
    const req = getMockReq()

    expect(req).toBeDefined()
    expect(req).toBeInstanceOf(Object)
    expect(Object.keys(req).length).toBe(DEFAULT_REQ_KEY_LENGTH)
  })
})
