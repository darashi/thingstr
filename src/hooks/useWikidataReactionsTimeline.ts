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
	const deleteFilter = useMemo(() => ({ kinds: [5] }), []);

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

	const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
		if (typeof eventStore.getByFilters === "function") {
			const existingDeletes = eventStore.getByFilters(
				deleteFilter,
			) as ReactionEvent[] | undefined;
			if (Array.isArray(existingDeletes)) {
				return extractDeletedIds(existingDeletes);
			}
		}
		return new Set();
	});

	useEffect(() => {
		const sub = eventStore.timeline(reactionFilter).subscribe((events) => {
			setReactions(events ?? []);
		});

		return () => sub.unsubscribe();
	}, [eventStore, reactionFilter]);

	useEffect(() => {
		const deleteSub = eventStore.filters(deleteFilter).subscribe((event) => {
			if (!event?.tags) return;
			const ids = extractDeletedIds([event]);
			if (ids.size === 0) return;
			setDeletedIds((prev) => {
				const next = new Set(prev);
				ids.forEach((id) => next.add(id));
				return next;
			});
		});

		return () => deleteSub.unsubscribe();
	}, [deleteFilter, eventStore]);

	const filtered = useMemo(() => {
		const items = reactions
			.filter((event) => !deletedIds.has(event.id))
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
	}, [deletedIds, reactions]);

	return filtered;
}

function extractDeletedIds(events: ReactionEvent[]): Set<string> {
	const ids = new Set<string>();
	events.forEach((event) => {
		event.tags.forEach(([key, value]) => {
			if (key === "e" && typeof value === "string") {
				ids.add(value);
			}
		});
	});
	return ids;
}
