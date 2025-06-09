export type Template<T extends object> = (data: T) => string;
/**
 * Fast and simple string templates.
 */
export declare function template<T extends object = object>(value: string): (data: T) => string;
