interface File {
    url: string;
    data: UnknownObject;
    schema: {
        plugins: {
            resolveURL(paths: {
                from: string;
                to: string;
            }): string;
        };
    };
}
interface UnknownObject {
    [k: string]: unknown;
    [k: number]: unknown;
}
export declare function formatSchema(inputObj: unknown, currentFile: File, allFiles: File[]): UnknownObject | undefined;
export {};
