import { Entity, ManyToOne, Generated, PrimaryColumn } from "typeorm";
import { User } from "./User";
import type { ApiKey as ApiKeyModel } from "../../models";

@Entity()
export class ApiKey implements ApiKeyModel {
	@PrimaryColumn()
	@Generated("uuid")
	secret_key!: string;

	@ManyToOne(() => User, (user) => user.apiKeys)
	user!: User;
}
