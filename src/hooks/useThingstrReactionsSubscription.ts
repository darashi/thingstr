import { useEffect } from "react";
import { THINGSTR_RELAYS } from "../config/relays";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";

const REACTION_FILTERS = [
	{ kinds: [17], "#k": ["wikidata"], limit: 500 },
	{ kinds: [5], limit: 500 },
];

export function useThingstrReactionsSubscription() {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();

	useEffect(() => {
		if (!THINGSTR_RELAYS.length) return;

		const group = relayPool.group(THINGSTR_RELAYS);
		const handleEvent = (event: unknown) => {
			if (!event || typeof event === "string") return;
			eventStore.add(event as never);
		};

		const requestSub = group
			.request(REACTION_FILTERS, { eventStore })
			.subscribe({
				next: handleEvent,
				error: (error) =>
					console.error(
						"Failed to request reactions from THINGSTR relays",
						error,
					),
			});

		const liveSub = group
			.subscription(REACTION_FILTERS, { eventStore })
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
