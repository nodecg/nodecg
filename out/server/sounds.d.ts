import type { NodeCG } from "../types/nodecg";
import type { Replicator } from "./replicant/replicator";
export declare class SoundsLib {
    app: import("express-serve-static-core").Express;
    private readonly _bundles;
    private readonly _cueRepsByBundle;
    constructor(bundles: NodeCG.Bundle[], replicator: Replicator);
    private _serveDefault;
    private _makeCuesRepDefaultValue;
}
