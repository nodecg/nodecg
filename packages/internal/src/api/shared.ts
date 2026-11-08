import { Schema } from "effect";
import {
	HttpApiEndpoint,
	HttpApiError,
	HttpApiGroup,
	HttpApiSchema,
} from "effect/http-api";

import { Patch, PatchNotApplicable, RevisionConflict } from "../occ/schema.ts";

const replicantGet = HttpApiEndpoint.get(
	"replicantGet",
	"/namespaces/:namespace/replicant/:fieldName",
	{
		params: { namespace: Schema.String, fieldName: Schema.String },
		success: Schema.Json,
		error: [
			HttpApiError.NotFound,
			HttpApiError.Forbidden,
			HttpApiError.InternalServerError,
		],
	},
);

const replicantUpdate = HttpApiEndpoint.put(
	"replicantUpdate",
	"/namespaces/:namespace/replicant/:fieldName",
	{
		params: { namespace: Schema.String, fieldName: Schema.String },
		payload: Patch,
		error: [
			HttpApiError.NotFound,
			HttpApiError.Forbidden,
			HttpApiError.BadRequest,
			PatchNotApplicable.pipe(HttpApiSchema.status(422)),
			RevisionConflict.pipe(HttpApiSchema.status(409)),
			HttpApiError.InternalServerError,
		],
	},
);

const computedGet = HttpApiEndpoint.get(
	"computedGet",
	"/namespaces/:namespace/computed/:fieldName",
	{
		params: { namespace: Schema.String, fieldName: Schema.String },
		success: Schema.Json,
		error: [
			HttpApiError.NotFound,
			HttpApiError.Forbidden,
			HttpApiError.InternalServerError,
		],
	},
);

const topicPublish = HttpApiEndpoint.post(
	"topicPublish",
	"/namespaces/:namespace/topic/:fieldName",
	{
		params: { namespace: Schema.String, fieldName: Schema.String },
		payload: Schema.Json,
		error: [
			HttpApiError.NotFound,
			HttpApiError.Forbidden,
			HttpApiError.BadRequest,
		],
	},
);

export class RpcCallError extends Schema.TaggedError<RpcCallError>()(
	"RpcCallError",
	{ message: Schema.String },
) {}

const rpcCall = HttpApiEndpoint.post(
	"rpcCall",
	"/namespaces/:namespace/rpc/:fieldName",
	{
		params: { namespace: Schema.String, fieldName: Schema.String },
		payload: Schema.Json,
		success: Schema.Json,
		error: [
			HttpApiError.NotFound,
			HttpApiError.Forbidden,
			HttpApiError.BadRequest,
			RpcCallError.pipe(HttpApiSchema.status(500)),
		],
	},
);

export const fieldGroup = <const Id extends string>(id: Id) =>
	HttpApiGroup.make(id)
		.add(replicantGet)
		.add(replicantUpdate)
		.add(computedGet)
		.add(topicPublish)
		.add(rpcCall);
