import crypto from "node:crypto";

import express from "express";
import { expect } from "vitest";

import { setupTest } from "./helpers/setup";
import * as C from "./helpers/test-constants";

const test = await setupTest();

test("should provide rawBody for webhook signature verification", async ({
	apis,
}) => {
	const secret = "test-webhook-secret";
	const router = express.Router();

	router.post("/webhook-verify", (req, res) => {
		// Verify that rawBody is available
		expect(req.rawBody).toBeDefined();
		expect(Buffer.isBuffer(req.rawBody)).toBe(true);

		// Simulate webhook signature verification
		const signature = req.headers["x-signature"] as string;
		if (!req.rawBody) {
			res.status(500).json({ error: "Missing rawBody" });
			return;
		}

		const computedSignature = crypto
			.createHmac("sha256", secret)
			.update(req.rawBody)
			.digest("hex");

		if (signature === computedSignature) {
			res.status(200).json({ verified: true, body: req.body });
		} else {
			res.status(401).json({ verified: false });
		}
	});

	apis.extension.mount("/test-bundle", router);

	// Test with valid signature
	const payload = JSON.stringify({ event: "test", data: { id: 123 } });
	const validSignature = crypto
		.createHmac("sha256", secret)
		.update(Buffer.from(payload))
		.digest("hex");

	const response = await fetch(`${C.rootUrl()}test-bundle/webhook-verify`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Signature": validSignature,
		},
		body: payload,
	});

	expect(response.status).toBe(200);
	const result = await response.json();
	expect(result.verified).toBe(true);
	expect(result.body).toEqual({ event: "test", data: { id: 123 } });
});

test("should reject webhook with invalid signature", async ({ apis }) => {
	const secret = "test-webhook-secret";
	const router = express.Router();

	router.post("/webhook-invalid", (req, res) => {
		const signature = req.headers["x-signature"] as string;
		if (!req.rawBody) {
			res.status(500).json({ error: "Missing rawBody" });
			return;
		}

		const computedSignature = crypto
			.createHmac("sha256", secret)
			.update(req.rawBody)
			.digest("hex");

		if (signature === computedSignature) {
			res.status(200).json({ verified: true });
		} else {
			res.status(401).json({ verified: false });
		}
	});

	apis.extension.mount("/test-bundle", router);

	// Test with invalid signature
	const payload = JSON.stringify({ event: "test" });
	const invalidSignature = "invalid-signature";

	const response = await fetch(`${C.rootUrl()}test-bundle/webhook-invalid`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Signature": invalidSignature,
		},
		body: payload,
	});

	expect(response.status).toBe(401);
	const result = await response.json();
	expect(result.verified).toBe(false);
});

test("should have both parsed body and rawBody available", async ({ apis }) => {
	const router = express.Router();

	router.post("/webhook-both", (req, res) => {
		res.json({
			hasParsedBody: typeof req.body === "object" && req.body !== null,
			hasRawBody: Buffer.isBuffer(req.rawBody),
			parsedBodyContent: req.body,
			rawBodyLength: req.rawBody?.length,
		});
	});

	apis.extension.mount("/test-bundle", router);

	const payload = JSON.stringify({ test: "data", nested: { value: 42 } });
	const response = await fetch(`${C.rootUrl()}test-bundle/webhook-both`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: payload,
	});

	expect(response.status).toBe(200);
	const result = await response.json();
	expect(result.hasParsedBody).toBe(true);
	expect(result.hasRawBody).toBe(true);
	expect(result.parsedBodyContent).toEqual({
		test: "data",
		nested: { value: 42 },
	});
	expect(result.rawBodyLength).toBe(payload.length);
});

test("should work with urlencoded bodies", async ({ apis }) => {
	const secret = "test-webhook-secret";
	const router = express.Router();

	router.post("/webhook-urlencoded", (req, res) => {
		expect(req.rawBody).toBeDefined();
		expect(Buffer.isBuffer(req.rawBody)).toBe(true);

		const signature = req.headers["x-signature"] as string;
		if (!req.rawBody) {
			res.status(500).json({ error: "Missing rawBody" });
			return;
		}

		const computedSignature = crypto
			.createHmac("sha256", secret)
			.update(req.rawBody)
			.digest("hex");

		res.json({
			verified: signature === computedSignature,
			body: req.body,
		});
	});

	apis.extension.mount("/test-bundle", router);

	const payload = "key1=value1&key2=value2";
	const validSignature = crypto
		.createHmac("sha256", secret)
		.update(Buffer.from(payload))
		.digest("hex");

	const response = await fetch(`${C.rootUrl()}test-bundle/webhook-urlencoded`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"X-Signature": validSignature,
		},
		body: payload,
	});

	expect(response.status).toBe(200);
	const result = await response.json();
	expect(result.verified).toBe(true);
	expect(result.body).toEqual({ key1: "value1", key2: "value2" });
});
