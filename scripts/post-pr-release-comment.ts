import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const {
	values: { version, prNumber },
} = parseArgs({
	options: {
		version: { type: "string" },
		prNumber: { type: "string" },
	},
});

if (!version) {
	throw new Error("Missing required argument: --version");
}

if (!prNumber) {
	throw new Error("Missing required argument: --prNumber");
}

// Marker to identify comments from this workflow
const COMMENT_MARKER = "<!-- pr-release-install-instructions -->";

// Create the comment body with install instructions
const commentBody = `${COMMENT_MARKER}
## 🚀 PR Release Published

A preview version of this PR has been published to npm!

### Install Instructions

\`\`\`bash
npm install nodecg@pr${prNumber}
\`\`\`

**Version:** \`${version}\`

This preview version will be updated automatically with each push to this PR.
`;

// Function to execute a command and return the output
function execCommand(
	command: string,
	args: string[],
): {
	success: boolean;
	stdout: string;
	stderr: string;
} {
	const result = spawnSync(command, args, {
		encoding: "utf-8",
		stdio: ["pipe", "pipe", "pipe"],
	});

	return {
		success: result.status === 0,
		stdout: result.stdout || "",
		stderr: result.stderr || "",
	};
}

// Get all comments on the PR
const listResult = execCommand("gh", [
	"pr",
	"view",
	prNumber,
	"--json",
	"comments",
	"--jq",
	".comments[] | select(.body | contains('" + COMMENT_MARKER + "')) | .id",
]);

if (listResult.success) {
	// Delete existing comments with our marker
	const existingCommentIds = listResult.stdout
		.trim()
		.split("\n")
		.filter((id) => id.length > 0);

	for (const commentId of existingCommentIds) {
		console.log(`Deleting existing comment: ${commentId}`);
		const deleteResult = execCommand("gh", [
			"api",
			"-X",
			"DELETE",
			`/repos/{owner}/{repo}/issues/comments/${commentId}`,
		]);

		if (!deleteResult.success) {
			console.error(
				`Failed to delete comment ${commentId}: ${deleteResult.stderr}`,
			);
		}
	}
}

// Post the new comment
console.log(`Posting new comment to PR #${prNumber}`);
const commentResult = execCommand("gh", [
	"pr",
	"comment",
	prNumber,
	"--body",
	commentBody,
]);

if (commentResult.success) {
	console.log("Successfully posted comment!");
} else {
	console.error(`Failed to post comment: ${commentResult.stderr}`);
	process.exit(1);
}
