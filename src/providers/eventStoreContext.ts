import { createContext } from "react";
import { EventStore } from "applesauce-core";
import type { NostrEvent } from "nostr-tools";
import { isVerifiedNostrEvent } from "../lib/nostr";

export class AppEventStore extends EventStore {
	override add(event: NostrEvent, fromRelay?: string): NostrEvent | null {
		if (event.kind === 5 || !isVerifiedNostrEvent(event)) return null;
		return super.add(event, fromRelay);
	}
}

export const eventStore = new AppEventStore();

export const EventStoreContext = createContext<EventStore | null>(null);
