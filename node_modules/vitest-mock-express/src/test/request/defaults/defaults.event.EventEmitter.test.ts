// Tested Module
import { describe, test, expect, Mock } from 'vitest'
import getMockReq from '../../../request/request.js'

describe('request - Defaults from "event.EventEmitter" (accepts no arguments and return default values)', () => {
  test('req.addListener is a mocked function', () => {
    const req = getMockReq()

    expect(req.addListener).toBeDefined()
    expect(typeof req.addListener).toBe('function')
    expect((req.addListener as Mock).getMockName()).toBe('addListener mock default')
  })

  test('req.on is a mocked function', () => {
    const req = getMockReq()

    expect(req.on).toBeDefined()
    expect(typeof req.on).toBe('function')
    expect((req.on as Mock).getMockName()).toBe('on mock default')
  })

  test('req.once is a mocked function', () => {
    const req = getMockReq()

    expect(req.once).toBeDefined()
    expect(typeof req.once).toBe('function')
    expect((req.once as Mock).getMockName()).toBe('once mock default')
  })

  test('req.removeListener is a mocked function', () => {
    const req = getMockReq()

    expect(req.removeListener).toBeDefined()
    expect(typeof req.removeListener).toBe('function')
    expect((req.removeListener as Mock).getMockName()).toBe('removeListener mock default')
  })

  test('req.off is a mocked function', () => {
    const req = getMockReq()

    expect(req.off).toBeDefined()
    expect(typeof req.off).toBe('function')
    expect((req.off as Mock).getMockName()).toBe('off mock default')
  })

  test('req.removeAllListeners is a mocked function', () => {
    const req = getMockReq()

    expect(req.removeAllListeners).toBeDefined()
    expect(typeof req.removeAllListeners).toBe('function')
    expect((req.removeAllListeners as Mock).getMockName()).toBe('removeAllListeners mock default')
  })

  test('req.setMaxListeners is a mocked function', () => {
    const req = getMockReq()

    expect(req.setMaxListeners).toBeDefined()
    expect(typeof req.setMaxListeners).toBe('function')
    expect((req.setMaxListeners as Mock).getMockName()).toBe('setMaxListeners mock default')
  })

  test('req.getMaxListeners is a mocked function', () => {
    const req = getMockReq()

    expect(req.getMaxListeners).toBeDefined()
    expect(typeof req.getMaxListeners).toBe('function')
    expect((req.getMaxListeners as Mock).getMockName()).toBe('getMaxListeners mock default')
  })

  test('req.listeners is a mocked function', () => {
    const req = getMockReq()

    expect(req.listeners).toBeDefined()
    expect(typeof req.listeners).toBe('function')
    expect((req.listeners as Mock).getMockName()).toBe('listeners mock default')
  })

  test('req.rawListeners is a mocked function', () => {
    const req = getMockReq()

    expect(req.rawListeners).toBeDefined()
    expect(typeof req.rawListeners).toBe('function')
    expect((req.rawListeners as Mock).getMockName()).toBe('rawListeners mock default')
  })

  test('req.emit is a mocked function', () => {
    const req = getMockReq()

    expect(req.emit).toBeDefined()
    expect(typeof req.emit).toBe('function')
    expect((req.emit as Mock).getMockName()).toBe('emit mock default')
  })

  test('req.listenerCount is a mocked function', () => {
    const req = getMockReq()

    expect(req.listenerCount).toBeDefined()
    expect(typeof req.listenerCount).toBe('function')
    expect((req.listenerCount as Mock).getMockName()).toBe('listenerCount mock default')
  })

  test('req.prependListener is a mocked function', () => {
    const req = getMockReq()

    expect(req.prependListener).toBeDefined()
    expect(typeof req.prependListener).toBe('function')
    expect((req.prependListener as Mock).getMockName()).toBe('prependListener mock default')
  })

  test('req.prependOnceListener is a mocked function', () => {
    const req = getMockReq()

    expect(req.prependOnceListener).toBeDefined()
    expect(typeof req.prependOnceListener).toBe('function')
    expect((req.prependOnceListener as Mock).getMockName()).toBe('prependOnceListener mock default')
  })

  test('req.eventNames is a mocked function', () => {
    const req = getMockReq()

    expect(req.eventNames).toBeDefined()
    expect(typeof req.eventNames).toBe('function')
    expect((req.eventNames as Mock).getMockName()).toBe('eventNames mock default')
  })
})
