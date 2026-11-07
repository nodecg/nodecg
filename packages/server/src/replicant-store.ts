import { FieldDecodeError, type FieldEncodeError } from "@nodecg-next/core";
import {
	applyPatch,
	ChangeOp,
	computeFingerprint,
	isDrift,
	type Patch,
	PatchNotApplicable,
	RevisionConflict,
	stableStringify,
} from "@nodecg-next/internal/occ";
import { setSignal, toError } from "@nodecg-next/internal/utils";
import {
	computed,
	effect,
	type ReadonlySignal,
	type Signal,
	signal,
} from "@preact/signals-core";
import {
	Array,
	type Cause,
	Context,
	Effect,
	Equal,
	Fiber,
	Hash,
	HashMap,
	Layer,
	Option,
	PubSub,
	Queue,
	Ref,
	Result,
	Schema,
	Stream,
	SynchronizedRef,
} from "effect";

import {
	DecodeError,
	ReplicantRepositoryService,
} from "./services/repository/replicant/replicant-repository.ts";
import { BackendError } from "./services/repository/repository-errors.ts";

export class ReplicantLoadError extends Schema.TaggedError<ReplicantLoadError>()(
	"ReplicantLoadError",
	{
		namespace: Schema.String,
		name: Schema.String,
		cause: Schema.Union([DecodeError, BackendError, FieldDecodeError]),
	},
) {
	override readonly message = `Loading replicant "${this.name}" in "${this.namespace}" failed: ${this.cause.message}`;
}

export class ComputedComputeError extends Schema.TaggedError<ComputedComputeError>()(
	"ComputedComputeError",
	{
		namespace: Schema.String,
		name: Schema.String,
		cause: Schema.instanceOf(Error),
	},
) {
	override readonly message = `Computing computed field "${this.name}" in "${this.namespace}" failed: ${this.cause.message}`;
}

export class ReplicantAlreadyRegistered extends Schema.TaggedError<ReplicantAlreadyRegistered>()(
	"ReplicantAlreadyRegistered",
	{
		namespace: Schema.String,
		name: Schema.String,
	},
) {
	override readonly message = `Replicant "${this.name}" in "${this.namespace}" is already registered`;
}

export class ComputedAlreadyRegistered extends Schema.TaggedError<ComputedAlreadyRegistered>()(
	"ComputedAlreadyRegistered",
	{
		namespace: Schema.String,
		name: Schema.String,
	},
) {
	override readonly message = `Computed "${this.name}" in "${this.namespace}" is already registered`;
}

const fieldKey = (namespace: string, name: string) => ({ namespace, name });
type FieldKey = ReturnType<typeof fieldKey>;

export class UnknownReplicant extends Schema.TaggedError<UnknownReplicant>()(
	"UnknownReplicant",
	{
		namespace: Schema.String,
		name: Schema.String,
	},
) {
	override readonly message = `Replicant "${this.name}" in "${this.namespace}" does not exist`;
}

export class ComputedNotFound extends Schema.TaggedError<ComputedNotFound>()(
	"ComputedNotFound",
	{
		namespace: Schema.String,
		name: Schema.String,
	},
) {
	override readonly message = `Computed "${this.name}" in "${this.namespace}" does not exist`;
}

export class CommitContended extends Schema.TaggedError<CommitContended>()(
	"CommitContended",
	{
		namespace: Schema.String,
		name: Schema.String,
	},
) {
	override readonly message = `Committing "${this.name}" in "${this.namespace}" lost a compare-and-swap to a concurrent write`;
}

interface LeafValue {
	readonly hash: number;
	readonly value: Schema.Json;
	readonly revision: number;
}

export interface RevisionedValue {
	readonly value: Schema.Json;
	readonly revision: number;
}

export interface ReplicantFrame {
	readonly value: Schema.Json;
	readonly revision: number;
	readonly delta: Option.Option<{
		readonly ops: Array.NonEmptyReadonlyArray<ChangeOp>;
		readonly baseRevision: number;
		readonly hash: number;
	}>;
}

// Cheap hash for quick deduplication, can collide
const makeLeafValue = (value: Schema.Json, revision: number): LeafValue => ({
	hash: Hash.string(stableStringify(value)),
	value,
	revision,
});

