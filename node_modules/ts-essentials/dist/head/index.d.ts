import { AnyArray } from "../any-array";
export declare type Head<Type extends AnyArray> = Type["length"] extends 0 ? never : Type[0];
