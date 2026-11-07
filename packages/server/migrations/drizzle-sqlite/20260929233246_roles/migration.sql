CREATE TABLE `global_role_grants` (
	`account_id` text NOT NULL,
	`role_name` text NOT NULL,
	CONSTRAINT `global_role_grants_pk` PRIMARY KEY(`account_id`, `role_name`),
	CONSTRAINT `fk_global_role_grants_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `role_grants` (
	`account_id` text NOT NULL,
	`namespace` text NOT NULL,
	`role_name` text NOT NULL,
	CONSTRAINT `role_grants_pk` PRIMARY KEY(`account_id`, `namespace`, `role_name`),
	CONSTRAINT `fk_role_grants_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
);
