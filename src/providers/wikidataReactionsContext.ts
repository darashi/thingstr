import { createContext } from "react";
import type { NostrEvent } from "nostr-tools";

export type WikidataReaction = {
	event: NostrEvent;
	entityId: string;
	pubkey: string;
	content: string;
};

export type WikidataReactionsValue = {
	timeline: WikidataReaction[];
	byEntityId: ReadonlyMap<string, WikidataReaction[]>;
};

export const WikidataReactionsContext =
	createContext<WikidataReactionsValue | null>(null);
