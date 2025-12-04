import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import configPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default defineConfig(
	eslint.configs.recommended,
	{
		files: ["**/*.{ts,mts,cts,tsx}"],
		extends: [
			tseslint.configs.recommendedTypeChecked,
			tseslint.configs.stylisticTypeChecked,
		],
		rules: {
			"no-empty-pattern": "off",
			"require-yield": "off",
			"@typescript-eslint/no-empty-object-type": [
				"error",
				{ allowInterfaces: "with-single-extends", allowObjectTypes: "allow" },
			],

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
			"@typescript-eslint/prefer-nullish-coalescing": "off",
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
	{
		files: ["workspaces/nodecg/src/client/dashboard/**/*"],
		rules: {
			"@typescript-eslint/no-unused-expressions": "off",
		},
	},
	{
		plugins: {
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
		},
	},
	configPrettier,
	{
		ignores: [
			"**/*.{js,cjs,mjs}",
			"**/node_modules",
			"**/dist",
			"**/out",
			"bundles",
			"workspaces/nodecg/test/fixtures",
			"coverage",
			"workspaces/nodecg/typetest/fake-bundle",
			"generated-types/client",
			"generated-types/server",
		],
	},
);
