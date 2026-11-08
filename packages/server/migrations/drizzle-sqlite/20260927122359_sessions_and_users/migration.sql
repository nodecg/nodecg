CREATE TABLE `accounts` (
	`id` text PRIMARY KEY,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `authentications` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`issuer` text NOT NULL,
	`subject` text NOT NULL,
	CONSTRAINT `fk_authentications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `authentications_issuer_subject_unique` UNIQUE(`issuer`,`subject`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`authentication_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT `fk_sessions_authentication_id_authentications_id_fk` FOREIGN KEY (`authentication_id`) REFERENCES `authentications`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL UNIQUE,
	CONSTRAINT `fk_users_account_id_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
);
