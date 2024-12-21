import { Entity, PrimaryColumn, Column } from 'typeorm';
import type { Replicant as ReplicantModel } from '../../models';

@Entity()
export class Replicant implements ReplicantModel {
	@PrimaryColumn('text')
	namespace!: string;

	@PrimaryColumn('text')
	name!: string;

	@Column('text')
	value!: string;
}
