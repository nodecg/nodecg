import { Schema } from "effect";

export const restartChannelName = "nodecg-e2e:restart-server";

export const RestartRequest = Schema.TaggedStruct("RestartRequest", {
	port: Schema.Int,
});

export const Restarted = Schema.TaggedStruct("Restarted", { port: Schema.Int });

export const RestartError = Schema.TaggedStruct("RestartError", {
	port: Schema.Int,
	message: Schema.String,
});

export const RestartReply = Schema.Union([Restarted, RestartError]);
