// Types
import type { Request } from 'express'

// Local Types
import type { MockRequest } from './index.js'
import { vi } from 'vitest'

/**
 * Returns a mocked **Express** `Request` with mocked functions and default values.
 */
export const getMockReq = <T extends Request>(values: MockRequest = {}): T => {
  const {
    /* express.Request */
    params = {},
    query = {},
    body = {},
    cookies = {},
    method = '',
    protocol = '',
    secure = false,
    ip = '',
    ips = [],
    subdomains = [],
    path = '',
    hostname = '',
    host = '',
    fresh = false,
    stale = false,
    xhr = false,
    route = {},
    signedCookies = {},
    originalUrl = '',
    url = '',
    baseUrl = '',
    accepted = [],
    get = vi.fn().mockName('get mock default'),
    header = vi.fn().mockName('header mock default'),
    accepts = vi.fn().mockName('accepts mock default'),
    acceptsCharsets = vi.fn().mockName('acceptsCharsets mock default'),
    acceptsEncodings = vi.fn().mockName('acceptsEncodings mock default'),
    acceptsLanguages = vi.fn().mockName('acceptsLanguages mock default'),
    range = vi.fn().mockName('range mock default'),
    param = vi.fn().mockName('param mock default'),
    is = vi.fn().mockName('is mock default'),
    app = {},
    res = vi.fn().mockName('res mock default'),
    next = vi.fn().mockName('next mock default'),

    /* http.IncomingMessage */
    aborted = false,
    httpVersion = '',
    httpVersionMajor = 0,
    httpVersionMinor = 0,
    complete = false,
    connection = {},
    socket = {},
    headers = {},
    rawHeaders = [],
    trailers = {},
    rawTrailers = [],
    setTimeout = vi.fn().mockName('setTimeout mock default'),
    statusCode = 0,
    statusMessage = '',
    destroy = vi.fn().mockName('destroy mock default'),

    /* stream.Readable */
    readable = false,
    readableHighWaterMark = 0,
    readableLength = 0,
    readableObjectMode = false,
    destroyed = false,
    _read = vi.fn().mockName('_read mock default'),
    read = vi.fn().mockName('read mock default'),
    setEncoding = vi.fn().mockName('setEncoding mock default'),
    pause = vi.fn().mockName('pause mock default'),
    resume = vi.fn().mockName('resume mock default'),
    isPaused = vi.fn().mockName('isPaused mock default'),
    unpipe = vi.fn().mockName('unpipe mock default'),
    unshift = vi.fn().mockName('unshift mock default'),
    wrap = vi.fn().mockName('wrap mock default'),
    push = vi.fn().mockName('push mock default'),
    _destroy = vi.fn().mockName('_destroy mock default'),
    addListener = vi.fn().mockName('addListener mock default'),
    emit = vi.fn().mockName('emit mock default'),
    on = vi.fn().mockName('on mock default'),
    once = vi.fn().mockName('once mock default'),
    prependListener = vi.fn().mockName('prependListener mock default'),
    prependOnceListener = vi.fn().mockName('prependOnceListener mock default'),
    removeListener = vi.fn().mockName('removeListener mock default'),
    // destroy - is handled/overridden as part of http.IncomingMessage

    /* event.EventEmitter */
    // addListener - is handled/overridden as part of stream.Readable
    // on - is handled/overridden as part of stream.Readable
    // once - is handled/overridden as part of stream.Readable
    // removeListener - is handled/overridden as part of stream.Readable
    off = vi.fn().mockName('off mock default'),
    removeAllListeners = vi.fn().mockName('removeAllListeners mock default'),
    setMaxListeners = vi.fn().mockName('setMaxListeners mock default'),
    getMaxListeners = vi.fn().mockName('getMaxListeners mock default'),
    listeners = vi.fn().mockName('listeners mock default'),
    rawListeners = vi.fn().mockName('rawListeners mock default'),
    // emit - is handled/overridden as part of stream.Readable
    listenerCount = vi.fn().mockName('listenerCount mock default'),
    // prependListener - is handled/overridden as part of stream.Readable
    // prependOnceListener - is handled/overridden as part of stream.Readable
    eventNames = vi.fn().mockName('eventNames mock default'),

    // custom values
    ...extraProvidedValues
  } = values

  const request = {
    /* express.Request */
    params,
    query,
    body,
    cookies,
    method,
    protocol,
    secure,
    ip,
    ips,
    subdomains,
    path,
    hostname,
    host,
    fresh,
    stale,
    xhr,
    route,
    signedCookies,
    originalUrl,
    url,
    baseUrl,
    accepted,
    get,
    header,
    accepts,
    acceptsCharsets,
    acceptsEncodings,
    acceptsLanguages,
    range,
    param,
    is,
    app,
    res,
    next,

    /* http.IncomingMessage */
    aborted,
    httpVersion,
    httpVersionMajor,
    httpVersionMinor,
    complete,
    connection,
    socket,
    headers,
    rawHeaders,
    trailers,
    rawTrailers,
    setTimeout,
    statusCode,
    statusMessage,
    destroy,

    /* stream.Readable */
    readable,
    readableHighWaterMark,
    readableLength,
    readableObjectMode,
    destroyed,
    _read,
    read,
    setEncoding,
    pause,
    resume,
    isPaused,
    unpipe,
    unshift,
    wrap,
    push,
    _destroy,
    addListener,
    emit,
    on,
    once,
    prependListener,
    prependOnceListener,
    removeListener,
    // destroy - is handled/overridden as part of http.IncomingMessage

    /* event.EventEmitter */
    // addListener - is handled/overridden as part of stream.Readable
    // on - is handled/overridden as part of stream.Readable
    // once - is handled/overridden as part of stream.Readable
    // removeListener - is handled/overridden as part of stream.Readable
    off,
    removeAllListeners,
    setMaxListeners,
    getMaxListeners,
    listeners,
    rawListeners,
    // emit - is handled/overridden as part of stream.Readable
    listenerCount,
    // prependListener - is handled/overridden as part of stream.Readable
    // prependOnceListener - is handled/overridden as part of stream.Readable
    eventNames,

    // custom values
    ...extraProvidedValues,
  }

  return request as unknown as T
}

export default getMockReq
