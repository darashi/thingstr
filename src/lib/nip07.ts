import type { EventTemplate, NostrEvent } from "nostr-tools/pure";
import { isVerifiedNostrEvent, normalizePubkey } from "./nostr";

function getNip07Provider() {
	if (!window.nostr?.getPublicKey) {
		throw new Error("NIP-07 provider is not available");
	}
	return window.nostr;
}

export async function requestNip07PublicKey(): Promise<string> {
	const pubkey = normalizePubkey(await getNip07Provider().getPublicKey());
	if (!pubkey) throw new Error("NIP-07 provider returned an invalid public key");
	return pubkey;
}

export function signedEventMatchesTemplate(
	event: NostrEvent,
	template: EventTemplate,
): boolean {
	return (
		event.kind === template.kind &&
		event.created_at === template.created_at &&
		event.content === template.content &&
		JSON.stringify(event.tags) === JSON.stringify(template.tags)
	);
}

export async function signEventWithNip07(
	template: EventTemplate,
	expectedPubkey: string,
): Promise<NostrEvent> {
	const provider = getNip07Provider();
	if (!provider.signEvent) throw new Error("NIP-07 signer is not available");

	const activePubkey = await requestNip07PublicKey();
	if (activePubkey !== expectedPubkey) {
		throw new Error("NIP-07 account does not match the logged-in account");
	}

	const event = await provider.signEvent(template);
	if (!isVerifiedNostrEvent(event)) {
		throw new Error("NIP-07 provider returned an invalid signed event");
	}
	if (event.pubkey !== expectedPubkey) {
		throw new Error("Signed event author does not match the logged-in account");
	}
	if (!signedEventMatchesTemplate(event, template)) {
		throw new Error("NIP-07 provider changed the event template");
	}
	return event;
}
