import { AnyRecord } from "../any-record";
export declare type NonEmptyObject<Object extends AnyRecord> = keyof Object extends never ? never : Object;
