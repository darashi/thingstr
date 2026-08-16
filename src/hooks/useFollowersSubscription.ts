import { useEffect } from "react";
import { PROFILE_RELAYS } from "../config/relays";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";
import { useNip07Auth } from "./useNip07Auth";

const FOLLOWER_EVENT_LIMIT = 500;

export function useFollowersSubscription() {
	const { pubkey } = useNip07Auth();
	const eventStore = useEventStore();
	const relayPool = useRelayPool();

	useEffect(() => {
		if (!pubkey) return;
		if (!PROFILE_RELAYS.length) return;

		const filters = [
			{ kinds: [3], "#p": [pubkey], limit: FOLLOWER_EVENT_LIMIT },
		];

		const group = relayPool.group(PROFILE_RELAYS);
		const requestSub = group
			.request(filters, { eventStore })
			.subscribe({
				error: (error) => {
					console.error("Failed to load follower events", error);
				},
			});

		const liveSub = group
			.subscription(filters, { eventStore })
			.subscribe({
				error: (error) => {
					console.error("Failed to subscribe to follower events", error);
				},
			});

		return () => {
			requestSub.unsubscribe();
			liveSub.unsubscribe();
		};
	}, [eventStore, pubkey, relayPool]);
}
