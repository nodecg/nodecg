import { type MigrationInterface, type QueryRunner } from "typeorm";

export class initialize1669424617013 implements MigrationInterface {
	name = "initialize1669424617013";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "permission" ("id" varchar PRIMARY KEY NOT NULL, "name" text NOT NULL, "entityId" text NOT NULL, "actions" integer NOT NULL, "roleId" varchar)`,
		);
		await queryRunner.query(
			`CREATE TABLE "role" ("id" varchar PRIMARY KEY NOT NULL, "name" text NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "identity" ("id" varchar PRIMARY KEY NOT NULL, "provider_type" text NOT NULL, "provider_hash" text NOT NULL, "provider_access_token" text, "provider_refresh_token" text, "userId" varchar)`,
		);
		await queryRunner.query(
			`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "name" text NOT NULL)`,
		);
		await queryRunner.query(
			`CREATE TABLE "api_key" ("secret_key" varchar PRIMARY KEY NOT NULL, "userId" varchar)`,
		);
		await queryRunner.query(
			`CREATE TABLE "replicant" ("namespace" text NOT NULL, "name" text NOT NULL, "value" text NOT NULL, PRIMARY KEY ("namespace", "name"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "session" ("expiredAt" bigint NOT NULL, "id" varchar(255) PRIMARY KEY NOT NULL, "json" text NOT NULL, "destroyedAt" datetime)`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_28c5d1d16da7908c97c9bc2f74" ON "session" ("expiredAt") `,
		);
		await queryRunner.query(
			`CREATE TABLE "user_roles_role" ("userId" varchar NOT NULL, "roleId" varchar NOT NULL, PRIMARY KEY ("userId", "roleId"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_5f9286e6c25594c6b88c108db7" ON "user_roles_role" ("userId") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_4be2f7adf862634f5f803d246b" ON "user_roles_role" ("roleId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "temporary_permission" ("id" varchar PRIMARY KEY NOT NULL, "name" text NOT NULL, "entityId" text NOT NULL, "actions" integer NOT NULL, "roleId" varchar, CONSTRAINT "FK_cdb4db95384a1cf7a837c4c683e" FOREIGN KEY ("roleId") REFERENCES "role" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_permission"("id", "name", "entityId", "actions", "roleId") SELECT "id", "name", "entityId", "actions", "roleId" FROM "permission"`,
		);
		await queryRunner.query(`DROP TABLE "permission"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_permission" RENAME TO "permission"`,
		);
		await queryRunner.query(
			`CREATE TABLE "temporary_identity" ("id" varchar PRIMARY KEY NOT NULL, "provider_type" text NOT NULL, "provider_hash" text NOT NULL, "provider_access_token" text, "provider_refresh_token" text, "userId" varchar, CONSTRAINT "FK_12915039d2868ab654567bf5181" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_identity"("id", "provider_type", "provider_hash", "provider_access_token", "provider_refresh_token", "userId") SELECT "id", "provider_type", "provider_hash", "provider_access_token", "provider_refresh_token", "userId" FROM "identity"`,
		);
		await queryRunner.query(`DROP TABLE "identity"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_identity" RENAME TO "identity"`,
		);
		await queryRunner.query(
			`CREATE TABLE "temporary_api_key" ("secret_key" varchar PRIMARY KEY NOT NULL, "userId" varchar, CONSTRAINT "FK_277972f4944205eb29127f9bb6c" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_api_key"("secret_key", "userId") SELECT "secret_key", "userId" FROM "api_key"`,
		);
		await queryRunner.query(`DROP TABLE "api_key"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_api_key" RENAME TO "api_key"`,
		);
		await queryRunner.query(`DROP INDEX "IDX_5f9286e6c25594c6b88c108db7"`);
		await queryRunner.query(`DROP INDEX "IDX_4be2f7adf862634f5f803d246b"`);
		await queryRunner.query(
			`CREATE TABLE "temporary_user_roles_role" ("userId" varchar NOT NULL, "roleId" varchar NOT NULL, CONSTRAINT "FK_5f9286e6c25594c6b88c108db77" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_4be2f7adf862634f5f803d246b8" FOREIGN KEY ("roleId") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("userId", "roleId"))`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_user_roles_role"("userId", "roleId") SELECT "userId", "roleId" FROM "user_roles_role"`,
		);
		await queryRunner.query(`DROP TABLE "user_roles_role"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_user_roles_role" RENAME TO "user_roles_role"`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_5f9286e6c25594c6b88c108db7" ON "user_roles_role" ("userId") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_4be2f7adf862634f5f803d246b" ON "user_roles_role" ("roleId") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_4be2f7adf862634f5f803d246b"`);
		await queryRunner.query(`DROP INDEX "IDX_5f9286e6c25594c6b88c108db7"`);
		await queryRunner.query(
			`ALTER TABLE "user_roles_role" RENAME TO "temporary_user_roles_role"`,
		);
		await queryRunner.query(
			`CREATE TABLE "user_roles_role" ("userId" varchar NOT NULL, "roleId" varchar NOT NULL, PRIMARY KEY ("userId", "roleId"))`,
		);
		await queryRunner.query(
			`INSERT INTO "user_roles_role"("userId", "roleId") SELECT "userId", "roleId" FROM "temporary_user_roles_role"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_user_roles_role"`);
		await queryRunner.query(
			`CREATE INDEX "IDX_4be2f7adf862634f5f803d246b" ON "user_roles_role" ("roleId") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_5f9286e6c25594c6b88c108db7" ON "user_roles_role" ("userId") `,
		);
		await queryRunner.query(
			`ALTER TABLE "api_key" RENAME TO "temporary_api_key"`,
		);
		await queryRunner.query(
			`CREATE TABLE "api_key" ("secret_key" varchar PRIMARY KEY NOT NULL, "userId" varchar)`,
		);
		await queryRunner.query(
			`INSERT INTO "api_key"("secret_key", "userId") SELECT "secret_key", "userId" FROM "temporary_api_key"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_api_key"`);
		await queryRunner.query(
			`ALTER TABLE "identity" RENAME TO "temporary_identity"`,
		);
		await queryRunner.query(
			`CREATE TABLE "identity" ("id" varchar PRIMARY KEY NOT NULL, "provider_type" text NOT NULL, "provider_hash" text NOT NULL, "provider_access_token" text, "provider_refresh_token" text, "userId" varchar)`,
		);
		await queryRunner.query(
			`INSERT INTO "identity"("id", "provider_type", "provider_hash", "provider_access_token", "provider_refresh_token", "userId") SELECT "id", "provider_type", "provider_hash", "provider_access_token", "provider_refresh_token", "userId" FROM "temporary_identity"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_identity"`);
		await queryRunner.query(
			`ALTER TABLE "permission" RENAME TO "temporary_permission"`,
		);
		await queryRunner.query(
			`CREATE TABLE "permission" ("id" varchar PRIMARY KEY NOT NULL, "name" text NOT NULL, "entityId" text NOT NULL, "actions" integer NOT NULL, "roleId" varchar)`,
		);
		await queryRunner.query(
			`INSERT INTO "permission"("id", "name", "entityId", "actions", "roleId") SELECT "id", "name", "entityId", "actions", "roleId" FROM "temporary_permission"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_permission"`);
		await queryRunner.query(`DROP INDEX "IDX_4be2f7adf862634f5f803d246b"`);
		await queryRunner.query(`DROP INDEX "IDX_5f9286e6c25594c6b88c108db7"`);
		await queryRunner.query(`DROP TABLE "user_roles_role"`);
		await queryRunner.query(`DROP INDEX "IDX_28c5d1d16da7908c97c9bc2f74"`);
		await queryRunner.query(`DROP TABLE "session"`);
		await queryRunner.query(`DROP TABLE "replicant"`);
		await queryRunner.query(`DROP TABLE "api_key"`);
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`DROP TABLE "identity"`);
		await queryRunner.query(`DROP TABLE "role"`);
		await queryRunner.query(`DROP TABLE "permission"`);
	}
}
