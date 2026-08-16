import type { EventStore } from "applesauce-core";
import type { NostrEvent } from "nostr-tools";
import { isVerifiedNostrEvent } from "./nostr";

type DeletionListener = (event: NostrEvent) => void;

const deletionEvents = new Map<string, NostrEvent>();
const deletionListeners = new Set<DeletionListener>();

function publishDeletionEvent(event: NostrEvent): void {
	if (deletionEvents.has(event.id)) return;
	deletionEvents.set(event.id, event);
	deletionListeners.forEach((listener) => listener(event));
}

export function ingestRelayEvent(
	eventStore: EventStore,
	event: unknown,
): NostrEvent | null {
	if (!isVerifiedNostrEvent(event)) return null;
	if (event.kind === 5) {
		publishDeletionEvent(event);
		return event;
	}
	eventStore.add(event);
	return event;
}

export function getReactionDeletionEvents(): NostrEvent[] {
	return [...deletionEvents.values()];
}

export function subscribeReactionDeletionEvents(
	listener: DeletionListener,
): () => void {
	deletionEvents.forEach(listener);
	deletionListeners.add(listener);
	return () => {
		deletionListeners.delete(listener);
	};
}

export function buildDeletionAuthorsByEventId(
	events: NostrEvent[],
): Map<string, Set<string>> {
	const authorsByEventId = new Map<string, Set<string>>();
	for (const event of events) {
		for (const [key, value] of event.tags) {
			if (key !== "e" || typeof value !== "string") continue;
			const authors = authorsByEventId.get(value) ?? new Set<string>();
			authors.add(event.pubkey);
			authorsByEventId.set(value, authors);
		}
	}
	return authorsByEventId;
}

export function isEventDeleted(
	event: NostrEvent,
	deletionAuthorsByEventId: ReadonlyMap<string, ReadonlySet<string>>,
): boolean {
	return deletionAuthorsByEventId.get(event.id)?.has(event.pubkey) ?? false;
}
