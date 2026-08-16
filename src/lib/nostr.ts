import { nip19 } from "nostr-tools";

const HEX_PUBKEY_REGEX = /^[0-9a-f]{64}$/i;

export function normalizePubkey(input: string): string | null {
	const value = input.trim();
	if (!value) return null;

	if (HEX_PUBKEY_REGEX.test(value)) {
		return value.toLowerCase();
	}

	if (value.toLowerCase().startsWith("npub")) {
		try {
			const decoded = nip19.decode(value);
			if (decoded.type === "npub" && typeof decoded.data === "string") {
				return decoded.data;
			}
		} catch (error) {
			console.error("Failed to decode npub", error);
			return null;
		}
	}

	return null;
}

export function encodeNpub(pubkey: string): string | null {
	try {
		return nip19.npubEncode(pubkey);
	} catch (error) {
		console.error("Failed to encode npub", error);
		return null;
	}
}
