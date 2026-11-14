import { formatField, NamespacePath } from "@nodecg/internal";
import { Schema } from "effect";

export class FieldPermissionDenied extends Schema.TaggedError<FieldPermissionDenied>()(
	"FieldPermissionDenied",
	{
		namespace: NamespacePath,
		name: Schema.String,
		operation: Schema.Literals(["read", "write"]),
	},
) {
	override readonly message = `Permission denied to ${this.operation} ${formatField(this.namespace, this.name)}`;
}
