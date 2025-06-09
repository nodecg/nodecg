import type { NodeCG } from "../types/nodecg";
export declare class SharedSourcesLib {
    app: import("express-serve-static-core").Express;
    constructor(bundles: NodeCG.Bundle[]);
}
