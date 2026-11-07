import type {
	EmptyNamespaceFields,
	NamespaceManifest,
} from "@nodecg-next/core";
import { manifestRolesKey, Role } from "@nodecg-next/internal";
import { Context, HashMap, HashSet, Option } from "effect";

export class RoleLinks extends Context.Service<
	RoleLinks,
	HashMap.HashMap<Role, HashSet.HashSet<Role>>
>()("RoleLinks") {}

export const normalizeRoleLinks = (
	manifests: ReadonlyArray<
		NamespaceManifest<string, EmptyNamespaceFields, string>
	>,
) => {
	const links = HashMap.fromIterable(
		manifests.flatMap((manifest) =>
			[...manifest[manifestRolesKey].roles].map(([name, { linkedRoles }]) => [
				Role.make({ namespace: manifest.namespace, name }),
				HashSet.fromIterable(linkedRoles),
			]),
		),
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

export const expandRoleLinks = (
	roles: Iterable<Role>,
	links: HashMap.HashMap<Role, HashSet.HashSet<Role>>,
) => {
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
