import { SqliteClient } from "@effect/sql-sqlite-node";
import { sql } from "drizzle-orm";
import * as SQLiteNodeDrizzle from "drizzle-orm/effect-sqlite-node";
import { migrate } from "drizzle-orm/effect-sqlite-node/migrator";
import {
	Array,
	Context,
	Effect,
	FileSystem,
	Layer,
	Option,
	Path,
	Schema,
} from "effect";

import { resolveDataDir } from "../../../data-dir.ts";
import { findPackageRoot } from "../../../package-root.ts";
import { BackendError } from "../../repository/repository-errors.ts";
import { relations } from "./relations.ts";

export class MigrationsNotFound extends Schema.TaggedError<MigrationsNotFound>()(
	"MigrationsNotFound",
	{ from: Schema.String },
) {
	override readonly message = `No package.json at or above ${this.from}, so the SQLite migrations cannot be located`;
}

const SQLITE_DATABASE_FILENAME = "nodecg.sqlite3";

const systemDatabaseFile = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	const dataDir = yield* resolveDataDir();
	yield* fs.makeDirectory(dataDir, { recursive: true });
	const file = path.join(dataDir, SQLITE_DATABASE_FILENAME);
	yield* Effect.logInfo(`Storing system data in ${file}`);
	return file;
}).pipe(
	Effect.catchTag("PlatformError", (cause) => BackendError.make({ cause })),
);

export class DrizzleSqliteDatabaseService extends Context.Service<DrizzleSqliteDatabaseService>()(
	"DrizzleSqliteDatabase",
	{
		make: Effect.fn("DrizzleSqliteDatabase.make")(
			function* (filename: string) {
				const path = yield* Path.Path;
				const client = yield* SqliteClient.make({ filename });
				const db = yield* SQLiteNodeDrizzle.makeWithDefaults({
					relations,
				}).pipe(Effect.provideService(SqliteClient.SqliteClient, client));
				const moduleDirectory = yield* path.fromFileUrl(
					new URL(".", import.meta.url),
				);
				const packageRoot = yield* findPackageRoot(moduleDirectory);
				if (Option.isNone(packageRoot)) {
					return yield* MigrationsNotFound.make({ from: moduleDirectory });
				}
				yield* migrate(db, {
					migrationsFolder: path.join(
						packageRoot.value,
						"migrations",
						"drizzle-sqlite",
					),
				});
				return db;
			},
			Effect.catchTag(
				[
					"BadArgument",
					"PlatformError",
					"MigratorInitError",
					"EffectDrizzleQueryError",
					"SqlError",
				],
				(cause) => BackendError.make({ cause }),
			),
		),
	},
) {
	static readonly layer = Layer.effect(
		this,
		systemDatabaseFile.pipe(Effect.flatMap(this.make)),
	);
}

const decodeMaxVariableNumber = Schema.decodeUnknownEffect(
	Schema.NonEmptyArray(
		Schema.Struct({
			value: Schema.TemplateLiteralParser([
				"MAX_VARIABLE_NUMBER=",
				Schema.FiniteFromString,
			]),
		}),
	),
);

const readMaxVariableNumber = Effect.gen(function* () {
	const db = yield* DrizzleSqliteDatabaseService;
	const rows = yield* db.all(
		sql`
			SELECT compile_options AS value
			FROM pragma_compile_options
			WHERE compile_options LIKE 'MAX_VARIABLE_NUMBER=%'
		`,
	);
	const limits = yield* decodeMaxVariableNumber(rows);
	return Array.headNonEmpty(limits).value[1];
});

export const makeQueryInChunks = Effect.gen(function* () {
	const maxVariableNumber = yield* readMaxVariableNumber;
	return <Row extends object, A, E, R>(
		rows: ReadonlyArray<Row>,
		query: (chunk: Array.NonEmptyArray<Row>) => Effect.Effect<A, E, R>,
	) =>
		Effect.forEach(
			Array.match(rows, {
				onEmpty: () => [],
				onNonEmpty: (rows) =>
					Array.chunksOf(
						rows,
						Math.floor(
							maxVariableNumber / Object.keys(Array.headNonEmpty(rows)).length,
						),
					),
			}),
			query,
			{ discard: true },
		);
});
