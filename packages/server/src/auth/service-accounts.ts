import type { UserId } from "@nodecg-next/internal";
import { Effect, Redacted } from "effect";
import { Digest, SecureRandom } from "effect/crypto";
import { Base64Url } from "effect/encoding";

import { ServiceAccountRepositoryService } from "../services/repository/service-account/service-account-repository.ts";
import { TransactionService } from "../services/transaction/transaction.ts";

export const hashApiKey = Effect.fnUntraced(function* (token: string) {
	const digest = yield* Digest.Digest;
	const hash = yield* digest.digest(
		Digest.sha256,
		new TextEncoder().encode(token),
	);
	return Base64Url.encode(hash);
});

export const newApiKey = Effect.fnUntraced(function* () {
	const random = yield* SecureRandom.SecureRandom;
	const bytes = yield* random.randomBytes(32);
	return Redacted.make(Base64Url.encode(bytes));
});

export const createServiceAccount = Effect.fn("createServiceAccount")(
	function* (displayName: string, createdBy: UserId) {
		const repository = yield* ServiceAccountRepositoryService;
		const token = yield* newApiKey();
		const hash = yield* hashApiKey(Redacted.value(token));
		const serviceAccountId = yield* TransactionService.wrap(
			Effect.gen(function* () {
				const serviceAccountId = yield* repository.create({
					displayName,
					createdBy,
				});
				yield* repository.addKey(serviceAccountId, { hash, label: "" });
				return serviceAccountId;
			}),
		);
		return { serviceAccountId, displayName, token };
	},
);
