import { NodeCGAPIClient } from "../dist/dts/client/api/api.client";

declare global {
	var NodeCG: typeof NodeCGAPIClient;
	var nodecg: NodeCGAPIClient;
}
