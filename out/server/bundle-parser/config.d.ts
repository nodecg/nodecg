import * as IO from "fp-ts/IO";
import type { NodeCG } from "../../types/nodecg";
export declare const parseDefaults: (bundleName: string) => (bundleDir: string) => IO.IO<import("fp-ts/lib/Either").Either<Error, Record<string, any>>>;
export declare function parseBundleConfig(bundleName: string, bundleDir: string, userConfig: NodeCG.Bundle.UnknownConfig): NodeCG.Bundle.UnknownConfig;
