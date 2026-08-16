import { useEffect } from "react";
import type { NostrEvent } from "nostr-tools";
import { THINGSTR_RELAYS } from "../config/relays";
import { ingestRelayEvent } from "../lib/reactionEventStore";
import {
	buildEntityReactionFilter,
	buildReactionDeletionFilter,
} from "../lib/reactionFilters";
import { isVerifiedNostrEvent } from "../lib/nostr";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";

export function useEntityReactionBackfill(
	entityId: string,
	enabled = true,
): void {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();

	useEffect(() => {
		if (!enabled || !entityId || !THINGSTR_RELAYS.length) return;

		const group = relayPool.group(THINGSTR_RELAYS);
		const relayOptions = {
			eventStore: null,
			reconnect: Infinity,
			resubscribe: { delay: 1_000 },
		};
		const pendingReactions = new Map<string, NostrEvent>();
		const deletionSubs: { unsubscribe: () => void }[] = [];
		let deletionTimer: ReturnType<typeof setTimeout> | null = null;
		let isCancelled = false;
		const requestDeletionBatch = (events: NostrEvent[], attempt = 0) => {
			if (isCancelled || !events.length) return;
			deletionSubs.push(
				group
					.request(
						buildReactionDeletionFilter(events.map(({ id }) => id)),
						relayOptions,
					)
					.subscribe({
						next: (event) => ingestRelayEvent(eventStore, event),
						error: (error) => {
							if (attempt < 2) {
								requestDeletionBatch(events, attempt + 1);
								return;
							}
							console.error(
								`Failed to backfill reaction deletions for entity ${entityId}`,
								error,
							);
						},
						complete: () => {
							if (isCancelled) return;
							events.forEach((event) => ingestRelayEvent(eventStore, event));
						},
					}),
			);
		};
		const requestDeletions = () => {
			deletionTimer = null;
			const events = [...pendingReactions.values()];
			pendingReactions.clear();
			if (!events.length) return;

			requestDeletionBatch(events);
		};
		const scheduleDeletionRequest = () => {
			if (deletionTimer !== null) return;
			deletionTimer = setTimeout(requestDeletions, 100);
		};
		const requestSub = group
			.request(buildEntityReactionFilter(entityId), relayOptions)
			.subscribe({
				next: (event) => {
					if (!isVerifiedNostrEvent(event) || event.kind !== 17) return;
					pendingReactions.set(event.id, event);
					scheduleDeletionRequest();
				},
				error: (error) => {
					if (deletionTimer !== null) clearTimeout(deletionTimer);
					requestDeletions();
					console.error(
						`Failed to backfill reactions for entity ${entityId}`,
						error,
					);
				},
				complete: () => {
					if (deletionTimer !== null) clearTimeout(deletionTimer);
					requestDeletions();
				},
			});

		return () => {
			isCancelled = true;
			if (deletionTimer !== null) clearTimeout(deletionTimer);
			requestSub.unsubscribe();
			deletionSubs.forEach((subscription) => subscription.unsubscribe());
		};
	}, [enabled, entityId, eventStore, relayPool]);
}
