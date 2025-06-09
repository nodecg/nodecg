import { OptionalKeys } from "../optional-keys";
export declare type RequiredKeys<Type> = Type extends unknown ? Exclude<keyof Type, OptionalKeys<Type>> : never;
