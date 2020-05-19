import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Permission } from './Permission';

@Entity()
export class Role {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({
		type: 'text',
		unique: true,
	})
	name: string;

	@OneToMany(
		() => Permission,
		permission => permission.role,
	)
	permissions: Permission[];
}
