// @ts-check

import eslint from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import configPrettier from "eslint-config-prettier";

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/class-literal-property-style": "off",

			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-misused-promises": "off",
			"@typescript-eslint/no-require-imports": "off",
			"@typescript-eslint/prefer-promise-reject-errors": "off",
			"@typescript-eslint/unbound-method": "off",
		},
	},
	{
		files: ["src/client/dashboard/**/*"],
		rules: {
			"@typescript-eslint/no-unused-expressions": "off",
		},
	},
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
			},
		},
	},
	configPrettier,
	{
		ignores: [
			"**/*.js",
			"node_modules",
			"dist",
			"out",
			"bundles",
			"test/fixtures",
			"coverage",
			"typetest/fake-bundle",
			"eslint.config.mjs",
			"generated-types/client",
			"generated-types/server",
		],
	},
);
