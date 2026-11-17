import type { RoleRegistry } from "@nodecg/core";
import { type NamespacePath, Role, RoleName } from "@nodecg/internal";
import { Array, Context, HashMap, HashSet, Option } from "effect";

type RoleLinkMap = HashMap.HashMap<Role, HashSet.HashSet<Role>>;

export class RoleLinks extends Context.Service<RoleLinks, RoleLinkMap>()(
	"RoleLinks",
) {}

export const resolveRoleLinks = (
	namespace: NamespacePath,
	roles: RoleRegistry["roles"],
): RoleLinkMap =>
	HashMap.fromIterable(
		Array.map(
			Array.fromIterable(roles),
			([name, { linkedRoles }]) =>
				[
					Role.make({ namespace, name }),
					HashSet.fromIterable(
						linkedRoles.map((link) =>
							Role.make({
								namespace: Array.appendAll(namespace, link.children),
								name: RoleName.make(link.name),
							}),
						),
					),
				] as const,
		),
	);

export const normalizeRoleLinks = (
	namespaceLinks: ReadonlyArray<RoleLinkMap>,
): RoleLinkMap => {
	const links = namespaceLinks.reduce(
		(all, next) => HashMap.union(all, next),
		HashMap.empty<Role, HashSet.HashSet<Role>>(),
	);
	const collectLinkedRoles = (role: Role): HashSet.HashSet<Role> =>
		HashMap.get(links, role).pipe(
			Option.getOrElse(() => HashSet.empty<Role>()),
			(roles) =>
				HashSet.reduce(roles, roles, (collected, linked) =>
					collected.pipe(HashSet.union(collectLinkedRoles(linked))),
				),
		);
	return links.pipe(HashMap.map((_, role) => collectLinkedRoles(role)));
};

export const expandRoleLinks = (roles: Iterable<Role>, links: RoleLinkMap) => {
	const roleSet = HashSet.fromIterable(roles);
	return HashSet.reduce(roleSet, roleSet, (expanded, role) =>
		HashSet.union(
			expanded,
			HashMap.get(links, role).pipe(
				Option.getOrElse(() => HashSet.empty<Role>()),
			),
		),
	);
};
