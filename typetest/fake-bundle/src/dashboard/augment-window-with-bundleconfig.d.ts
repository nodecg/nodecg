import { NodeCGAPIClient } from "../../../../out/client/api/api.client";

type BundleConfig = { foo: { bar: "bar" } };

declare global {
	var NodeCG: typeof NodeCGAPIClient;
	var nodecg: NodeCGAPIClient<BundleConfig>;
}
