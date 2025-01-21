import type { User as UserModel } from '@nodecg/database-adapter-types'
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinTable,
	ManyToMany,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";

import { ApiKey } from "./ApiKey";
import { Identity } from "./Identity";
import { Role } from "./Role";

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
