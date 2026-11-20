import { defineNamespace } from "@nodecg/core";
import { manifestRolesKey, Role, RoleName } from "@nodecg/internal";
import { Equal, HashMap, HashSet, Option } from "effect";
import { assert, describe, test } from "vitest";

import {
	expandRoleLinks,
	normalizeRoleLinks,
	resolveRoleLinks,
} from "./role-links.ts";

const operator = Role.make({
	namespace: ["show"],
	name: RoleName.make("operator"),
});
const uploader = Role.make({
	namespace: ["show", "assets"],
	name: RoleName.make("uploader"),
});
const archiver = Role.make({
	namespace: ["show", "assets", "archive"],
	name: RoleName.make("archiver"),
});
const player = Role.make({
	namespace: ["show", "media"],
	name: RoleName.make("player"),
});
const viewer = Role.make({
	namespace: ["show"],
	name: RoleName.make("viewer"),
});

describe("resolveRoleLinks", () => {
	test("places each linked role under the declaring path and the child keys", () => {
		const archive = defineNamespace("show-archive", {
			roles: { archiver: { permission: [] } },
		});
		const media = defineNamespace("show-media", {
			roles: { player: { permission: [] } },
			children: { archive },
		});
		const show = defineNamespace("show", {
			roles: {
				operator: {
					permission: [],
					linkRoles: (children) => [
						children.media.children.archive.roles.archiver,
						children.media.roles.player,
					],
				},
			},
			children: { media },
		});

		assert(
			Equal.equals(
				resolveRoleLinks(["root", "show"], show[manifestRolesKey].roles),
				HashMap.make([
					Role.make({
						namespace: ["root", "show"],
						name: RoleName.make("operator"),
					}),
					HashSet.make(
						Role.make({
							namespace: ["root", "show", "media", "archive"],
							name: RoleName.make("archiver"),
						}),
						Role.make({
							namespace: ["root", "show", "media"],
							name: RoleName.make("player"),
						}),
					),
				]),
			),
		);
	});

	test("keeps a role with no links", () => {
		const show = defineNamespace("show", {
			roles: { viewer: { permission: [] } },
		});

		assert(
			Equal.equals(
				resolveRoleLinks(["root", "show"], show[manifestRolesKey].roles),
				HashMap.make([
					Role.make({
						namespace: ["root", "show"],
						name: RoleName.make("viewer"),
					}),
					HashSet.empty(),
				]),
			),
		);
	});
});

describe("normalizeRoleLinks", () => {
	test("follows a chain to every role it reaches", () => {
		const links = normalizeRoleLinks([
			HashMap.make([operator, HashSet.make(uploader)]),
			HashMap.make([uploader, HashSet.make(archiver)]),
			HashMap.make([archiver, HashSet.empty<Role>()]),
		]);

		assert(
			Equal.equals(
				HashMap.get(links, operator),
				Option.some(HashSet.make(uploader, archiver)),
			),
		);
		assert(
			Equal.equals(
				HashMap.get(links, uploader),
				Option.some(HashSet.make(archiver)),
			),
		);
	});
});

describe("expandRoleLinks", () => {
	test("keeps held roles beside linked roles", () => {
		const links = HashMap.make(
			[operator, HashSet.make(uploader, archiver)],
			[uploader, HashSet.make(archiver)],
		);

		assert(
			Equal.equals(
				expandRoleLinks(HashSet.make(operator, uploader, viewer), links),
				HashSet.make(operator, uploader, viewer, archiver),
			),
		);
	});

	test("ignores a link whose source is not held", () => {
		const links = HashMap.make([uploader, HashSet.make(player)]);

		assert(
			Equal.equals(
				expandRoleLinks(HashSet.make(operator), links),
				HashSet.make(operator),
			),
		);
	});
});
