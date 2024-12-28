import { Entity, Generated, ManyToOne, PrimaryColumn } from "typeorm";

import type { ApiKey as ApiKeyModel } from "../../../../types/models";
import { User } from "./User";

@Entity()
export class ApiKey implements ApiKeyModel {
	@PrimaryColumn()
	@Generated("uuid")
	secret_key!: string;

	@ManyToOne(() => User, (user) => user.apiKeys)
	user!: User;
}
