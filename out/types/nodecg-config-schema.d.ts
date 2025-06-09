import { z } from "zod";
export declare const nodecgConfigSchema: z.ZodEffects<z.ZodObject<{
    host: z.ZodDefault<z.ZodString>;
    port: z.ZodDefault<z.ZodNumber>;
    baseURL: z.ZodOptional<z.ZodString>;
    exitOnUncaught: z.ZodDefault<z.ZodBoolean>;
    logging: z.ZodDefault<z.ZodObject<{
        console: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            level: z.ZodDefault<z.ZodEnum<["verbose", "debug", "info", "warn", "error", "silent"]>>;
            timestamps: z.ZodDefault<z.ZodBoolean>;
            replicants: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            level: "verbose" | "debug" | "info" | "warn" | "error" | "silent";
            timestamps: boolean;
            replicants: boolean;
        }, {
            enabled?: boolean | undefined;
            level?: "verbose" | "debug" | "info" | "warn" | "error" | "silent" | undefined;
            timestamps?: boolean | undefined;
            replicants?: boolean | undefined;
        }>>;
        file: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            level: z.ZodDefault<z.ZodEnum<["verbose", "debug", "info", "warn", "error", "silent"]>>;
            path: z.ZodDefault<z.ZodString>;
            timestamps: z.ZodDefault<z.ZodBoolean>;
            replicants: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            enabled: boolean;
            level: "verbose" | "debug" | "info" | "warn" | "error" | "silent";
            timestamps: boolean;
            replicants: boolean;
        }, {
            path?: string | undefined;
            enabled?: boolean | undefined;
            level?: "verbose" | "debug" | "info" | "warn" | "error" | "silent" | undefined;
            timestamps?: boolean | undefined;
            replicants?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
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
    }, {
        console?: {
            enabled?: boolean | undefined;
            level?: "verbose" | "debug" | "info" | "warn" | "error" | "silent" | undefined;
            timestamps?: boolean | undefined;
            replicants?: boolean | undefined;
        } | undefined;
        file?: {
            path?: string | undefined;
            enabled?: boolean | undefined;
            level?: "verbose" | "debug" | "info" | "warn" | "error" | "silent" | undefined;
            timestamps?: boolean | undefined;
            replicants?: boolean | undefined;
        } | undefined;
    }>>;
    bundles: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
        disabled: z.ZodDefault<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
        paths: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled: string[] | null;
        disabled: string[] | null;
        paths: string[];
    }, {
        enabled?: string[] | null | undefined;
        disabled?: string[] | null | undefined;
        paths?: string[] | undefined;
    }>>;
    login: z.ZodDefault<z.ZodEffects<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        sessionSecret: z.ZodOptional<z.ZodString>;
        forceHttpsReturn: z.ZodDefault<z.ZodBoolean>;
        steam: z.ZodEffects<z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            apiKey: z.ZodOptional<z.ZodString>;
            allowedIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            allowedIds: string[];
            apiKey?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            apiKey?: string | undefined;
            allowedIds?: string[] | undefined;
        }>>, {
            enabled: boolean;
            allowedIds: string[];
            apiKey?: string | undefined;
        } | undefined, {
            enabled?: boolean | undefined;
            apiKey?: string | undefined;
            allowedIds?: string[] | undefined;
        } | undefined>;
        twitch: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            clientID: z.ZodOptional<z.ZodString>;
            clientSecret: z.ZodOptional<z.ZodString>;
            scope: z.ZodDefault<z.ZodString>;
            allowedUsernames: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            allowedIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            allowedIds: string[];
            scope: string;
            allowedUsernames: string[];
            clientID?: string | undefined;
            clientSecret?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            allowedIds?: string[] | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUsernames?: string[] | undefined;
        }>>, {
            enabled: boolean;
            allowedIds: string[];
            scope: string;
            allowedUsernames: string[];
            clientID?: string | undefined;
            clientSecret?: string | undefined;
        } | undefined, {
            enabled?: boolean | undefined;
            allowedIds?: string[] | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUsernames?: string[] | undefined;
        } | undefined>, {
            enabled: boolean;
            allowedIds: string[];
            scope: string;
            allowedUsernames: string[];
            clientID?: string | undefined;
            clientSecret?: string | undefined;
        } | undefined, {
            enabled?: boolean | undefined;
            allowedIds?: string[] | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUsernames?: string[] | undefined;
        } | undefined>;
        discord: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            clientID: z.ZodOptional<z.ZodString>;
            clientSecret: z.ZodOptional<z.ZodString>;
            scope: z.ZodDefault<z.ZodString>;
            allowedUserIDs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            allowedGuilds: z.ZodDefault<z.ZodArray<z.ZodObject<{
                guildID: z.ZodString;
                allowedRoleIDs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                guildBotToken: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                guildID: string;
                allowedRoleIDs: string[];
                guildBotToken: string;
            }, {
                guildID: string;
                allowedRoleIDs?: string[] | undefined;
                guildBotToken?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
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
        }, {
            enabled?: boolean | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUserIDs?: string[] | undefined;
            allowedGuilds?: {
                guildID: string;
                allowedRoleIDs?: string[] | undefined;
                guildBotToken?: string | undefined;
            }[] | undefined;
        }>>, {
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
        } | undefined, {
            enabled?: boolean | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUserIDs?: string[] | undefined;
            allowedGuilds?: {
                guildID: string;
                allowedRoleIDs?: string[] | undefined;
                guildBotToken?: string | undefined;
            }[] | undefined;
        } | undefined>, {
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
        } | undefined, {
            enabled?: boolean | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUserIDs?: string[] | undefined;
            allowedGuilds?: {
                guildID: string;
                allowedRoleIDs?: string[] | undefined;
                guildBotToken?: string | undefined;
            }[] | undefined;
        } | undefined>;
        local: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            allowedUsers: z.ZodDefault<z.ZodArray<z.ZodObject<{
                username: z.ZodString;
                password: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                username: string;
                password: string;
            }, {
                username: string;
                password: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            allowedUsers: {
                username: string;
                password: string;
            }[];
        }, {
            enabled?: boolean | undefined;
            allowedUsers?: {
                username: string;
                password: string;
            }[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
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
    }, {
        enabled?: boolean | undefined;
        sessionSecret?: string | undefined;
        forceHttpsReturn?: boolean | undefined;
        steam?: {
            enabled?: boolean | undefined;
            apiKey?: string | undefined;
            allowedIds?: string[] | undefined;
        } | undefined;
        twitch?: {
            enabled?: boolean | undefined;
            allowedIds?: string[] | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUsernames?: string[] | undefined;
        } | undefined;
        discord?: {
            enabled?: boolean | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUserIDs?: string[] | undefined;
            allowedGuilds?: {
                guildID: string;
                allowedRoleIDs?: string[] | undefined;
                guildBotToken?: string | undefined;
            }[] | undefined;
        } | undefined;
        local?: {
            enabled?: boolean | undefined;
            allowedUsers?: {
                username: string;
                password: string;
            }[] | undefined;
        } | undefined;
    }>, {
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
    }, {
        enabled?: boolean | undefined;
        sessionSecret?: string | undefined;
        forceHttpsReturn?: boolean | undefined;
        steam?: {
            enabled?: boolean | undefined;
            apiKey?: string | undefined;
            allowedIds?: string[] | undefined;
        } | undefined;
        twitch?: {
            enabled?: boolean | undefined;
            allowedIds?: string[] | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUsernames?: string[] | undefined;
        } | undefined;
        discord?: {
            enabled?: boolean | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUserIDs?: string[] | undefined;
            allowedGuilds?: {
                guildID: string;
                allowedRoleIDs?: string[] | undefined;
                guildBotToken?: string | undefined;
            }[] | undefined;
        } | undefined;
        local?: {
            enabled?: boolean | undefined;
            allowedUsers?: {
                username: string;
                password: string;
            }[] | undefined;
        } | undefined;
    }>>;
    ssl: z.ZodEffects<z.ZodEffects<z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        allowHTTP: z.ZodDefault<z.ZodBoolean>;
        keyPath: z.ZodOptional<z.ZodString>;
        certificatePath: z.ZodOptional<z.ZodString>;
        passphrase: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        allowHTTP: boolean;
        keyPath?: string | undefined;
        certificatePath?: string | undefined;
        passphrase?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        allowHTTP?: boolean | undefined;
        keyPath?: string | undefined;
        certificatePath?: string | undefined;
        passphrase?: string | undefined;
    }>>, {
        enabled: boolean;
        allowHTTP: boolean;
        keyPath?: string | undefined;
        certificatePath?: string | undefined;
        passphrase?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        allowHTTP?: boolean | undefined;
        keyPath?: string | undefined;
        certificatePath?: string | undefined;
        passphrase?: string | undefined;
    } | undefined>, {
        enabled: boolean;
        allowHTTP: boolean;
        keyPath?: string | undefined;
        certificatePath?: string | undefined;
        passphrase?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        allowHTTP?: boolean | undefined;
        keyPath?: string | undefined;
        certificatePath?: string | undefined;
        passphrase?: string | undefined;
    } | undefined>;
    sentry: z.ZodEffects<z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        dsn: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        dsn?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        dsn?: string | undefined;
    }>>, {
        enabled: boolean;
        dsn?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        dsn?: string | undefined;
    } | undefined>;
}, "strip", z.ZodTypeAny, {
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
    baseURL?: string | undefined;
}, {
    host?: string | undefined;
    port?: number | undefined;
    baseURL?: string | undefined;
    exitOnUncaught?: boolean | undefined;
    logging?: {
        console?: {
            enabled?: boolean | undefined;
            level?: "verbose" | "debug" | "info" | "warn" | "error" | "silent" | undefined;
            timestamps?: boolean | undefined;
            replicants?: boolean | undefined;
        } | undefined;
        file?: {
            path?: string | undefined;
            enabled?: boolean | undefined;
            level?: "verbose" | "debug" | "info" | "warn" | "error" | "silent" | undefined;
            timestamps?: boolean | undefined;
            replicants?: boolean | undefined;
        } | undefined;
    } | undefined;
    bundles?: {
        enabled?: string[] | null | undefined;
        disabled?: string[] | null | undefined;
        paths?: string[] | undefined;
    } | undefined;
    login?: {
        enabled?: boolean | undefined;
        sessionSecret?: string | undefined;
        forceHttpsReturn?: boolean | undefined;
        steam?: {
            enabled?: boolean | undefined;
            apiKey?: string | undefined;
            allowedIds?: string[] | undefined;
        } | undefined;
        twitch?: {
            enabled?: boolean | undefined;
            allowedIds?: string[] | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUsernames?: string[] | undefined;
        } | undefined;
        discord?: {
            enabled?: boolean | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUserIDs?: string[] | undefined;
            allowedGuilds?: {
                guildID: string;
                allowedRoleIDs?: string[] | undefined;
                guildBotToken?: string | undefined;
            }[] | undefined;
        } | undefined;
        local?: {
            enabled?: boolean | undefined;
            allowedUsers?: {
                username: string;
                password: string;
            }[] | undefined;
        } | undefined;
    } | undefined;
    ssl?: {
        enabled?: boolean | undefined;
        allowHTTP?: boolean | undefined;
        keyPath?: string | undefined;
        certificatePath?: string | undefined;
        passphrase?: string | undefined;
    } | undefined;
    sentry?: {
        enabled?: boolean | undefined;
        dsn?: string | undefined;
    } | undefined;
}>, {
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
}, {
    host?: string | undefined;
    port?: number | undefined;
    baseURL?: string | undefined;
    exitOnUncaught?: boolean | undefined;
    logging?: {
        console?: {
            enabled?: boolean | undefined;
            level?: "verbose" | "debug" | "info" | "warn" | "error" | "silent" | undefined;
            timestamps?: boolean | undefined;
            replicants?: boolean | undefined;
        } | undefined;
        file?: {
            path?: string | undefined;
            enabled?: boolean | undefined;
            level?: "verbose" | "debug" | "info" | "warn" | "error" | "silent" | undefined;
            timestamps?: boolean | undefined;
            replicants?: boolean | undefined;
        } | undefined;
    } | undefined;
    bundles?: {
        enabled?: string[] | null | undefined;
        disabled?: string[] | null | undefined;
        paths?: string[] | undefined;
    } | undefined;
    login?: {
        enabled?: boolean | undefined;
        sessionSecret?: string | undefined;
        forceHttpsReturn?: boolean | undefined;
        steam?: {
            enabled?: boolean | undefined;
            apiKey?: string | undefined;
            allowedIds?: string[] | undefined;
        } | undefined;
        twitch?: {
            enabled?: boolean | undefined;
            allowedIds?: string[] | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUsernames?: string[] | undefined;
        } | undefined;
        discord?: {
            enabled?: boolean | undefined;
            clientID?: string | undefined;
            clientSecret?: string | undefined;
            scope?: string | undefined;
            allowedUserIDs?: string[] | undefined;
            allowedGuilds?: {
                guildID: string;
                allowedRoleIDs?: string[] | undefined;
                guildBotToken?: string | undefined;
            }[] | undefined;
        } | undefined;
        local?: {
            enabled?: boolean | undefined;
            allowedUsers?: {
                username: string;
                password: string;
            }[] | undefined;
        } | undefined;
    } | undefined;
    ssl?: {
        enabled?: boolean | undefined;
        allowHTTP?: boolean | undefined;
        keyPath?: string | undefined;
        certificatePath?: string | undefined;
        passphrase?: string | undefined;
    } | undefined;
    sentry?: {
        enabled?: boolean | undefined;
        dsn?: string | undefined;
    } | undefined;
}>;
export type NodeCGConfig = z.infer<typeof nodecgConfigSchema>;
