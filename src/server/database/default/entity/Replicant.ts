import type { Replicant as ReplicantModel } from '@nodecg/database-adapter-types'
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Replicant implements ReplicantModel {
	@PrimaryColumn("text")
	namespace!: string;

	@PrimaryColumn("text")
	name!: string;

	@Column("text")
	value!: string;
}
