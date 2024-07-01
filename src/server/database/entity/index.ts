import { apiKey, apiKeyRelations } from './ApiKey';
export type { ApiKey } from './ApiKey';

import { identity, identityRelations } from './Identity';
export type { Identity } from './Identity'

import { permission, permissionRelations } from './Permission';
export { Action } from './Permission';
export type { Permission } from './Permission';

import { replicant } from './Replicant';
export type { Replicant } from './Replicant';

import { role, roleRelations } from './Role';
export type { Role } from './Role';

import { session } from './Session';
export type { Session } from './Session';

import { user, userRelations } from './User';
export type { User } from './User';

import { userRoles, userRolesRelations } from './UserRole';

export const tables = {
	apiKey,
	identity,
	permission,
	replicant,
	role,
	session,
	user,
	userRoles
};

export const relations = {
	apiKey: apiKeyRelations,
	identity: identityRelations,
	permission: permissionRelations,
	role: roleRelations,
	user: userRelations,
	userRoles: userRolesRelations
};