const sameValue = (current: LeafValue, value: Schema.Json) => {
	const serialized = stableStringify(value);
	return (
		current.hash === Hash.string(serialized) &&
		stableStringify(current.value) === serialized
	);
};

interface ReplicantNode {
	readonly key: FieldKey;
	readonly signal: Signal<LeafValue>;
	readonly persistent: boolean;
	readonly queued: Ref.Ref<boolean>;
}

type ComputeFailure = ComputedComputeError | FieldEncodeError;

export type ComputedResult = Result.Result<Schema.Json, ComputeFailure>;

const readComputedResult = (
	result: ReadonlySignal<ComputedResult>,
	namespace: string,
	name: string,
) =>
	Result.try({
		try: () => result.value,
		catch: (error) =>
			ComputedComputeError.make({ namespace, name, cause: toError(error) }),
	}).pipe(Result.flatMap((evaluation) => evaluation));

/**
 * Container of replicant side effect logic
 */
export class ReplicantStoreService extends Context.Service<ReplicantStoreService>()(
	"ReplicantStore",
	{
		make: Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			const replicants = yield* SynchronizedRef.make(
				HashMap.empty<FieldKey, ReplicantNode>(),
			);
			const computedResults = yield* SynchronizedRef.make(
				HashMap.empty<FieldKey, ReadonlySignal<ComputedResult>>(),
			);

			const pendingWrites = yield* Queue.unbounded<
				{ readonly node: ReplicantNode; readonly retries: number },
				Cause.Done
			>();

			const changes = yield* PubSub.unbounded<{
				readonly namespace: string;
				readonly name: string;
				readonly frame: ReplicantFrame;
			}>();

			const initializeReplicant = Effect.fn(
				"ReplicantStore.initializeReplicant",
			)(function* (
				namespace: string,
				name: string,
				validate: (
					value: Schema.Json,
				) => Effect.Effect<unknown, FieldDecodeError>,
				defaultValue: Schema.Json,
				persistent: boolean,
			) {
				const key = fieldKey(namespace, name);
				if (HashMap.has(yield* SynchronizedRef.get(replicants), key)) {
					return yield* ReplicantAlreadyRegistered.make({ namespace, name });
				}
				const persistedValue = persistent
					? yield* repository.read(namespace, name).pipe(
							Effect.asSome,
							Effect.catchTags({
								ReplicantNotFound: () => Effect.succeedNone,
								DecodeError: (cause) =>
									ReplicantLoadError.make({ namespace, name, cause }),
								BackendError: (cause) =>
									ReplicantLoadError.make({ namespace, name, cause }),
							}),
						)
					: Option.none();
				const initial = yield* Option.match(persistedValue, {
					onNone: () => Effect.succeed(defaultValue),
					onSome: (value) =>
						validate(value).pipe(
							Effect.as(value),
							Effect.mapError((cause) =>
								ReplicantLoadError.make({ namespace, name, cause }),
							),
						),
				});
				const replicant = signal(makeLeafValue(initial, 0));
				const queued = yield* Ref.make(false);
				yield* SynchronizedRef.update(replicants, (map) =>
					HashMap.set(map, key, { key, signal: replicant, persistent, queued }),
				);
				if (persistent && Option.isNone(persistedValue)) {
					yield* repository
						.write(namespace, name, defaultValue)
						.pipe(
							Effect.catchTag("BackendError", (cause) =>
								ReplicantLoadError.make({ namespace, name, cause }),
							),
						);
				}
				const read = () => {
					const { value, revision } = replicant.value;
					return { value, revision };
				};
				return read;
			});

			const lookupNode = Effect.fn(function* (namespace: string, name: string) {
				const map = yield* SynchronizedRef.get(replicants);
				const existing = HashMap.get(map, fieldKey(namespace, name));
				if (Option.isNone(existing)) {
					return yield* UnknownReplicant.make({ namespace, name });
				}
				return existing.value;
			});

			const scope = yield* Effect.scope;

			const enqueue = Effect.fn(function* (node: ReplicantNode) {
				if (!(yield* Ref.getAndSet(node.queued, true))) {
					yield* Queue.offer(pendingWrites, { node, retries: 0 });
				}
			});

			const retry = Effect.fn(function* (node: ReplicantNode, retries: number) {
				if (retries >= 5) {
					return yield* Effect.logError(
						`Stopped retrying replicant "${node.key.namespace}/${node.key.name}" after ${retries} retries`,
					);
				}
				if (!(yield* Ref.getAndSet(node.queued, true))) {
					// Keep writing other replicants during the wait
					yield* Effect.forkIn(
						Effect.delay(
							Queue.offer(pendingWrites, { node, retries: retries + 1 }),
							"1 second",
						),
						scope,
					);
				}
			});

			const persist = (node: ReplicantNode) =>
				repository
					.write(node.key.namespace, node.key.name, node.signal.peek().value)
					.pipe(
						Effect.tapError((error) =>
							Effect.logError(
								`Persisting replicant "${node.key.namespace}/${node.key.name}" failed`,
								error,
							),
						),
					);

			const consumer = yield* Effect.forkScoped(
				Stream.runForEach(
					Stream.fromQueue(pendingWrites),
					({ node, retries }) =>
						Effect.gen(function* () {
							// Allow queuing the replicant during the write
							yield* Ref.set(node.queued, false);
							yield* persist(node).pipe(
								Effect.catchTag("BackendError", () => retry(node, retries)),
							);
						}),
				),
			);

			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					yield* Queue.end(pendingWrites);
					yield* Fiber.join(consumer);
					const waiting = yield* Effect.filter(
						HashMap.values(yield* SynchronizedRef.get(replicants)),
						(node) => Ref.get(node.queued),
					);
					yield* Effect.forEach(
						waiting,
						(node) =>
							persist(node).pipe(
								Effect.catchTag("BackendError", () => Effect.void),
							),
						{ discard: true },
					);
				}),
			);

			const finishCommit = (
				node: ReplicantNode,
				namespace: string,
				name: string,
				stored: LeafValue,
				frame: ReplicantFrame,
			) =>
				SynchronizedRef.modifyEffect(replicants, (map) =>
					Effect.gen(function* () {
						if (node.signal.peek().revision !== stored.revision) {
							return yield* CommitContended.make({ namespace, name });
						}
						yield* Effect.suspend(() =>
							Effect.fromResult(
								setSignal(
									node.signal,
									makeLeafValue(frame.value, frame.revision),
								),
							),
						).pipe(
							Effect.withSpan("setSignal", { attributes: { namespace, name } }),
							Effect.orDie,
						);
						if (node.persistent) {
							yield* enqueue(node);
						}
						yield* PubSub.publish(changes, { namespace, name, frame });
						return [
							{ value: frame.value, revision: frame.revision },
							map,
						] as const;
					}),
				);

			const commit = Effect.fn("ReplicantStore.commit")(function* <E>(
				namespace: string,
				name: string,
				produce: (current: RevisionedValue) => Effect.Effect<Schema.Json, E>,
			) {
				const node = yield* lookupNode(namespace, name);
				const stored = node.signal.peek();
				const nextEncoded = yield* produce({
					value: stored.value,
					revision: stored.revision,
				});
				if (sameValue(stored, nextEncoded)) {
					return { value: stored.value, revision: stored.revision };
				}
				return yield* finishCommit(node, namespace, name, stored, {
					value: nextEncoded,
					revision: stored.revision + 1,
					delta: Option.none(),
				});
			});

			const isChangeOp = Schema.is(ChangeOp);

			const commitPatch = Effect.fn("ReplicantStore.commitPatch")(function* <E>(
				namespace: string,
				name: string,
				patch: Patch,
				validate: (applied: Schema.Json) => Effect.Effect<unknown, E>,
			) {
				const node = yield* lookupNode(namespace, name);
				const stored = node.signal.peek();
				const applied = applyPatch(stored.value, patch);
				if (Result.isFailure(applied)) {
					const { op, cause } = applied.failure;
					if (isDrift(cause)) {
						return yield* RevisionConflict.make({
							value: stored.value,
							revision: stored.revision,
							reason: cause._tag,
						});
					}
					return yield* PatchNotApplicable.make({
						path: op.path,
						reason: cause._tag,
					});
				}
				const changeOps = patch.filter(isChangeOp);
				if (
					!Array.isReadonlyArrayNonEmpty(changeOps) ||
					sameValue(stored, applied.success)
				) {
					return { value: stored.value, revision: stored.revision };
				}
				yield* validate(applied.success);
				return yield* finishCommit(node, namespace, name, stored, {
					value: applied.success,
					revision: stored.revision + 1,
					delta: Option.some({
						ops: changeOps,
						baseRevision: stored.revision,
						hash: computeFingerprint(applied.success),
					}),
				});
			});

			const subscribeReplicant = Effect.fn("ReplicantStore.subscribeReplicant")(
				function* (namespace: string, name: string) {
					const dequeue = yield* PubSub.subscribe(changes);
					const node = yield* lookupNode(namespace, name);
					const stored = node.signal.peek();
					const seed: ReplicantFrame = {
						value: stored.value,
						revision: stored.revision,
						delta: Option.none(),
					};
					const updates = Stream.fromSubscription(dequeue).pipe(
						Stream.filter(
							(event) =>
								event.namespace === namespace &&
								event.name === name &&
								event.frame.revision > stored.revision,
						),
						Stream.map((event) => event.frame),
					);
					return Stream.concat(Stream.succeed(seed), updates);
				},
			);

			const initializeComputed = Effect.fn("ReplicantStore.initializeComputed")(
				function* (
					namespace: string,
					name: string,
					evaluate: () => ComputedResult,
				) {
					let lastResult = Option.none<ComputedResult>();
					let lastValue = Option.none<{
						readonly value: Schema.Json;
						readonly hash: number;
					}>();

					const result = computed(() =>
						Result.match(evaluate(), {
							onSuccess: (value) => {
								const hash = Hash.string(JSON.stringify(value));

								if (
									Option.isNone(lastResult) ||
									Option.isNone(lastValue) ||
									lastValue.value.hash !== hash ||
									JSON.stringify(lastValue.value.value) !==
										JSON.stringify(value)
								) {
									const next = Result.succeed(value);
									lastResult = Option.some(next);
									lastValue = Option.some({ value, hash });
									return next;
								}

								if (Result.isSuccess(lastResult.value)) {
									return lastResult.value;
								}

								const next = Result.succeed(lastValue.value.value);
								lastResult = Option.some(next);
								return next;
							},
							onFailure: (failure) => {
								if (
									Option.isSome(lastResult) &&
									Result.isFailure(lastResult.value) &&
									Equal.equals(failure, lastResult.value.failure)
								) {
									return lastResult.value;
								}
								const next = Result.fail(failure);
								lastResult = Option.some(next);
								return next;
							},
						}),
					);

					yield* SynchronizedRef.updateEffect(computedResults, (map) =>
						Effect.gen(function* () {
							const key = fieldKey(namespace, name);
							if (HashMap.has(map, key)) {
								return yield* ComputedAlreadyRegistered.make({
									namespace,
									name,
								});
							}
							return HashMap.set(map, key, result);
						}),
					);
					return () => readComputedResult(result, namespace, name);
				},
			);

			const subscribeComputed = Effect.fn("ReplicantStore.subscribeComputed")(
				function* (namespace: string, name: string) {
					const result = HashMap.get(
						yield* SynchronizedRef.get(computedResults),
						fieldKey(namespace, name),
					);
					if (Option.isNone(result)) {
						return yield* ComputedNotFound.make({ namespace, name });
					}
					const updates = yield* Queue.make<ComputedResult>();
					yield* Effect.acquireRelease(
						Effect.sync(() =>
							effect(() => {
								Queue.offerUnsafe(
									updates,
									readComputedResult(result.value, namespace, name),
								);
							}),
						),
						(dispose) => Effect.sync(dispose),
					);
					// Fast-fail the subscribe when the current value fails to compute
					yield* Effect.fromResult(
						readComputedResult(result.value, namespace, name),
					);
					return Stream.fromQueue(updates).pipe(
						Stream.tap(
							Result.match({
								onSuccess: () => Effect.void,
								onFailure: (error) =>
									Effect.logError(
										`Failed to compute "${namespace}/${name}"`,
										error,
									),
							}),
						),
						Stream.filterMap((evaluation) => evaluation),
						Stream.changesWith((previous, next) => previous === next),
					);
				},
			);

			return {
				initializeReplicant,
				commit,
				commitPatch,
				subscribeReplicant,
				initializeComputed,
				subscribeComputed,
			};
		}),
	},
) {
	static readonly layer = Layer.effect(this, this.make);
}
