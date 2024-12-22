import type { ElementMixin } from "@polymer/polymer/lib/mixins/element-mixin";

declare namespace PolymerHacks {
	export type Element = {
		// eslint-disable-next-line @typescript-eslint/prefer-function-type
		new (...args: any[]): ElementMixin & { $: Record<string, any> };
	};
}
