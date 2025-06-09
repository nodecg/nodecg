import { KeyofBase } from "../key-of-base";
export declare type Dictionary<Type, Keys extends KeyofBase = string> = {
    [key in Keys]: Type;
};
