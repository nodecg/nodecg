import { InternalApi, PublicApi } from "@nodecg-next/internal";
import { HttpApi } from "effect/http-api";

export const RootApi = HttpApi.make("NodeCG")
	.addHttpApi(InternalApi)
	.addHttpApi(PublicApi);
