import { Effect } from "effect";
import { vi } from "vitest";

import {
	type ReplicantRepository,
	ReplicantNotFound,
} from "./replicant-repository.ts";

export const createReplicantRepositoryStub = () => {
	const read = vi.fn<ReplicantRepository["read"]>(
		(namespace, name) => new ReplicantNotFound({ namespace, name }),
	);
	const write = vi.fn<ReplicantRepository["write"]>(() => Effect.void);
	const stub = {
		read,
		write,
	} satisfies ReplicantRepository;
	const reset = () => {
		for (const mock of [read, write]) {
			mock.mockReset();
		}
	};
	return { stub, reset };
};
