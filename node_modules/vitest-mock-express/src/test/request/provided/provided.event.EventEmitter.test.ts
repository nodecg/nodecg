// Helpers
import { describe, test, expect } from 'vitest'
import { providedFunction } from '../../helpers/provided.js'

// Tested Module
import getMockReq from '../../../request/request.js'

describe('request - Provided for "event.EventEmitter" (accepts arguments and returns expected values)', () => {
  test('req.addListener can be provided', () => {
    const req = getMockReq({ addListener: providedFunction })

    expect(req.addListener).toBeDefined()
    expect(req.addListener).toBe(providedFunction)
  })

  test('req.on can be provided', () => {
    const req = getMockReq({ on: providedFunction })

    expect(req.on).toBeDefined()
    expect(req.on).toBe(providedFunction)
  })

  test('req.once can be provided', () => {
    const req = getMockReq({ once: providedFunction })

    expect(req.once).toBeDefined()
    expect(req.once).toBe(providedFunction)
  })

  test('req.removeListener can be provided', () => {
    const req = getMockReq({ removeListener: providedFunction })

    expect(req.removeListener).toBeDefined()
    expect(req.removeListener).toBe(providedFunction)
  })

  test('req.off can be provided', () => {
    const req = getMockReq({ off: providedFunction })

    expect(req.off).toBeDefined()
    expect(req.off).toBe(providedFunction)
  })

  test('req.removeAllListeners can be provided', () => {
    const req = getMockReq({ removeAllListeners: providedFunction })

    expect(req.removeAllListeners).toBeDefined()
    expect(req.removeAllListeners).toBe(providedFunction)
  })

  test('req.setMaxListeners can be provided', () => {
    const req = getMockReq({ setMaxListeners: providedFunction })

    expect(req.setMaxListeners).toBeDefined()
    expect(req.setMaxListeners).toBe(providedFunction)
  })

  test('req.getMaxListeners can be provided', () => {
    const req = getMockReq({ getMaxListeners: providedFunction })

    expect(req.getMaxListeners).toBeDefined()
    expect(req.getMaxListeners).toBe(providedFunction)
  })

  test('req.listeners can be provided', () => {
    const req = getMockReq({ listeners: providedFunction })

    expect(req.listeners).toBeDefined()
    expect(req.listeners).toBe(providedFunction)
  })

  test('req.rawListeners can be provided', () => {
    const req = getMockReq({ rawListeners: providedFunction })

    expect(req.rawListeners).toBeDefined()
    expect(req.rawListeners).toBe(providedFunction)
  })

  test('req.emit can be provided', () => {
    const req = getMockReq({ emit: providedFunction })

    expect(req.emit).toBeDefined()
    expect(req.emit).toBe(providedFunction)
  })

  test('req.listenerCount can be provided', () => {
    const req = getMockReq({ listenerCount: providedFunction })

    expect(req.listenerCount).toBeDefined()
    expect(req.listenerCount).toBe(providedFunction)
  })

  test('req.prependListener can be provided', () => {
    const req = getMockReq({ prependListener: providedFunction })

    expect(req.prependListener).toBeDefined()
    expect(req.prependListener).toBe(providedFunction)
  })

  test('req.prependOnceListener can be provided', () => {
    const req = getMockReq({ prependOnceListener: providedFunction })

    expect(req.prependOnceListener).toBeDefined()
    expect(req.prependOnceListener).toBe(providedFunction)
  })

  test('req.eventNames can be provided', () => {
    const req = getMockReq({ eventNames: providedFunction })

    expect(req.eventNames).toBeDefined()
    expect(req.eventNames).toBe(providedFunction)
  })
})
