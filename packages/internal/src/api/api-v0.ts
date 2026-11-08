import { HttpApi } from "effect/http-api";

import { ServiceAccountAuthenticationMiddleware } from "../auth.ts";
import { fieldGroup } from "./shared.ts";

export const PublicApi = HttpApi.make("PublicApi")
	.add(
		fieldGroup("PublicField").middleware(
			ServiceAccountAuthenticationMiddleware,
		),
	)
	.prefix("/api/v0");
