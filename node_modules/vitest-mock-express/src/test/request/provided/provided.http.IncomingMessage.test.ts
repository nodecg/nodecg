// Helpers
import { describe, test, expect } from 'vitest'
import {
  providedBoolean,
  providedFunction,
  providedNumber,
  providedParams,
  providedSocket,
  providedString,
  providedStringArray,
  providedStringObject,
} from '../../helpers/provided.js'

// Tested Module
import getMockReq from '../../../request/request.js'

describe('request - Provided for "http.IncomingMessage" (accepts arguments and returns expected values)', () => {
  test('req.aborted can be provided', () => {
    const req = getMockReq({ aborted: providedBoolean })

    expect(req.aborted).toBeDefined()
    expect(req.aborted).toBe(providedBoolean)
  })

  test('req.httpVersion can be provided', () => {
    const req = getMockReq({ httpVersion: providedString })

    expect(req.httpVersion).toBeDefined()
    expect(req.httpVersion).toBe(providedString)
  })

  test('req.httpVersionMajor can be provided', () => {
    const req = getMockReq({ httpVersionMajor: providedNumber })

    expect(req.httpVersionMajor).toBeDefined()
    expect(req.httpVersionMajor).toBe(providedNumber)
  })

  test('req.httpVersionMinor can be provided', () => {
    const req = getMockReq({ httpVersionMinor: providedNumber })

    expect(req.httpVersionMinor).toBeDefined()
    expect(req.httpVersionMinor).toBe(providedNumber)
  })

  test('req.complete can be provided', () => {
    const req = getMockReq({ complete: providedBoolean })

    expect(req.complete).toBeDefined()
    expect(req.complete).toBe(providedBoolean)
  })

  test('req.connection can be provided', () => {
    const req = getMockReq({ connection: providedSocket || undefined })

    expect(req.connection).toBeDefined()
    expect(req.connection).toBe(providedSocket)
  })

  test('req.socket can be provided', () => {
    const req = getMockReq({ socket: providedSocket || undefined })

    expect(req.socket).toBeDefined()
    expect(req.socket).toBe(providedSocket)
  })

  test('req.headers can be provided', () => {
    const req = getMockReq({ headers: providedParams })

    expect(req.headers).toBeDefined()
    expect(req.headers).toBe(providedParams)
  })

  test('req.rawHeaders can be provided', () => {
    const req = getMockReq({ rawHeaders: providedStringArray })

    expect(req.rawHeaders).toBeDefined()
    expect(req.rawHeaders).toBe(providedStringArray)
  })

  test('req.trailers can be provided', () => {
    const req = getMockReq({ trailers: providedStringObject })

    expect(req.trailers).toBeDefined()
    expect(req.trailers).toBe(providedStringObject)
  })

  test('req.rawTrailers can be provided', () => {
    const req = getMockReq({ rawTrailers: providedStringArray })

    expect(req.rawTrailers).toBeDefined()
    expect(req.rawTrailers).toBe(providedStringArray)
  })

  test('req.setTimeout can be provided', () => {
    const req = getMockReq({ setTimeout: providedFunction })

    expect(req.setTimeout).toBeDefined()
    expect(req.setTimeout).toBe(providedFunction)
  })

  test('req.statusCode can be provided', () => {
    const req = getMockReq({ statusCode: providedNumber })

    expect(req.statusCode).toBeDefined()
    expect(req.statusCode).toBe(providedNumber)
  })

  test('req.statusMessage can be provided', () => {
    const req = getMockReq({ statusMessage: providedString })

    expect(req.statusMessage).toBeDefined()
    expect(req.statusMessage).toBe(providedString)
  })

  test('req.destroy can be provided', () => {
    const req = getMockReq({ destroy: providedFunction })

    expect(req.destroy).toBeDefined()
    expect(req.destroy).toBe(providedFunction)
  })
})
