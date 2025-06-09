import { AsyncOrSync } from "../async-or-sync";
export declare type AsyncOrSyncType<AsyncOrSyncType> = AsyncOrSyncType extends AsyncOrSync<infer Type> ? Type : never;
