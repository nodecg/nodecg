CREATE TABLE "global_role_grants" (
	"account_id" uuid,
	"role_name" text,
	CONSTRAINT "global_role_grants_pkey" PRIMARY KEY("account_id","role_name")
);
--> statement-breakpoint
CREATE TABLE "role_grants" (
	"account_id" uuid,
	"namespace" text,
	"role_name" text,
	CONSTRAINT "role_grants_pkey" PRIMARY KEY("account_id","namespace","role_name")
);
--> statement-breakpoint
ALTER TABLE "global_role_grants" ADD CONSTRAINT "global_role_grants_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_grants" ADD CONSTRAINT "role_grants_account_id_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE;