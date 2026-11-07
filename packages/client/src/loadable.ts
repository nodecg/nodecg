import { Data, type Schema } from "effect";

export type ReadyLoadableValue<Decoded> = Data.TaggedEnum<{
	Replicant: {
		readonly decoded: Decoded;
		readonly encoded: Schema.Json;
		readonly revision: number;
	};
	Computed: { readonly decoded: Decoded };
	Topic: { readonly decoded: Decoded };
	Derived: { readonly decoded: Decoded };
}>;

export type ReadyLoadableTag = ReadyLoadableValue<unknown>["_tag"];

export type Loadable<
	V extends ReadyLoadableValue<unknown>,
	E = unknown,
> = Data.TaggedEnum<{
	Cold: {};
	Pending: {};
	Ready: { readonly value: V };
	Failure: { readonly error: E };
}>;

interface ReadyLoadableValueDefinition extends Data.TaggedEnum.WithGenerics<1> {
	readonly taggedEnum: ReadyLoadableValue<this["A"]>;
}

interface LoadableDefinition extends Data.TaggedEnum.WithGenerics<2> {
	readonly taggedEnum: Loadable<
		this["A"] & ReadyLoadableValue<unknown>,
		this["B"]
	>;
}

export const ReadyLoadableValue =
	Data.taggedEnum<ReadyLoadableValueDefinition>();
export const Loadable = Data.taggedEnum<LoadableDefinition>();

export type ReplicantValue<Decoded> = Data.TaggedEnum.Value<
	ReadyLoadableValue<Decoded>,
	"Replicant"
>;
export type ComputedValue<Decoded> = Data.TaggedEnum.Value<
	ReadyLoadableValue<Decoded>,
	"Computed"
>;
export type TopicValue<Decoded> = Data.TaggedEnum.Value<
	ReadyLoadableValue<Decoded>,
	"Topic"
>;
export type DerivedValue<Decoded> = Data.TaggedEnum.Value<
	ReadyLoadableValue<Decoded>,
	"Derived"
>;

export type ReplicantLoadable<Decoded, E = unknown> = Loadable<
	ReplicantValue<Decoded>,
	E
>;
export type ComputedLoadable<Decoded, E = unknown> = Loadable<
	ComputedValue<Decoded>,
	E
>;
export type TopicLoadable<Decoded, E = unknown> = Loadable<
	TopicValue<Decoded>,
	E
>;
export type DerivedLoadable<Decoded, E = unknown> = Loadable<
	DerivedValue<Decoded>,
	E
>;

export const Cold = Loadable.Cold();
export const Pending = Loadable.Pending();
