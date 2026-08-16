import { useEffect } from "react";
import type { NostrEvent } from "nostr-tools";
import { THINGSTR_RELAYS } from "../config/relays";
import { ingestRelayEvent } from "../lib/reactionEventStore";
import { buildReactionDeletionFilter } from "../lib/reactionFilters";
import { isVerifiedNostrEvent } from "../lib/nostr";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";

const REACTION_PAGE_SIZE = 500;
const MAX_REACTION_PAGES = 10;

export function useUserReactionBackfill(
	normalizedPubkey: string | null | undefined,
) {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();

	useEffect(() => {
		if (!normalizedPubkey) return;
		if (!THINGSTR_RELAYS.length) return;

		const group = relayPool.group(THINGSTR_RELAYS);
		const relayOptions = {
			eventStore: null,
			reconnect: Infinity,
			resubscribe: { delay: 1_000 },
		};
		let cancelCurrentRequest: (() => void) | null = null;
		let cancelDeleteRequest: (() => void) | null = null;
		let isCancelled = false;

		type PageResult = {
			earliestTimestamp: number | null;
			reactionCount: number;
			events: NostrEvent[];
			isComplete: boolean;
		};

		const loadPage = (until?: number): Promise<PageResult> =>
			new Promise<PageResult>((resolve) => {
				const filters = [
					{
						kinds: [17],
						"#k": ["wikidata"],
						authors: [normalizedPubkey],
						limit: REACTION_PAGE_SIZE,
						...(typeof until === "number" ? { until } : {}),
					},
				];

				let earliestTimestamp: number | null = null;
				const events = new Map<string, NostrEvent>();
				let isResolved = false;

				const finish = (result: PageResult) => {
					if (isResolved) return;
					isResolved = true;
					cancelCurrentRequest = null;
					resolve(result);
				};

				const subscription = group
					.request(filters, relayOptions)
					.subscribe({
						next: (event) => {
							if (!isVerifiedNostrEvent(event) || event.kind !== 17) return;
							events.set(event.id, event);
							earliestTimestamp =
								earliestTimestamp === null
									? event.created_at
									: Math.min(earliestTimestamp, event.created_at);
						},
						error: (error) => {
							console.error("Failed to load user reactions", error);
							finish({
								earliestTimestamp,
								reactionCount: events.size,
								events: [...events.values()],
								isComplete: false,
							});
						},
						complete: () =>
							finish({
								earliestTimestamp,
								reactionCount: events.size,
								events: [...events.values()],
								isComplete: true,
							}),
					});

				cancelCurrentRequest = () => {
					subscription.unsubscribe();
					finish({
						earliestTimestamp: null,
						reactionCount: 0,
						events: [],
						isComplete: false,
					});
					cancelCurrentRequest = null;
				};
			});

		const loadDeleteAttempt = (eventIds: string[]) =>
			new Promise<boolean>((resolve) => {
				if (!eventIds.length) {
					resolve(true);
					return;
				}
				let isResolved = false;
				const finish = (succeeded: boolean) => {
					if (isResolved) return;
					isResolved = true;
					cancelDeleteRequest = null;
					resolve(succeeded);
				};

				const subscription = group
					.request(buildReactionDeletionFilter(eventIds), relayOptions)
					.subscribe({
						next: (event) => ingestRelayEvent(eventStore, event),
						error: () => finish(false),
						complete: () => finish(true),
					});

				cancelDeleteRequest = () => {
					subscription.unsubscribe();
					finish(true);
				};
			});
		const loadDeletes = async (eventIds: string[]): Promise<boolean> => {
			for (let attempt = 0; attempt < 3; attempt += 1) {
				if (isCancelled) return false;
				if (await loadDeleteAttempt(eventIds)) return true;
			}
			console.error("Failed to load delete events after 3 attempts");
			return false;
		};

		void (async () => {
			let until: number | undefined;
			for (let page = 0; page < MAX_REACTION_PAGES; page += 1) {
				if (isCancelled) break;
				const { earliestTimestamp, reactionCount, events, isComplete } =
					await loadPage(until);
				if (isCancelled) break;
				const deletionsLoaded = await loadDeletes(
					events.map(({ id }) => id),
				);
				if (isCancelled) break;
				if (!deletionsLoaded) break;
				events.forEach((event) => ingestRelayEvent(eventStore, event));
				if (!isComplete) break;
				if (earliestTimestamp === null) break;

				const nextUntil = earliestTimestamp - 1;
				if (until !== undefined && nextUntil >= until) break;
				if (reactionCount < REACTION_PAGE_SIZE) break;
				until = nextUntil;
			}
		})();

		return () => {
			isCancelled = true;
			cancelCurrentRequest?.();
			cancelDeleteRequest?.();
		};
	}, [eventStore, normalizedPubkey, relayPool]);
}
