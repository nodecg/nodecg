// Types
import type { Response } from 'express'
import type { MediaType, Request } from 'express-serve-static-core'

export const providedNumber = 123

export const providedBoolean = true

export const providedString = 'Provided String'

export const providedStringArray = ['One', 'Two', 'Three', 'Four']

export const providedFunction = vi.fn().mockName('Provided Mock Function')

export const providedObject = {
  one: {
    two: 'three',
  },
  four: ['five'],
}

export const providedApp: Partial<Response['app']> = {
  settings: {
    one: 'two',
  },
}

export const providedReq: Partial<Response['req']> = {
  path: 'value',
}

export const providedRes: Partial<Response> = {
  chunkedEncoding: true,
}

export const providedSocket: Partial<Response['socket']> = {
  connecting: true,
}

export const providedStringObject: { [key: string]: string | undefined } = {
  one: 'two',
  three: 'four',
}

export const providedParams: Request['params'] = {
  one: 'two',
  three: 'four',
}

export const providedMediaTypeArray: MediaType[] = [
  {
    value: 'value',
    quality: 1,
    type: 'type',
    subtype: 'subtype',
  },
]
