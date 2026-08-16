import { useEffect, useMemo, useState } from "react";
import { useEventStore } from "./useEventStore";
import { useNip07Auth } from "./useNip07Auth";
import { withWikidataPrefix } from "../lib/wikidata/ids";

interface UseWikidataReactionsResult {
	isStarred: boolean;
	lastReactionEventId: string | null;
}

type UseWikidataReactionsOptions = {
	pubkey?: string | null;
};

type ReactionFilter = {
	kinds: number[];
	"#i": string[];
	"#k": string[];
	authors?: string[];
};

type ReactionState = {
	trackingKey: string;
	events: Map<string, number>;
};

export function useWikidataReactions(
	entityId: string,
	{ pubkey: targetPubkey }: UseWikidataReactionsOptions = {},
): UseWikidataReactionsResult {
	const eventStore = useEventStore();
	const { pubkey } = useNip07Auth();
	const pubkeyToTrack = targetPubkey ?? pubkey;
	const prefixedEntityId = useMemo(
		() => withWikidataPrefix(entityId),
		[entityId],
	);
	const filter = useMemo(
		(): ReactionFilter => ({
			kinds: [17],
			"#i": [prefixedEntityId],
			"#k": ["wikidata"],
			...(pubkeyToTrack ? { authors: [pubkeyToTrack] } : {}),
		}),
		[prefixedEntityId, pubkeyToTrack],
	);
	const trackingKey = `${pubkeyToTrack ?? ""}:${prefixedEntityId}`;
	const [reactionState, setReactionState] = useState<ReactionState | null>(
		null,
	);

	useEffect(() => {
		if (!pubkeyToTrack) return;

		const sub = eventStore.filters(filter).subscribe((event) => {
			if (event.pubkey !== pubkeyToTrack) return;
			setReactionState((current) => {
				const events =
					current?.trackingKey === trackingKey
						? new Map(current.events)
						: new Map<string, number>();
				if (events.get(event.id) === event.created_at) return current;
				events.set(event.id, event.created_at);
				return { trackingKey, events };
			});
		});

		const removeSub = eventStore.remove$.subscribe((event) => {
			setReactionState((current) => {
				if (current?.trackingKey !== trackingKey) return current;
				if (!current.events.has(event.id)) return current;
				const events = new Map(current.events);
				events.delete(event.id);
				return { trackingKey, events };
			});
		});

		return () => {
			sub.unsubscribe();
			removeSub.unsubscribe();
		};
	}, [eventStore, filter, pubkeyToTrack, trackingKey]);

	return useMemo(() => {
		if (reactionState?.trackingKey !== trackingKey) {
			return { isStarred: false, lastReactionEventId: null };
		}

		let lastReactionEventId: string | null = null;
		let lastReactionTimestamp = Number.NEGATIVE_INFINITY;
		for (const [eventId, createdAt] of reactionState.events) {
			if (
				createdAt > lastReactionTimestamp ||
				(createdAt === lastReactionTimestamp &&
					(lastReactionEventId === null || eventId < lastReactionEventId))
			) {
				lastReactionEventId = eventId;
				lastReactionTimestamp = createdAt;
			}
		}

		return {
			isStarred: reactionState.events.size > 0,
			lastReactionEventId,
		};
	}, [reactionState, trackingKey]);
}
