import { Entity, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { User } from './User';

@Entity()
export class Identity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column('text')
	provider_type: 'twitch' | 'steam' | 'local' | 'discord';

	/**
	 * Hashed password for local, auth token from twitch, etc.
	 */
	@Column('text')
	provider_hash: string;

	@ManyToOne(() => User, (user) => user.identities)
	user: User;
}
