import { Column,Entity, PrimaryColumn } from "typeorm";

import type { Replicant as ReplicantModel } from "../../../../types/models";

@Entity()
export class Replicant implements ReplicantModel {
	@PrimaryColumn("text")
	namespace!: string;

	@PrimaryColumn("text")
	name!: string;

	@Column("text")
	value!: string;
}
