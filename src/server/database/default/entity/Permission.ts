import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import type { Permission as PermissionModel } from "../../../../types/models";
import { Role } from "./Role";

export const enum Action {
	NONE = 0,
	READ = 1 << 0,
	WRITE = 1 << 1,
}

@Entity()
export class Permission implements PermissionModel {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column("text")
	name!: string;

	@ManyToOne(() => Role, (role) => role.permissions)
	role!: Role;

	@Column("text")
	entityId!: string;

	@Column("int")
	actions!: number;
}
