// Helpers
import { describe, test, expect } from 'vitest'
import { callAllFunctions } from '../helpers/response.js'

// Tested Module
import getMockRes from '../../response/response.js'

export const DEFAULT_RES_KEY_LENGTH = 84

describe('response - General', () => {
  test('the mock res is provided and contains the expected functions', () => {
    const { res } = getMockRes()

    // res contains the expected functions
    expect(res).toBeDefined()
    expect(Object.keys(res).length).toBe(DEFAULT_RES_KEY_LENGTH)
  })
})

describe('response - returns the expected object', () => {
  test('it contains the correct amount of properties', () => {
    const mockRes = getMockRes()

    // the response contains values for res and next and clear functions
    expect(mockRes).toBeInstanceOf(Object)
    expect(Object.keys(mockRes).length).toBe(4)
  })

  test('the res object is provided', () => {
    const { res } = getMockRes()

    expect(res).toBeDefined()
    expect(res).toBeInstanceOf(Object)
  })

  test('the mock next function is provided', () => {
    const { next } = getMockRes()

    expect(next).toBeDefined()
    expect(typeof next).toBe('function')
  })

  test('the mock next function can be called', () => {
    const { next } = getMockRes()

    next()

    expect(next).toBeCalledTimes(1)
  })

  test('the mock clear function is provided', () => {
    const { mockClear } = getMockRes()

    expect(mockClear).toBeDefined()
    expect(typeof mockClear).toBe('function')
  })

  test('the mock clear alias function is provided', () => {
    const { clearMockRes } = getMockRes()

    expect(clearMockRes).toBeDefined()
    expect(typeof clearMockRes).toBe('function')
  })
})

