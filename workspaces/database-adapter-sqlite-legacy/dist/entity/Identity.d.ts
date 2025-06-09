import type { Identity as IdentityModel } from "@nodecg/database-adapter-types";
import { User } from "./User";
export declare class Identity implements IdentityModel {
    id: string;
    provider_type: "twitch" | "steam" | "local" | "discord";
    /**
     * Hashed password for local, auth token from twitch, etc.
     */
    provider_hash: string;
    /**
     * Only used by Twitch and Discord providers.
     */
    provider_access_token: string | null;
    /**
     * Only used by Twitch and Discord providers.
     */
    provider_refresh_token: string | null;
    user: User;
}
//# sourceMappingURL=Identity.d.ts.map