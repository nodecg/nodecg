import { baseUrlCookieName } from "@nodecg-next/internal";
import { Cookies } from "effect/http";

const cookieBase = (): string | undefined =>
	Cookies.parseHeader(document.cookie)[baseUrlCookieName];

export const nodecgBase = (): string | undefined => {
	const value = cookieBase();
	if (typeof value === "undefined") {
		return undefined;
	}
	try {
		const url = new URL(value, location.href);
		return url.origin === location.origin ? url.href : undefined;
	} catch {
		return undefined;
	}
};
