// Helpers
import { describe, test, expect } from 'vitest'
import { providedBoolean, providedFunction, providedReq, providedSocket } from '../../helpers/provided.js'

// Tested Module
import getMockRes from '../../../response/response.js'

describe('response - Provided for "http.OutgoingMessage" (accepts arguments and returns expected values)', () => {
  test('res.req can be provided', () => {
    const { res } = getMockRes({ req: providedReq })

    expect(res.req).toBeDefined()
    expect(res.req).toBe(providedReq)
  })

  test('res.chunkedEncoding can be provided', () => {
    const { res } = getMockRes({ chunkedEncoding: providedBoolean })

    expect(res.chunkedEncoding).toBeDefined()
    expect(res.chunkedEncoding).toBe(providedBoolean)
  })

  test('res.shouldKeepAlive can be provided', () => {
    const { res } = getMockRes({ shouldKeepAlive: providedBoolean })

    expect(res.shouldKeepAlive).toBeDefined()
    expect(res.shouldKeepAlive).toBe(providedBoolean)
  })

  test('res.useChunkedEncodingByDefault can be provided', () => {
    const { res } = getMockRes({ useChunkedEncodingByDefault: providedBoolean })

    expect(res.useChunkedEncodingByDefault).toBeDefined()
    expect(res.useChunkedEncodingByDefault).toBe(providedBoolean)
  })

  test('res.sendDate can be provided', () => {
    const { res } = getMockRes({ sendDate: providedBoolean })

    expect(res.sendDate).toBeDefined()
    expect(res.sendDate).toBe(providedBoolean)
  })

  test('res.finished can be provided', () => {
    const { res } = getMockRes({ finished: providedBoolean })

    expect(res.finished).toBeDefined()
    expect(res.finished).toBe(providedBoolean)
  })

  test('res.headersSent can be provided', () => {
    const { res } = getMockRes({ headersSent: providedBoolean })

    expect(res.headersSent).toBeDefined()
    expect(res.headersSent).toBe(providedBoolean)
  })

  test('res.connection can be provided', () => {
    const { res } = getMockRes({ connection: providedSocket })

    expect(res.connection).toBeDefined()
    expect(res.connection).toBe(providedSocket)
  })

  test('res.socket can be provided', () => {
    const { res } = getMockRes({ socket: providedSocket })

    expect(res.socket).toBeDefined()
    expect(res.socket).toBe(providedSocket)
  })

  test('res.setTimeout can be provided', () => {
    const { res } = getMockRes({ setTimeout: providedFunction })

    expect(res.setTimeout).toBeDefined()
    expect(res.setTimeout).toBe(providedFunction)
  })

  test('res.setHeader can be provided', () => {
    const { res } = getMockRes({ setHeader: providedFunction })

    expect(res.setHeader).toBeDefined()
    expect(res.setHeader).toBe(providedFunction)
  })

  test('res.getHeader can be provided', () => {
    const { res } = getMockRes({ getHeader: providedFunction })

    expect(res.getHeader).toBeDefined()
    expect(res.getHeader).toBe(providedFunction)
  })

  test('res.getHeaders can be provided', () => {
    const { res } = getMockRes({ getHeaders: providedFunction })

    expect(res.getHeaders).toBeDefined()
    expect(res.getHeaders).toBe(providedFunction)
  })

  test('res.getHeaderNames can be provided', () => {
    const { res } = getMockRes({ getHeaderNames: providedFunction })

    expect(res.getHeaderNames).toBeDefined()
    expect(res.getHeaderNames).toBe(providedFunction)
  })

  test('res.hasHeader can be provided', () => {
    const { res } = getMockRes({ hasHeader: providedFunction })

    expect(res.hasHeader).toBeDefined()
    expect(res.hasHeader).toBe(providedFunction)
  })

  test('res.removeHeader can be provided', () => {
    const { res } = getMockRes({ removeHeader: providedFunction })

    expect(res.removeHeader).toBeDefined()
    expect(res.removeHeader).toBe(providedFunction)
  })

  test('res.addTrailers can be provided', () => {
    const { res } = getMockRes({ addTrailers: providedFunction })

    expect(res.addTrailers).toBeDefined()
    expect(res.addTrailers).toBe(providedFunction)
  })

  test('res.flushHeaders can be provided', () => {
    const { res } = getMockRes({ flushHeaders: providedFunction })

    expect(res.flushHeaders).toBeDefined()
    expect(res.flushHeaders).toBe(providedFunction)
  })
})
