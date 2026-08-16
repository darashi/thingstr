import { useEffect } from "react";
import { THINGSTR_RELAYS } from "../config/relays";
import { ingestRelayEvent } from "../lib/reactionEventStore";
import { buildThingstrReactionFilters } from "../lib/reactionFilters";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";

export function useThingstrReactionsSubscription() {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();

	useEffect(() => {
		if (!THINGSTR_RELAYS.length) return;

		const group = relayPool.group(THINGSTR_RELAYS);
		const filters = buildThingstrReactionFilters();
		const relayOptions = {
			eventStore: null,
			reconnect: Infinity,
			resubscribe: { delay: 1_000 },
		};
		const handleEvent = (event: unknown) => {
			ingestRelayEvent(eventStore, event);
		};
		const requestSub = group
			.request(filters, relayOptions)
			.subscribe({
				next: handleEvent,
				error: (error) =>
					console.error(
						"Failed to request reactions from THINGSTR relays",
						error,
					),
			});

		const liveSub = group
			.subscription(filters, relayOptions)
			.subscribe({
				next: handleEvent,
				error: (error) =>
					console.error(
						"Failed to subscribe to reactions from THINGSTR relays",
						error,
					),
			});

		return () => {
			requestSub.unsubscribe();
			liveSub.unsubscribe();
		};
	}, [eventStore, relayPool]);
}
