/** @deprecated please use builtin `Awaited` */
export declare type Awaited<Type> = Type extends PromiseLike<infer Value> ? Value : never;
