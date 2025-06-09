// Tested Module
import { describe, test, expect, Mock, vi } from 'vitest'
import getMockRes from '../../../response/response.js'

describe('response - Defaults for "event.EventEmitter" (accepts no arguments and return default values)', () => {
  test('res.addListener is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.addListener).toBeDefined()
    expect(typeof res.addListener).toBe('function')
    expect((res.addListener as Mock).getMockName()).toBe('addListener mock default')
  })

  test('res.addListener is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.addListener('test', vi.fn())).toBe(res)
  })

  test('res.on is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.on).toBeDefined()
    expect(typeof res.on).toBe('function')
    expect((res.on as Mock).getMockName()).toBe('on mock default')
  })

  test('res.on is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.on('test', vi.fn())).toBe(res)
  })

  test('res.once is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.once).toBeDefined()
    expect(typeof res.once).toBe('function')
    expect((res.once as Mock).getMockName()).toBe('once mock default')
  })

  test('res.once is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.once('test', vi.fn())).toBe(res)
  })

  test('res.removeListener is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.removeListener).toBeDefined()
    expect(typeof res.removeListener).toBe('function')
    expect((res.removeListener as Mock).getMockName()).toBe('removeListener mock default')
  })

  test('res.removeListener is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.removeListener('test', vi.fn())).toBe(res)
  })

  test('res.off is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.off).toBeDefined()
    expect(typeof res.off).toBe('function')
    expect((res.off as Mock).getMockName()).toBe('off mock default')
  })

  test('res.off is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.off('test', vi.fn())).toBe(res)
  })

  test('res.removeAllListeners is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.removeAllListeners).toBeDefined()
    expect(typeof res.removeAllListeners).toBe('function')
    expect((res.removeAllListeners as Mock).getMockName()).toBe('removeAllListeners mock default')
  })

  test('res.removeAllListeners is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.removeAllListeners('test')).toBe(res)
  })

  test('res.setMaxListeners is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.setMaxListeners).toBeDefined()
    expect(typeof res.setMaxListeners).toBe('function')
    expect((res.setMaxListeners as Mock).getMockName()).toBe('setMaxListeners mock default')
  })

  test('res.setMaxListeners is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.setMaxListeners(10)).toBe(res)
  })

  test('res.getMaxListeners is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.getMaxListeners).toBeDefined()
    expect(typeof res.getMaxListeners).toBe('function')
    expect((res.getMaxListeners as Mock).getMockName()).toBe('getMaxListeners mock default')
  })

  test('res.getMaxListeners is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.getMaxListeners()).toBeUndefined()
  })

  test('res.listeners is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.listeners).toBeDefined()
    expect(typeof res.listeners).toBe('function')
    expect((res.listeners as Mock).getMockName()).toBe('listeners mock default')
  })

  test('res.listeners is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.listeners('test')).toBeUndefined()
  })

  test('res.rawListeners is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.rawListeners).toBeDefined()
    expect(typeof res.rawListeners).toBe('function')
    expect((res.rawListeners as Mock).getMockName()).toBe('rawListeners mock default')
  })

  test('res.rawListeners is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.rawListeners('test')).toBeUndefined()
  })

  test('res.emit is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.emit).toBeDefined()
    expect(typeof res.emit).toBe('function')
    expect((res.emit as Mock).getMockName()).toBe('emit mock default')
  })

  test('res.emit is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.emit('test')).toBeUndefined()
  })

  test('res.listenerCount is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.listenerCount).toBeDefined()
    expect(typeof res.listenerCount).toBe('function')
    expect((res.listenerCount as Mock).getMockName()).toBe('listenerCount mock default')
  })

  test('res.listenerCount is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.listenerCount('test')).toBeUndefined()
  })

  test('res.prependListener is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.prependListener).toBeDefined()
    expect(typeof res.prependListener).toBe('function')
    expect((res.prependListener as Mock).getMockName()).toBe('prependListener mock default')
  })

  test('res.prependListener is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.prependListener('test', vi.fn())).toBe(res)
  })

  test('res.prependOnceListener is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.prependOnceListener).toBeDefined()
    expect(typeof res.prependOnceListener).toBe('function')
    expect((res.prependOnceListener as Mock).getMockName()).toBe('prependOnceListener mock default')
  })

  test('res.prependOnceListener is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.prependOnceListener('test', vi.fn())).toBe(res)
  })

  test('res.eventNames is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.eventNames).toBeDefined()
    expect(typeof res.eventNames).toBe('function')
    expect((res.eventNames as Mock).getMockName()).toBe('eventNames mock default')
  })

  test('res.eventNames is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.eventNames()).toBeUndefined()
  })
})
