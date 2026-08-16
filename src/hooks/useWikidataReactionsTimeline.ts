import { useEffect, useMemo, useState } from "react";
import { useEventStore } from "./useEventStore";
import { stripWikidataPrefix } from "../lib/wikidata/ids";

type ReactionEvent = {
	id: string;
	pubkey: string;
	created_at: number;
	tags: string[][];
	content: string;
	kind: number;
};

export interface WikidataReactionItem {
	event: ReactionEvent;
	entityId: string;
	pubkey: string;
}

export function useWikidataReactionsTimeline(): WikidataReactionItem[] {
	const eventStore = useEventStore();

	const reactionFilter = useMemo(
		() => ({
			kinds: [17],
			"#k": ["wikidata"],
		}),
		[],
	);

	const [reactions, setReactions] = useState<ReactionEvent[]>(() => {
		if (typeof eventStore.getByFilters === "function") {
			const existing = eventStore.getByFilters(
				reactionFilter,
			) as ReactionEvent[] | undefined;
			if (Array.isArray(existing)) {
				return existing;
			}
		}
		return [];
	});

	useEffect(() => {
		const sub = eventStore.timeline(reactionFilter).subscribe((events) => {
			setReactions(events ?? []);
		});

		return () => sub.unsubscribe();
	}, [eventStore, reactionFilter]);

	const filtered = useMemo(() => {
		const items = reactions
			.map((event) => {
				const entityTag = event.tags.find(
					([key, value]) => key === "i" && typeof value === "string",
				);
				if (!entityTag) return null;
				const [, value] = entityTag;
				if (!value) return null;
				const id = stripWikidataPrefix(value);
				if (!id) return null;
				return {
					event,
					entityId: id,
					pubkey: event.pubkey,
				};
			})
			.filter(Boolean) as WikidataReactionItem[];

		return items.sort(
			(a, b) => (b?.event?.created_at ?? 0) - (a?.event?.created_at ?? 0),
		);
	}, [reactions]);

	return filtered;
}
