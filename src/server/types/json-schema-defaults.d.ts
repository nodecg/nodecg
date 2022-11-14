declare module 'json-schema-defaults' {
	function jsonSchemaDefaults(schema: Record<string, unknown>): Record<string, any>;
	export = jsonSchemaDefaults;
}
