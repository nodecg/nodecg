import type { ApiKey as ApiKeyModel } from "@nodecg/database-adapter-types";
import { Entity, Generated, ManyToOne, PrimaryColumn } from "typeorm";

import { User } from "./User.ts";

@Entity({ name: "api_key" })
export class ApiKey implements ApiKeyModel {
	@PrimaryColumn()
	@Generated("uuid")
	secret_key!: string;

	@ManyToOne(() => User, (user) => user.apiKeys)
	user!: User;
}
