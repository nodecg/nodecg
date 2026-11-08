export const customRoutePath = (namespace: string, name: string) =>
	`/namespaces/${encodeURIComponent(namespace)}/custom/${encodeURIComponent(name)}` as const;
