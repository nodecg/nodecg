import { ObjectType } from "../common/ObjectType";
import { ForeignKeyOptions } from "./options/ForeignKeyOptions";
/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 */
export declare function ForeignKey<T>(typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>), options?: ForeignKeyOptions): PropertyDecorator;
/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 */
export declare function ForeignKey<T>(typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>), inverseSide: string | ((object: T) => any), options?: ForeignKeyOptions): PropertyDecorator;
/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 */
export declare function ForeignKey<T, C extends (readonly [] | readonly string[]) & (number extends C["length"] ? readonly [] : unknown)>(typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>), columnNames: C, referencedColumnNames: {
    [K in keyof C]: string;
}, options?: ForeignKeyOptions): ClassDecorator;
