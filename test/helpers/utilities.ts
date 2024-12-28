import type { ExecutionContext } from "ava";
import type * as Puppeteer from "puppeteer";

import type { NodeCG } from "../../src/types/nodecg";

export const sleep = async (milliseconds: number): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});

export const waitOneTick = async (): Promise<void> =>
	new Promise((resolve) => {
		process.nextTick(resolve);
	});

export const waitForRegistration = async (
	page: Puppeteer.Page,
): Promise<unknown> => {
	const response = await page.evaluate(
		async () =>
			new Promise((resolve) => {
				if ((window as any).__nodecgRegistrationAccepted__) {
					finish();
				} else {
					window.addEventListener("nodecg-registration-accepted", finish);
				}

				function finish(): void {
					resolve((window as any).__refreshMarker__);
					(window as any).__refreshMarker__ = "__refreshMarker__";
				}
			}),
	);

	return response;
};

export const shadowSelector = <T extends Element>(
	page: Puppeteer.Page,
	...selectors: string[]
): Promise<Puppeteer.ElementHandle<T>> =>
	page.evaluateHandle((selectors) => {
		let foundDom = document.querySelector(selectors[0]);
		if (!foundDom) throw new Error(`Failed to find selector "${selectors[0]}"`);
		for (const selector of selectors.slice(1)) {
			if (foundDom!.shadowRoot) {
				foundDom = foundDom!.shadowRoot.querySelector(selector);
			} else {
				foundDom = foundDom!.querySelector(selector);
			}
		}

		return foundDom;
	}, selectors) as any;

export function invokeAck(ack?: NodeCG.Acknowledgement, ...args: any[]): void {
	if (!ack) {
		throw new Error("no callback provided");
	}

	if (ack.handled) {
		throw new Error("cb already handled");
	}

	if (args.length > 0) {
		ack(...args);
		return;
	}

	ack();
}
