import { authSession } from "@nodecg-next/browser";
import { loginUrl } from "@nodecg-next/client";
import { Suspense, use, useSyncExternalStore } from "react";

const session = authSession();
const providersPromise = session.client.providers();

const useIdentity = () =>
	useSyncExternalStore(session.identity.subscribe, session.identity.get);

function LoginLinks() {
	const providers = use(providersPromise);
	return (
		<>
			{providers.map((provider) => (
				<a key={provider.name} href={loginUrl(provider, location.pathname)}>
					Log in with {provider.name}
				</a>
			))}
		</>
	);
}

export function Login() {
	const identity = useIdentity();

	if (typeof identity === "undefined") {
		return <p>Checking session…</p>;
	}

	if (identity._tag === "user") {
		const authentication = identity.authentication;
		return (
			<div>
				<p>
					Logged in as <strong>{identity.displayName}</strong>{" "}
					<button type="button" onClick={() => void session.logout()}>
						Log out
					</button>
				</p>
				<dl>
					<dt>issuer</dt>
					<dd>{authentication.issuer}</dd>
					<dt>subject</dt>
					<dd>{authentication.subject}</dd>
				</dl>
			</div>
		);
	}

	return (
		<div>
			<p>Not logged in.</p>
			<Suspense fallback={null}>
				<LoginLinks />
			</Suspense>
		</div>
	);
}
