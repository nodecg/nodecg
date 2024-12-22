import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToMany,
	JoinTable,
	OneToMany,
} from "typeorm";
import { Role } from "./Role";
import { Identity } from "./Identity";
import { ApiKey } from "./ApiKey";
import type { User as UserModel } from "../../../../types/models";

@Entity()
export class User implements UserModel {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@CreateDateColumn()
	created_at!: number;

	@Column("text")
	name!: string;

	@ManyToMany(() => Role)
	@JoinTable()
	roles!: Role[];

	@OneToMany(() => Identity, (identity) => identity.user)
	identities!: Identity[];

	@OneToMany(() => ApiKey, (apiKey) => apiKey.user)
	apiKeys!: ApiKey[];
}
