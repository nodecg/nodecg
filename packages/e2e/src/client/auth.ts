import { loadAuthClient, type RoleAssignment } from "@nodecg-next/client";
import { Url, UrlParams } from "effect/http";
import { commands } from "vitest/browser";

export const makeAuthHelpers = (baseUrl: string) => {
	const client = loadAuthClient(baseUrl);

	const login = async (subject: string) => {
		await client.logout();
		const providers = await client.providers();
		const dev = providers.find((provider) => provider.name === "dev");
		if (typeof dev === "undefined") {
			throw new Error("dev provider is not registered");
		}
		const params = UrlParams.setAll({
			as: subject,
			returnTo: `${new URL(baseUrl).pathname}/api/internal/me`,
		});
		const url = Url.modifyUrlParams(dev.url, params);
		await commands.navigate(url.href);
	};

	const logout = () => client.logout();
	const me = () => client.me();

	const findUserId = async (subject: string) => {
		const { users } = await client.listUsers();
		const user = users.find(({ authentications }) =>
			authentications.some(
				(authentication) =>
					authentication.issuer === "dev" && authentication.subject === subject,
			),
		);
		if (typeof user === "undefined") {
			throw new Error(`"${subject}" is not a user`);
		}
		return user.id;
	};

	const createUser = async (subject: string) => {
		await login(subject);
		await login("root");
		const userId = await findUserId(subject);
		await logout();
		return userId;
	};

	const grantRole = (userId: string, role: RoleAssignment["role"]) =>
		client.grantRole({ userId, role });

	const revokeRole = (userId: string, role: RoleAssignment["role"]) =>
		client.revokeRole({ userId, role });

	const grantAsAdmin = async (userId: string, role: RoleAssignment["role"]) => {
		await login("root");
		await grantRole(userId, role);
	};

	const revokeAsAdmin = async (
		userId: string,
		role: RoleAssignment["role"],
	) => {
		await login("root");
		await revokeRole(userId, role);
	};

	return {
		client,
		login,
		logout,
		me,
		createUser,
		grantRole,
		revokeRole,
		grantAsAdmin,
		revokeAsAdmin,
	};
};
