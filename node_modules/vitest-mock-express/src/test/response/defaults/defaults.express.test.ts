// Tested Module
import { describe, test, expect, Mock } from 'vitest'
import getMockRes from '../../../response/response.js'

describe('response - Defaults from "express.Express" (accepts no arguments and return default values)', () => {
  test('res.status is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.status).toBeDefined()
    expect(typeof res.status).toBe('function')
    expect((res.status as Mock).getMockName()).toBe('status mock default')
  })

  test('res.status is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.status(123)).toBe(res)
  })

  test('res.sendStatus is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.sendStatus).toBeDefined()
    expect(typeof res.sendStatus).toBe('function')
    expect((res.sendStatus as Mock).getMockName()).toBe('sendStatus mock default')
  })

  test('res.sendStatus is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.sendStatus(123)).toBe(res)
  })

  test('res.links is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.links).toBeDefined()
    expect(typeof res.links).toBe('function')
    expect((res.links as Mock).getMockName()).toBe('links mock default')
  })

  test('res.links is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.links(1)).toBe(res)
  })

  test('res.send is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.send).toBeDefined()
    expect(typeof res.send).toBe('function')
    expect((res.send as Mock).getMockName()).toBe('send mock default')
  })

  test('res.send is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.send()).toBe(res)
  })

  test('res.json is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.json).toBeDefined()
    expect(typeof res.json).toBe('function')
    expect((res.json as Mock).getMockName()).toBe('json mock default')
  })

  test('res.json is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.json()).toBe(res)
  })

  test('res.jsonp is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.jsonp).toBeDefined()
    expect(typeof res.jsonp).toBe('function')
    expect((res.jsonp as Mock).getMockName()).toBe('jsonp mock default')
  })

  test('res.jsonp is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.jsonp()).toBe(res)
  })

  test('res.sendFile is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.sendFile).toBeDefined()
    expect(typeof res.sendFile).toBe('function')
    expect((res.sendFile as Mock).getMockName()).toBe('sendFile mock default')
  })

  test('res.sendFile function is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.sendFile('test')).toBeUndefined()
  })

  test('res.sendfile is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.sendfile).toBeDefined()
    expect(typeof res.sendfile).toBe('function')
    expect((res.sendfile as Mock).getMockName()).toBe('sendfile mock default')
  })

  test('res.sendfile function is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.sendfile('test')).toBeUndefined()
  })

  test('res.download is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.download).toBeDefined()
    expect(typeof res.download).toBe('function')
    expect((res.download as Mock).getMockName()).toBe('download mock default')
  })

  test('res.download function is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.download('test')).toBeUndefined()
  })

  test('res.contentType is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.contentType).toBeDefined()
    expect(typeof res.contentType).toBe('function')
    expect((res.contentType as Mock).getMockName()).toBe('contentType mock default')
  })

  test('res.contentType is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.contentType('test')).toBe(res)
  })

  test('res.type is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.type).toBeDefined()
    expect(typeof res.type).toBe('function')
    expect((res.type as Mock).getMockName()).toBe('type mock default')
  })

  test('res.type is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.type('test')).toBe(res)
  })

  test('res.format is a mocked function ', () => {
    const { res } = getMockRes()

    expect(res.format).toBeDefined()
    expect(typeof res.format).toBe('function')
    expect((res.format as Mock).getMockName()).toBe('format mock default')
  })

  test('res.format is chainable', () => {
    const { res } = getMockRes()

    expect(res.format('test')).toBe(res)
  })

  test('res.attachment is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.attachment).toBeDefined()
    expect(typeof res.attachment).toBe('function')
    expect((res.attachment as Mock).getMockName()).toBe('attachment mock default')
  })

  test('res.attachment is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.attachment()).toBe(res)
  })

  test('res.set is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.set).toBeDefined()
    expect(typeof res.set).toBe('function')
    expect((res.set as Mock).getMockName()).toBe('set mock default')
  })

  test('res.set is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.set('test')).toBe(res)
  })

  test('res.header is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.header).toBeDefined()
    expect(typeof res.header).toBe('function')
    expect((res.header as Mock).getMockName()).toBe('header mock default')
  })

  test('res.header is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.header('test')).toBe(res)
  })

  test('res.headersSent is a boolean', () => {
    const { res } = getMockRes()

    expect(res.headersSent).toBeDefined()
    expect(res.headersSent).toBe(false)
  })

  test('res.get is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.get).toBeDefined()
    expect(typeof res.get).toBe('function')
    expect((res.get as Mock).getMockName()).toBe('get mock default')
  })

  test('res.get is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.get('test')).toBeUndefined()
  })

  test('res.clearCookie is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.clearCookie).toBeDefined()
    expect(typeof res.clearCookie).toBe('function')
    expect((res.clearCookie as Mock).getMockName()).toBe('clearCookie mock default')
  })

  test('res.clearCookie is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.clearCookie('test')).toBe(res)
  })

  test('res.cookie is a mocked function ', () => {
    const { res } = getMockRes()

    expect(res.cookie).toBeDefined()
    expect(typeof res.cookie).toBe('function')
    expect((res.cookie as Mock).getMockName()).toBe('cookie mock default')
  })

  test('res.cookie is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.cookie('test', 'test two')).toBe(res)
  })

  test('res.location is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.location).toBeDefined()
    expect(typeof res.location).toBe('function')
    expect((res.location as Mock).getMockName()).toBe('location mock default')
  })

  test('res.location is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.location('test')).toBe(res)
  })

  test('res.redirect is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.redirect).toBeDefined()
    expect(typeof res.redirect).toBe('function')
    expect((res.redirect as Mock).getMockName()).toBe('redirect mock default')
  })

  test('res.redirect is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.redirect('test')).toBeUndefined()
  })

  test('res.render is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.render).toBeDefined()
    expect(typeof res.render).toBe('function')
    expect((res.render as Mock).getMockName()).toBe('render mock default')
  })

  test('res.render is not chainable', () => {
    const { res } = getMockRes()

    // it does not return itself (is not chainable)
    expect(res.render('test')).toBeUndefined()
  })

  test('res.locals is an empty object', () => {
    const { res } = getMockRes()

    expect(res.locals).toBeDefined()
    expect(res.locals).toBeInstanceOf(Object)
    expect(Object.keys(res.locals).length).toBe(0)
  })

  test('res.charset is an empty string', () => {
    const { res } = getMockRes()

    expect(res.charset).toBeDefined()
    expect(res.charset).toBe('')
  })

  test('res.vary is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.vary).toBeDefined()
    expect(typeof res.vary).toBe('function')
    expect((res.vary as Mock).getMockName()).toBe('vary mock default')
  })

  test('res.vary is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.vary('test')).toBe(res)
  })

  test('res.app is an empty object', () => {
    const { res } = getMockRes()

    expect(res.app).toBeDefined()
    expect(res.app).toBeInstanceOf(Object)
    expect(Object.keys(res.app).length).toBe(0)
  })

  test('res.append is a mocked function', () => {
    const { res } = getMockRes()

    expect(res.append).toBeDefined()
    expect(typeof res.append).toBe('function')
    expect((res.append as Mock).getMockName()).toBe('append mock default')
  })

  test('res.append is chainable', () => {
    const { res } = getMockRes()

    // it returns itself (is chainable)
    expect(res.append('test')).toBe(res)
  })

  test('res.req is an empty object', () => {
    const { res } = getMockRes()

    expect(res.req).toBeDefined()
    expect(res.req).toBeInstanceOf(Object)
    expect(res.req).toEqual({})
  })
})
