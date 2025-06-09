import { Driver } from "../driver/Driver";
interface BuildSqlTagParams {
    driver: Driver;
    strings: TemplateStringsArray;
    expressions: unknown[];
}
export declare function buildSqlTag({ driver, strings, expressions, }: BuildSqlTagParams): {
    query: string;
    parameters: unknown[];
};
export {};
