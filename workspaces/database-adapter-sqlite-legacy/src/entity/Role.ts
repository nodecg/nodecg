import type { Role as RoleModel } from "@nodecg/database-adapter-types";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { Permission } from "./Permission";

@Entity()
export class Role implements RoleModel {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({
		type: "text",
		unique: true,
	})
	name!: string;

	@OneToMany(() => Permission, (permission) => permission.role)
	permissions!: Permission[];
}
