function replace(source, find, repl) {
    let res = '';
    let rem = source;
    let beg = 0;
    let end = -1;
    while ((end = rem.indexOf(find)) > -1) {
        res += source.substring(beg, beg + end) + repl;
        rem = rem.substring(end + find.length, rem.length);
        beg += end + find.length;
    }
    if (rem.length > 0) {
        res += source.substring(source.length - rem.length, source.length);
    }
    return res;
}
function decodeFragmentSegments(segments) {
    let i = -1;
    const len = segments.length;
    const res = new Array(len);
    while (++i < len) {
        if (typeof segments[i] === 'string') {
            res[i] = replace(replace(decodeURIComponent(segments[i]), '~1', '/'), '~0', '~');
        }
        else {
            res[i] = segments[i];
        }
    }
    return res;
}
function encodeFragmentSegments(segments) {
    let i = -1;
    const len = segments.length;
    const res = new Array(len);
    while (++i < len) {
        if (typeof segments[i] === 'string') {
            res[i] = encodeURIComponent(replace(replace(segments[i], '~', '~0'), '/', '~1'));
        }
        else {
            res[i] = segments[i];
        }
    }
    return res;
}
function decodePointerSegments(segments) {
    let i = -1;
    const len = segments.length;
    const res = new Array(len);
    while (++i < len) {
        if (typeof segments[i] === 'string') {
            res[i] = replace(replace(segments[i], '~1', '/'), '~0', '~');
        }
        else {
            res[i] = segments[i];
        }
    }
    return res;
}
function encodePointerSegments(segments) {
    let i = -1;
    const len = segments.length;
    const res = new Array(len);
    while (++i < len) {
        if (typeof segments[i] === 'string') {
            res[i] = replace(replace(segments[i], '~', '~0'), '/', '~1');
        }
        else {
            res[i] = segments[i];
        }
    }
    return res;
}
function decodePointer(ptr) {
    if (typeof ptr !== 'string') {
        throw new TypeError('Invalid type: JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0) {
        return [];
    }
    if (ptr[0] !== '/') {
        throw new ReferenceError('Invalid JSON Pointer syntax. Non-empty pointer must begin with a solidus `/`.');
    }
    return decodePointerSegments(ptr.substring(1).split('/'));
}
function encodePointer(path) {
    if (!path || (path && !Array.isArray(path))) {
        throw new TypeError('Invalid type: path must be an array of segments.');
    }
    if (path.length === 0) {
        return '';
    }
    return '/'.concat(encodePointerSegments(path).join('/'));
}
function decodeUriFragmentIdentifier(ptr) {
    if (typeof ptr !== 'string') {
        throw new TypeError('Invalid type: JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0 || ptr[0] !== '#') {
        throw new ReferenceError('Invalid JSON Pointer syntax; URI fragment identifiers must begin with a hash.');
    }
    if (ptr.length === 1) {
        return [];
    }
    if (ptr[1] !== '/') {
        throw new ReferenceError('Invalid JSON Pointer syntax.');
    }
    return decodeFragmentSegments(ptr.substring(2).split('/'));
}
function encodeUriFragmentIdentifier(path) {
    if (!path || (path && !Array.isArray(path))) {
        throw new TypeError('Invalid type: path must be an array of segments.');
    }
    if (path.length === 0) {
        return '#';
    }
    return '#/'.concat(encodeFragmentSegments(path).join('/'));
}
const InvalidRelativePointerError = 'Invalid Relative JSON Pointer syntax. Relative pointer must begin with a non-negative integer, followed by either the number sign (#), or a JSON Pointer.';
function decodeRelativePointer(ptr) {
    if (typeof ptr !== 'string') {
        throw new TypeError('Invalid type: Relative JSON Pointers are represented as strings.');
    }
    if (ptr.length === 0) {
        // https://tools.ietf.org/id/draft-handrews-relative-json-pointer-00.html#rfc.section.3
        throw new ReferenceError(InvalidRelativePointerError);
    }
    const segments = ptr.split('/');
    let first = segments[0];
    // It is a name reference; strip the hash.
    if (first[first.length - 1] == '#') {
        if (segments.length > 1) {
            throw new ReferenceError(InvalidRelativePointerError);
        }
        first = first.substr(0, first.length - 1);
    }
    let i = -1;
    const len = first.length;
    while (++i < len) {
        if (first[i] < '0' || first[i] > '9') {
            throw new ReferenceError(InvalidRelativePointerError);
        }
    }
    const path = decodePointerSegments(segments.slice(1));
    path.unshift(segments[0]);
    return path;
}
function toArrayIndexReference(arr, idx) {
    if (typeof idx === 'number')
        return idx;
    const len = idx.length;
    if (!len)
        return -1;
    let cursor = 0;
    if (len === 1 && idx[0] === '-') {
        if (!Array.isArray(arr)) {
            return 0;
        }
        return arr.length;
    }
    while (++cursor < len) {
        if (idx[cursor] < '0' || idx[cursor] > '9') {
            return -1;
        }
    }
    return parseInt(idx, 10);
}
function compilePointerDereference(path) {
    let body = "if (typeof(it) !== 'undefined'";
    if (path.length === 0) {
        return (it) => it;
    }
    body = path.reduce((body, _, i) => {
        return (body +
            "\n\t&& it !== null && typeof((it = it['" +
            replace(replace(path[i] + '', '\\', '\\\\'), "'", "\\'") +
            "'])) !== 'undefined'");
    }, "if (typeof(it) !== 'undefined'");
    body = body + ') {\n\treturn it;\n }';
    // eslint-disable-next-line no-new-func
    return new Function('it', body);
}
function setValueAtPath(target, val, path, force = false) {
    if (path.length === 0) {
        throw new Error('Cannot set the root object; assign it directly.');
    }
    if (typeof target === 'undefined') {
        throw new TypeError('Cannot set values on undefined');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let it = target;
    const len = path.length;
    const end = path.length - 1;
    let step;
    let cursor = -1;
    let rem;
    let p;
    while (++cursor < len) {
        step = path[cursor];
        if (typeof step !== 'string' && typeof step !== 'number') {
            throw new TypeError('PathSegments must be a string or a number.');
        }
        if (
        // Reconsider this strategy. It disallows legitimate structures on
        // non - objects, or more precisely, on objects not derived from a class
        // or constructor function.
        step === '__proto__' ||
            step === 'constructor' ||
            step === 'prototype') {
            throw new Error('Attempted prototype pollution disallowed.');
        }
        if (Array.isArray(it)) {
            if (step === '-' && cursor === end) {
                it.push(val);
                return undefined;
            }
            p = toArrayIndexReference(it, step);
            if (it.length > p) {
                if (cursor === end) {
                    rem = it[p];
                    it[p] = val;
                    break;
                }
                it = it[p];
            }
            else if (cursor === end && p === it.length) {
                if (force) {
                    it.push(val);
                    return undefined;
                }
            }
            else if (force) {
                it = it[p] = cursor === end ? val : {};
            }
        }
        else {
            if (typeof it[step] === 'undefined') {
                if (force) {
                    if (cursor === end) {
                        it[step] = val;
                        return undefined;
                    }
                    // if the next step is an array index, this step should be an array.
                    const n = Number(path[cursor + 1]);
                    if (Number.isInteger(n) &&
                        toArrayIndexReference(it[step], n) !== -1) {
                        it = it[step] = [];
                        continue;
                    }
                    it = it[step] = {};
                    continue;
                }
                return undefined;
            }
            if (cursor === end) {
                rem = it[step];
                it[step] = val;
                break;
            }
            it = it[step];
        }
    }
    return rem;
}
function unsetValueAtPath(target, path) {
    if (path.length === 0) {
        throw new Error('Cannot unset the root object; assign it directly.');
    }
    if (typeof target === 'undefined') {
        throw new TypeError('Cannot unset values on undefined');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let it = target;
    const len = path.length;
    const end = path.length - 1;
    let step;
    let cursor = -1;
    let rem;
    let p;
    while (++cursor < len) {
        step = path[cursor];
        if (typeof step !== 'string' && typeof step !== 'number') {
            throw new TypeError('PathSegments must be a string or a number.');
        }
        if (step === '__proto__' ||
            step === 'constructor' ||
            step === 'prototype') {
            throw new Error('Attempted prototype pollution disallowed.');
        }
        if (Array.isArray(it)) {
            p = toArrayIndexReference(it, step);
            if (p >= it.length)
                return undefined;
            if (cursor === end) {
                rem = it[p];
                delete it[p];
                break;
            }
            it = it[p];
        }
        else {
            if (typeof it[step] === 'undefined') {
                return undefined;
            }
            if (cursor === end) {
                rem = it[step];
                delete it[step];
                break;
            }
            it = it[step];
        }
    }
    return rem;
}
function looksLikeFragment(ptr) {
    return typeof ptr === 'string' && ptr.length > 0 && ptr[0] === '#';
}
function pickDecoder(ptr) {
    return looksLikeFragment(ptr) ? decodeUriFragmentIdentifier : decodePointer;
}
function decodePtrInit(ptr) {
    return Array.isArray(ptr)
        ? ptr.slice(0)
        : pickDecoder(ptr)(ptr);
}

/**
 * Determines if the value is an object (not null)
 * @param value the value
 * @returns true if the value is a non-null object; otherwise false.
 *
 * @hidden
 */
function isObject(value) {
    return typeof value === 'object' && value !== null;
}
/** @hidden */
function shouldDescend(obj) {
    return isObject(obj) && !JsonReference.isReference(obj);
}
/** @hidden */
function descendingVisit(target, visitor, encoder) {
    const distinctObjects = new Map();
    const q = [{ obj: target, path: [] }];
    while (q.length) {
        const { obj, path } = q.shift();
        visitor(encoder(path), obj);
        if (shouldDescend(obj)) {
            distinctObjects.set(obj, new JsonPointer(encodeUriFragmentIdentifier(path)));
            if (!Array.isArray(obj)) {
                const keys = Object.keys(obj);
                const len = keys.length;
                let i = -1;
                while (++i < len) {
                    const it = obj[keys[i]];
                    if (isObject(it) && distinctObjects.has(it)) {
                        q.push({
                            obj: new JsonReference(distinctObjects.get(it)),
                            path: path.concat(keys[i]),
                        });
                    }
                    else {
                        q.push({
                            obj: it,
                            path: path.concat(keys[i]),
                        });
                    }
                }
            }
            else {
                // handleArray
                let j = -1;
                const len = obj.length;
                while (++j < len) {
                    const it = obj[j];
                    if (isObject(it) && distinctObjects.has(it)) {
                        q.push({
                            obj: new JsonReference(distinctObjects.get(it)),
                            path: path.concat([j + '']),
                        });
                    }
                    else {
                        q.push({
                            obj: it,
                            path: path.concat([j + '']),
                        });
                    }
                }
            }
        }
    }
}
/** @hidden */
const $ptr = Symbol('pointer');
/** @hidden */
const $frg = Symbol('fragmentId');
/** @hidden */
const $get = Symbol('getter');
/**
 * Represents a JSON Pointer, capable of getting and setting the value on target
 * objects at the pointer's location.
 *
 * While there are static variants for most operations, our recommendation is
 * to use the instance level methods, which enables you avoid repeated
 * compiling/emitting transient accessors. Take a look at the speed comparisons
 * for our justification.
 *
 * In most cases, you should create and reuse instances of JsonPointer within
 * scope that makes sense for your app. We often create constants for frequently
 * used pointers, but your use case may vary.
 *
 * The following is a contrived example showing a function that uses pointers to
 * deal with changes in the structure of data (a version independent function):
 *
 * ```ts
 * import { JsonPointer } from 'json-ptr';
 *
 * export type SupportedVersion = '1.0' | '1.1';
 *
 * interface PrimaryGuestNamePointers {
 *   name: JsonPointer;
 *   surname: JsonPointer;
 *   honorific: JsonPointer;
 * }
 * const versions: Record<SupportedVersion, PrimaryGuestNamePointers> = {
 *   '1.0': {
 *     name: JsonPointer.create('/guests/0/name'),
 *     surname: JsonPointer.create('/guests/0/surname'),
 *     honorific: JsonPointer.create('/guests/0/honorific'),
 *   },
 *   '1.1': {
 *     name: JsonPointer.create('/primary/primaryGuest/name'),
 *     surname: JsonPointer.create('/primary/primaryGuest/surname'),
 *     honorific: JsonPointer.create('/primary/primaryGuest/honorific'),
 *   }
 * };
 *
 * interface Reservation extends Record<string, unknown> {
 *   version?: SupportedVersion;
 * }
 *
 * function primaryGuestName(reservation: Reservation): string {
 *   const pointers = versions[reservation.version || '1.0'];
 *   const name = pointers.name.get(reservation) as string;
 *   const surname = pointers.surname.get(reservation) as string;
 *   const honorific = pointers.honorific.get(reservation) as string;
 *   const names: string[] = [];
 *   if (honorific) names.push(honorific);
 *   if (name) names.push(name);
 *   if (surname) names.push(surname);
 *   return names.join(' ');
 * }
 *
 * // The original layout of a reservation (only the parts relevant to our example)
 * const reservationV1: Reservation = {
 *   guests: [{
 *     name: 'Wilbur',
 *     surname: 'Finkle',
 *     honorific: 'Mr.'
 *   }, {
 *     name: 'Wanda',
 *     surname: 'Finkle',
 *     honorific: 'Mrs.'
 *   }, {
 *     name: 'Wilma',
 *     surname: 'Finkle',
 *     honorific: 'Miss',
 *     child: true,
 *     age: 12
 *   }]
 *   // ...
 * };
 *
 * // The new layout of a reservation (only the parts relevant to our example)
 * const reservationV1_1: Reservation = {
 *   version: '1.1',
 *   primary: {
 *     primaryGuest: {
 *       name: 'Wilbur',
 *       surname: 'Finkle',
 *       honorific: 'Mr.'
 *     },
 *     additionalGuests: [{
 *       name: 'Wanda',
 *       surname: 'Finkle',
 *       honorific: 'Mrs.'
 *     }, {
 *       name: 'Wilma',
 *       surname: 'Finkle',
 *       honorific: 'Miss',
 *       child: true,
 *       age: 12
 *     }]
 *     // ...
 *   }
 *   // ...
 * };
 *
 * console.log(primaryGuestName(reservationV1));
 * console.log(primaryGuestName(reservationV1_1));
 *
 * ```
 *
 * There are many uses for pointers.
 */
class JsonPointer {
    /**
     * Creates a new instance.
     * @param ptr a string representation of a JSON Pointer, or a decoded array of path segments.
     */
    constructor(ptr) {
        this.path = decodePtrInit(ptr);
    }
    /**
     * Factory function that creates a JsonPointer instance.
     *
     * ```ts
     * const ptr = JsonPointer.create('/deeply/nested/data/0/here');
     * ```
     * _or_
     * ```ts
     * const ptr = JsonPointer.create(['deeply', 'nested', 'data', 0, 'here']);
     * ```
     * @param pointer the pointer or path.
     */
    static create(pointer) {
        return new JsonPointer(pointer);
    }
    /**
     * Determines if the specified `target`'s object graph has a value at the `pointer`'s location.
     *
     * ```ts
     * const target = {
     *   first: 'second',
     *   third: ['fourth', 'fifth', { sixth: 'seventh' }],
     *   eighth: 'ninth'
     * };
     *
     * console.log(JsonPointer.has(target, '/third/0'));
     * // true
     * console.log(JsonPointer.has(target, '/tenth'));
     * // false
     * ```
     *
     * @param target the target of the operation
     * @param pointer the pointer or path
     */
    static has(target, pointer) {
        if (typeof pointer === 'string' || Array.isArray(pointer)) {
            pointer = new JsonPointer(pointer);
        }
        return pointer.has(target);
    }
    /**
     * Gets the `target` object's value at the `pointer`'s location.
     *
     * ```ts
     * const target = {
     *   first: 'second',
     *   third: ['fourth', 'fifth', { sixth: 'seventh' }],
     *   eighth: 'ninth'
     * };
     *
     * console.log(JsonPointer.get(target, '/third/2/sixth'));
     * // seventh
     * console.log(JsonPointer.get(target, '/tenth'));
     * // undefined
     * ```
     *
     * @param target the target of the operation
     * @param pointer the pointer or path.
     */
    static get(target, pointer) {
        if (typeof pointer === 'string' || Array.isArray(pointer)) {
            pointer = new JsonPointer(pointer);
        }
        return pointer.get(target);
    }
    /**
     * Sets the `target` object's value, as specified, at the `pointer`'s location.
     *
     * ```ts
     * const target = {
     *   first: 'second',
     *   third: ['fourth', 'fifth', { sixth: 'seventh' }],
     *   eighth: 'ninth'
     * };
     *
     * console.log(JsonPointer.set(target, '/third/2/sixth', 'tenth'));
     * // seventh
     * console.log(JsonPointer.set(target, '/tenth', 'eleventh', true));
     * // undefined
     * console.log(JSON.stringify(target, null, ' '));
     * // {
     * // "first": "second",
     * // "third": [
     * //  "fourth",
     * //  "fifth",
     * //  {
     * //   "sixth": "tenth"
     * //  }
     * // ],
     * // "eighth": "ninth",
     * // "tenth": "eleventh"
     * // }
     * ```
     *
     * @param target the target of the operation
     * @param pointer the pointer or path
     * @param val a value to write into the object graph at the specified pointer location
     * @param force indications whether the operation should force the pointer's location into existence in the object graph.
     *
     * @returns the prior value at the pointer's location in the object graph.
     */
    static set(target, pointer, val, force = false) {
        if (typeof pointer === 'string' || Array.isArray(pointer)) {
            pointer = new JsonPointer(pointer);
        }
        return pointer.set(target, val, force);
    }
    /**
     * Removes the `target` object's value at the `pointer`'s location.
     *
     * ```ts
     * const target = {
     *   first: 'second',
     *   third: ['fourth', 'fifth', { sixth: 'seventh' }],
     *   eighth: 'ninth'
     * };
     *
     * console.log(JsonPointer.unset(target, '/third/2/sixth'));
     * // seventh
     * console.log(JsonPointer.unset(target, '/tenth'));
     * // undefined
     * console.log(JSON.stringify(target, null, ' '));
     * // {
     * // "first": "second",
     * // "third": [
     * //  "fourth",
     * //  "fifth",
     * //  {}
     * // ],
     * // "eighth": "ninth",
     * // }
     * ```
     * @param target the target of the operation
     * @param pointer the pointer or path
     *
     * @returns the value that was removed from the object graph.
     */
    static unset(target, pointer) {
        if (typeof pointer === 'string' || Array.isArray(pointer)) {
            pointer = new JsonPointer(pointer);
        }
        return pointer.unset(target);
    }
    /**
     * Decodes the specified pointer into path segments.
     * @param pointer a string representation of a JSON Pointer
     */
    static decode(pointer) {
        return pickDecoder(pointer)(pointer);
    }
    /**
     * Evaluates the target's object graph, calling the specified visitor for every unique pointer location discovered while walking the graph.
     * @param target the target of the operation
     * @param visitor a callback function invoked for each unique pointer location in the object graph
     * @param fragmentId indicates whether the visitor should receive fragment identifiers or regular pointers
     */
    static visit(target, visitor, fragmentId = false) {
        descendingVisit(target, visitor, fragmentId ? encodeUriFragmentIdentifier : encodePointer);
    }
    /**
     * Evaluates the target's object graph, returning a [[JsonStringPointerListItem]] for each location in the graph.
     * @param target the target of the operation
     */
    static listPointers(target) {
        const res = [];
        descendingVisit(target, (pointer, value) => {
            res.push({ pointer, value });
        }, encodePointer);
        return res;
    }
    /**
     * Evaluates the target's object graph, returning a [[UriFragmentIdentifierPointerListItem]] for each location in the graph.
     * @param target the target of the operation
     */
    static listFragmentIds(target) {
        const res = [];
        descendingVisit(target, (fragmentId, value) => {
            res.push({ fragmentId, value });
        }, encodeUriFragmentIdentifier);
        return res;
    }
    /**
     * Evaluates the target's object graph, returning a Record&lt;Pointer, unknown> populated with pointers and the corresponding values from the graph.
     * @param target the target of the operation
     * @param fragmentId indicates whether the results are populated with fragment identifiers rather than regular pointers
     */
    static flatten(target, fragmentId = false) {
        const res = {};
        descendingVisit(target, (p, v) => {
            res[p] = v;
        }, fragmentId ? encodeUriFragmentIdentifier : encodePointer);
        return res;
    }
    /**
     * Evaluates the target's object graph, returning a Map&lt;Pointer,unknown>  populated with pointers and the corresponding values form the graph.
     * @param target the target of the operation
     * @param fragmentId indicates whether the results are populated with fragment identifiers rather than regular pointers
     */
    static map(target, fragmentId = false) {
        const res = new Map();
        descendingVisit(target, res.set.bind(res), fragmentId ? encodeUriFragmentIdentifier : encodePointer);
        return res;
    }
    /**
     * Gets the target object's value at the pointer's location.
     * @param target the target of the operation
     */
    get(target) {
        if (!this[$get]) {
            this[$get] = compilePointerDereference(this.path);
        }
        return this[$get](target);
    }
    /**
     * Sets the target object's value, as specified, at the pointer's location.
     *
     * If any part of the pointer's path does not exist, the operation aborts
     * without modification, unless the caller indicates that pointer's location
     * should be created.
     *
     * @param target the target of the operation
     * @param value the value to set
     * @param force indicates whether the pointer's location should be created if it doesn't already exist.
     */
    set(target, value, force = false) {
        return setValueAtPath(target, value, this.path, force);
    }
    /**
     * Removes the target object's value at the pointer's location.
     * @param target the target of the operation
     *
     * @returns the value that was removed from the object graph.
     */
    unset(target) {
        return unsetValueAtPath(target, this.path);
    }
    /**
     * Determines if the specified target's object graph has a value at the pointer's location.
     * @param target the target of the operation
     */
    has(target) {
        return typeof this.get(target) !== 'undefined';
    }
    /**
     * Gets the value in the object graph that is the parent of the pointer location.
     * @param target the target of the operation
     */
    parent(target) {
        const p = this.path;
        if (p.length == 1)
            return undefined;
        const parent = new JsonPointer(p.slice(0, p.length - 1));
        return parent.get(target);
    }
    /**
     * Creates a new JsonPointer instance, pointing to the specified relative location in the object graph.
     * @param ptr the relative pointer (relative to this)
     * @returns A new instance that points to the relative location.
     */
    relative(ptr) {
        const p = this.path;
        const decoded = decodeRelativePointer(ptr);
        const n = parseInt(decoded[0]);
        if (n > p.length)
            throw new Error('Relative location does not exist.');
        const r = p.slice(0, p.length - n).concat(decoded.slice(1));
        if (decoded[0][decoded[0].length - 1] == '#') {
            // It references the path segment/name, not the value
            const name = r[r.length - 1];
            throw new Error(`We won't compile a pointer that will always return '${name}'. Use JsonPointer.rel(target, ptr) instead.`);
        }
        return new JsonPointer(r);
    }
    /**
     * Resolves the specified relative pointer path against the specified target object, and gets the target object's value at the relative pointer's location.
     * @param target the target of the operation
     * @param ptr the relative pointer (relative to this)
     * @returns the value at the relative pointer's resolved path; otherwise undefined.
     */
    rel(target, ptr) {
        const p = this.path;
        const decoded = decodeRelativePointer(ptr);
        const n = parseInt(decoded[0]);
        if (n > p.length) {
            // out of bounds
            return undefined;
        }
        const r = p.slice(0, p.length - n).concat(decoded.slice(1));
        const other = new JsonPointer(r);
        if (decoded[0][decoded[0].length - 1] == '#') {
            // It references the path segment/name, not the value
            const name = r[r.length - 1];
            const parent = other.parent(target);
            return Array.isArray(parent) ? parseInt(name, 10) : name;
        }
        return other.get(target);
    }
    /**
     * Creates a new instance by concatenating the specified pointer's path onto this pointer's path.
     * @param ptr the string representation of a pointer, it's decoded path, or an instance of JsonPointer indicating the additional path to concatenate onto the pointer.
     */
    concat(ptr) {
        return new JsonPointer(this.path.concat(ptr instanceof JsonPointer ? ptr.path : decodePtrInit(ptr)));
    }
    /**
     * This pointer's JSON Pointer encoded string representation.
     */
    get pointer() {
        if (this[$ptr] === undefined) {
            this[$ptr] = encodePointer(this.path);
        }
        return this[$ptr];
    }
    /**
     * This pointer's URI fragment identifier encoded string representation.
     */
    get uriFragmentIdentifier() {
        if (!this[$frg]) {
            this[$frg] = encodeUriFragmentIdentifier(this.path);
        }
        return this[$frg];
    }
    /**
     * Emits the JSON Pointer encoded string representation.
     */
    toString() {
        return this.pointer;
    }
}
/** @hidden */
const $pointer = Symbol('pointer');
/**
 * A reference to a location in an object graph.
 *
 * This type is used by this module to break cycles in an object graph and to
 * reference locations that have already been visited when enumerating pointers.
 */
class JsonReference {
    /**
     * Creates a new instance.
     * @param pointer a JSON Pointer for the reference.
     */
    constructor(pointer) {
        this[$pointer] =
            pointer instanceof JsonPointer ? pointer : new JsonPointer(pointer);
        this.$ref = this[$pointer].uriFragmentIdentifier;
    }
    /**
     * Determines if the specified `candidate` is a JsonReference.
     * @param candidate the candidate
     */
    static isReference(candidate) {
        if (!candidate)
            return false;
        const ref = candidate;
        return typeof ref.$ref === 'string' && typeof ref.resolve === 'function';
    }
    /**
     * Resolves the reference against the `target` object, returning the value at
     * the referenced pointer's location.
     * @param target the target object
     */
    resolve(target) {
        return this[$pointer].get(target);
    }
    /**
     * Gets the reference's pointer.
     */
    pointer() {
        return this[$pointer];
    }
    /**
     * Gets the reference pointer's string representation (a URI fragment identifier).
     */
    toString() {
        return this.$ref;
    }
}

export { JsonPointer, JsonReference, compilePointerDereference, decodeFragmentSegments, decodePointer, decodePointerSegments, decodePtrInit, decodeRelativePointer, decodeUriFragmentIdentifier, encodeFragmentSegments, encodePointer, encodePointerSegments, encodeUriFragmentIdentifier, looksLikeFragment, pickDecoder, replace, setValueAtPath, toArrayIndexReference, unsetValueAtPath };
//# sourceMappingURL=index.js.map
