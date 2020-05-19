import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Replicant {
	@PrimaryColumn('text')
	namespace: string;

	@PrimaryColumn('text')
	name: string;

	@Column('text')
	value: string;
}
