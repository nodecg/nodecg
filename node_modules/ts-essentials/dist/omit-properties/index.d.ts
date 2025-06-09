import { PickKeysByValue } from "../pick-keys-by-value";
export declare type OmitProperties<Type, Value> = Omit<Type, PickKeysByValue<Type, Value>>;
