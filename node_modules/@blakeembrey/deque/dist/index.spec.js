"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe('values', () => {
    it('should create an iterator of values', () => {
        const d = new index_1.Deque('abc');
        const values = Array.from(d);
        expect(values).toEqual(Array.from('abc'));
    });
    it('should support `Set`-like iterable methods', () => {
        const d = new index_1.Deque('abc');
        expect(Array.from(d.entries())).toEqual(Array.from('abc'));
        expect(Array.from(d.keys())).toEqual(Array.from('abc'));
        expect(Array.from(d.values())).toEqual(Array.from('abc'));
    });
});
describe('push', () => {
    it('should push a value on the right', () => {
        const d = new index_1.Deque();
        d.push('a');
        expect(Array.from(d)).toEqual(Array.from('a'));
        d.push('b');
        expect(Array.from(d)).toEqual(Array.from('ab'));
        d.push('c');
        expect(Array.from(d)).toEqual(Array.from('abc'));
    });
});
describe('pushLeft', () => {
    it('should push a value on the left', () => {
        const d = new index_1.Deque();
        d.pushLeft('a');
        expect(Array.from(d)).toEqual(Array.from('a'));
        d.pushLeft('b');
        expect(Array.from(d)).toEqual(Array.from('ba'));
        d.pushLeft('c');
        expect(Array.from(d)).toEqual(Array.from('cba'));
    });
});
describe('extend', () => {
    it('should extend to the right', () => {
        const d = new index_1.Deque('abc');
        d.extend('def');
        expect(Array.from(d)).toEqual(Array.from('abcdef'));
    });
});
describe('extendLeft', () => {
    it('should extend to the left', () => {
        const d = new index_1.Deque('def');
        d.extendLeft('cba');
        expect(Array.from(d)).toEqual(Array.from('abcdef'));
    });
});
describe('pop', () => {
    it('should pop right value', () => {
        const d = new index_1.Deque('abcde');
        expect(Array.from(d)).toEqual(['a', 'b', 'c', 'd', 'e']);
        expect(d.pop()).toEqual('e');
        expect(Array.from(d)).toEqual(['a', 'b', 'c', 'd']);
        expect(d.pop()).toEqual('d');
        expect(Array.from(d)).toEqual(['a', 'b', 'c']);
        expect(d.pop()).toEqual('c');
        expect(Array.from(d)).toEqual(['a', 'b']);
        expect(d.pop()).toEqual('b');
        expect(Array.from(d)).toEqual(['a']);
        expect(d.pop()).toEqual('a');
    });
    it('should not pop empty deque', () => {
        const d = new index_1.Deque();
        expect(() => d.pop()).toThrow(RangeError);
    });
});
describe('popLeft', () => {
    it('should pop left value', () => {
        const d = new index_1.Deque('abcde');
        expect(Array.from(d)).toEqual(['a', 'b', 'c', 'd', 'e']);
        expect(d.popLeft()).toEqual('a');
        expect(Array.from(d)).toEqual(['b', 'c', 'd', 'e']);
        expect(d.popLeft()).toEqual('b');
        expect(Array.from(d)).toEqual(['c', 'd', 'e']);
        expect(d.popLeft()).toEqual('c');
        expect(Array.from(d)).toEqual(['d', 'e']);
        expect(d.popLeft()).toEqual('d');
        expect(Array.from(d)).toEqual(['e']);
        expect(d.popLeft()).toEqual('e');
    });
    it('should not pop left empty deque', () => {
        const d = new index_1.Deque();
        expect(() => d.popLeft()).toThrow(RangeError);
    });
});
describe('peek', () => {
    it('should peek values', () => {
        const d = new index_1.Deque('abc');
        expect(d.peek(0)).toEqual('a');
        expect(d.peek(1)).toEqual('b');
        expect(d.peek(2)).toEqual('c');
        expect(d.peek(-1)).toEqual('c');
        expect(d.peek(-2)).toEqual('b');
        expect(d.peek(-3)).toEqual('a');
        expect(() => d.peek(3)).toThrow(RangeError);
        expect(() => d.peek(-4)).toThrow(RangeError);
    });
    it('should throw on non range', () => {
        const d = new index_1.Deque('abc');
        expect(() => d.peek('a')).toThrow(RangeError);
    });
    it('should throw on empty deque', () => {
        const d = new index_1.Deque();
        expect(() => d.peek(0)).toThrow(RangeError);
    });
});
describe('clear', () => {
    it('should clear a deque', () => {
        const d = new index_1.Deque('abc');
        expect(Array.from(d)).toEqual(Array.from('abc'));
        d.clear();
        expect(Array.from(d)).toEqual([]);
        expect(() => d.peek(0)).toThrow(RangeError);
    });
});
describe('indexOf', () => {
    it('should search for the position of a value', () => {
        const d = new index_1.Deque('abc');
        expect(d.indexOf('a')).toEqual(0);
        expect(d.indexOf('b')).toEqual(1);
        expect(d.indexOf('c')).toEqual(2);
        expect(d.indexOf('d')).toEqual(-1);
    });
    it('should search from offset', () => {
        const d = new index_1.Deque('abcdef');
        expect(d.indexOf('a', 2)).toEqual(-1);
        expect(d.indexOf('a', 1)).toEqual(-1);
        expect(d.indexOf('a', 0)).toEqual(0);
        expect(d.indexOf('b', 1)).toEqual(1);
        expect(d.indexOf('c', 2)).toEqual(2);
        expect(d.indexOf('d', 3)).toEqual(3);
        expect(d.indexOf('e', 4)).toEqual(4);
        expect(d.indexOf('f', 5)).toEqual(5);
        expect(d.indexOf('a', 6)).toEqual(-1);
        expect(d.indexOf('a', -1)).toEqual(-1);
        expect(d.indexOf('a', -5)).toEqual(-1);
        expect(d.indexOf('f', -1)).toEqual(5);
        expect(d.indexOf('a', -6)).toEqual(0);
        expect(d.indexOf('a', -10)).toEqual(0);
    });
});
describe('has', () => {
    it('should search for a value', () => {
        const d = new index_1.Deque('abc');
        expect(d.has('a')).toEqual(true);
        expect(d.has('b')).toEqual(true);
        expect(d.has('c')).toEqual(true);
        expect(d.has('d')).toEqual(false);
    });
});
describe('insert', () => {
    it('should insert an element at position', () => {
        const d = new index_1.Deque();
        d.insert(0, 'b');
        d.insert(1, 'd');
        d.insert(1, 'c');
        d.insert(0, 'a');
        expect(Array.from(d)).toEqual(Array.from('abcd'));
    });
    it('should insert at the tail each time', () => {
        const d = new index_1.Deque();
        d.insert(0, 'a');
        d.insert(1, 'b');
        d.insert(2, 'c');
        d.insert(3, 'd');
        d.insert(4, 'e');
        expect(Array.from(d)).toEqual(Array.from('abcde'));
    });
});
describe('delete', () => {
    it('should delete value at index', () => {
        const d = new index_1.Deque('abc');
        d.delete(1);
        expect(Array.from(d)).toEqual(Array.from('ac'));
        expect(() => d.delete(-1)).toThrowError(RangeError);
        d.delete(0);
        expect(Array.from(d)).toEqual(Array.from('c'));
        expect(() => d.delete(1)).toThrowError(RangeError);
        d.delete(0);
        expect(Array.from(d)).toEqual([]);
        expect(() => d.delete(0)).toThrowError(RangeError);
    });
    it('should throw when deleting empty deque', () => {
        const d = new index_1.Deque();
        expect(() => d.delete(0)).toThrow(RangeError);
    });
});
describe('reverse', () => {
    it('should reverse a deque', () => {
        const d = new index_1.Deque('abcde');
        d.reverse();
        expect(Array.from(d)).toEqual(Array.from('edcba'));
    });
    it('should reverse an empty deque', () => {
        const d = new index_1.Deque();
        d.reverse();
        expect(Array.from(d)).toEqual([]);
    });
    it('should reverse a deque with one element', () => {
        const d = new index_1.Deque('a');
        d.reverse();
        expect(Array.from(d)).toEqual(['a']);
    });
    it('should reverse a rotated deque', () => {
        const d = new index_1.Deque('abcdefghi');
        d.rotate(5);
        expect(Array.from(d)).toEqual(Array.from('efghiabcd'));
        d.reverse();
        expect(Array.from(d)).toEqual(Array.from('dcbaihgfe'));
    });
});
describe('rotate', () => {
    it('should rotate a deque', () => {
        const d = new index_1.Deque('abcde');
        d.rotate(2);
        expect(Array.from(d)).toEqual(Array.from('deabc'));
        d.rotate(-3);
        expect(Array.from(d)).toEqual(Array.from('bcdea'));
        d.rotate(6);
        expect(Array.from(d)).toEqual(Array.from('abcde'));
    });
    it('should rotate on empty deque', () => {
        const d = new index_1.Deque();
        d.rotate();
        expect(Array.from(d)).toEqual([]);
    });
});
describe('size', () => {
    it('should give the deque size', () => {
        const d = new index_1.Deque('abcdef');
        expect(d.size).toEqual(6);
        d.rotate(3);
        expect(d.size).toEqual(6);
    });
});
describe('array resize', () => {
    it('should resize array as required', () => {
        const d = new index_1.Deque();
        d.extend('abcd');
        expect(d.pop()).toEqual('d');
        expect(d.pop()).toEqual('c');
        expect(d.pop()).toEqual('b');
        expect(d.pop()).toEqual('a');
        expect(() => d.pop()).toThrow(RangeError);
        d.extend('efgh');
        d.extend('ijkl');
        expect(d.popLeft()).toEqual('e');
        expect(d.popLeft()).toEqual('f');
        expect(d.popLeft()).toEqual('g');
        expect(d.popLeft()).toEqual('h');
        expect(d.popLeft()).toEqual('i');
        expect(d.popLeft()).toEqual('j');
        expect(d.popLeft()).toEqual('k');
        expect(d.popLeft()).toEqual('l');
        expect(() => d.popLeft()).toThrow(RangeError);
    });
});
//# sourceMappingURL=index.spec.js.map