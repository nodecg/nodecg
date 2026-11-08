declare module "vitest/internal/browser" {
	interface BrowserCommands {
		navigate: (url: string) => Promise<void>;
		restartServer: (suite: string) => Promise<void>;
	}
}
