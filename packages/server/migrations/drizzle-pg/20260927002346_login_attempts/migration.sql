CREATE TABLE "login_attempts" (
	"key" text PRIMARY KEY,
	"provider" text NOT NULL,
	"state" text NOT NULL,
	"code_verifier" text,
	"nonce" text,
	"return_to" text,
	"expires_at" bigint NOT NULL
);
