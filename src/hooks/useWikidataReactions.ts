import { useEffect, useMemo, useState } from "react";
import { useProfile } from "./useProfile";
import { useEventStore } from "./useEventStore";
import { useNip07Auth } from "./useNip07Auth";

interface UseWikidataReactionsResult {
	isStarred: boolean;
	pubkey: string | null;
	lastReactionEventId: string | null;
	profilePicture: string | null;
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

export function useWikidataReactions(
	entityId: string,
	{ pubkey: targetPubkey }: UseWikidataReactionsOptions = {},
): UseWikidataReactionsResult {
	const eventStore = useEventStore();
	const { session } = useNip07Auth();
	const pubkeyToTrack = targetPubkey ?? session?.pubkey ?? null;
	const filter = useMemo(
		(): ReactionFilter => ({
			kinds: [17],
			"#i": [`wd:${entityId}`],
			"#k": ["wikidata"],
			...(pubkeyToTrack ? { authors: [pubkeyToTrack] } : {}),
		}),
		[entityId, pubkeyToTrack],
	);

	const [pubkey, setPubkey] = useState<string | null>(null);
	const [lastReactionEventId, setLastReactionEventId] = useState<string | null>(
		null,
	);
	const [isStarred, setIsStarred] = useState(false);
	const [reactionIds, setReactionIds] = useState<Set<string>>(new Set());

	const { picture: profilePicture } = useProfile(pubkey);

	useEffect(() => {
		setPubkey(null);
		setLastReactionEventId(null);
		setIsStarred(false);
		setReactionIds(new Set());

		if (!pubkeyToTrack) return;

		// hydrate existing reactions
		if (typeof eventStore.getByFilters === "function") {
			const existing = eventStore.getByFilters(filter) as
				| Array<{ created_at?: number; pubkey?: string; id?: string }>
				| undefined;
			if (Array.isArray(existing) && existing.length) {
				const ids = new Set<string>();
				const latest = existing.reduce((prev, current) => {
					if (!prev) return current;
					return (current.created_at ?? 0) > (prev.created_at ?? 0)
						? current
						: prev;
				});
				existing.forEach((ev) => {
					if (ev.id) ids.add(ev.id);
				});
				setReactionIds(ids);
				setPubkey(latest.pubkey ?? null);
				setLastReactionEventId(latest.id ?? null);
				setIsStarred(true);
			}
		}

		const sub = eventStore.filters(filter).subscribe((event) => {
			if (event?.pubkey !== pubkeyToTrack) return;
			setPubkey(event.pubkey);
			setLastReactionEventId(event.id ?? null);
			setIsStarred(true);
			if (event.id) {
				setReactionIds((prev) => {
					const next = new Set(prev);
					next.add(event.id as string);
					return next;
				});
			}
		});

		return () => sub.unsubscribe();
	}, [eventStore, filter, pubkeyToTrack]);

	// watch deletions (kind 5) that reference known reaction ids
	useEffect(() => {
		const deleteSub = eventStore.filters({ kinds: [5] }).subscribe((event) => {
			if (!event?.tags) return;
			const deletedId = event.tags.find(([key]) => key === "e")?.[1];
			if (deletedId && reactionIds.has(deletedId)) {
				setReactionIds((prev) => {
					const next = new Set(prev);
					next.delete(deletedId);
					return next;
				});
				if (lastReactionEventId === deletedId) {
					setIsStarred(false);
					setPubkey(null);
					setLastReactionEventId(null);
				}
			}
		});
		return () => deleteSub.unsubscribe();
		// Intentionally not including reactionIds in deps to avoid re-subscribing frequently
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [eventStore, lastReactionEventId]);

	return { isStarred, pubkey, lastReactionEventId, profilePicture };
}
