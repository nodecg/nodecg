import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Permission } from "./Permission";
import type { Role as RoleModel } from "../../models";

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
