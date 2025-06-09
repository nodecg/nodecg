import { AnyArray } from "../any-array";
export declare type Tail<Type extends AnyArray> = Type extends [any, ...infer Rest] ? Rest : never;
