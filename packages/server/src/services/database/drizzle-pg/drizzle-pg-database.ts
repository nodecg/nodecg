import type { EffectPgDatabase } from "drizzle-orm/effect-postgres";
import { Context } from "effect";

export class DrizzlePgDatabaseService extends Context.Service<
	DrizzlePgDatabaseService,
	EffectPgDatabase
>()("DrizzlePgDatabase") {}
