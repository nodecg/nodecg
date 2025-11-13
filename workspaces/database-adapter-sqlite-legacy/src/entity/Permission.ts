import type { Permission as PermissionModel } from "@nodecg/database-adapter-types";
import {
	Column,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	type Relation,
} from "typeorm";

import { Role } from "./Role.ts";

export const enum Action {
	NONE = 0,
	READ = 1 << 0,
	WRITE = 1 << 1,
}

@Entity({ name: "permission" })
export class Permission implements PermissionModel {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column("text")
	name!: string;

	@ManyToOne(() => Role, (role) => role.permissions)
	role!: Relation<Role>;

	@Column("text")
	entityId!: string;

	@Column("int")
	actions!: number;
}
