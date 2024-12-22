/// <reference path="./augment-window-with-bundleconfig.d.ts" />
import type NodeCGTypes from "../../../../generated-types";
import { assertTypeOrUndefined } from "../shared/utils";

console.log(nodecg);
console.log(NodeCG);

const logger = new nodecg.Logger("foo");
logger.error("shaking my smh");
nodecg.log.trace("some verbose logs here");

nodecg.sendMessage("hello!").then(() => {
	console.log("done");
});

const sound = nodecg.playSound("playRocknRoll");
console.log(sound.duration);

export const config: NodeCGTypes.FilteredConfig = nodecg.config;

// Even though a generic type is specified, the value could still be
// undefined because no default was provided and there is no assertion
// that a default value will come from the schema.
// Also, it's a client replicant, so it can always be undefined anyway...
const explicitlyTypedRep: NodeCGTypes.ClientReplicant<string> =
	nodecg.Replicant("explicitlyTypedRep");
assertTypeOrUndefined<string>(explicitlyTypedRep.value);

// This is the same thing as the above test.
const genericallyTypedRep = nodecg.Replicant<string>("genericallyTypedRep");
assertTypeOrUndefined<string>(genericallyTypedRep.value);

// Even if a defaultValue is provided, a client-side rep can still be undefined.
const defaultValueRep = nodecg.Replicant("defaultValueRep", {
	defaultValue: "foo",
});
assertTypeOrUndefined<string>(defaultValueRep.value);

// This tests the default case that a replicant's value should be unknown.
const unknownRep = nodecg.Replicant("unknownRep");
// @ts-expect-error
const fail = 4 + unknownRep.value;

// @ts-expect-error
nodecg.Replicant("unsupportedOptions", { madeUp: true });

const replicants: {
	mappedReplicant: NodeCGTypes.ClientReplicant<string>;
	[k: string]: NodeCGTypes.ClientReplicant<unknown>;
} = {
	mappedReplicant: nodecg.Replicant("mappedReplicant"),
};
const what: NodeCGTypes.ClientReplicant<unknown> =
	nodecg.Replicant<string>("haha");
console.log(what.value);
assertTypeOrUndefined<string>(replicants.mappedReplicant.value);

// This tests that bundleConfig is deep read only
// @ts-expect-error
nodecg.bundleConfig.foo.bar = "bar";

// This tests that bundleConfig only specifies known properties
// @ts-expect-error
nodecg.bundleConfig.nope;

// This tests that the generic for readReplicant works
nodecg.readReplicant<string>("readTest", (value) => {
	assertTypeOrUndefined<string>(value);
});

// This tests some conditions for having "undefined" be a possible value of a Replicant.
const withGenericButNoOptions = nodecg.Replicant<{ param: string }>(
	"withGenericButNoOptions",
);
// @ts-expect-error
withGenericButNoOptions.value.param = "thing";
const withGenericAndEmptyOptions = nodecg.Replicant<{ param: string }>(
	"withGenericAndEmptyOptions",
	{},
);
// @ts-expect-error
withGenericAndEmptyOptions.value.param = "thing";
