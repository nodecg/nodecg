import { expect, test } from "vitest";
import { parseWorkspaces } from "./index";
import type { NodeCG } from "../../types/nodecg";

// Minimal mock panel - only includes properties that parseWorkspaces actually uses
function mockPanel(overrides: {
	workspace?: string;
	workspaceOrder?: number;
	fullbleed?: boolean;
	dialog?: boolean;
	name?: string;
	title?: string;
}): NodeCG.Bundle.Panel {
	return {
		dialog: false,
		workspace: "default",
		...overrides
	} as NodeCG.Bundle.Panel;
}

// Minimal mock bundle - only includes properties that parseWorkspaces needs
function mockBundle(name: string, panels: NodeCG.Bundle.Panel[]): NodeCG.Bundle {
	return {
		name,
		dashboard: { panels }
	} as NodeCG.Bundle;
}

test("parseWorkspaces - should sort workspaces alphabetically when no order specified", () => {
	const bundles = [
		mockBundle("bundle1", [
			mockPanel({ workspace: "zebra" }),
			mockPanel({ workspace: "alpha" }),
			mockPanel({ workspace: "beta" })
		])
	];

	const workspaces = parseWorkspaces(bundles);
	const nonDefaultWorkspaces = workspaces.filter(w => w.name !== "default");

	expect(nonDefaultWorkspaces).toHaveLength(3);
	expect(nonDefaultWorkspaces[0]!.name).toBe("alpha");
	expect(nonDefaultWorkspaces[1]!.name).toBe("beta");
	expect(nonDefaultWorkspaces[2]!.name).toBe("zebra");
});

test("parseWorkspaces - should sort workspaces by order when workspaceOrder specified", () => {
	const bundles = [
		mockBundle("bundle1", [
			mockPanel({ workspace: "third", workspaceOrder: 3 }),
			mockPanel({ workspace: "first", workspaceOrder: 1 }),
			mockPanel({ workspace: "second", workspaceOrder: 2 })
		])
	];

	const workspaces = parseWorkspaces(bundles);
	const nonDefaultWorkspaces = workspaces.filter(w => w.name !== "default");

	expect(nonDefaultWorkspaces).toHaveLength(3);
	expect(nonDefaultWorkspaces[0]!.name).toBe("first");
	expect(nonDefaultWorkspaces[1]!.name).toBe("second");
	expect(nonDefaultWorkspaces[2]!.name).toBe("third");
});

test("parseWorkspaces - should sort ordered workspaces before unordered ones", () => {
	const bundles = [
		mockBundle("bundle1", [
			mockPanel({ workspace: "zebra" }), // no order
			mockPanel({ workspace: "ordered", workspaceOrder: 1 }),
			mockPanel({ workspace: "alpha" }) // no order
		])
	];

	const workspaces = parseWorkspaces(bundles);
	const nonDefaultWorkspaces = workspaces.filter(w => w.name !== "default");

	expect(nonDefaultWorkspaces).toHaveLength(3);
	expect(nonDefaultWorkspaces[0]!.name).toBe("ordered"); // ordered first
	expect(nonDefaultWorkspaces[1]!.name).toBe("alpha"); // then alphabetical
	expect(nonDefaultWorkspaces[2]!.name).toBe("zebra");
});

test("parseWorkspaces - should use minimum order when multiple panels share workspace", () => {
	const bundles = [
		mockBundle("bundle1", [
			mockPanel({ workspace: "shared", workspaceOrder: 5 }),
			mockPanel({ workspace: "shared", workspaceOrder: 2 }), // minimum
			mockPanel({ workspace: "shared", workspaceOrder: 8 }),
			mockPanel({ workspace: "other", workspaceOrder: 3 })
		])
	];

	const workspaces = parseWorkspaces(bundles);
	const nonDefaultWorkspaces = workspaces.filter(w => w.name !== "default");

	expect(nonDefaultWorkspaces).toHaveLength(2);
	expect(nonDefaultWorkspaces[0]!.name).toBe("shared"); // order 2 (minimum)
	expect(nonDefaultWorkspaces[1]!.name).toBe("other"); // order 3
});

test("parseWorkspaces - should respect workspaceOrder for fullbleed panels", () => {
	const bundles = [
		mockBundle("bundle1", [
			mockPanel({
				name: "fullbleed-panel",
				title: "Fullbleed Panel",
				fullbleed: true,
				workspaceOrder: 1
			}),
			mockPanel({
				workspace: "regular",
				workspaceOrder: 2
			})
		])
	];

	const workspaces = parseWorkspaces(bundles);
	// Filter out default workspace
	const nonDefaultWorkspaces = workspaces.filter(w => w.name !== "default");

	expect(nonDefaultWorkspaces).toHaveLength(2);

	// Fullbleed workspace should come first due to order 1
	expect(nonDefaultWorkspaces[0]!.name).toBe("__nodecg_fullbleed__bundle1_fullbleed-panel");
	expect(nonDefaultWorkspaces[0]!.fullbleed).toBe(true);
	expect(nonDefaultWorkspaces[0]!.label).toBe("Fullbleed Panel");

	// Regular workspace should come second due to order 2
	expect(nonDefaultWorkspaces[1]!.name).toBe("regular");
	expect(nonDefaultWorkspaces[1]!.fullbleed).toBeUndefined();
});

test("parseWorkspaces - should handle default workspace correctly", () => {
	const bundles = [
		mockBundle("bundle1", [
			mockPanel({ workspace: "default" }),
			mockPanel({ workspace: "custom", workspaceOrder: 1 })
		])
	];

	const workspaces = parseWorkspaces(bundles);

	// Default workspace should always be first
	expect(workspaces[0]!.name).toBe("default");
	expect(workspaces[0]!.route).toBe("");
	expect(workspaces[0]!.label).toBe("Main Workspace");

	// Custom workspace should follow
	expect(workspaces[1]!.name).toBe("custom");
	expect(workspaces[1]!.route).toBe("workspace/custom");
});

test("parseWorkspaces - should ignore dialog panels", () => {
	const bundles = [
		mockBundle("bundle1", [
			mockPanel({ workspace: "workspace1" }),
			mockPanel({ dialog: true, workspace: "workspace2" }), // should be ignored
			mockPanel({ workspace: "workspace3" })
		])
	];

	const workspaces = parseWorkspaces(bundles);
	const nonDefaultWorkspaces = workspaces.filter(w => w.name !== "default");

	expect(nonDefaultWorkspaces).toHaveLength(2);
	expect(nonDefaultWorkspaces[0]!.name).toBe("workspace1");
	expect(nonDefaultWorkspaces[1]!.name).toBe("workspace3");
});

test("parseWorkspaces - should handle empty bundle list", () => {
	const workspaces = parseWorkspaces([]);
	expect(workspaces).toHaveLength(1);
	expect(workspaces[0]!.name).toBe("default");
	expect(workspaces[0]!.label).toBe("Workspace");
});

test("parseWorkspaces - should handle bundles with no panels", () => {
	const bundles = [
		mockBundle("bundle1", [])
	];

	const workspaces = parseWorkspaces(bundles);
	expect(workspaces).toHaveLength(1);
	expect(workspaces[0]!.name).toBe("default");
	expect(workspaces[0]!.label).toBe("Workspace");
});
