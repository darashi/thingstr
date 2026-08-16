import { useEffect } from "react";
import { THINGSTR_RELAYS } from "../config/relays";
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
		let cancelCurrentRequest: (() => void) | null = null;
		let cancelDeleteRequest: (() => void) | null = null;
		let isCancelled = false;

		type PageResult = {
			earliestTimestamp: number | null;
			reactionCount: number;
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
				let reactionCount = 0;
				let isResolved = false;

				const finish = (result: PageResult) => {
					if (isResolved) return;
					isResolved = true;
					cancelCurrentRequest = null;
					resolve(result);
				};

				const subscription = group
					.request(filters, { eventStore })
					.subscribe({
						next: (event) => {
							if (event.kind === 17) reactionCount += 1;
							earliestTimestamp =
								earliestTimestamp === null
									? event.created_at
									: Math.min(earliestTimestamp, event.created_at);
						},
						error: (error) => {
							console.error("Failed to load user reactions", error);
							finish({
								earliestTimestamp: null,
								reactionCount: 0,
							});
						},
						complete: () => finish({ earliestTimestamp, reactionCount }),
					});

				cancelCurrentRequest = () => {
					subscription.unsubscribe();
					finish({
						earliestTimestamp: null,
						reactionCount: 0,
					});
					cancelCurrentRequest = null;
				};
			});

		const loadDeletes = () =>
			new Promise<void>((resolve) => {
				const deleteFilters = [
					{
						kinds: [5],
						authors: [normalizedPubkey],
						limit: REACTION_PAGE_SIZE,
					},
				];

				const subscription = group
					.request(deleteFilters, { eventStore })
					.subscribe({
						error: (error) => {
							console.error("Failed to load delete events", error);
							resolve();
						},
						complete: () => resolve(),
					});

				cancelDeleteRequest = () => {
					subscription.unsubscribe();
					cancelDeleteRequest = null;
					resolve();
				};
			});

		void (async () => {
			await loadDeletes();
			let until: number | undefined;
			for (let page = 0; page < MAX_REACTION_PAGES; page += 1) {
				if (isCancelled) break;
				const { earliestTimestamp, reactionCount } = await loadPage(until);
				if (isCancelled) break;
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
