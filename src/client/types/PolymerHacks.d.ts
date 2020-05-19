import { ElementMixin } from '@polymer/polymer/lib/mixins/element-mixin';

declare namespace PolymerHacks {
	export interface Element {
		// eslint-disable-next-line @typescript-eslint/prefer-function-type
		new (...args: any[]): ElementMixin & { $: { [k: string]: any } };
	}
}
