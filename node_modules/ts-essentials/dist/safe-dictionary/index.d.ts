import { KeyofBase } from "../key-of-base";
export declare type SafeDictionary<Type, Keys extends KeyofBase = string> = {
    [key in Keys]?: Type;
};
