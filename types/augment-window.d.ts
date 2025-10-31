 

import { NodeCGAPIClient } from "../out/client/api/api.client";

declare global {
	var NodeCG: typeof NodeCGAPIClient;
	var nodecg: NodeCGAPIClient;
}
