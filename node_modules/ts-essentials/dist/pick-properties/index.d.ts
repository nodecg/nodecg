import { PickKeysByValue } from "../pick-keys-by-value";
export declare type PickProperties<Type, Value> = Pick<Type, PickKeysByValue<Type, Value>>;
