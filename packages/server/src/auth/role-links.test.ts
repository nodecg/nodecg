import { defineNamespace } from "@nodecg-next/core";
import { Role, RoleName } from "@nodecg-next/internal";
import { Equal, HashMap, HashSet, Option } from "effect";
import { assert, describe, test } from "vitest";

import { expandRoleLinks, normalizeRoleLinks } from "./role-links.ts";

const operator = Role.make({
	namespace: "show",
	name: RoleName.make("operator"),
});
const uploader = Role.make({
	namespace: "show-assets",
	name: RoleName.make("uploader"),
});
const archiver = Role.make({
	namespace: "show-archive",
	name: RoleName.make("archiver"),
});
const player = Role.make({
	namespace: "show-media",
	name: RoleName.make("player"),
});
const viewer = Role.make({
	namespace: "show",
	name: RoleName.make("viewer"),
});

describe("normalizeRoleLinks", () => {
	test("follows a chain to every role it reaches", () => {
		const archive = defineNamespace("show-archive", {
			roles: { archiver: { permission: [] } },
		});
		const assets = defineNamespace("show-assets", {
			roles: {
				uploader: { permission: [], linkedRoles: [archive.roles.archiver] },
			},
			children: { archive },
		});
		const show = defineNamespace("show", {
			roles: {
				operator: { permission: [], linkedRoles: [assets.roles.uploader] },
			},
			children: { assets },
		});

		const links = normalizeRoleLinks([show, assets, archive]);

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

	test("follows every link of a role", () => {
		const assets = defineNamespace("show-assets", {
			roles: { uploader: { permission: [] } },
		});
		const media = defineNamespace("show-media", {
			roles: { player: { permission: [] } },
		});
		const show = defineNamespace("show", {
			roles: {
				operator: {
					permission: [],
					linkedRoles: [assets.roles.uploader, media.roles.player],
				},
			},
			children: { assets, media },
		});

		const links = normalizeRoleLinks([show, assets, media]);

		assert(
			Equal.equals(
				HashMap.get(links, operator),
				Option.some(HashSet.make(uploader, player)),
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
