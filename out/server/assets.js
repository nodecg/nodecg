"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssetsMiddleware = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importStar(require("node:path"));
const internal_util_1 = require("@nodecg/internal-util");
const chokidar_1 = __importDefault(require("chokidar"));
const express_1 = __importDefault(require("express"));
const hasha_1 = __importDefault(require("hasha"));
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const errors_1 = require("../shared/utils/errors");
const logger_1 = require("./logger");
const authcheck_1 = require("./util/authcheck");
const debounce_name_1 = require("./util/debounce-name");
const send_file_1 = require("./util/send-file");
const logger = (0, logger_1.createLogger)("assets");
const getAssetsPath = () => node_path_1.default.join((0, internal_util_1.getNodecgRoot)(), "assets");
const createAssetFile = (filepath, sum) => {
    const parsedPath = node_path_1.default.parse(filepath);
    const parts = parsedPath.dir
        .replace(getAssetsPath() + node_path_1.default.sep, "")
        .split(node_path_1.default.sep);
    return {
        sum,
        base: parsedPath.base,
        ext: parsedPath.ext,
        name: parsedPath.name,
        namespace: parts[0],
        category: parts[1],
        url: `/assets/${parts[0]}/${parts[1]}/${encodeURIComponent(parsedPath.base)}`,
    };
};
const prepareNamespaceAssetsPath = (namespace) => {
    const assetsPath = node_path_1.default.join(getAssetsPath(), namespace);
    if (!node_fs_1.default.existsSync(assetsPath)) {
        node_fs_1.default.mkdirSync(assetsPath);
    }
    return assetsPath;
};
const repsByNamespace = new Map();
const getCollectRep = (namespace, category) => {
    return repsByNamespace.get(namespace)?.get(category);
};
const resolveDeferreds = (deferredFiles) => {
    let foundNull = false;
    deferredFiles.forEach((uf) => {
        if (uf === null) {
            foundNull = true;
        }
    });
    if (!foundNull) {
        deferredFiles.forEach((uploadedFile) => {
            if (!uploadedFile) {
                return;
            }
            const rep = getCollectRep(uploadedFile.namespace, uploadedFile.category);
            if (rep) {
                rep.value.push(uploadedFile);
            }
        });
        deferredFiles.clear();
    }
};
const createAssetsMiddleware = (bundles, replicator) => {
    const assetsPath = getAssetsPath();
    if (!node_fs_1.default.existsSync(assetsPath)) {
        node_fs_1.default.mkdirSync(assetsPath);
    }
    const collectionsRep = replicator.declare("collections", "_assets", {
        defaultValue: [],
        persistent: false,
    });
    const collections = [];
    for (const bundle of bundles) {
        if (!bundle.hasAssignableSoundCues &&
            (!bundle.assetCategories || bundle.assetCategories.length <= 0)) {
            continue;
        }
        // If this bundle has sounds && at least one of those sounds is assignable, create the assets:sounds replicant.
        if (bundle.hasAssignableSoundCues) {
            bundle.assetCategories.unshift({
                name: "sounds",
                title: "Sounds",
                allowedTypes: ["mp3", "ogg"],
            });
        }
        collections.push({
            name: bundle.name,
            categories: bundle.assetCategories,
        });
    }
    const watchDirs = [];
    for (const collection of collections) {
        const namespacedAssetsPath = prepareNamespaceAssetsPath(collection.name);
        const collectionReps = new Map();
        repsByNamespace.set(collection.name, collectionReps);
        collectionsRep.value.push({
            name: collection.name,
            categories: collection.categories,
        });
        for (const category of collection.categories) {
            const categoryPath = node_path_1.default.join(namespacedAssetsPath, category.name);
            if (!node_fs_1.default.existsSync(categoryPath)) {
                node_fs_1.default.mkdirSync(categoryPath);
            }
            collectionReps.set(category.name, replicator.declare(`assets:${category.name}`, collection.name, {
                defaultValue: [],
                persistent: false,
            }));
            if (category.allowedTypes && category.allowedTypes.length > 0) {
                watchDirs.push({
                    path: categoryPath,
                    types: category.allowedTypes ?? [],
                });
            }
            else {
                watchDirs.push({
                    path: categoryPath,
                    types: [],
                });
            }
        }
    }
    // Chokidar does not accept Windows-style path separators when using globs
    const fixedPaths = Array.from(watchDirs).map((pattern) => ({
        ...pattern,
        path: pattern.path.replace(/\\/g, "/"),
    }));
    const watcher = chokidar_1.default.watch(fixedPaths.map((path) => path.path), {
        ignored: (val, stats) => {
            if (!stats?.isFile()) {
                return false;
            }
            for (const path of fixedPaths) {
                if (val.startsWith(path.path)) {
                    const matchesType = path.types.includes((0, node_path_1.extname)(val).slice(1));
                    return !matchesType; // If it matches the type, don't ignore it.
                }
            }
            return false;
        },
    });
    /**
     * When the Chokidar watcher first starts up, it will fire an 'add' event for each file found.
     * After that, it will emit the 'ready' event.
     * To avoid thrashing the replicant, we want to add all of these first files at once.
     * This is what the ready Boolean, deferredFiles Map, and resolveDeferreds function are for.
     */
    let ready = false;
    const deferredFiles = new Map();
    watcher.on("add", async (filepath) => {
        if (!ready) {
            deferredFiles.set(filepath, undefined);
        }
        try {
            const sum = await hasha_1.default.fromFile(filepath, { algorithm: "sha1" });
            const uploadedFile = createAssetFile(filepath, sum);
            if (deferredFiles) {
                deferredFiles.set(filepath, uploadedFile);
                resolveDeferreds(deferredFiles);
            }
            else {
                const rep = getCollectRep(uploadedFile.namespace, uploadedFile.category);
                if (rep) {
                    rep.value.push(uploadedFile);
                }
            }
        }
        catch (err) {
            if (deferredFiles) {
                deferredFiles.delete(filepath);
            }
            logger.error((0, errors_1.stringifyError)(err));
        }
    });
    watcher.on("ready", () => {
        ready = true;
    });
    watcher.on("change", (filepath) => {
        (0, debounce_name_1.debounceName)(filepath, async () => {
            try {
                const sum = await hasha_1.default.fromFile(filepath, { algorithm: "sha1" });
                const newUploadedFile = createAssetFile(filepath, sum);
                const rep = getCollectRep(newUploadedFile.namespace, newUploadedFile.category);
                if (!rep) {
                    throw new Error("should have had a replicant here");
                }
                const index = rep.value.findIndex((uf) => uf.url === newUploadedFile.url);
                if (index > -1) {
                    rep.value.splice(index, 1, newUploadedFile);
                }
                else {
                    rep.value.push(newUploadedFile);
                }
            }
            catch (err) {
                logger.error((0, errors_1.stringifyError)(err));
            }
        });
    });
    watcher.on("unlink", (filepath) => {
        const deletedFile = createAssetFile(filepath, "temp");
        const rep = getCollectRep(deletedFile.namespace, deletedFile.category);
        if (!rep) {
            return;
        }
        rep.value.some((assetFile, index) => {
            if (assetFile.url === deletedFile.url) {
                rep.value.splice(index, 1);
                logger.debug('"%s" was deleted', deletedFile.url);
                return true;
            }
            return false;
        });
    });
    watcher.on("error", (e) => {
        logger.error(e.stack);
    });
    const assetsRouter = express_1.default.Router();
    const upload = (0, multer_1.default)({
        storage: multer_1.default.diskStorage({
            destination: getAssetsPath(),
            filename: (req, file, cb) => {
                const params = req.params;
                cb(null, `${params["namespace"]}/${params["category"]}/${Buffer.from(file.originalname, "latin1").toString("utf8")}`);
            },
        }),
    });
    const uploader = upload.array("file", 64);
    // Retrieving existing files
    const getParamsSchema = zod_1.z.object({
        namespace: zod_1.z.string(),
        category: zod_1.z.string(),
        filePath: zod_1.z.string(),
    });
    assetsRouter.get("/:namespace/:category/:filePath", 
    // Check if the user is authorized.
    authcheck_1.authCheck, 
    // Send the file (or an appropriate error).
    (req, res, next) => {
        const params = getParamsSchema.parse(req.params);
        const parentDir = getAssetsPath();
        const fullPath = node_path_1.default.join(parentDir, params.namespace, params.category, params.filePath);
        (0, send_file_1.sendFile)(parentDir, fullPath, res, next);
    });
    // Upload new files
    assetsRouter.post("/:namespace/:category", 
    // Check if the user is authorized.
    authcheck_1.authCheck, 
    // Then receive the files they are sending, up to a max of 64.
    (req, res, next) => {
        uploader(req, res, (err) => {
            if (err) {
                console.error(err);
                res.send(500);
                return;
            }
            next();
        });
    }, 
    // Then send a response.
    (req, res) => {
        if (req.files) {
            res.status(200).send("Success");
        }
        else {
            res.status(400).send("Bad Request");
        }
    });
    // Deleting existing files
    const deleteParamsSchema = zod_1.z.object({
        namespace: zod_1.z.string(),
        category: zod_1.z.string(),
        filename: zod_1.z.string(),
    });
    assetsRouter.delete("/:namespace/:category/:filename", 
    // Check if the user is authorized.
    authcheck_1.authCheck, 
    // Delete the file (or an send appropriate error).
    (req, res) => {
        const params = deleteParamsSchema.parse(req.params);
        const fullPath = node_path_1.default.join(getAssetsPath(), params.namespace, params.category, params.filename);
        node_fs_1.default.unlink(fullPath, (err) => {
            if (err) {
                if (err.code === "ENOENT") {
                    return res
                        .status(410)
                        .send(`The file to delete does not exist: ${params.filename}`);
                }
                logger.error(`Failed to delete file ${fullPath}`, err);
                return res
                    .status(500)
                    .send(`Failed to delete file: ${params.filename}`);
            }
            return res.sendStatus(200);
        });
    });
    return assetsRouter;
};
exports.createAssetsMiddleware = createAssetsMiddleware;
//# sourceMappingURL=assets.js.map