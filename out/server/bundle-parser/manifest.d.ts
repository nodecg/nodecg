import * as IOE from "fp-ts/IOEither";
import type { NodeCG } from "../../types/nodecg";
export declare const parseManifest: (bundlePath: string) => (packageJson: NodeCG.PackageJSON) => IOE.IOEither<Error, never> | IOE.IOEither<never, {
    name: string;
    version: string;
    license: string | undefined;
    description: string | undefined;
    homepage: string | undefined;
    author: (string | {
        name: string;
        email?: string;
        url?: string;
    }) | undefined;
    contributors: (string | {
        name: string;
        email?: string;
        url?: string;
    })[] | undefined;
    transformBareModuleSpecifiers: boolean;
    compatibleRange?: string;
    dashboardPanels?: NodeCG.Manifest.UnparsedPanel[];
    graphics?: NodeCG.Manifest.UnparsedGraphic[];
    assetCategories?: NodeCG.Manifest.UnparsedAssetCategory[];
    mount?: NodeCG.Manifest.UnparsedMount[];
    soundCues?: NodeCG.Manifest.UnparsedSoundCue[];
    bundleDependencies?: NodeCG.Manifest.UnparsedBundleDependencies;
}>;
