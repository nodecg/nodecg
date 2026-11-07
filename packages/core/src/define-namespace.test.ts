import { manifestRolesKey, RoleName } from "@nodecg-next/internal";
import { Result, Schema } from "effect";
import { assert, describe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod";

import {
	defineNamespace,
	type EmptyNamespaceFields,
	extendNamespace,
	type NamespaceManifest,
} from "./define-namespace.ts";
import { FieldDecodeError, FieldEncodeError } from "./field-codec.ts";
import type { NamespaceRole } from "./role.ts";

const decodeJsonText = Schema.decodeSync(Schema.fromJsonString(Schema.Json));

describe("defineNamespace", () => {
	describe("runtime", () => {
		test("replicant, computed and topic fields encode/decode round-trip", () => {
			const manifest = defineNamespace("match", {
				replicant: {
					score: {
						schema: Schema.Struct({ left: Schema.FiniteFromString }),
					},
				},
				computed: { title: { schema: z.string().trim() } },
				topic: { count: { schema: Schema.BigIntFromString } },
			});

			expect(manifest.replicant.score.encode({ left: 1 })).toStrictEqual(
				Result.succeed({ left: "1" }),
			);
			expect(manifest.replicant.score.decode({ left: "2" })).toStrictEqual(
				Result.succeed({ left: 2 }),
			);

			expect(manifest.computed.title.encode(" final ")).toStrictEqual(
				Result.succeed("final"),
			);
			expect(manifest.computed.title.decode(" semi ")).toStrictEqual(
				Result.succeed("semi"),
			);

			expect(manifest.topic.count.encode(3n)).toStrictEqual(
				Result.succeed("3"),
			);
			expect(manifest.topic.count.decode("4")).toStrictEqual(
				Result.succeed(4n),
			);
		});

		test("decode surfaces FieldDecodeError on bad wire input", () => {
			const manifest = defineNamespace("match", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const decoded = manifest.replicant.count.decode("nope");

			assert(Result.isFailure(decoded));
			expect(decoded.failure).toBeInstanceOf(FieldDecodeError);
		});

		test("encode and decode refuse an object key every object inherits", () => {
			const manifest = defineNamespace("match", {
				replicant: {
					scores: {
						schema: Schema.Record(Schema.String, Schema.FiniteFromString),
					},
				},
			});

			const encoded = manifest.replicant.scores.encode({
				home: 1,
				toString: 2,
			});
			assert(Result.isFailure(encoded));
			expect(encoded.failure).toBeInstanceOf(FieldEncodeError);
			expect(encoded.failure.message).toBe(
				'Failed to encode replicant "scores": Object key "toString" is a name every object inherits',
			);

			const decoded = manifest.replicant.scores.decode(
				decodeJsonText('{"home":"1","__proto__":"2"}'),
			);
			assert(Result.isFailure(decoded));
			expect(decoded.failure).toBeInstanceOf(FieldDecodeError);
			expect(decoded.failure.message).toBe(
				'Failed to decode replicant "scores": Object key "__proto__" is a name every object inherits',
			);
		});

		test("rpc request and response encode/decode round-trip independently", () => {
			const manifest = defineNamespace("match", {
				rpc: {
					setScore: {
						schema: {
							request: Schema.FiniteFromString,
							response: z.string().trim(),
						},
					},
				},
			});

			expect(manifest.rpc.setScore.request.encode(1)).toStrictEqual(
				Result.succeed("1"),
			);
			expect(manifest.rpc.setScore.request.decode("2")).toStrictEqual(
				Result.succeed(2),
			);

			expect(manifest.rpc.setScore.response.encode(" done ")).toStrictEqual(
				Result.succeed("done"),
			);
			expect(manifest.rpc.setScore.response.decode(" kept ")).toStrictEqual(
				Result.succeed("kept"),
			);
		});
	});

	describe("permission resolution", () => {
		const manifest = defineNamespace("match", {
			roles: {
				judge: {
					permission: ["replicant-read", "replicant-write", "computed-read"],
				},
				monitor: { permission: ["computed-read"] },
				viewer: { permission: ["replicant-read", "computed-read"] },
			},
			replicant: {
				score: {
					schema: Schema.Finite,
					permission: {
						read: { deny: ["viewer"] },
						write: { allow: ["judge"] },
					},
				},
				label: { schema: Schema.String },
				banner: {
					schema: Schema.String,
					permission: {
						read: { member: "allow" },
						write: { allow: [] },
					},
				},
			},
			computed: {
				winning: { schema: Schema.NullOr(Schema.Literals(["l", "r"])) },
			},
		});

		test("no rule → inherits the role-level base", () => {
			expect(manifest.replicant.label.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
			});
			expect(manifest.replicant.label.permission.write).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
			});
		});

		test("deny excludes from the base", () => {
			expect(manifest.replicant.score.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(["viewer"]),
			});
		});

		test("allow replaces the role base", () => {
			expect(manifest.replicant.score.permission.write).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(["viewer"]),
			});
		});

		test("a member grant stays a symbolic slot, not an expansion to role names", () => {
			expect(manifest.replicant.banner.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
				member: "allow",
			});
		});

		test("server-owned write", () => {
			expect(manifest.replicant.banner.permission.write).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
		});

		test("computed resolves its read base", () => {
			expect(manifest.computed.winning.permission.read).toEqual({
				roles: new Set(["judge", "monitor", "viewer"]),
				rolesDenied: new Set(),
			});
		});
	});

	describe("principals as capability bases", () => {
		test("everyone opens every field of the capability", () => {
			const manifest = defineNamespace("match", {
				principals: { everyone: { permission: ["computed-read"] } },
				roles: { judge: { permission: ["replicant-read"] } },
				replicant: { score: { schema: Schema.Finite } },
				computed: { winning: { schema: Schema.Boolean } },
			});

			expect(manifest.computed.winning.permission.read).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
				everyone: "allow",
			});
			expect(manifest.replicant.score.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
			});
		});

		test("a member grant does not drop a namespace-wide everyone base", () => {
			const manifest = defineNamespace("match", {
				principals: { everyone: { permission: ["replicant-read"] } },
				roles: {
					judge: { permission: ["replicant-read"] },
					viewer: { permission: [] },
				},
				replicant: {
					internal: {
						schema: Schema.Finite,
						permission: { read: { member: "allow" } },
					},
				},
			});

			expect(manifest.replicant.internal.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
				everyone: "allow",
				member: "allow",
			});
		});

		test("member is a blanket base every named role holds", () => {
			const manifest = defineNamespace("match", {
				principals: { member: { permission: ["replicant-read"] } },
				roles: {
					judge: { permission: ["replicant-write"] },
					viewer: { permission: [] },
				},
				replicant: { score: { schema: Schema.Finite } },
			});

			expect(manifest.replicant.score.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
				member: "allow",
			});
			expect(manifest.replicant.score.permission.write).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
			});
		});

		test("a principal cannot be declared as a named role", () => {
			expect(() =>
				defineNamespace("match", {
					// @ts-expect-error a principal belongs under "principals"
					roles: { everyone: { permission: ["replicant-read"] } },
				}),
			).toThrow(/principal — declare it under "principals"/);
		});

		test("superadmin can be declared nowhere — it is granted, never declared", () => {
			expect(() =>
				defineNamespace("match", {
					// @ts-expect-error superadmin cannot be declared anywhere
					roles: { superadmin: { permission: ["replicant-read"] } },
				}),
			).toThrow(/granted to a user, never declared/);
		});
	});

	describe("names", () => {
		test("rejects a namespace that is not file-safe", () => {
			// @ts-expect-error a dot is not allowed
			expect(() => defineNamespace("show.2", {})).toThrow(
				/Namespace "show.2" must use only A-Z, a-z, 0-9/,
			);
		});

		test("rejects a replicant name outside the allowed characters", () => {
			expect(() =>
				defineNamespace("show", {
					replicant: {
						// @ts-expect-error a space is not allowed
						"home score": { schema: Schema.FiniteFromString },
					},
				}),
			).toThrow(/Replicant "home score" in "show" must use only A-Z, a-z, 0-9/);
		});

		test("rejects replicant names that differ only in case", () => {
			expect(() =>
				defineNamespace("show", {
					replicant: {
						// @ts-expect-error differs from homescore only in case
						homeScore: { schema: Schema.FiniteFromString },
						// @ts-expect-error differs from homeScore only in case
						homescore: { schema: Schema.FiniteFromString },
					},
				}),
			).toThrow(
				'Replicant "homescore" in "show" differs from "homeScore" only in case',
			);
		});

		test("rejects a custom route name outside the allowed characters", () => {
			expect(() =>
				defineNamespace("show", {
					customRoute: {
						// @ts-expect-error a slash is not allowed
						"a/b": { get: {} },
					},
				}),
			).toThrow(
				'Custom route "a/b" in "show" must use only A-Z, a-z, 0-9, "_" and "-", and not be a Windows device name',
			);
		});

		test("rejects custom route names that differ only in case", () => {
			expect(() =>
				defineNamespace("show", {
					customRoute: {
						// @ts-expect-error differs from Webhook only in case
						webhook: { get: {} },
						// @ts-expect-error differs from webhook only in case
						Webhook: { post: {} },
					},
				}),
			).toThrow(
				'Custom route "Webhook" in "show" differs from "webhook" only in case',
			);
		});

		test("rejects a custom route method that is not HTTP", () => {
			expect(() =>
				defineNamespace("show", {
					// @ts-expect-error fetch is not an HTTP method
					customRoute: { backup: { fetch: {} } },
				}),
			).toThrow('Custom route "backup" in "show" has unknown method "fetch"');
		});

		test("rejects trace as a custom route method", () => {
			expect(() =>
				defineNamespace("show", {
					// @ts-expect-error trace can't reach a handler
					customRoute: { backup: { trace: {} } },
				}),
			).toThrow('Custom route "backup" in "show" has unknown method "trace"');
		});

		test("types refuse the wildcard beside another custom route method", () => {
			defineNamespace("show", {
				// @ts-expect-error the wildcard stands alone
				customRoute: { backup: { "*": {}, get: {} } },
			});
		});
	});

	describe("a replicant writer is a reader", () => {
		test("the write set folds into read, so a write capability carries read", () => {
			const manifest = defineNamespace("match", {
				roles: { producer: { permission: ["replicant-write"] } },
				replicant: { score: { schema: Schema.Finite } },
			});

			expect(manifest.replicant.score.permission.write).toEqual({
				roles: new Set(["producer"]),
				rolesDenied: new Set(),
			});
			expect(manifest.replicant.score.permission.read).toEqual({
				roles: new Set(["producer"]),
				rolesDenied: new Set(),
			});
		});

		test("a topic publisher is not a subscriber", () => {
			const manifest = defineNamespace("match", {
				roles: { announcer: { permission: ["topic-publish"] } },
				topic: { bell: { schema: Schema.String } },
			});

			expect(manifest.topic.bell.permission.write).toEqual({
				roles: new Set(["announcer"]),
				rolesDenied: new Set(),
			});
			expect(manifest.topic.bell.permission.read).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
		});

		test("denying read denies write with it", () => {
			const manifest = defineNamespace("match", {
				roles: { producer: { permission: ["replicant-write"] } },
				replicant: {
					secret: {
						schema: Schema.String,
						permission: { read: { deny: ["producer"] } },
					},
				},
			});

			expect(manifest.replicant.secret.permission.read).toEqual({
				roles: new Set(),
				rolesDenied: new Set(["producer"]),
			});
			expect(manifest.replicant.secret.permission.write).toEqual({
				roles: new Set(),
				rolesDenied: new Set(["producer"]),
			});
		});

		test("denying write leaves read intact", () => {
			const manifest = defineNamespace("match", {
				roles: {
					viewer: { permission: ["replicant-read", "replicant-write"] },
				},
				replicant: {
					board: {
						schema: Schema.String,
						permission: { write: { deny: ["viewer"] } },
					},
				},
			});

			expect(manifest.replicant.board.permission.read).toEqual({
				roles: new Set(["viewer"]),
				rolesDenied: new Set(),
			});
			expect(manifest.replicant.board.permission.write).toEqual({
				roles: new Set(),
				rolesDenied: new Set(["viewer"]),
			});
		});
	});

	describe("rpc permission resolution", () => {
		test("rpc-call bakes into write, read stays empty", () => {
			const manifest = defineNamespace("match", {
				roles: {
					operator: { permission: ["rpc-call"] },
					viewer: { permission: ["replicant-read"] },
				},
				rpc: {
					restart: {
						schema: { request: Schema.Finite, response: Schema.Finite },
					},
				},
			});

			expect(manifest.rpc.restart.permission.write).toEqual({
				roles: new Set(["operator"]),
				rolesDenied: new Set(),
			});
			expect(manifest.rpc.restart.permission.read).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
		});

		test("field deny subtracts from the rpc-call base", () => {
			const manifest = defineNamespace("match", {
				roles: {
					operator: { permission: ["rpc-call"] },
					producer: { permission: ["rpc-call"] },
				},
				rpc: {
					restart: {
						schema: { request: Schema.Finite, response: Schema.Finite },
						permission: { write: { deny: ["operator"] } },
					},
				},
			});

			expect(manifest.rpc.restart.permission.write).toEqual({
				roles: new Set(["producer"]),
				rolesDenied: new Set(["operator"]),
			});
		});
	});

	describe("custom route permission resolution", () => {
		test("custom-route-request bakes into write", () => {
			const manifest = defineNamespace("match", {
				roles: {
					operator: { permission: ["custom-route-request"] },
					viewer: { permission: ["rpc-call"] },
				},
				customRoute: { backup: { get: {} } },
			});

			expect(manifest.customRoute.backup.get.permission.write).toEqual({
				roles: new Set(["operator"]),
				rolesDenied: new Set(),
			});
			expect(manifest.customRoute.backup.get.permission.read).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
		});

		test("each method keeps its own permission", () => {
			const manifest = defineNamespace("match", {
				roles: {
					operator: { permission: ["custom-route-request"] },
					producer: { permission: ["custom-route-request"] },
				},
				customRoute: {
					asset: {
						get: { permission: { write: { deny: ["operator"] } } },
						post: {},
					},
					webhook: {
						"*": { permission: { write: { everyone: "allow" } } },
					},
				},
			});

			expect(manifest.customRoute.asset.get.permission.write).toEqual({
				roles: new Set(["producer"]),
				rolesDenied: new Set(["operator"]),
			});
			expect(manifest.customRoute.asset.post.permission.write).toEqual({
				roles: new Set(["operator", "producer"]),
				rolesDenied: new Set(),
			});
			expect(manifest.customRoute.webhook["*"].permission.write).toEqual({
				roles: new Set(["operator", "producer"]),
				rolesDenied: new Set(),
				everyone: "allow",
			});
		});

		test("a method set to undefined resolves like an empty one", () => {
			const manifest = defineNamespace("match", {
				roles: { operator: { permission: ["custom-route-request"] } },
				customRoute: { backup: { get: undefined } },
			});

			expect(manifest.customRoute.backup.get.permission.write).toEqual({
				roles: new Set(["operator"]),
				rolesDenied: new Set(),
			});
		});

		test("rejects a role the namespace does not declare", () => {
			expect(() =>
				defineNamespace("match", {
					customRoute: {
						backup: {
							get: {
								// @ts-expect-error ghost is not declared
								permission: { write: { allow: ["ghost"] } },
							},
						},
					},
				}),
			).toThrow('Unknown role "ghost" in customRoute "backup" get write.allow');
		});
	});

	describe("topic direction presets", () => {
		test("server-only publish grants write to server, subscribe to holders", () => {
			const manifest = defineNamespace("match", {
				roles: { viewer: { permission: ["topic-subscribe"] } },
				topic: {
					start: {
						schema: Schema.Boolean,
						permission: { write: { allow: [] } },
					},
				},
			});

			expect(manifest.topic.start.permission.write).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
			expect(manifest.topic.start.permission.read).toEqual({
				roles: new Set(["viewer"]),
				rolesDenied: new Set(),
			});
		});
	});

	describe("types", () => {
		test("options not specified are hidden", () => {
			const manifest = defineNamespace("match", {
				replicant: {
					count: { schema: Schema.Finite },
				},
			});
			expectTypeOf(manifest.replicant).not.toBeNever();
			expectTypeOf(manifest.computed).toEqualTypeOf({});
			expectTypeOf(manifest.topic).toEqualTypeOf({});
			expectTypeOf(manifest.rpc).toEqualTypeOf({});

			const manifest2 = defineNamespace("match", {
				replicant: {
					count: { schema: Schema.Finite },
				},
				computed: {
					double: { schema: Schema.Finite },
				},
			});
			expectTypeOf(manifest2.replicant).not.toBeNever();
			expectTypeOf(manifest2.computed).not.toBeNever();
			expectTypeOf(manifest2.topic).toEqualTypeOf({});
			expectTypeOf(manifest2.rpc).toEqualTypeOf({});

			const manifest3 = defineNamespace("match", {
				topic: {
					count: { schema: Schema.Finite },
				},
			});
			expectTypeOf(manifest3.replicant).toEqualTypeOf({});
			expectTypeOf(manifest3.computed).toEqualTypeOf({});
			expectTypeOf(manifest3.topic).not.toBeNever();
			expectTypeOf(manifest3.rpc).toEqualTypeOf({});

			const manifest4 = defineNamespace("match", {
				rpc: {
					ping: {
						schema: { request: Schema.String, response: Schema.String },
					},
				},
			});
			expectTypeOf(manifest4.replicant).toEqualTypeOf({});
			expectTypeOf(manifest4.computed).toEqualTypeOf({});
			expectTypeOf(manifest4.topic).toEqualTypeOf({});
			expectTypeOf(manifest4.rpc).not.toBeNever();
		});

		test("decoded type flows into the field codec per group", () => {
			const manifest = defineNamespace("match", {
				replicant: {
					label: {
						schema: Schema.String.check(
							Schema.isNonEmpty(),
							Schema.isTrimmed(),
						),
					},
				},
				computed: {
					winning: {
						schema: Schema.NullOr(Schema.Literals(["left", "right"])),
					},
				},
				topic: { start: { schema: z.boolean() } },
				rpc: {
					setScore: {
						schema: {
							request: Schema.Struct({ home: Schema.Finite }),
							response: Schema.Boolean,
						},
					},
				},
			});

			expectTypeOf(manifest.replicant.label.encode)
				.parameter(0)
				.toEqualTypeOf<string>();
			expectTypeOf(manifest.computed.winning.decode).returns.toEqualTypeOf<
				Result.Result<"left" | "right" | null, FieldDecodeError>
			>();
			expectTypeOf(manifest.topic.start.encode)
				.parameter(0)
				.toEqualTypeOf<boolean>();
			expectTypeOf(manifest.rpc.setScore.request.encode)
				.parameter(0)
				.toEqualTypeOf<{ readonly home: number } | { home: number }>();
			expectTypeOf(manifest.rpc.setScore.response.decode).returns.toEqualTypeOf<
				Result.Result<boolean, FieldDecodeError>
			>();
		});

		test("codec signatures and namespace type", () => {
			const manifest = defineNamespace("match", {
				replicant: { count: { schema: Schema.Finite } },
			});

			expectTypeOf(manifest.namespace).toEqualTypeOf<"match">();
			expectTypeOf(manifest.replicant.count.encode).returns.toEqualTypeOf<
				Result.Result<Schema.Json, FieldEncodeError>
			>();
			expectTypeOf(manifest.replicant.count.decode)
				.parameter(0)
				.toEqualTypeOf<Schema.Json>();
		});

		describe("rejects schemas whose encoded form is not JSON-compatible", () => {
			test("Effect Schema.Date", () => {
				defineNamespace("match", {
					// @ts-expect-error Schema.Date has Encoded=Date, not Schema.Json
					replicant: { when: { schema: Schema.Date } },
				});
			});

			test("Effect Schema.BigInt", () => {
				defineNamespace("match", {
					// @ts-expect-error bigint is not assignable to Schema.Json
					replicant: { count: { schema: Schema.BigInt } },
				});
			});

			test("date", () => {
				defineNamespace("match", {
					// @ts-expect-error a Date is not JSON
					replicant: { startAt: { schema: z.coerce.date() } },
				});
			});

			test("bigint", () => {
				defineNamespace("match", {
					// @ts-expect-error bigint has no JSON form
					replicant: { count: { schema: z.bigint() } },
				});
			});

			test("object holding a Set", () => {
				defineNamespace("match", {
					replicant: {
						// @ts-expect-error Set has no JSON form
						tags: { schema: z.object({ names: z.set(z.string()) }) },
					},
				});
			});

			test("object holding unknown beside a bigint", () => {
				defineNamespace("match", {
					replicant: {
						data: {
							// @ts-expect-error bigint has no JSON form
							schema: z.object({ data: z.unknown(), count: z.bigint() }),
						},
					},
				});
			});

			test("interface holding a bigint", () => {
				interface Tally {
					count: bigint;
				}

				defineNamespace("match", {
					// @ts-expect-error bigint has no JSON form
					replicant: { tally: { schema: z.custom<Tally>() } },
				});
			});
		});

		test("accepts a schema whose value is an interface", () => {
			interface Score {
				readonly left: number;
				readonly history: ReadonlyArray<Score>;
			}

			const manifest = defineNamespace("match", {
				replicant: { score: { schema: z.custom<Score>() } },
			});

			expectTypeOf(manifest.replicant.score.decode).returns.toEqualTypeOf<
				Result.Result<Score, FieldDecodeError>
			>();
		});

		test("accepts a schema that reads another type than its value", () => {
			const manifest = defineNamespace("match", {
				replicant: {
					length: { schema: z.string().transform((text) => text.length) },
				},
			});

			expectTypeOf(manifest.replicant.length.decode).returns.toEqualTypeOf<
				Result.Result<number, FieldDecodeError>
			>();
		});

		test("accepts unknown, any and never schemas", () => {
			const manifest = defineNamespace("match", {
				replicant: {
					anything: { schema: z.unknown() },
					raw: { schema: z.any() },
					nothing: { schema: z.never() },
					nested: { schema: z.object({ data: z.unknown(), raw: z.any() }) },
				},
			});

			expectTypeOf(manifest.replicant.anything.decode).returns.toEqualTypeOf<
				Result.Result<unknown, FieldDecodeError>
			>();
			expectTypeOf(manifest.replicant.raw.decode).returns.toEqualTypeOf<
				Result.Result<any, FieldDecodeError>
			>();
			expectTypeOf(manifest.replicant.nothing.decode).returns.toEqualTypeOf<
				Result.Result<never, FieldDecodeError>
			>();
			expectTypeOf(manifest.replicant.nested.decode).returns.toEqualTypeOf<
				Result.Result<{ data: unknown; raw: any }, FieldDecodeError>
			>();
		});

		describe("permission tokens restricted to declared roles", () => {
			test("accepts declared roles in allow/deny and principals as slots", () => {
				const manifest = defineNamespace("match", {
					roles: { judge: { permission: ["replicant-read"] } },
					replicant: {
						score: {
							schema: Schema.Finite,
							permission: {
								read: { allow: ["judge"], everyone: "allow" },
								write: { allow: [], member: "allow" },
							},
						},
					},
				});

				expect(manifest.replicant.score.permission.read).toEqual({
					roles: new Set(["judge"]),
					rolesDenied: new Set(),
					everyone: "allow",
					member: "allow",
				});
				expect(manifest.replicant.score.permission.write).toEqual({
					roles: new Set(),
					rolesDenied: new Set(),
					member: "allow",
				});
			});

			test("rejects a rule targeting an undeniable principal", () => {
				for (const principal of ["admin", "server"]) {
					const permission = { read: { [principal]: "deny" } };
					expect(() =>
						defineNamespace("match", {
							replicant: { score: { schema: Schema.Finite, permission } },
						}),
					).toThrow(
						new RegExp(
							`Undeniable principal "${principal}" in replicant "score" read`,
						),
					);
				}
			});

			test("rejects a principal name as an allow token — principals are slots", () => {
				expect(() =>
					defineNamespace("match", {
						roles: { judge: { permission: ["replicant-read"] } },
						replicant: {
							score: {
								schema: Schema.Finite,
								// @ts-expect-error "everyone" is a slot, not an allow token
								permission: { read: { allow: ["everyone"] } },
							},
						},
					}),
				).toThrow(/Unknown role "everyone" in replicant "score" read\.allow/);
			});

			test("rejects a misspelled principal slot", () => {
				defineNamespace("match", {
					replicant: {
						score: {
							schema: Schema.Finite,
							// @ts-expect-error "evryone" is not a principal slot
							permission: { read: { evryone: "allow" } },
						},
					},
				});
			});

			test("rejects an unknown token in allow or deny", () => {
				expect(() =>
					defineNamespace("match", {
						roles: { judge: { permission: ["replicant-read"] } },
						replicant: {
							score: {
								schema: Schema.Finite,
								// @ts-expect-error "viewer" is neither a declared nor a reserved role
								permission: { read: { allow: ["viewer"] } },
							},
						},
					}),
				).toThrow(/Unknown role "viewer" in replicant "score" read\.allow/);

				expect(() =>
					defineNamespace("match", {
						roles: { judge: { permission: ["replicant-read"] } },
						replicant: {
							score: {
								schema: Schema.Finite,
								// @ts-expect-error "vewer" is a typo, not a known role
								permission: { read: { deny: ["vewer"] } },
							},
						},
					}),
				).toThrow(/Unknown role "vewer" in replicant "score" read\.deny/);
			});
		});
	});

	test("keeps its declared children", () => {
		const assets = defineNamespace("show-assets", {});
		const show = defineNamespace("show", { children: { assets } });

		expect(show.children).toStrictEqual({ assets });
	});

	describe("role links", () => {
		const assets = defineNamespace("show-assets", {
			roles: { uploader: { permission: ["rpc-call"] } },
		});

		test("exposes each declared role as a reference", () => {
			expect(assets.roles).toStrictEqual({
				uploader: { namespace: "show-assets", name: "uploader" },
			});
			expectTypeOf(assets.roles.uploader).toEqualTypeOf<
				NamespaceRole<"show-assets", "uploader">
			>();
		});

		test("links a role to the child roles it lists", () => {
			const show = defineNamespace("show", {
				roles: {
					operator: { permission: [], linkedRoles: [assets.roles.uploader] },
				},
				children: { assets },
			});

			expect(
				show[manifestRolesKey].roles.get(RoleName.make("operator"))
					?.linkedRoles,
			).toStrictEqual([{ namespace: "show-assets", name: "uploader" }]);
		});

		test("rejects a role of a namespace that is not a child", () => {
			const media = defineNamespace("show-media", {
				roles: { player: { permission: ["rpc-call"] } },
			});

			expect(() =>
				defineNamespace("show", {
					roles: {
						operator: {
							permission: [],
							// @ts-expect-error "show-media" is not a declared child
							linkedRoles: [media.roles.player],
						},
					},
					children: { assets },
				}),
			).toThrow(/Role "operator" cannot link to "player" of "show-media"/);
		});

		test("rejects a role the child does not declare", () => {
			const widened: NamespaceManifest<string, EmptyNamespaceFields, string> =
				assets;

			expect(() =>
				defineNamespace("show", {
					roles: {
						operator: {
							permission: [],
							linkedRoles: [{ namespace: "show-assets", name: "server" }],
						},
					},
					children: { assets: widened },
				}),
			).toThrow(/Role "operator" cannot link to "server" of "show-assets"/);
		});
	});
});

