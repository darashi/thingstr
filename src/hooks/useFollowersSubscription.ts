import { useEffect, useMemo } from "react";
import { PROFILE_RELAYS } from "../config/relays";
import { normalizePubkey } from "../lib/nostr";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";
import { useNip07Auth } from "./useNip07Auth";

const FOLLOWER_EVENT_LIMIT = 500;

export function useFollowersSubscription() {
	const { session } = useNip07Auth();
	const eventStore = useEventStore();
	const relayPool = useRelayPool();

	const normalizedPubkey = useMemo(
		() => (session?.pubkey ? normalizePubkey(session.pubkey) : null),
		[session?.pubkey],
	);

	useEffect(() => {
		if (!normalizedPubkey) return;
		if (!PROFILE_RELAYS.length) return;

		const filters = [
			{ kinds: [3], "#p": [normalizedPubkey], limit: FOLLOWER_EVENT_LIMIT },
		];

		const group = relayPool.group(PROFILE_RELAYS);
		const handleEvent = (event: unknown) => {
			if (!event || typeof event === "string") return;
			eventStore.add(event as never);
		};

		const requestSub = group.request(filters, { eventStore }).subscribe({
			next: handleEvent,
			error: (error) => {
				console.error("Failed to load follower events", error);
			},
		});

		const liveSub = group.subscription(filters, { eventStore }).subscribe({
			next: handleEvent,
			error: (error) => {
				console.error("Failed to subscribe to follower events", error);
			},
		});

		return () => {
			requestSub.unsubscribe();
			liveSub.unsubscribe();
		};
	}, [eventStore, normalizedPubkey, relayPool]);
}
