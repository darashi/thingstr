import { useEffect, useState } from "react";
import { useEventStore } from "./useEventStore";
import { useNip07Auth } from "./useNip07Auth";
import { normalizePubkey } from "../lib/nostr";

const FOLLOWER_FILTER_TEMPLATE = { kinds: [3], "#p": [] as string[] };
const EMPTY_FOLLOWERS = new Set<string>();

interface FollowersState {
	targetPubkey: string;
	followers: Set<string>;
}

export function useFollowers(): Set<string> {
	const eventStore = useEventStore();
	const { pubkey: targetPubkey } = useNip07Auth();
	const [state, setState] = useState<FollowersState | null>(null);

	useEffect(() => {
		if (!targetPubkey) return;

		const filter = { ...FOLLOWER_FILTER_TEMPLATE, "#p": [targetPubkey] };
		const sub = eventStore.filters(filter).subscribe((event) => {
			if (!event?.pubkey) return;
			const normalized = normalizePubkey(event.pubkey) ?? event.pubkey;
			setState((previous) => {
				const followers =
					previous?.targetPubkey === targetPubkey
						? previous.followers
						: EMPTY_FOLLOWERS;
				if (followers.has(normalized)) return previous;
				const next = new Set(followers);
				next.add(normalized);
				return { targetPubkey, followers: next };
			});
		});

		return () => sub.unsubscribe();
	}, [eventStore, targetPubkey]);

	return state?.targetPubkey === targetPubkey
		? state.followers
		: EMPTY_FOLLOWERS;
}
