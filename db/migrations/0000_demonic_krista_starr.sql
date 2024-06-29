CREATE TABLE `api_key` (
	`secret_key` text PRIMARY KEY NOT NULL,
	`userId` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `identity` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_type` text NOT NULL,
	`provider_hash` text NOT NULL,
	`provider_access_token` text,
	`provider_refresh_token` text,
	`userId` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `permission` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`roleId` text,
	`entityId` text NOT NULL,
	`actions` integer NOT NULL,
	FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `replicant` (
	`namespace` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`name`, `namespace`)
);
--> statement-breakpoint
CREATE TABLE `role` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiredAt` integer NOT NULL,
	`json` text NOT NULL,
	`destroyedAt` integer
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_roles_role` (
	`userId` text NOT NULL,
	`roleId` text NOT NULL,
	PRIMARY KEY(`roleId`, `userId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_name_unique` ON `role` (`name`);--> statement-breakpoint
CREATE INDEX `expiredAtIdx` ON `session` (`expiredAt`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `user_roles_role` (`userId`);--> statement-breakpoint
CREATE INDEX `roleIdIdx` ON `user_roles_role` (`roleId`);