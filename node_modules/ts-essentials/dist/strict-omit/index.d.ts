import { AnyArray } from "../any-array";
import { AnyRecord } from "../any-record";
export declare type StrictOmit<Type extends AnyRecord, Keys extends keyof Type> = Type extends AnyArray ? never : Omit<Type, Keys>;