describe('response - the mock functions can be cleared', () => {
  test('mock clear clears all mocks', () => {
    const { res, next, mockClear } = getMockRes()

    // call all of the mock functions
    next()
    callAllFunctions(res)

    // ensure they all report as being called

    /* express.Response */
    expect(next).toBeCalledTimes(1)
    expect(res.status).toBeCalledTimes(1)
    expect(res.sendStatus).toBeCalledTimes(1)
    expect(res.links).toBeCalledTimes(1)
    expect(res.send).toBeCalledTimes(1)
    expect(res.json).toBeCalledTimes(1)
    expect(res.jsonp).toBeCalledTimes(1)
    expect(res.sendFile).toBeCalledTimes(1)
    expect(res.sendfile).toBeCalledTimes(1)
    expect(res.download).toBeCalledTimes(1)
    expect(res.contentType).toBeCalledTimes(1)
    expect(res.type).toBeCalledTimes(1)
    expect(res.format).toBeCalledTimes(1)
    expect(res.attachment).toBeCalledTimes(1)
    expect(res.set).toBeCalledTimes(1)
    expect(res.header).toBeCalledTimes(1)
    expect(res.get).toBeCalledTimes(1)
    expect(res.clearCookie).toBeCalledTimes(1)
    expect(res.cookie).toBeCalledTimes(1)
    expect(res.location).toBeCalledTimes(1)
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.render).toBeCalledTimes(1)
    expect(res.vary).toBeCalledTimes(1)
    expect(res.append).toBeCalledTimes(1)

    /* http. ServerResponse */
    expect(res.assignSocket).toBeCalledTimes(1)
    expect(res.detachSocket).toBeCalledTimes(1)
    expect(res.writeContinue).toBeCalledTimes(1)
    expect(res.writeHead).toBeCalledTimes(1)
    expect(res.writeProcessing).toBeCalledTimes(1)

    /* http.OutgoingMessage */
    expect(res.setTimeout).toBeCalledTimes(1)
    expect(res.setHeader).toBeCalledTimes(1)
    expect(res.getHeader).toBeCalledTimes(1)
    expect(res.getHeaders).toBeCalledTimes(1)
    expect(res.getHeaderNames).toBeCalledTimes(1)
    expect(res.hasHeader).toBeCalledTimes(1)
    expect(res.removeHeader).toBeCalledTimes(1)
    expect(res.addTrailers).toBeCalledTimes(1)
    expect(res.flushHeaders).toBeCalledTimes(1)

    /* stream.Writable */
    expect(res._write).toBeCalledTimes(1)
    expect(res._writev).toBeCalledTimes(1)
    expect(res._destroy).toBeCalledTimes(1)
    expect(res._final).toBeCalledTimes(1)
    expect(res.write).toBeCalledTimes(1)
    expect(res.setDefaultEncoding).toBeCalledTimes(1)
    expect(res.end).toBeCalledTimes(1)
    expect(res.cork).toBeCalledTimes(1)
    expect(res.uncork).toBeCalledTimes(1)
    expect(res.destroy).toBeCalledTimes(1)
    expect(res.addListener).toBeCalledTimes(1)
    expect(res.emit).toBeCalledTimes(1)
    expect(res.on).toBeCalledTimes(1)
    expect(res.once).toBeCalledTimes(1)
    expect(res.prependListener).toBeCalledTimes(1)
    expect(res.prependOnceListener).toBeCalledTimes(1)
    expect(res.removeListener).toBeCalledTimes(1)

    /* event.EventEmitter */
    expect(res.addListener).toBeCalledTimes(1)
    expect(res.on).toBeCalledTimes(1)
    expect(res.once).toBeCalledTimes(1)
    expect(res.removeListener).toBeCalledTimes(1)
    expect(res.off).toBeCalledTimes(1)
    expect(res.removeAllListeners).toBeCalledTimes(1)
    expect(res.setMaxListeners).toBeCalledTimes(1)
    expect(res.getMaxListeners).toBeCalledTimes(1)
    expect(res.listeners).toBeCalledTimes(1)
    expect(res.rawListeners).toBeCalledTimes(1)
    expect(res.emit).toBeCalledTimes(1)
    expect(res.listenerCount).toBeCalledTimes(1)
    expect(res.prependListener).toBeCalledTimes(1)
    expect(res.prependOnceListener).toBeCalledTimes(1)
    expect(res.eventNames).toBeCalledTimes(1)

    // clear the mock
    mockClear()

    // ensure they all have been cleared

    /* express.Response */
    expect(next).not.toBeCalled()
    expect(next).not.toBeCalled()
    expect(res.status).not.toBeCalled()
    expect(res.sendStatus).not.toBeCalled()
    expect(res.links).not.toBeCalled()
    expect(res.send).not.toBeCalled()
    expect(res.json).not.toBeCalled()
    expect(res.jsonp).not.toBeCalled()
    expect(res.sendFile).not.toBeCalled()
    expect(res.sendfile).not.toBeCalled()
    expect(res.download).not.toBeCalled()
    expect(res.contentType).not.toBeCalled()
    expect(res.type).not.toBeCalled()
    expect(res.format).not.toBeCalled()
    expect(res.attachment).not.toBeCalled()
    expect(res.set).not.toBeCalled()
    expect(res.header).not.toBeCalled()
    expect(res.get).not.toBeCalled()
    expect(res.clearCookie).not.toBeCalled()
    expect(res.cookie).not.toBeCalled()
    expect(res.location).not.toBeCalled()
    expect(res.redirect).not.toBeCalled()
    expect(res.render).not.toBeCalled()
    expect(res.vary).not.toBeCalled()
    expect(res.append).not.toBeCalled()

    /* http.ServerResponse */
    expect(res.assignSocket).not.toBeCalled()
    expect(res.detachSocket).not.toBeCalled()
    expect(res.writeContinue).not.toBeCalled()
    expect(res.writeHead).not.toBeCalled()
    expect(res.writeProcessing).not.toBeCalled()

    /* http.OutgoingMessage */
    expect(res.setTimeout).not.toBeCalled()
    expect(res.setHeader).not.toBeCalled()
    expect(res.getHeader).not.toBeCalled()
    expect(res.getHeaders).not.toBeCalled()
    expect(res.getHeaderNames).not.toBeCalled()
    expect(res.hasHeader).not.toBeCalled()
    expect(res.removeHeader).not.toBeCalled()
    expect(res.addTrailers).not.toBeCalled()
    expect(res.flushHeaders).not.toBeCalled()

    /* stream.Writable */
    expect(res._write).not.toBeCalled()
    expect(res._writev).not.toBeCalled()
    expect(res._destroy).not.toBeCalled()
    expect(res._final).not.toBeCalled()
    expect(res.write).not.toBeCalled()
    expect(res.setDefaultEncoding).not.toBeCalled()
    expect(res.end).not.toBeCalled()
    expect(res.cork).not.toBeCalled()
    expect(res.uncork).not.toBeCalled()
    expect(res.destroy).not.toBeCalled()
    expect(res.addListener).not.toBeCalled()
    expect(res.emit).not.toBeCalled()
    expect(res.on).not.toBeCalled()
    expect(res.once).not.toBeCalled()
    expect(res.prependListener).not.toBeCalled()
    expect(res.prependOnceListener).not.toBeCalled()
    expect(res.removeListener).not.toBeCalled()

    /* event.EventEmitter */
    expect(res.addListener).not.toBeCalled()
    expect(res.on).not.toBeCalled()
    expect(res.once).not.toBeCalled()
    expect(res.removeListener).not.toBeCalled()
    expect(res.off).not.toBeCalled()
    expect(res.removeAllListeners).not.toBeCalled()
    expect(res.setMaxListeners).not.toBeCalled()
    expect(res.getMaxListeners).not.toBeCalled()
    expect(res.listeners).not.toBeCalled()
    expect(res.rawListeners).not.toBeCalled()
    expect(res.emit).not.toBeCalled()
    expect(res.listenerCount).not.toBeCalled()
    expect(res.prependListener).not.toBeCalled()
    expect(res.prependOnceListener).not.toBeCalled()
    expect(res.eventNames).not.toBeCalled()
  })

  test('clearMockRes clears all mocks', () => {
    const { res, next, clearMockRes } = getMockRes()

    // call all of the mock functions
    next()
    callAllFunctions(res)

    // ensure they all report as being called

    /* express.Response */
    expect(next).toBeCalledTimes(1)
    expect(res.status).toBeCalledTimes(1)
    expect(res.sendStatus).toBeCalledTimes(1)
    expect(res.links).toBeCalledTimes(1)
    expect(res.send).toBeCalledTimes(1)
    expect(res.json).toBeCalledTimes(1)
    expect(res.jsonp).toBeCalledTimes(1)
    expect(res.sendFile).toBeCalledTimes(1)
    expect(res.sendfile).toBeCalledTimes(1)
    expect(res.download).toBeCalledTimes(1)
    expect(res.contentType).toBeCalledTimes(1)
    expect(res.type).toBeCalledTimes(1)
    expect(res.format).toBeCalledTimes(1)
    expect(res.attachment).toBeCalledTimes(1)
    expect(res.set).toBeCalledTimes(1)
    expect(res.header).toBeCalledTimes(1)
    expect(res.get).toBeCalledTimes(1)
    expect(res.clearCookie).toBeCalledTimes(1)
    expect(res.cookie).toBeCalledTimes(1)
    expect(res.location).toBeCalledTimes(1)
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.render).toBeCalledTimes(1)
    expect(res.vary).toBeCalledTimes(1)
    expect(res.append).toBeCalledTimes(1)

    /* http.ServerResponse */
    expect(res.assignSocket).toBeCalledTimes(1)
    expect(res.detachSocket).toBeCalledTimes(1)
    expect(res.writeContinue).toBeCalledTimes(1)
    expect(res.writeHead).toBeCalledTimes(1)
    expect(res.writeProcessing).toBeCalledTimes(1)

    /* http.OutgoingMessage */
    expect(res.setTimeout).toBeCalledTimes(1)
    expect(res.setHeader).toBeCalledTimes(1)
    expect(res.getHeader).toBeCalledTimes(1)
    expect(res.getHeaders).toBeCalledTimes(1)
    expect(res.getHeaderNames).toBeCalledTimes(1)
    expect(res.hasHeader).toBeCalledTimes(1)
    expect(res.removeHeader).toBeCalledTimes(1)
    expect(res.addTrailers).toBeCalledTimes(1)
    expect(res.flushHeaders).toBeCalledTimes(1)

    /* stream.Writable */
    expect(res._write).toBeCalledTimes(1)
    expect(res._writev).toBeCalledTimes(1)
    expect(res._destroy).toBeCalledTimes(1)
    expect(res._final).toBeCalledTimes(1)
    expect(res.write).toBeCalledTimes(1)
    expect(res.setDefaultEncoding).toBeCalledTimes(1)
    expect(res.end).toBeCalledTimes(1)
    expect(res.cork).toBeCalledTimes(1)
    expect(res.uncork).toBeCalledTimes(1)
    expect(res.destroy).toBeCalledTimes(1)
    expect(res.addListener).toBeCalledTimes(1)
    expect(res.emit).toBeCalledTimes(1)
    expect(res.on).toBeCalledTimes(1)
    expect(res.once).toBeCalledTimes(1)
    expect(res.prependListener).toBeCalledTimes(1)
    expect(res.prependOnceListener).toBeCalledTimes(1)
    expect(res.removeListener).toBeCalledTimes(1)

    /* event.EventEmitter */
    expect(res.addListener).toBeCalledTimes(1)
    expect(res.on).toBeCalledTimes(1)
    expect(res.once).toBeCalledTimes(1)
    expect(res.removeListener).toBeCalledTimes(1)
    expect(res.off).toBeCalledTimes(1)
    expect(res.removeAllListeners).toBeCalledTimes(1)
    expect(res.setMaxListeners).toBeCalledTimes(1)
    expect(res.getMaxListeners).toBeCalledTimes(1)
    expect(res.listeners).toBeCalledTimes(1)
    expect(res.rawListeners).toBeCalledTimes(1)
    expect(res.emit).toBeCalledTimes(1)
    expect(res.listenerCount).toBeCalledTimes(1)
    expect(res.prependListener).toBeCalledTimes(1)
    expect(res.prependOnceListener).toBeCalledTimes(1)
    expect(res.eventNames).toBeCalledTimes(1)

    // clear the mock
    clearMockRes()

    // ensure they all have been cleared

    /* express.Response */
    expect(next).not.toBeCalled()
    expect(next).not.toBeCalled()
    expect(res.status).not.toBeCalled()
    expect(res.sendStatus).not.toBeCalled()
    expect(res.links).not.toBeCalled()
    expect(res.send).not.toBeCalled()
    expect(res.json).not.toBeCalled()
    expect(res.jsonp).not.toBeCalled()
    expect(res.sendFile).not.toBeCalled()
    expect(res.sendfile).not.toBeCalled()
    expect(res.download).not.toBeCalled()
    expect(res.contentType).not.toBeCalled()
    expect(res.type).not.toBeCalled()
    expect(res.format).not.toBeCalled()
    expect(res.attachment).not.toBeCalled()
    expect(res.set).not.toBeCalled()
    expect(res.header).not.toBeCalled()
    expect(res.get).not.toBeCalled()
    expect(res.clearCookie).not.toBeCalled()
    expect(res.cookie).not.toBeCalled()
    expect(res.location).not.toBeCalled()
    expect(res.redirect).not.toBeCalled()
    expect(res.render).not.toBeCalled()
    expect(res.vary).not.toBeCalled()
    expect(res.append).not.toBeCalled()

    /* http.ServerResponse */
    expect(res.assignSocket).not.toBeCalled()
    expect(res.detachSocket).not.toBeCalled()
    expect(res.writeContinue).not.toBeCalled()
    expect(res.writeHead).not.toBeCalled()
    expect(res.writeProcessing).not.toBeCalled()

    /* http.OutgoingMessage */
    expect(res.setTimeout).not.toBeCalled()
    expect(res.setHeader).not.toBeCalled()
    expect(res.getHeader).not.toBeCalled()
    expect(res.getHeaders).not.toBeCalled()
    expect(res.getHeaderNames).not.toBeCalled()
    expect(res.hasHeader).not.toBeCalled()
    expect(res.removeHeader).not.toBeCalled()
    expect(res.addTrailers).not.toBeCalled()
    expect(res.flushHeaders).not.toBeCalled()

    /* stream.Writable */
    expect(res._write).not.toBeCalled()
    expect(res._writev).not.toBeCalled()
    expect(res._destroy).not.toBeCalled()
    expect(res._final).not.toBeCalled()
    expect(res.write).not.toBeCalled()
    expect(res.setDefaultEncoding).not.toBeCalled()
    expect(res.end).not.toBeCalled()
    expect(res.cork).not.toBeCalled()
    expect(res.uncork).not.toBeCalled()
    expect(res.destroy).not.toBeCalled()
    expect(res.addListener).not.toBeCalled()
    expect(res.emit).not.toBeCalled()
    expect(res.on).not.toBeCalled()
    expect(res.once).not.toBeCalled()
    expect(res.prependListener).not.toBeCalled()
    expect(res.prependOnceListener).not.toBeCalled()
    expect(res.removeListener).not.toBeCalled()

    /* event.EventEmitter */
    expect(res.addListener).not.toBeCalled()
    expect(res.on).not.toBeCalled()
    expect(res.once).not.toBeCalled()
    expect(res.removeListener).not.toBeCalled()
    expect(res.off).not.toBeCalled()
    expect(res.removeAllListeners).not.toBeCalled()
    expect(res.setMaxListeners).not.toBeCalled()
    expect(res.getMaxListeners).not.toBeCalled()
    expect(res.listeners).not.toBeCalled()
    expect(res.rawListeners).not.toBeCalled()
    expect(res.emit).not.toBeCalled()
    expect(res.listenerCount).not.toBeCalled()
    expect(res.prependListener).not.toBeCalled()
    expect(res.prependOnceListener).not.toBeCalled()
    expect(res.eventNames).not.toBeCalled()
  })
})
