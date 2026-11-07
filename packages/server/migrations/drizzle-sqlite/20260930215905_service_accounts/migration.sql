CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY,
	`service_account_id` text NOT NULL,
	`key_hash` text NOT NULL UNIQUE,
	`label` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	CONSTRAINT `fk_api_keys_service_account_id_service_accounts_id_fk` FOREIGN KEY (`service_account_id`) REFERENCES `service_accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `service_accounts` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL UNIQUE,
	`created_by` text,
	CONSTRAINT `fk_service_accounts_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_service_accounts_created_by_accounts_id_fk` FOREIGN KEY (`created_by`) REFERENCES `accounts`(`id`) ON DELETE SET NULL
);
