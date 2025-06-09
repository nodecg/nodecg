// Types
import type { IncomingMessage } from 'http'
import type { Readable } from 'stream'
import type { Request } from 'express-serve-static-core'

// Local Types
import type { EventEventEmitter } from '../index.js'
import type { Mock } from 'vitest'

interface StreamReadable extends EventEventEmitter {
  readable?: Readable['readable']
  readableHighWaterMark?: Readable['readableHighWaterMark']
  readableLength?: Readable['readableLength']
  readableObjectMode?: Readable['readableObjectMode']
  destroyed?: Readable['destroyed']
  _read?: Mock
  read?: Mock
  setEncoding?: Mock
  pause?: Mock
  resume?: Mock
  isPaused?: Mock
  unpipe?: Mock
  unshift?: Mock
  wrap?: Mock
  push?: Mock
  _destroy?: Mock
  addListener?: Mock
  emit?: Mock
  on?: Mock
  once?: Mock
  prependListener?: Mock
  prependOnceListener?: Mock
  removeListener?: Mock
  destroy?: Mock
}

interface HttpIncomingMessage extends StreamReadable {
  aborted?: IncomingMessage['aborted']
  httpVersion?: IncomingMessage['httpVersion']
  httpVersionMajor?: IncomingMessage['httpVersionMajor']
  httpVersionMinor?: IncomingMessage['httpVersionMinor']
  complete?: IncomingMessage['complete']
  connection?: Partial<IncomingMessage['connection']>
  socket?: Partial<IncomingMessage['socket']>
  headers?: Partial<IncomingMessage['headers']>
  rawHeaders?: IncomingMessage['rawHeaders']
  trailers?: IncomingMessage['trailers']
  rawTrailers?: IncomingMessage['rawTrailers']
  setTimeout?: Mock
  statusCode?: IncomingMessage['statusCode']
  statusMessage?: IncomingMessage['statusMessage']
  destroy?: Mock
}

export interface MockRequest extends HttpIncomingMessage {
  params?: Request['params']
  query?: Request['query']
  body?: Request['body']
  cookies?: Request['cookies']
  method?: Request['method']
  protocol?: Request['protocol']
  secure?: Request['secure']
  ip?: Request['ip']
  ips?: Request['ips']
  subdomains?: Request['subdomains']
  path?: Request['path']
  hostname?: Request['hostname']
  host?: Request['host']
  fresh?: Request['fresh']
  stale?: Request['stale']
  xhr?: Request['xhr']
  route?: Request['route']
  signedCookies?: Request['signedCookies']
  originalUrl?: Request['originalUrl']
  url?: Request['url']
  baseUrl?: Request['baseUrl']
  accepted?: Request['accepted']
  get?: Mock
  header?: Mock
  accepts?: Mock
  acceptsCharsets?: Mock
  acceptsEncodings?: Mock
  acceptsLanguages?: Mock
  range?: Mock
  param?: Mock
  is?: Mock
  app?: Partial<Request['app']>
  res?: Partial<Request['res']>
  next?: Mock

  // allow custom properties to be provided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
