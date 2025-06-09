import type { NodeCG } from "../../types/nodecg";
export declare function parseSounds(bundlePath: string, manifest: Pick<NodeCG.Manifest, "soundCues" | "name">): {
    soundCues: NodeCG.Bundle.SoundCue[];
    hasAssignableSoundCues: boolean;
};
