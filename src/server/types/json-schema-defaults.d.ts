declare module 'json-schema-defaults' {
	function jsonSchemaDefaults(schema: object): { [k: string]: any };
	export = jsonSchemaDefaults;
}
