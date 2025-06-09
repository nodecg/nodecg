export declare type PathSegment = string | number;
export declare type PathSegments = PathSegment[];
export declare type JsonStringPointer = string;
export declare type UriFragmentIdentifierPointer = string;
export declare type Pointer = JsonStringPointer | UriFragmentIdentifierPointer;
export declare type RelativeJsonPointer = string;
/**
 * List item used when listing pointers and their values in an object graph.
 */
export interface JsonStringPointerListItem {
    /**
     * Contains the location of the value in the evaluated object graph.
     */
    readonly pointer: JsonStringPointer;
    /**
     * The value at the pointer's location in the object graph.
     */
    readonly value: unknown;
}
/**
 * List item used when listing fragment identifiers and their values in an object graph.
 */
export interface UriFragmentIdentifierPointerListItem {
    /**
     * Contains the location (as a fragmentId) of the value in the evaluated object graph.
     */
    readonly fragmentId: UriFragmentIdentifierPointer;
    /**
     * The value at the pointer's location in the object graph.
     */
    readonly value: unknown;
}
export declare type Decoder = (ptr: Pointer) => PathSegments;
export declare type Encoder = (ptr: PathSegments) => Pointer;
