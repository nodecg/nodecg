import type { Identity as IdentityModel } from '@nodecg/database-adapter-types'
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { User } from "./User";

@Entity()
export class Identity implements IdentityModel {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column("text")
	provider_type!: "twitch" | "steam" | "local" | "discord";

	/**
	 * Hashed password for local, auth token from twitch, etc.
	 */
	@Column("text")
	provider_hash!: string;

	/**
	 * Only used by Twitch and Discord providers.
	 */
	@Column("text", { nullable: true })
	provider_access_token: string | null = null;

	/**
	 * Only used by Twitch and Discord providers.
	 */
	@Column("text", { nullable: true })
	provider_refresh_token: string | null = null;

	@ManyToOne(() => User, (user) => user.identities)
	user!: User;
}
