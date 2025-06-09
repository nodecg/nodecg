# Deque

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Deques are a generalization of stacks and queues (the name is pronounced "deck" and is short for "double-ended queue").
> -- [Python `collections`](https://docs.python.org/3/library/collections.html#collections.deque).

## Installation

```
npm install @blakeembrey/deque --save
```

## Usage

- `size` Returns the number of elements in the deque.
- `push(x)` Add `x` to right side of the deque.
- `pushLeft(x)` Add `x` to the left side of the deque.
- `clear()` Remove all elements from the deque leaving it with length 0.
- `extend(iterable)` Extend the right side of the deque by appending elements from iterable.
- `extendLeft(iterable)` Extend the left side of the deque by appending elements from iterable.
- `peek(i)` Return the element at index `i` in the deque.
- `indexOf(x, start?)` Return the position of `x` in the deque.
- `has(x)` Return a boolean indicating whether `x` is in the deque.
- `insert(i, x)` Insert `x` into the deque at position `i`.
- `pop()` Remove and return an element from the right side of the deque. If no elements are present, throws `RangeError`.
- `popLeft()` Return and return an element from the left side of the deque. If no elements are present, throws `RangeError`.
- `delete(i)` Delete the value at position `i`.
- `reverse()` Reverse the elements of the deque in-place.
- `rotate(n=1)` Rotate the deque `n` steps to the right.
- `entries()` Return an iterable of deque.
- `@@iterator()` Return an iterable of deque.

```js
import { Deque } from '@blakeembrey/deque'

const d = new Deque('ghi')

for (const value of d) {
  console.log(value.toUpperCase()) //=> G H I
}

d.push('j')
d.pushLeft('f')
d //=> Deque(['f', 'g', 'h', 'i', 'j'])

d.pop() //=> 'j'
d.popLeft() //=> 'f'

Array.from(d) //=> ['g', 'h', 'i']

d.peek(0) //=> 'g'
d.peek(-1) //=> 'i'

d.extend('jkl')
d //=> Deque(['g', 'h', 'i', 'j', 'k', 'l'])

d.rotate(1)
d //=> Deque(['l', 'g', 'h', 'i', 'j', 'k'])

d.rotate(-1)
d //=> Deque(['g', 'h', 'i', 'j', 'k', 'l'])

const d2 = new Deque(d)

d2 //=> Deque(['g', 'h', 'i', 'j', 'k', 'l'])
```

## TypeScript

This project uses [TypeScript](https://github.com/Microsoft/TypeScript) and publishes definitions on NPM.

## Reference

Circular array implementation originally based on [`denque`](https://github.com/Salakar/denque) with additional optimizations.

## License

Apache 2.0

[npm-image]: https://img.shields.io/npm/v/@blakeembrey/deque.svg?style=flat
[npm-url]: https://npmjs.org/package/@blakeembrey/deque
[downloads-image]: https://img.shields.io/npm/dm/@blakeembrey/deque.svg?style=flat
[downloads-url]: https://npmjs.org/package/@blakeembrey/deque
[travis-image]: https://img.shields.io/travis/blakeembrey/deque.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/deque
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/deque.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/deque?branch=master
