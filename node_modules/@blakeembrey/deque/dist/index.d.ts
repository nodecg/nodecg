export declare class Deque<T> {
    private head;
    private tail;
    private mask;
    private list;
    constructor(values?: Iterable<T>);
    private _resize;
    push(value: T): this;
    pushLeft(value: T): this;
    clear(): void;
    extend(values: Iterable<T>): this;
    extendLeft(values: Iterable<T>): this;
    peek(index: number): T;
    indexOf(needle: T, start?: number): number;
    has(needle: T): boolean;
    insert(index: number, value: T): this;
    readonly size: number;
    pop(): T;
    popLeft(): T;
    delete(index: number): this;
    reverse(): this;
    rotate(n?: number): this;
    entries(): IterableIterator<T>;
    keys(): IterableIterator<T>;
    values(): IterableIterator<T>;
    [Symbol.iterator](): IterableIterator<T>;
}
