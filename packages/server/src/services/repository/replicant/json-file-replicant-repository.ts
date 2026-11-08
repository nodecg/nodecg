import {
	Effect,
	FileSystem,
	Layer,
	Path,
	Schedule,
	Schema,
	SchemaIssue,
} from "effect";

import { resolveDataDir } from "../../../data-dir.ts";
import { OperatingSystemService } from "../../operating-system/operating-system.ts";
import { BackendError } from "../repository-errors.ts";
import {
	DecodeError,
	ReplicantNotFound,
	ReplicantRepositoryService,
} from "./replicant-repository.ts";

const decodeJson = Schema.decodeEffect(Schema.fromJsonString(Schema.Json));
const encodeJson = Schema.encodeEffect(Schema.fromJsonString(Schema.Json));
const formatIssue = SchemaIssue.makeFormatterDefault();

const isFileLockError = Schema.is(
	Schema.Struct({
		code: Schema.Literals(["EPERM", "EBUSY"]),
	}),
);

export const JsonFileReplicantRepository = Layer.effect(
	ReplicantRepositoryService,
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const operatingSystem = yield* OperatingSystemService;
		const root = path.join(yield* resolveDataDir(), "replicants");
		yield* Effect.logInfo(`Storing replicants in ${root}`);

		const directory = (namespace: string) => path.join(root, namespace);
		const file = (namespace: string, name: string) =>
			path.join(directory(namespace), `${name}.json`);

		const read = Effect.fn("ReplicantRepository.read")(
			function* (namespace: string, name: string) {
				const text = yield* fs
					.readFileString(file(namespace, name))
					.pipe(
						Effect.catchReason("PlatformError", "NotFound", () =>
							ReplicantNotFound.make({ namespace, name }),
						),
					);
				return yield* decodeJson(text);
			},
			Effect.catchTags({
				PlatformError: (cause) => BackendError.make({ cause }),
				SchemaError: (error) =>
					DecodeError.make({ issue: formatIssue(error.issue) }),
			}),
		);

		const write = Effect.fn("ReplicantRepository.write")(
			function* (namespace: string, name: string, value: Schema.Json) {
				const target = file(namespace, name);
				const temporary = `${target}.tmp`;
				const bytes = new TextEncoder().encode(yield* encodeJson(value));
				const writeTemporary = fs.open(temporary, { flag: "w" }).pipe(
					Effect.tap((handle) => handle.writeAll(bytes)),
					Effect.tap((handle) => handle.sync),
					Effect.scoped,
				);
				yield* writeTemporary.pipe(
					Effect.catchReason("PlatformError", "NotFound", () =>
						fs
							.makeDirectory(directory(namespace), { recursive: true })
							.pipe(Effect.andThen(writeTemporary)),
					),
				);

				yield* fs.rename(temporary, target).pipe(
					// Windows might randomly lock files, e.g. for an antivirus scan
					Effect.retry({
						while: (error) =>
							operatingSystem === "windows" && isFileLockError(error.cause),
						schedule: Schedule.spaced("100 millis").pipe(
							Schedule.upTo({ duration: "1 minute" }),
						),
					}),
				);
			},
			Effect.catchTag(["PlatformError", "SchemaError"], (cause) =>
				BackendError.make({ cause }),
			),
		);

		return { read, write };
	}),
);
