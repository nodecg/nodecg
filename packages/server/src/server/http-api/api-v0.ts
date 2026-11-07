import { CurrentIdentity, CurrentServiceAccount } from "@nodecg-next/internal";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { RootApi } from "../root-api.ts";
import {
	callRpc,
	getComputed,
	getReplicant,
	publishTopic,
	updateReplicant,
} from "./shared.ts";

const provideIdentity = Effect.provideServiceEffect(
	CurrentIdentity,
	Effect.gen(function* () {
		const serviceAccount = yield* CurrentServiceAccount;
		return serviceAccount;
	}),
);

export const PublicGroupsLive = HttpApiBuilder.group(
	RootApi,
	"PublicField",
	(handlers) =>
		handlers
			.handle("replicantGet", ({ params: { namespace, fieldName } }) =>
				getReplicant(namespace, fieldName).pipe(provideIdentity),
			)
			.handle(
				"replicantUpdate",
				({ params: { namespace, fieldName }, payload }) =>
					updateReplicant(namespace, fieldName, payload).pipe(provideIdentity),
			)
			.handle("computedGet", ({ params: { namespace, fieldName } }) =>
				getComputed(namespace, fieldName).pipe(provideIdentity),
			)
			.handle("topicPublish", ({ params: { namespace, fieldName }, payload }) =>
				publishTopic(namespace, fieldName, payload).pipe(provideIdentity),
			)
			.handle("rpcCall", ({ params: { namespace, fieldName }, payload }) =>
				callRpc(namespace, fieldName, payload).pipe(provideIdentity),
			),
);
