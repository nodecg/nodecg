/// <reference types="node" />
import { Writable, Readable } from "stream";
/**
 * Onchange configuration options.
 */
export interface Options {
    add?: boolean;
    awaitWriteFinish?: number;
    command?: string[];
    cwd?: string;
    defaultExclude?: boolean;
    delay?: number;
    env?: NodeJS.ProcessEnv;
    exclude?: (string | ((path: string) => boolean))[];
    filter?: string[];
    initial?: boolean;
    jobs?: number;
    kill?: boolean;
    killSignal?: NodeJS.Signals;
    matches: string[];
    onReady?: () => void;
    outpipe?: string;
    poll?: number;
    stderr?: Writable;
    stdin?: Readable;
    stdout?: Writable;
    verbose?: boolean;
}
/**
 * Onchange manages
 */
export declare function onchange(options: Options): () => void;
