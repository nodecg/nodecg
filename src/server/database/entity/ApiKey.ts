import { Entity, ManyToOne, Generated, PrimaryColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class ApiKey {
	@PrimaryColumn()
	@Generated('uuid')
	secret_key: string;

	@ManyToOne(
		() => User,
		user => user.apiKeys,
	)
	user: User;
}
