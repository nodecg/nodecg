import { PickProperties } from "../pick-properties";
export declare type PickKeys<Type, Value> = Exclude<keyof PickProperties<Type, Value>, undefined>;
