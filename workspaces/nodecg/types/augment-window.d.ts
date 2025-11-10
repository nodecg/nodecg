import { NodeCGAPIClient } from "../out/client/api.client";

declare global {
	var NodeCG: typeof NodeCGAPIClient;
	var nodecg: NodeCGAPIClient;
}
