import { Effect } from "effect";
import { config } from "../config/index.js";

export class NodecgConfig extends Effect.Service<NodecgConfig>()(
	"NodecgConfig",
	{ succeed: config },
) {}
