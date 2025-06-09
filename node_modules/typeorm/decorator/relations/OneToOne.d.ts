import { ObjectType } from "../../common/ObjectType";
import { RelationOptions } from "../options/RelationOptions";
/**
 * One-to-one relation allows the creation of a direct relation between two entities. Entity1 has only one Entity2.
 * Entity1 is the owner of the relationship, and stores Entity2 id on its own side.
 */
export declare function OneToOne<T>(typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>), options?: RelationOptions): PropertyDecorator;
/**
 * One-to-one relation allows the creation of a direct relation between two entities. Entity1 has only one Entity2.
 * Entity1 is the owner of the relationship, and stores Entity2 id on its own side.
 */
export declare function OneToOne<T>(typeFunctionOrTarget: string | ((type?: any) => ObjectType<T>), inverseSide?: string | ((object: T) => any), options?: RelationOptions): PropertyDecorator;
