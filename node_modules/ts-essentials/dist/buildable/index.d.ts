import { DeepPartial } from "../deep-partial";
import { DeepWritable } from "../deep-writable";
export declare type Buildable<Type> = DeepPartial<DeepWritable<Type>>;
