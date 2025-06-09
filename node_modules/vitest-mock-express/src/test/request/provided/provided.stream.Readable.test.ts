// Helpers
import { describe, test, expect } from 'vitest'
import { providedBoolean, providedFunction, providedNumber } from '../../helpers/provided.js'

// Tested Module
import getMockReq from '../../../request/request.js'

describe('request - Provided for "stream.Readable" (accepts arguments and returns expected values)', () => {
  test('req.readable can be provided', () => {
    const req = getMockReq({ readable: providedBoolean })

    expect(req.readable).toBeDefined()
    expect(req.readable).toBe(providedBoolean)
  })

  test('req.readableHighWaterMark can be provided', () => {
    const req = getMockReq({ readableHighWaterMark: providedNumber })

    expect(req.readableHighWaterMark).toBeDefined()
    expect(req.readableHighWaterMark).toBe(providedNumber)
  })

  test('req.readableLength can be provided', () => {
    const req = getMockReq({ readableLength: providedNumber })

    expect(req.readableLength).toBeDefined()
    expect(req.readableLength).toBe(providedNumber)
  })

  test('req.readableObjectMode can be provided', () => {
    const req = getMockReq({ readableObjectMode: providedBoolean })

    expect(req.readableObjectMode).toBeDefined()
    expect(req.readableObjectMode).toBe(providedBoolean)
  })

  test('req.destroyed can be provided', () => {
    const req = getMockReq({ destroyed: providedBoolean })

    expect(req.destroyed).toBeDefined()
    expect(req.destroyed).toBe(providedBoolean)
  })

  test('req.constructor can be provided', () => {
    const req = getMockReq({ constructor: providedFunction })

    expect(req.constructor).toBeDefined()
    expect(req.constructor).toBe(providedFunction)
  })

  test('req._read can be provided', () => {
    const req = getMockReq({ _read: providedFunction })

    expect(req._read).toBeDefined()
    expect(req._read).toBe(providedFunction)
  })

  test('req.read can be provided', () => {
    const req = getMockReq({ read: providedFunction })

    expect(req.read).toBeDefined()
    expect(req.read).toBe(providedFunction)
  })

  test('req.setEncoding can be provided', () => {
    const req = getMockReq({ setEncoding: providedFunction })

    expect(req.setEncoding).toBeDefined()
    expect(req.setEncoding).toBe(providedFunction)
  })

  test('req.pause can be provided', () => {
    const req = getMockReq({ pause: providedFunction })

    expect(req.pause).toBeDefined()
    expect(req.pause).toBe(providedFunction)
  })

  test('req.resume can be provided', () => {
    const req = getMockReq({ resume: providedFunction })

    expect(req.resume).toBeDefined()
    expect(req.resume).toBe(providedFunction)
  })

  test('req.isPaused can be provided', () => {
    const req = getMockReq({ isPaused: providedFunction })

    expect(req.isPaused).toBeDefined()
    expect(req.isPaused).toBe(providedFunction)
  })

  test('req.unpipe can be provided', () => {
    const req = getMockReq({ unpipe: providedFunction })

    expect(req.unpipe).toBeDefined()
    expect(req.unpipe).toBe(providedFunction)
  })

  test('req.unshift can be provided', () => {
    const req = getMockReq({ unshift: providedFunction })

    expect(req.unshift).toBeDefined()
    expect(req.unshift).toBe(providedFunction)
  })

  test('req.wrap can be provided', () => {
    const req = getMockReq({ wrap: providedFunction })

    expect(req.wrap).toBeDefined()
    expect(req.wrap).toBe(providedFunction)
  })

  test('req.push can be provided', () => {
    const req = getMockReq({ push: providedFunction })

    expect(req.push).toBeDefined()
    expect(req.push).toBe(providedFunction)
  })

  test('req._destroy can be provided', () => {
    const req = getMockReq({ _destroy: providedFunction })

    expect(req._destroy).toBeDefined()
    expect(req._destroy).toBe(providedFunction)
  })

  test('req.addListener can be provided', () => {
    const req = getMockReq({ addListener: providedFunction })

    expect(req.addListener).toBeDefined()
    expect(req.addListener).toBe(providedFunction)
  })

  test('req.emit can be provided', () => {
    const req = getMockReq({ emit: providedFunction })

    expect(req.emit).toBeDefined()
    expect(req.emit).toBe(providedFunction)
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

  test('req.removeListener can be provided', () => {
    const req = getMockReq({ removeListener: providedFunction })

    expect(req.removeListener).toBeDefined()
    expect(req.removeListener).toBe(providedFunction)
  })

  test('req.destroy can be provided', () => {
    const req = getMockReq({ destroy: providedFunction })

    expect(req.destroy).toBeDefined()
    expect(req.destroy).toBe(providedFunction)
  })
})
