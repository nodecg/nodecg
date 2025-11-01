import type { DatabaseAdapter } from "@nodecg/database-adapter-types";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		export interface Locals {
			databaseAdapter: DatabaseAdapter;
		}

		export interface Request {
			/**
			 * The raw request body as a Buffer.
			 *
			 * This property is populated by NodeCG's body-parser middleware and contains
			 * the original, unparsed request body. This is particularly useful for verifying
			 * webhook signatures, where the exact bytes of the request body are needed to
			 * compute a hash that matches the signature provided by the webhook service.
			 *
			 * @example
			 * // Verifying a GitHub webhook signature
			 * const crypto = require('crypto');
			 *
			 * router.post('/github-webhook', (req, res) => {
			 *   const signature = req.headers['x-hub-signature-256'];
			 *   const hmac = crypto.createHmac('sha256', webhookSecret);
			 *   hmac.update(req.rawBody); // Use the raw body buffer
			 *   const computedSignature = 'sha256=' + hmac.digest('hex');
			 *
			 *   if (signature === computedSignature) {
			 *     // Signature is valid, process the webhook
			 *     const event = req.body; // Parsed JSON object is also available
			 *     // ...
			 *   }
			 * });
			 *
			 * @example
			 * // Verifying a Stripe webhook signature
			 * const crypto = require('crypto');
			 *
			 * router.post('/stripe-webhook', (req, res) => {
			 *   const signature = req.headers['stripe-signature'];
			 *   const [timestamp, providedSig] = parseStripeSignature(signature);
			 *   // Note: Convert to string only if required by the webhook service.
			 *   // Many services require the raw bytes (Buffer) for signature verification.
			 *   const signedPayload = `${timestamp}.${req.rawBody.toString()}`;
			 *   const expectedSig = crypto
			 *     .createHmac('sha256', stripeWebhookSecret)
			 *     .update(signedPayload)
			 *     .digest('hex');
			 *
			 *   if (providedSig === expectedSig) {
			 *     // Process the webhook
			 *   }
			 * });
			 */
			rawBody?: Buffer;
		}
	}
}
