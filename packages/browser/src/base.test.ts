import { baseUrlCookieName } from "@nodecg/internal";
import { afterEach, describe, expect, test } from "vitest";

import { nodecgBase } from "./base.ts";

afterEach(() => {
	document.cookie = `${baseUrlCookieName}=; Max-Age=0; Path=/`;
});

describe("nodecgBase", () => {
	test("resolves the cookie path against the page origin", () => {
		document.cookie = `${baseUrlCookieName}=%2Fsub; Path=/`;
		expect(nodecgBase()).toBe(`${location.origin}/sub`);
	});

	test.each(["http://other:1234/sub", "//other:1234/sub", "http://"])(
		"rejects the off-origin or unparseable cookie %s",
		(value) => {
			document.cookie = `${baseUrlCookieName}=${encodeURIComponent(value)}; Path=/`;
			expect(nodecgBase()).toBeUndefined();
		},
	);
});