describe("extendNamespace", () => {
	const base = defineNamespace("match", {
		roles: {
			judge: {
				permission: ["replicant-read", "replicant-write", "computed-read"],
			},
			viewer: { permission: ["replicant-read", "computed-read"] },
		},
		replicant: {
			score: { schema: Schema.Finite },
			secret: {
				schema: Schema.String,
				permission: { read: { allow: ["judge"] } },
			},
		},
		computed: { total: { schema: Schema.Finite } },
	});

	describe("runtime", () => {
		test("rejects an added replicant name outside the allowed characters", () => {
			expect(() =>
				extendNamespace(base, {
					replicant: {
						// @ts-expect-error a slash is not allowed
						"away/score": { schema: Schema.Finite },
					},
				}),
			).toThrow(
				/Replicant "away\/score" in "match" must use only A-Z, a-z, 0-9/,
			);
		});

		test("rejects an added replicant name that differs from an existing one only in case", () => {
			expect(() =>
				extendNamespace(base, {
					replicant: {
						// @ts-expect-error differs from score only in case
						Score: { schema: Schema.Finite },
					},
				}),
			).toThrow(
				'Replicant "Score" in "match" differs from "score" only in case',
			);
		});

		test("overrides an existing field's permission without a schema", () => {
			const extended = extendNamespace(base, {
				replicant: { score: { permission: { read: { deny: ["viewer"] } } } },
			});

			expect(extended.replicant.score.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(["viewer"]),
			});
			expect(extended.replicant.score.permission.write).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(["viewer"]),
			});
		});

		test("keeps a replicant's persistence unless the extension sets it", () => {
			const unpersisted = extendNamespace(base, {
				replicant: {
					score: { persistent: false },
					live: { schema: Schema.Boolean, persistent: false },
				},
			});
			const extended = extendNamespace(unpersisted, {
				replicant: { score: { permission: { read: { deny: ["viewer"] } } } },
			});

			expect(base.replicant.score.persistent).toBe(true);
			expect(extended.replicant.score.persistent).toBe(false);
			expect(extended.replicant.live.persistent).toBe(false);
			expect(extended.replicant.secret.persistent).toBe(true);
		});

		test("adds a new field beside the existing ones", () => {
			const extended = extendNamespace(base, {
				replicant: {
					pinned: {
						schema: z.string().trim(),
						permission: { write: { allow: ["judge"] } },
					},
				},
			});

			expect(extended.replicant.pinned.encode(" hi ")).toStrictEqual(
				Result.succeed("hi"),
			);
			expect(extended.replicant.pinned.permission.write).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
			});
			expect(extended.replicant.score.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
			});
		});

		test("role-level grant retroactively adds to existing lists, including pinned", () => {
			const extended = extendNamespace(base, {
				roles: { auditor: { permission: ["replicant-read"] } },
			});

			expect(extended.replicant.score.permission.read).toEqual({
				roles: new Set(["auditor", "judge", "viewer"]),
				rolesDenied: new Set(),
			});
			expect(extended.replicant.secret.permission.read).toEqual({
				roles: new Set(["auditor", "judge"]),
				rolesDenied: new Set(),
			});
		});

		test("re-listing a role's permissions overrides the previous set, vetoing dropped capabilities", () => {
			const extended = extendNamespace(base, {
				roles: { judge: { permission: ["replicant-read"] } },
			});

			expect(extended.replicant.score.permission.write).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
			expect(extended.computed.total.permission.read).toEqual({
				roles: new Set(["viewer"]),
				rolesDenied: new Set(),
			});
			expect(extended.replicant.secret.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
			});
			expect(extended.replicant.score.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
			});
		});

		test("callback form receives the resolved precedent", () => {
			const extended = extendNamespace(base, (precedent) => ({
				replicant: {
					mirror: {
						schema: Schema.Finite,
						permission: {
							read: {
								allow: [...precedent.replicant.score.permission.read.roles],
							},
						},
					},
				},
			}));

			expect(extended.replicant.mirror.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
			});
		});

		test("adds fields across computed and topic groups", () => {
			const extended = extendNamespace(base, {
				computed: { ratio: { schema: Schema.Finite } },
				topic: { ping: { schema: Schema.String } },
			});

			expect(extended.computed.ratio.encode(0.5)).toStrictEqual(
				Result.succeed(0.5),
			);
			expect(extended.topic.ping.encode("x")).toStrictEqual(
				Result.succeed("x"),
			);
			expect(extended.computed.ratio.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
			});
			expect(extended.topic.ping.permission.read).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
		});

		test("adds an rpc field with request/response and permission", () => {
			const extended = extendNamespace(base, {
				roles: { operator: { permission: ["rpc-call"] } },
				rpc: {
					restart: {
						schema: {
							request: Schema.String,
							response: Schema.Boolean,
						},
						permission: { write: { allow: ["operator"] } },
					},
				},
			});

			expect(extended.rpc.restart.request.encode("go")).toStrictEqual(
				Result.succeed("go"),
			);
			expect(extended.rpc.restart.response.decode(true)).toStrictEqual(
				Result.succeed(true),
			);
			expect(extended.rpc.restart.permission.write).toEqual({
				roles: new Set(["operator"]),
				rolesDenied: new Set(),
			});
			expect(extended.rpc.restart.permission.read).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
		});

		test("adds a custom route with its permission", () => {
			const extended = extendNamespace(base, {
				roles: { operator: { permission: ["custom-route-request"] } },
				customRoute: {
					backup: {
						get: { permission: { write: { allow: ["operator"] } } },
					},
				},
			});

			expect(extended.customRoute.backup.get.permission.write).toEqual({
				roles: new Set(["operator"]),
				rolesDenied: new Set(),
			});
		});

		test("overrides a custom route's permission and keeps its denials", () => {
			const routeBase = defineNamespace("match", {
				roles: {
					operator: { permission: ["custom-route-request"] },
					producer: { permission: ["custom-route-request"] },
				},
				customRoute: {
					backup: {
						get: { permission: { write: { deny: ["operator"] } } },
					},
				},
			});

			const extended = extendNamespace(routeBase, {
				customRoute: {
					backup: {
						get: { permission: { write: { everyone: "allow" } } },
					},
				},
			});

			expect(extended.customRoute.backup.get.permission.write).toEqual({
				roles: new Set(["producer"]),
				rolesDenied: new Set(["operator"]),
				everyone: "allow",
			});
		});

		test("a custom route's explicit allow follows role changes like an rpc's", () => {
			const routeBase = defineNamespace("match", {
				roles: {
					operator: { permission: ["rpc-call", "custom-route-request"] },
				},
				rpc: {
					restart: {
						schema: { request: Schema.Finite, response: Schema.Finite },
						permission: { write: { allow: ["operator"] } },
					},
				},
				customRoute: {
					backup: {
						get: { permission: { write: { allow: ["operator"] } } },
					},
				},
			});

			const granted = extendNamespace(routeBase, {
				roles: {
					producer: { permission: ["rpc-call", "custom-route-request"] },
				},
			});
			const grantedRoute = granted.customRoute.backup.get.permission;
			expect(grantedRoute.write).toEqual({
				roles: new Set(["operator", "producer"]),
				rolesDenied: new Set(),
			});
			expect(grantedRoute.write).toEqual(granted.rpc.restart.permission.write);

			const vetoed = extendNamespace(granted, {
				roles: { operator: { permission: [] } },
			});
			const vetoedRoute = vetoed.customRoute.backup.get.permission;
			expect(vetoedRoute.write).toEqual({
				roles: new Set(["producer"]),
				rolesDenied: new Set(),
			});
			expect(vetoedRoute.write).toEqual(vetoed.rpc.restart.permission.write);
		});

		test("adds a method to a precedent's custom route", () => {
			const routeBase = defineNamespace("match", {
				customRoute: {
					asset: { get: { permission: { write: { everyone: "allow" } } } },
				},
			});

			const extended = extendNamespace(routeBase, {
				customRoute: {
					asset: { post: {} },
				},
			});

			expect(extended.customRoute.asset.get.permission.write).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
				everyone: "allow",
			});
			expect(extended.customRoute.asset.post.permission.write).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});
		});

		test("rejects an added custom route name that differs from an existing one only in case", () => {
			const routeBase = defineNamespace("match", {
				customRoute: { webhook: { get: {} } },
			});

			expect(() =>
				extendNamespace(routeBase, {
					customRoute: {
						// @ts-expect-error differs from webhook only in case
						Webhook: { post: {} },
					},
				}),
			).toThrow(
				'Custom route "Webhook" in "match" differs from "webhook" only in case',
			);
		});

		test("rejects an added custom route name outside the allowed characters", () => {
			expect(() =>
				extendNamespace(base, {
					customRoute: {
						// @ts-expect-error a slash is not allowed
						"a/b": { get: {} },
					},
				}),
			).toThrow(
				'Custom route "a/b" in "match" must use only A-Z, a-z, 0-9, "_" and "-", and not be a Windows device name',
			);
		});

		test("re-lists a role to re-bake rpc write, and grants retroactively", () => {
			const rpcBase = defineNamespace("match", {
				roles: { operator: { permission: ["rpc-call"] } },
				rpc: {
					restart: {
						schema: { request: Schema.Finite, response: Schema.Finite },
					},
				},
			});

			const vetoed = extendNamespace(rpcBase, {
				roles: { operator: { permission: [] } },
			});
			expect(vetoed.rpc.restart.permission.write).toEqual({
				roles: new Set(),
				rolesDenied: new Set(),
			});

			const granted = extendNamespace(rpcBase, {
				roles: { producer: { permission: ["rpc-call"] } },
			});
			expect(granted.rpc.restart.permission.write).toEqual({
				roles: new Set(["operator", "producer"]),
				rolesDenied: new Set(),
			});
		});

		test("declaring everyone opens the precedent's fields, and re-listing it locks them back down", () => {
			const opened = extendNamespace(base, {
				principals: { everyone: { permission: ["replicant-read"] } },
			});
			expect(opened.replicant.score.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
				everyone: "allow",
			});
			expect(opened.replicant.secret.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
				everyone: "allow",
			});

			const closed = extendNamespace(opened, {
				principals: { everyone: { permission: [] } },
			});
			expect(closed.replicant.score.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
			});
			expect(closed.replicant.secret.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
			});
		});

		test("an extend cannot re-list the server or admin principal", () => {
			for (const principal of ["server", "admin"]) {
				const principals = { [principal]: { permission: [] } };
				expect(() => extendNamespace(base, { principals })).toThrow(
					new RegExp(`Principal "${principal}" is undeniable`),
				);
			}
		});

		test("a member blanket reaches roles added in a later extend", () => {
			const blanketed = extendNamespace(base, {
				principals: { member: { permission: ["replicant-read"] } },
			});
			const withAuditor = extendNamespace(blanketed, {
				roles: { auditor: { permission: [] } },
			});

			expect(withAuditor.replicant.score.permission.read).toEqual({
				roles: new Set(["judge", "viewer"]),
				rolesDenied: new Set(),
				member: "allow",
			});
		});

		test("re-listing member drops the blanket but keeps roles holding the capability outright", () => {
			const blanketed = extendNamespace(base, {
				principals: { member: { permission: ["replicant-write"] } },
				roles: { viewer: { permission: ["replicant-read"] } },
			});
			expect(blanketed.replicant.score.permission.write).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
				member: "allow",
			});

			const revoked = extendNamespace(blanketed, {
				principals: { member: { permission: [] } },
			});
			expect(revoked.replicant.score.permission.write).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
			});
		});

		const locked = extendNamespace(base, {
			replicant: { score: { permission: { read: { deny: ["viewer"] } } } },
		});

		test("a denial carries into the extended manifest, folding into write", () => {
			expect(locked.replicant.score.permission.read.rolesDenied).toEqual(
				new Set(["viewer"]),
			);
			expect(locked.replicant.score.permission.write.rolesDenied).toEqual(
				new Set(["viewer"]),
			);
		});

		test("a denial survives an extend that does not speak about the field", () => {
			const untouched = extendNamespace(locked, {
				roles: { auditor: { permission: ["replicant-read"] } },
			});

			expect(untouched.replicant.score.permission.read.rolesDenied).toEqual(
				new Set(["viewer"]),
			);
		});

		test("re-allowing a denied role lifts the denial", () => {
			const regranted = extendNamespace(locked, {
				replicant: {
					score: { permission: { read: { allow: ["viewer", "judge"] } } },
				},
			});

			expect(regranted.replicant.score.permission.read).toEqual({
				roles: new Set(["viewer", "judge"]),
				rolesDenied: new Set(),
			});
		});

		test("lifting read does not hand back write — that needs its own allow", () => {
			const readOnly = extendNamespace(locked, {
				replicant: {
					score: { permission: { read: { allow: ["viewer", "judge"] } } },
				},
			});
			expect(readOnly.replicant.score.permission.write.rolesDenied).toEqual(
				new Set(["viewer"]),
			);

			const full = extendNamespace(locked, {
				replicant: {
					score: {
						permission: {
							read: { allow: ["viewer", "judge"] },
							write: { allow: ["viewer", "judge"] },
						},
					},
				},
			});
			expect(full.replicant.score.permission.write).toEqual({
				roles: new Set(["viewer", "judge"]),
				rolesDenied: new Set(),
			});
		});

		test("an everyone grant does not lift a role denial — deny wins across slots", () => {
			const opened = extendNamespace(locked, {
				replicant: {
					score: { permission: { read: { everyone: "allow" } } },
				},
			});

			expect(opened.replicant.score.permission.read).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(["viewer"]),
				everyone: "allow",
			});
		});

		test("throws on an unknown token in an added field", () => {
			expect(() =>
				extendNamespace(base, {
					replicant: {
						pinned: {
							schema: Schema.String,
							permission: { write: { allow: ["jdge"] } },
						},
					},
				}),
			).toThrow(/Unknown role "jdge" in replicant "pinned" write\.allow/);
		});

		test("accepts a role added in the same extend as a field token", () => {
			const extended = extendNamespace(base, {
				roles: { auditor: { permission: ["replicant-read"] } },
				replicant: {
					pinned: {
						schema: Schema.String,
						permission: { read: { allow: ["auditor"] } },
					},
				},
			});

			expect(extended.replicant.pinned.permission.read).toEqual({
				roles: new Set(["auditor", "judge"]),
				rolesDenied: new Set(),
			});
			expect(extended.replicant.pinned.permission.write).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
			});
		});
	});

	describe("types", () => {
		test("merges added field types into the manifest", () => {
			const extended = extendNamespace(base, {
				replicant: {
					pinned: {
						schema: Schema.String.check(
							Schema.isNonEmpty(),
							Schema.isTrimmed(),
						),
					},
				},
				computed: { ratio: { schema: z.number() } },
			});

			expectTypeOf(extended.replicant.score.encode)
				.parameter(0)
				.toEqualTypeOf<number>();
			expectTypeOf(extended.replicant.pinned.encode)
				.parameter(0)
				.toEqualTypeOf<string>();
			expectTypeOf(extended.computed.ratio.encode)
				.parameter(0)
				.toEqualTypeOf<number>();
		});

		test("merges added rpc field types into the manifest", () => {
			const extended = extendNamespace(base, {
				rpc: {
					setScore: {
						schema: {
							request: Schema.Struct({ home: Schema.Finite }),
							response: Schema.Boolean,
						},
					},
				},
			});

			expectTypeOf(extended.rpc.setScore.request.encode)
				.parameter(0)
				.toEqualTypeOf<{ readonly home: number } | { home: number }>();
			expectTypeOf(extended.rpc.setScore.response.decode).returns.toEqualTypeOf<
				Result.Result<boolean, FieldDecodeError>
			>();
		});
	});

	describe("children", () => {
		const assets = defineNamespace("show-assets", {});
		const media = defineNamespace("show-media", {});
		const show = defineNamespace("show", { children: { assets } });

		test("adds children beside the precedent's", () => {
			const extended = extendNamespace(show, { children: { media } });

			expect(extended.children).toStrictEqual({ assets, media });
		});

		test("rejects re-declaring a child", () => {
			extendNamespace(show, {
				// @ts-expect-error "assets" is already a child of "show"
				children: { assets },
			});
		});
	});

	describe("role links", () => {
		const assets = defineNamespace("show-assets", {
			roles: { uploader: { permission: ["rpc-call"] } },
		});
		const media = defineNamespace("show-media", {
			roles: { player: { permission: ["rpc-call"] } },
		});
		const show = defineNamespace("show", {
			roles: {
				operator: { permission: [], linkedRoles: [assets.roles.uploader] },
			},
			children: { assets },
		});

		test("exposes added roles beside the precedent's", () => {
			const extended = extendNamespace(show, {
				roles: { director: { permission: [] } },
			});

			expect(extended.roles).toStrictEqual({
				operator: { namespace: "show", name: "operator" },
				director: { namespace: "show", name: "director" },
			});
			expectTypeOf(extended.roles).toEqualTypeOf<
				Readonly<
					Record<
						"operator" | "director",
						NamespaceRole<"show", "operator" | "director">
					>
				>
			>();
		});

		test("adds links beside the precedent's", () => {
			const extended = extendNamespace(show, {
				roles: {
					director: {
						permission: [],
						linkedRoles: [assets.roles.uploader, media.roles.player],
					},
				},
				children: { media },
			});

			const { roles } = extended[manifestRolesKey];
			expect(roles.get(RoleName.make("operator"))?.linkedRoles).toStrictEqual([
				{ namespace: "show-assets", name: "uploader" },
			]);
			expect(roles.get(RoleName.make("director"))?.linkedRoles).toStrictEqual([
				{ namespace: "show-assets", name: "uploader" },
				{ namespace: "show-media", name: "player" },
			]);
		});

		test("keeps the links of a role re-declared without any", () => {
			const extended = extendNamespace(show, {
				roles: { operator: { permission: ["rpc-call"] } },
			});

			expect(
				extended[manifestRolesKey].roles.get(RoleName.make("operator"))
					?.linkedRoles,
			).toStrictEqual([{ namespace: "show-assets", name: "uploader" }]);
		});

		test("replaces the links of a role re-declared with its own", () => {
			const extended = extendNamespace(show, {
				roles: {
					operator: { permission: [], linkedRoles: [media.roles.player] },
				},
				children: { media },
			});

			expect(
				extended[manifestRolesKey].roles.get(RoleName.make("operator"))
					?.linkedRoles,
			).toStrictEqual([{ namespace: "show-media", name: "player" }]);
		});

		test("rejects a role of a namespace that is not a child", () => {
			expect(() =>
				extendNamespace(show, {
					roles: {
						director: {
							permission: [],
							// @ts-expect-error "show-media" is not a declared child
							linkedRoles: [media.roles.player],
						},
					},
				}),
			).toThrow(/Role "director" cannot link to "player" of "show-media"/);
		});
	});
});
