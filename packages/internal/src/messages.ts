import { Schema } from "effect";

import { ChangeOp } from "./occ/schema.ts";

const ReplicantFieldIdentifier = Schema.Struct({
	type: Schema.Literal("replicant"),
	namespace: Schema.String,
	name: Schema.String,
});
export type ReplicantFieldIdentifier = typeof ReplicantFieldIdentifier.Type;
const ComputedFieldIdentifier = Schema.Struct({
	type: Schema.Literal("computed"),
	namespace: Schema.String,
	name: Schema.String,
});
export type ComputedFieldIdentifier = typeof ComputedFieldIdentifier.Type;
const TopicFieldIdentifier = Schema.Struct({
	type: Schema.Literal("topic"),
	namespace: Schema.String,
	name: Schema.String,
});
export type TopicFieldIdentifier = typeof TopicFieldIdentifier.Type;

const FieldIdentifier = Schema.Union([
	ReplicantFieldIdentifier,
	ComputedFieldIdentifier,
	TopicFieldIdentifier,
]);
export type FieldIdentifier = typeof FieldIdentifier.Type;

export const SubscribeMessage = Schema.TaggedStruct("subscribe", {
	field: FieldIdentifier,
});

export const UnsubscribeMessage = Schema.TaggedStruct("unsubscribe", {
	field: FieldIdentifier,
});

export const ResyncMessage = Schema.TaggedStruct("resync", {
	field: ReplicantFieldIdentifier,
});

export const PingMessage = Schema.TaggedStruct("ping", {});
export type PingMessage = typeof PingMessage.Type;
export const PongMessage = Schema.TaggedStruct("pong", {});
export type PongMessage = typeof PongMessage.Type;

export const ClientMessage = Schema.Union([
	SubscribeMessage,
	UnsubscribeMessage,
	ResyncMessage,
	PingMessage,
]);
export type ClientMessage = typeof ClientMessage.Type;

export const ReplicantSnapshotMessage = Schema.TaggedStruct("snapshot", {
	field: ReplicantFieldIdentifier,
	value: Schema.Json,
	revision: Schema.Int,
});
export type ReplicantSnapshotMessage = typeof ReplicantSnapshotMessage.Type;

export const ReplicantDeltaMessage = Schema.TaggedStruct("delta", {
	field: ReplicantFieldIdentifier,
	ops: Schema.NonEmptyArray(ChangeOp),
	baseRevision: Schema.Int,
	revision: Schema.Int,
	hash: Schema.Int,
});
export type ReplicantDeltaMessage = typeof ReplicantDeltaMessage.Type;

export const FieldValueMessage = Schema.TaggedStruct("value", {
	field: Schema.Union([ComputedFieldIdentifier, TopicFieldIdentifier]),
	value: Schema.Json,
});
export type FieldValueMessage = typeof FieldValueMessage.Type;

export const PublishMessage = Schema.Union([
	ReplicantSnapshotMessage,
	ReplicantDeltaMessage,
	FieldValueMessage,
]);
export type PublishMessage = typeof PublishMessage.Type;

export const SubscribeRejectedMessage = Schema.TaggedStruct(
	"subscribe-rejected",
	{
		field: FieldIdentifier,
		reason: Schema.Literals(["forbidden", "not-found", "unavailable"]),
		message: Schema.optional(Schema.String),
	},
);
export type SubscribeRejectedMessage = typeof SubscribeRejectedMessage.Type;

export const ServerMessage = Schema.Union([
	PublishMessage,
	SubscribeRejectedMessage,
	PongMessage,
]);
export type ServerMessage = typeof ServerMessage.Type;
