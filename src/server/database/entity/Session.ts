import type { ISession } from 'connect-typeorm';
import { Column, Entity, Index, PrimaryColumn, ValueTransformer, DeleteDateColumn } from 'typeorm';

// Postgres returns string by default. Return number instead.
const Bigint: ValueTransformer = {
	from: (value) => new Number(value),
	to: (value) => (value === Infinity ? '+Infinity' : new Number(value)),
};

@Entity()
export class Session implements ISession {
	@Index()
	@Column('bigint', { transformer: Bigint })
	expiredAt = Date.now();

	@PrimaryColumn('varchar', { length: 255 })
	id = '';

	@Column('text')
	json = '';

	@DeleteDateColumn()
	public destroyedAt?: Date;
}
