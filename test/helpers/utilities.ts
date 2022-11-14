// Packages
import type { ExecutionContext } from 'ava';
import type * as Puppeteer from 'puppeteer';
import type { Acknowledgement } from '../../src/shared/api.base';

export const sleep = async (milliseconds: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});

export const waitForRegistration = async (page: Puppeteer.Page): Promise<unknown> => {
	const response = await page.evaluate(
		async () =>
			new Promise((resolve) => {
				if ((window as any).__nodecgRegistrationAccepted__) {
					finish();
				} else {
					window.addEventListener('nodecg-registration-accepted', finish);
				}

				function finish(): void {
					resolve((window as any).__refreshMarker__);
					(window as any).__refreshMarker__ = '__refreshMarker__';
				}
			}),
	);

	return response;
};

export const shadowSelector = async <T extends Element>(
	page: Puppeteer.Page,
	...selectors: string[]
): Promise<Puppeteer.ElementHandle<T>> =>
	page.evaluateHandle((selectors) => {
		let foundDom = document.querySelector(selectors[0]);
		if (!foundDom) throw new Error(`Failed to find selector "${selectors[0]}"`);
		for (const selector of selectors.slice(1)) {
			/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
			if (foundDom!.shadowRoot) {
				foundDom = foundDom!.shadowRoot.querySelector(selector);
			} else {
				foundDom = foundDom!.querySelector(selector);
			}
			/* eslint-enable @typescript-eslint/no-unnecessary-type-assertion */
		}

		return foundDom;
	}, selectors) as any;

export function invokeAck(t: ExecutionContext, ack?: Acknowledgement, ...args: any[]): void {
	if (!ack) {
		t.fail('no callback provided');
		return;
	}

	if (ack.handled) {
		t.fail('cb already handled');
		return;
	}

	if (args.length > 0) {
		return ack(...args);
	}

	return ack();
}
