import { JsonStringPointer, UriFragmentIdentifierPointer, Pointer, RelativeJsonPointer, PathSegments, JsonStringPointerListItem, UriFragmentIdentifierPointerListItem } from './types';
/**
 * Signature of visitor functions, used with [[JsonPointer.visit]] method. Visitors are callbacks invoked for every segment/branch of a target's object graph.
 *
 * Tree descent occurs in-order, breadth first.
 */
export declare type Visitor = (ptr: JsonStringPointer, val: unknown) => void;
/** @hidden */
declare const $ptr: unique symbol;
/** @hidden */
declare const $frg: unique symbol;
/** @hidden */
declare const $get: unique symbol;
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
export declare class JsonPointer {
    /** @hidden */
    private [$ptr];
    /** @hidden */
    private [$frg];
    /** @hidden */
    private [$get];
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
    static create(pointer: Pointer | PathSegments): JsonPointer;
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
    static has(target: unknown, pointer: Pointer | PathSegments | JsonPointer): boolean;
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
    static get(target: unknown, pointer: Pointer | PathSegments | JsonPointer): unknown;
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
    static set(target: unknown, pointer: Pointer | PathSegments | JsonPointer, val: unknown, force?: boolean): unknown;
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
    static unset(target: unknown, pointer: Pointer | PathSegments | JsonPointer): unknown;
    /**
     * Decodes the specified pointer into path segments.
     * @param pointer a string representation of a JSON Pointer
     */
    static decode(pointer: Pointer): PathSegments;
    /**
     * Evaluates the target's object graph, calling the specified visitor for every unique pointer location discovered while walking the graph.
     * @param target the target of the operation
     * @param visitor a callback function invoked for each unique pointer location in the object graph
     * @param fragmentId indicates whether the visitor should receive fragment identifiers or regular pointers
     */
    static visit(target: unknown, visitor: Visitor, fragmentId?: boolean): void;
    /**
     * Evaluates the target's object graph, returning a [[JsonStringPointerListItem]] for each location in the graph.
     * @param target the target of the operation
     */
    static listPointers(target: unknown): JsonStringPointerListItem[];
    /**
     * Evaluates the target's object graph, returning a [[UriFragmentIdentifierPointerListItem]] for each location in the graph.
     * @param target the target of the operation
     */
    static listFragmentIds(target: unknown): UriFragmentIdentifierPointerListItem[];
    /**
     * Evaluates the target's object graph, returning a Record&lt;Pointer, unknown> populated with pointers and the corresponding values from the graph.
     * @param target the target of the operation
     * @param fragmentId indicates whether the results are populated with fragment identifiers rather than regular pointers
     */
    static flatten(target: unknown, fragmentId?: boolean): Record<Pointer, unknown>;
    /**
     * Evaluates the target's object graph, returning a Map&lt;Pointer,unknown>  populated with pointers and the corresponding values form the graph.
     * @param target the target of the operation
     * @param fragmentId indicates whether the results are populated with fragment identifiers rather than regular pointers
     */
    static map(target: unknown, fragmentId?: boolean): Map<Pointer, unknown>;
    /**
     * The pointer's decoded path segments.
     */
    readonly path: PathSegments;
    /**
     * Creates a new instance.
     * @param ptr a string representation of a JSON Pointer, or a decoded array of path segments.
     */
    constructor(ptr: Pointer | PathSegments);
    /**
     * Gets the target object's value at the pointer's location.
     * @param target the target of the operation
     */
    get(target: unknown): unknown;
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
    set(target: unknown, value: unknown, force?: boolean): unknown;
    /**
     * Removes the target object's value at the pointer's location.
     * @param target the target of the operation
     *
     * @returns the value that was removed from the object graph.
     */
    unset(target: unknown): unknown;
    /**
     * Determines if the specified target's object graph has a value at the pointer's location.
     * @param target the target of the operation
     */
    has(target: unknown): boolean;
    /**
     * Gets the value in the object graph that is the parent of the pointer location.
     * @param target the target of the operation
     */
    parent(target: unknown): unknown;
    /**
     * Creates a new JsonPointer instance, pointing to the specified relative location in the object graph.
     * @param ptr the relative pointer (relative to this)
     * @returns A new instance that points to the relative location.
     */
    relative(ptr: RelativeJsonPointer): JsonPointer;
    /**
     * Resolves the specified relative pointer path against the specified target object, and gets the target object's value at the relative pointer's location.
     * @param target the target of the operation
     * @param ptr the relative pointer (relative to this)
     * @returns the value at the relative pointer's resolved path; otherwise undefined.
     */
    rel(target: unknown, ptr: RelativeJsonPointer): unknown;
    /**
     * Creates a new instance by concatenating the specified pointer's path onto this pointer's path.
     * @param ptr the string representation of a pointer, it's decoded path, or an instance of JsonPointer indicating the additional path to concatenate onto the pointer.
     */
    concat(ptr: JsonPointer | Pointer | PathSegments): JsonPointer;
    /**
     * This pointer's JSON Pointer encoded string representation.
     */
    get pointer(): JsonStringPointer;
    /**
     * This pointer's URI fragment identifier encoded string representation.
     */
    get uriFragmentIdentifier(): UriFragmentIdentifierPointer;
    /**
     * Emits the JSON Pointer encoded string representation.
     */
    toString(): string;
}
/** @hidden */
declare const $pointer: unique symbol;
/**
 * A reference to a location in an object graph.
 *
 * This type is used by this module to break cycles in an object graph and to
 * reference locations that have already been visited when enumerating pointers.
 */
export declare class JsonReference {
    /**
     * Determines if the specified `candidate` is a JsonReference.
     * @param candidate the candidate
     */
    static isReference(candidate: unknown): candidate is JsonReference;
    /** @hidden */
    private readonly [$pointer];
    /**
     * A reference to a position if an object graph.
     */
    readonly $ref: UriFragmentIdentifierPointer;
    /**
     * Creates a new instance.
     * @param pointer a JSON Pointer for the reference.
     */
    constructor(pointer: JsonPointer | Pointer | PathSegments);
    /**
     * Resolves the reference against the `target` object, returning the value at
     * the referenced pointer's location.
     * @param target the target object
     */
    resolve(target: unknown): unknown;
    /**
     * Gets the reference's pointer.
     */
    pointer(): JsonPointer;
    /**
     * Gets the reference pointer's string representation (a URI fragment identifier).
     */
    toString(): string;
}
export {};
