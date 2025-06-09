import { DatabaseAdapter } from "@nodecg/database-adapter-types";
import type express from "express";
import type * as ExpressCore from "express-serve-static-core";
import { NodeCGConfig } from "./nodecg-config-schema";
import type { ClientToServerEvents, ServerToClientEvents } from "./socket-protocol";
type Person = {
    name: string;
    email?: string;
    url?: string;
} | string;
export declare namespace NodeCG {
    /**
     * A collection of types that represent the raw data from the `nodecg` stanza in a bundle's `package.json`.
     */
    namespace Manifest {
        /**
         * An unparsed `assetCategory` from a bundle's `package.json`.
         */
        interface UnparsedAssetCategory {
            name: string;
            title: string;
            allowedTypes?: string[];
        }
        /**
         * An unparsed `panel` from a bundle's `package.json`.
         */
        interface UnparsedPanel {
            name: string;
            title: string;
            file: string;
            headerColor?: string;
            fullbleed?: boolean;
            workspace?: string;
            dialog?: boolean;
            dialogButtons?: {
                name: string;
                type: "dismiss" | "confirm";
            }[];
            width?: number;
        }
        /**
         * An unparsed `graphic` from a bundle's `package.json`.
         */
        interface UnparsedGraphic {
            file: string;
            width: number;
            height: number;
            singleInstance?: boolean;
        }
        /**
         * An unparsed `mount` configuration from a bundle's `package.json`.
         */
        interface UnparsedMount {
            directory: string;
            endpoint: string;
        }
        /**
         * An unparsed `soundCue` from a bundle's `package.json`.
         */
        interface UnparsedSoundCue {
            name: string;
            assignable?: boolean;
            defaultVolume?: number;
            defaultFile?: string;
        }
        /**
         * An unparsed record of `bundleDependencies` from a bundle's `package.json`.
         */
        type UnparsedBundleDependencies = Record<string, string>;
        /**
         * The actual structure of a bundle's `nodecg` stanza from it's `package.json`.
         */
        interface UnparsedManifest {
            compatibleRange?: string;
            transformBareModuleSpecifiers?: boolean;
            dashboardPanels?: UnparsedPanel[];
            graphics?: UnparsedGraphic[];
            assetCategories?: UnparsedAssetCategory[];
            mount?: UnparsedMount[];
            soundCues?: UnparsedSoundCue[];
            bundleDependencies?: UnparsedBundleDependencies;
        }
    }
    /**
     * The rough structure of a bundle's `package.json`.
     * Only includes types that NodeCG cares about.
     */
    interface PackageJSON {
        name: string;
        version: string;
        license?: string;
        description?: string;
        homepage?: string;
        author?: Person;
        contributors?: Person[];
        nodecg?: Manifest.UnparsedManifest;
    }
    /**
     * A _parsed_ bundle manifest as used internally by NodeCG.
     */
    type Manifest = Omit<PackageJSON, "nodecg"> & Manifest.UnparsedManifest & {
        transformBareModuleSpecifiers: boolean;
    };
    /**
     * A collection of types that comprise a `bundle`.
     */
    namespace Bundle {
        type GitData = undefined | {
            branch: string;
            hash: string;
            shortHash: string;
        } | {
            branch: string;
            hash: string;
            shortHash: string;
            date: string;
            message: string;
        };
        type Graphic = {
            url: string;
        } & Required<Manifest.UnparsedGraphic>;
        type Panel = Manifest.UnparsedPanel & {
            path: string;
            headerColor: string;
            bundleName: string;
            html: string;
        } & ({
            dialog: false;
            workspace: string;
        } | {
            dialog: true;
        }) & ({
            fullbleed: false;
            width: number;
        } | {
            fullbleed: true;
        });
        type Mount = Manifest.UnparsedMount;
        type SoundCue = Manifest.UnparsedSoundCue;
        type AssetCategory = Manifest.UnparsedAssetCategory;
        type BundleDependencies = Manifest.UnparsedBundleDependencies;
        type UnknownConfig = Record<string, unknown>;
    }
    interface NodecgBundleConfig {
        databaseAdapter?: DatabaseAdapter;
    }
    /**
     * The actual type of a `bundle`.
     */
    interface Bundle {
        name: string;
        version: string;
        license?: string;
        description?: string;
        homepage?: string;
        author?: Person;
        contributors?: Person[];
        dir: string;
        git: Bundle.GitData;
        transformBareModuleSpecifiers: boolean;
        hasAssignableSoundCues: boolean;
        hasExtension: boolean;
        config: Bundle.UnknownConfig;
        dashboard: {
            dir: string;
            panels: Bundle.Panel[];
        };
        graphics: Bundle.Graphic[];
        assetCategories: Bundle.AssetCategory[];
        mount: Bundle.Mount[];
        soundCues: Bundle.SoundCue[];
        compatibleRange?: string;
        bundleDependencies?: Bundle.BundleDependencies;
        nodecgBundleConfig: NodecgBundleConfig;
    }
    /**
     * NodeCG's socket protocol.
     * It is unikely that you will need to use this directly.
     * Does not include builtin Socket.IO events such as `connect`, `disconnect`, etc.
     */
    interface SocketProtocol {
        serverToClient: ServerToClientEvents;
        clientToServer: ClientToServerEvents;
    }
    /**
     * The full, parsed NodeCG config (i.e `cfg/nodecg.{json,yaml,js}`).
     * Contains sensitive secrets!
     * Available to server-side code (extensions) only.
     */
    type Config = NodeCGConfig;
    /**
     * The filtered, minimal, parsed NodeCG config (i.e `cfg/nodecg.{json,yaml,js}`).
     * Does not contain any sensitive secrets.
     * Available to client-side code (dashboard, graphics) only.
     */
    interface FilteredConfig {
        host: string;
        port: number;
        baseURL: string;
        logging: {
            console: {
                enabled: boolean;
                level: string;
                timestamps: boolean;
                replicants: boolean;
            };
            file: {
                enabled: boolean;
                level: string;
                timestamps: boolean;
                replicants: boolean;
            };
        };
        sentry: {
            enabled: boolean;
            dsn?: string;
        };
        login: {
            enabled: boolean;
            steam?: {
                enabled: boolean;
            };
            twitch?: {
                enabled: boolean;
                clientID?: string;
                scope?: string;
            };
            local?: {
                enabled: boolean;
            };
            discord?: {
                enabled: boolean;
                clientID?: string;
                scope?: string;
            };
        };
        ssl?: {
            enabled: boolean;
        };
    }
    /**
     * A sound cue `file`, as used in sound cue Replicants.
     */
    interface CueFile {
        sum: string;
        base: string;
        ext: string;
        name: string;
        url: string;
        default: boolean;
    }
    /**
     * A sound cue definition, as used in sound cue Replicants.
     */
    interface SoundCue {
        name: string;
        volume: number;
        file?: CueFile;
        assignable: boolean;
        channels?: number;
        bundleName?: TemplateStringsArray;
        defaultVolume?: number | undefined;
        defaultFile?: CueFile;
    }
    /**
     * An asset file, as used in assets Replicants.
     */
    interface AssetFile {
        sum: string;
        base: string;
        ext: string;
        name: string;
        namespace: string;
        category: string;
        url: string;
    }
    /**
     * A namespace containing various types used in the Replicant system.
     * It should be unlikely that you need to use these directly.
     */
    namespace Replicant {
        type Options<D> = OptionsNoDefault | OptionsWithDefault<D>;
        interface OptionsNoDefault {
            persistent?: boolean;
            persistenceInterval?: number;
            schemaPath?: string;
        }
        interface OptionsWithDefault<D> {
            persistent?: boolean;
            persistenceInterval?: number;
            schemaPath?: string;
            defaultValue: D;
        }
        type Operation<T> = {
            path: string;
        } & ({
            method: "overwrite";
            args: {
                newValue: T | undefined;
            };
        } | {
            method: "delete";
            args: {
                prop: string | number | symbol;
            };
        } | {
            method: "add";
            args: {
                prop: string;
                newValue: any;
            };
        } | {
            method: "update";
            args: {
                prop: string;
                newValue: any;
            };
        } | {
            method: "copyWithin";
            args: {
                mutatorArgs: Parameters<any[]["copyWithin"]>;
            };
        } | {
            method: "fill";
            args: {
                mutatorArgs: Parameters<any[]["fill"]>;
            };
        } | {
            method: "pop";
        } | {
            method: "push";
            args: {
                mutatorArgs: Parameters<any[]["push"]>;
            };
        } | {
            method: "reverse";
        } | {
            method: "shift";
        } | {
            method: "sort";
            args: {
                mutatorArgs: Parameters<any[]["sort"]>;
            };
        } | {
            method: "splice";
            args: {
                mutatorArgs: Parameters<any[]["splice"]>;
            };
        } | {
            method: "unshift";
            args: {
                mutatorArgs: Parameters<any[]["unshift"]>;
            };
        });
    }
    /**
     * Express middleware that can be mounted to NodeCG's webserver via `nodecg.mount`.
     */
    type Middleware = ExpressCore.ApplicationRequestHandler<express.Application>;
    /**
     * A description of an instance of a currently-open graphic.
     * It is unlikely that you will need to use this type directly.
     */
    interface GraphicsInstance {
        ipv4: string;
        timestamp: number;
        bundleName: string;
        bundleVersion?: string;
        bundleGit: Bundle.GitData;
        pathName: string;
        singleInstance: boolean;
        socketId: string;
        open: boolean;
        potentiallyOutOfDate: boolean;
    }
    /**
     * A description of a dashboard workspace.
     * It is unlikely that you will need to use this type directly.
     */
    interface Workspace {
        name: string;
        label: string;
        route: string;
        fullbleed?: boolean;
    }
    /**
     * A handled `listenFor` acknowledgement.
     * Attempting to call/invoke a handled acknowledgement will throw an error.
     */
    interface HandledAcknowledgement {
        handled: true;
    }
    /**
     * An unhandled `listenFor` acknowledgement.
     * It can safely be called/invoked.
     */
    interface UnhandledAcknowledgement {
        handled: false;
        (err?: any, response?: unknown): void;
    }
    /**
     * A `listenFor` acknowledgement, sent from client to server.
     */
    type Acknowledgement = HandledAcknowledgement | UnhandledAcknowledgement;
    /**
     * A `listenFor` handler function/callback.
     */
    type ListenHandler = (data: any, ack?: Acknowledgement) => void;
    /**
     * A description of NodeCG's logger interface.
     */
    interface Logger {
        name: string;
        trace: (...args: any[]) => void;
        debug: (...args: any[]) => void;
        info: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
        replicants: (...args: any[]) => void;
    }
    /**
     * The logging levels available to NodeCG.
     */
    enum LogLevel {
        Trace = "verbose",
        Debug = "debug",
        Info = "info",
        Warn = "warn",
        Error = "error",
        Silent = "silent"
    }
    /**
     * A description of which platform/environment an instance of the NodeCG API is being used in.
     * It should not be necessary to ever use this type directly in your bundle's code.
     */
    type Platform = "server" | "client";
}
export {};
