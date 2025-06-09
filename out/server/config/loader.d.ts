import type { NodeCG } from "../../types/nodecg";
export declare const loadConfig: (cfgDirOrFile: string) => {
    config: {
        baseURL: string;
        host: string;
        port: number;
        exitOnUncaught: boolean;
        logging: {
            console: {
                enabled: boolean;
                level: "verbose" | "debug" | "info" | "warn" | "error" | "silent";
                timestamps: boolean;
                replicants: boolean;
            };
            file: {
                path: string;
                enabled: boolean;
                level: "verbose" | "debug" | "info" | "warn" | "error" | "silent";
                timestamps: boolean;
                replicants: boolean;
            };
        };
        bundles: {
            enabled: string[] | null;
            disabled: string[] | null;
            paths: string[];
        };
        login: {
            enabled: boolean;
            forceHttpsReturn: boolean;
            sessionSecret?: string | undefined;
            steam?: {
                enabled: boolean;
                allowedIds: string[];
                apiKey?: string | undefined;
            } | undefined;
            twitch?: {
                enabled: boolean;
                allowedIds: string[];
                scope: string;
                allowedUsernames: string[];
                clientID?: string | undefined;
                clientSecret?: string | undefined;
            } | undefined;
            discord?: {
                enabled: boolean;
                scope: string;
                allowedUserIDs: string[];
                allowedGuilds: {
                    guildID: string;
                    allowedRoleIDs: string[];
                    guildBotToken: string;
                }[];
                clientID?: string | undefined;
                clientSecret?: string | undefined;
            } | undefined;
            local?: {
                enabled: boolean;
                allowedUsers: {
                    username: string;
                    password: string;
                }[];
            } | undefined;
        };
        ssl: {
            enabled: boolean;
            allowHTTP: boolean;
            keyPath?: string | undefined;
            certificatePath?: string | undefined;
            passphrase?: string | undefined;
        };
        sentry: {
            enabled: boolean;
            dsn?: string | undefined;
        };
    };
    filteredConfig: NodeCG.FilteredConfig;
};
