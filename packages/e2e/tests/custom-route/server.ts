import type { IncomingMessage, ServerResponse } from "node:http";

import { implementNamespace, loadNodeCG } from "@nodecg-next/server";
import express from "express";
import { Hono } from "hono";
import { fetchNodeHandler } from "srvx/node";

import { reportReady } from "../../src/server/report-ready.ts";
import { customRouteManifest } from "./manifest.ts";

const encoder = new TextEncoder();

const honoApp = new Hono().post("/greet/:name", async (context) =>
	context.json({
		name: context.req.param("name"),
		body: await context.req.text(),
	}),
);

const expressApp = express()
	.use(express.text())
	.post("/greet/:name", (request, response) => {
		response.json({ name: request.params.name, body: request.body });
	});

const customRoute = implementNamespace(customRouteManifest, {
	seedReplicant: { uploadedBytes: () => 0 },
	implementCustomRoute: {
		upload: {
			post: async (request, { replicant }) => {
				const { byteLength } = await request.arrayBuffer();
				await replicant.uploadedBytes.set(byteLength);
				const { pathname, search } = new URL(request.url);
				return Response.json({ pathname, search });
			},
		},
		stream: {
			get: () =>
				new Response(
					new ReadableStream({
						start(controller) {
							controller.enqueue(encoder.encode("one"));
							controller.enqueue(encoder.encode("two"));
							controller.close();
						},
					}),
				),
		},
		hono: { "*": (request) => honoApp.fetch(request) },
		express: {
			"*": (request) =>
				fetchNodeHandler(
					(nodeRequest: IncomingMessage, nodeResponse: ServerResponse) =>
						expressApp(nodeRequest, nodeResponse),
					request,
				),
		},
	},
});

const nodecg = await loadNodeCG({
	namespaces: { customRoute },
	onReady: reportReady,
});

nodecg.start();
