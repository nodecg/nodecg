PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_service_accounts` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL UNIQUE,
	`created_by` text,
	CONSTRAINT `fk_service_accounts_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_service_accounts_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_service_accounts`(`id`, `account_id`) SELECT `id`, `account_id` FROM `service_accounts`;--> statement-breakpoint
DROP TABLE `service_accounts`;--> statement-breakpoint
ALTER TABLE `__new_service_accounts` RENAME TO `service_accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;