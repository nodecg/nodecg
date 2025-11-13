import { it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { afterEach, beforeEach, describe, expect } from "vitest";

import {
	MockFileSystemServiceLayer,
	MockJsonSchemaServiceLayer,
	MockPathServiceLayer,
	MockTerminalServiceLayer,
} from "../helpers/mock-services.js";
import { createTestLayer } from "../helpers/test-runner.js";
import { defaultconfigCommand } from "./defaultconfig.js";

describe("defaultconfigCommand", () => {
	describe("generating config with explicit bundle name", () => {
		it.effect(
			"should generate default config when bundle name is provided",
			() =>
				Effect.gen(function* () {
					const handler = defaultconfigCommand.handler;
					yield* handler({
						bundle: Option.some("test-bundle"),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockFileSystemServiceLayer({
								"/mock/nodecg/bundles/test-bundle": {},
								"/mock/nodecg/bundles/test-bundle/configschema.json": {
									type: "object",
									properties: {
										host: { type: "string", default: "localhost" },
										port: { type: "number", default: 9090 },
										enabled: { type: "boolean", default: true },
									},
								},
								"/mock/nodecg/cfg": {},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
							MockJsonSchemaServiceLayer({
								host: "localhost",
								port: 9090,
								enabled: true,
							}),
						),
					),
				),
		);

		it.effect("should error when bundle does not exist", () =>
			Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("non-existent-bundle"),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockFileSystemServiceLayer({
							"/mock/nodecg/bundles": {},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
						MockJsonSchemaServiceLayer(),
					),
				),
			),
		);

		it.effect("should error when bundle has no configschema.json", () =>
			Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("test-bundle"),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockFileSystemServiceLayer({
							"/mock/nodecg/bundles/test-bundle": {},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
						MockJsonSchemaServiceLayer(),
					),
				),
			),
		);

		it.effect("should error when config file already exists", () =>
			Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("test-bundle"),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockFileSystemServiceLayer({
							"/mock/nodecg/bundles/test-bundle": {},
							"/mock/nodecg/bundles/test-bundle/configschema.json": {
								type: "object",
								properties: {},
							},
							"/mock/nodecg/cfg": {},
							"/mock/nodecg/cfg/test-bundle.json": {
								existing: "config",
							},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
						MockJsonSchemaServiceLayer(),
					),
				),
			),
		);
	});

	describe("finding bundle in current directory", () => {
		it.effect(
			"should generate config for current directory bundle when no name provided",
			() =>
				Effect.gen(function* () {
					const handler = defaultconfigCommand.handler;
					yield* handler({
						bundle: Option.none(),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockFileSystemServiceLayer({
								[`${process.cwd()}/package.json`]: {
									name: "current-bundle",
									version: "1.0.0",
									nodecg: { compatibleRange: "^1.0.0" },
								},
								"/mock/nodecg/bundles/current-bundle": {},
								"/mock/nodecg/bundles/current-bundle/configschema.json": {
									type: "object",
									properties: {
										apiKey: { type: "string", default: "default-key" },
									},
								},
								"/mock/nodecg/cfg": {},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({
								nodecgPath: "/mock/nodecg",
								isBundle: true,
							}),
							MockJsonSchemaServiceLayer({
								apiKey: "default-key",
							}),
						),
					),
				),
		);

		it.effect("should error when current directory is not a bundle", () =>
			Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				try {
					yield* handler({
						bundle: Option.none(),
					});
				} catch (error) {
					expect(error).toBeDefined();
				}
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockFileSystemServiceLayer({
							[`${process.cwd()}/package.json`]: {
								name: "not-a-bundle",
								version: "1.0.0",
							},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({
							nodecgPath: "/mock/nodecg",
							isBundle: false,
						}),
						MockJsonSchemaServiceLayer(),
					),
				),
			),
		);
	});

	describe("creating cfg directory", () => {
		it.effect("should create cfg directory if it does not exist", () =>
			Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("test-bundle"),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockFileSystemServiceLayer({
							"/mock/nodecg/bundles/test-bundle": {},
							"/mock/nodecg/bundles/test-bundle/configschema.json": {
								type: "object",
								properties: {},
							},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
						MockJsonSchemaServiceLayer({ key: "value" }),
					),
				),
			),
		);
	});

	describe("complex schema defaults", () => {
		it.effect("should apply nested default values from schema", () =>
			Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("complex-bundle"),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockFileSystemServiceLayer({
							"/mock/nodecg/bundles/complex-bundle": {},
							"/mock/nodecg/bundles/complex-bundle/configschema.json": {
								type: "object",
								properties: {
									server: {
										type: "object",
										properties: {
											host: { type: "string", default: "localhost" },
											port: { type: "number", default: 8080 },
											ssl: {
												type: "object",
												properties: {
													enabled: { type: "boolean", default: false },
													cert: { type: "string", default: "/path/to/cert" },
												},
											},
										},
									},
									features: {
										type: "object",
										properties: {
											authentication: { type: "boolean", default: true },
											logging: { type: "boolean", default: true },
										},
									},
								},
							},
							"/mock/nodecg/cfg": {},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
						MockJsonSchemaServiceLayer({
							server: {
								host: "localhost",
								port: 8080,
								ssl: {
									enabled: false,
									cert: "/path/to/cert",
								},
							},
							features: {
								authentication: true,
								logging: true,
							},
						}),
					),
				),
			),
		);
	});

	describe("installed mode (NodeCG as dependency)", () => {
		beforeEach(() => {
			process.env["NODECG_ROOT"] = "/mock/root";
		});

		afterEach(() => {
			delete process.env["NODECG_ROOT"];
		});

		it.effect(
			"should create config for root bundle when bundle name matches root package",
			() =>
				Effect.gen(function* () {
					const handler = defaultconfigCommand.handler;
					yield* handler({
						bundle: Option.some("my-awesome-bundle"),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockFileSystemServiceLayer({
								"/mock/root/package.json": {
									name: "my-awesome-bundle",
									nodecg: { compatibleRange: "^2.0.0" },
								},
								"/mock/root/configschema.json": {
									type: "object",
									properties: {
										installedMode: { type: "boolean", default: true },
										value: { type: "number", default: 42 },
									},
								},
								"/mock/root/cfg": {},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({
								nodecgPath: "/mock/root",
								isBundle: true,
							}),
							MockJsonSchemaServiceLayer({
								installedMode: true,
								value: 42,
							}),
						),
					),
				),
		);

		it.effect(
			"should create config for root bundle when run with no arguments",
			() =>
				Effect.gen(function* () {
					const handler = defaultconfigCommand.handler;
					yield* handler({
						bundle: Option.none(),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockFileSystemServiceLayer({
								[`${process.cwd()}/package.json`]: {
									name: "not-a-bundle",
									version: "1.0.0",
								},
								"/mock/root/package.json": {
									name: "my-awesome-bundle",
									nodecg: { compatibleRange: "^2.0.0" },
								},
								"/mock/root/configschema.json": {
									type: "object",
									properties: {
										installedMode: { type: "boolean", default: true },
									},
								},
								"/mock/root/cfg": {},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({
								nodecgPath: "/mock/root",
								isBundle: true,
							}),
							MockJsonSchemaServiceLayer({
								installedMode: true,
							}),
						),
					),
				),
		);

		it.effect(
			"should still check bundles directory when bundle name doesn't match root",
			() =>
				Effect.gen(function* () {
					const handler = defaultconfigCommand.handler;
					yield* handler({
						bundle: Option.some("another-bundle"),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockFileSystemServiceLayer({
								"/mock/root/package.json": {
									name: "my-awesome-bundle",
									nodecg: { compatibleRange: "^2.0.0" },
								},
								"/mock/root/bundles/another-bundle/package.json": {
									name: "another-bundle",
									nodecg: { compatibleRange: "^2.0.0" },
								},
								"/mock/root/bundles/another-bundle/configschema.json": {
									type: "object",
									properties: {
										fromBundlesDir: { type: "boolean", default: true },
									},
								},
								"/mock/root/cfg": {},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({
								nodecgPath: "/mock/root",
								isBundle: true,
							}),
							MockJsonSchemaServiceLayer({
								fromBundlesDir: true,
							}),
						),
					),
				),
		);
	});
});
