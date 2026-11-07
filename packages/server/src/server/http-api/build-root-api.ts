import { Layer } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { RootApi } from "../root-api.ts";
import { InternalGroupsLive } from "./api-internal.ts";
import { PublicGroupsLive } from "./api-v0.ts";

export const RootApiLive = HttpApiBuilder.layer(RootApi).pipe(
	Layer.provide(InternalGroupsLive),
	Layer.provide(PublicGroupsLive),
);
