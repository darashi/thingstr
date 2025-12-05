import { useEffect, useMemo, useState } from "react";
import { useEventStore } from "./useEventStore";
import { useNip07Auth } from "./useNip07Auth";
import { normalizePubkey } from "../lib/nostr";

const FOLLOWER_FILTER_TEMPLATE = { kinds: [3], "#p": [] as string[] };

export function useFollowers(): Set<string> {
	const eventStore = useEventStore();
	const { session } = useNip07Auth();

	const targetPubkey = useMemo(
		() => (session?.pubkey ? normalizePubkey(session.pubkey) : null),
		[session?.pubkey],
	);

	const [followers, setFollowers] = useState<Set<string>>(new Set());

	useEffect(() => {
		setFollowers(new Set());
		if (!targetPubkey) return;

		const filter = { ...FOLLOWER_FILTER_TEMPLATE, "#p": [targetPubkey] };

		if (typeof eventStore.getByFilters === "function") {
			const existing = eventStore.getByFilters(filter) as
				| Array<{ pubkey?: string }>
				| undefined;
			if (Array.isArray(existing)) {
				const initial = new Set<string>();
				existing.forEach((event) => {
					if (!event?.pubkey) return;
					const normalized = normalizePubkey(event.pubkey) ?? event.pubkey;
					initial.add(normalized);
				});
				setFollowers(initial);
			}
		}

		const sub = eventStore.filters(filter).subscribe((event) => {
			if (!event?.pubkey) return;
			const normalized = normalizePubkey(event.pubkey) ?? event.pubkey;
			setFollowers((prev) => {
				if (prev.has(normalized)) return prev;
				const next = new Set(prev);
				next.add(normalized);
				return next;
			});
		});

		return () => sub.unsubscribe();
	}, [eventStore, targetPubkey]);

	return followers;
}
