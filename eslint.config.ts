import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default defineConfig(
	eslint.configs.recommended,
	{
		files: ["**/*.{ts,mts,cts,tsx}"],
		extends: [
			tseslint.configs.recommendedTypeChecked,
			tseslint.configs.stylisticTypeChecked,
			{
				languageOptions: {
					parserOptions: {
						projectService: true,
					},
				},
			},
		],
	},
	{
		rules: {
			"no-empty-pattern": "off",
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
		plugins: {
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			"simple-import-sort/imports": "warn",
			"simple-import-sort/exports": "warn",
		},
	},
	eslintConfigPrettier,
	{
		ignores: [
			"**/*.{js,cjs,mjs}",
			"node_modules",
			"dist",
			"out",
			"bundles",
			"test/fixtures",
			"coverage",
			"typetest/fake-bundle",
			"eslint.config.ts",
			"generated-types/client",
			"generated-types/server",
		],
	},
);
