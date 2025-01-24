import { Command } from "commander";
import { vi } from "vitest";

export class MockCommand extends Command {
	log() {
		// To be mocked later
	}

	request(opts: any) {
		throw new Error(`Unexpected request: ${JSON.stringify(opts, null, 2)}`);
	}

	runWith(argString: string) {
		return this.parseAsync(["node", "./", ...argString.split(" ")]);
	}
}

export const createMockProgram = () => {
	const program = new MockCommand();

	vi.spyOn(program, "log").mockImplementation(() => void 0);

	return program;
};
