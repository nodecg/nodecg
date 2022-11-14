// Packages
import { ExecutionContext } from 'ava'; // eslint-disable-line ava/use-test
import * as Puppeteer from 'puppeteer';
import { Acknowledgement } from '../../src/shared/api.base';

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
): Promise<Puppeteer.ElementHandle<T>> => {
	return page.evaluateHandle((selectors) => {
		let foundDom = document.querySelector(selectors[0]);
		for (const selector of selectors.slice(1)) {
			if (foundDom.shadowRoot) {
				foundDom = foundDom.shadowRoot.querySelector(selector);
			} else {
				foundDom = foundDom.querySelector(selector);
			}
		}

		return foundDom;
	}, selectors) as any;
};

export function invokeAck(t: ExecutionContext, ack?: Acknowledgement, ...args: any[]): void {
	if (!ack) {
		return t.fail('no callback provided');
	}

	if (ack.handled) {
		return t.fail('cb already handled');
	}

	return ack(...args);
}
