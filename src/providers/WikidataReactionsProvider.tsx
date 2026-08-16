import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { NostrEvent } from "nostr-tools";
import { useEventStore } from "../hooks/useEventStore";
import {
	getReactionDeletionEvents,
	subscribeReactionDeletionEvents,
} from "../lib/reactionEventStore";
import { WIKIDATA_REACTION_FILTER } from "../lib/reactionFilters";
import { buildWikidataReactionsValue } from "./buildWikidataReactionsValue";
import { WikidataReactionsContext } from "./wikidataReactionsContext";

function storedReactions(eventStore: ReturnType<typeof useEventStore>) {
	return eventStore.getByFilters(WIKIDATA_REACTION_FILTER) as NostrEvent[];
}

export function WikidataReactionsProvider({
	children,
}: {
	children: ReactNode;
}) {
	const eventStore = useEventStore();
	const [reactions, setReactions] = useState<NostrEvent[]>(() =>
		storedReactions(eventStore),
	);
	const [deletions, setDeletions] = useState<NostrEvent[]>(
		getReactionDeletionEvents,
	);

	useEffect(() => {
		const subscription = eventStore
			.timeline(WIKIDATA_REACTION_FILTER)
			.subscribe((events) => setReactions((events ?? []) as NostrEvent[]));
		return () => subscription.unsubscribe();
	}, [eventStore]);

	useEffect(
		() =>
			subscribeReactionDeletionEvents((event) => {
				setDeletions((current) =>
					current.some(({ id }) => id === event.id)
						? current
						: [...current, event],
				);
			}),
		[],
	);

	const value = useMemo(
		() => buildWikidataReactionsValue(reactions, deletions),
		[deletions, reactions],
	);

	return (
		<WikidataReactionsContext.Provider value={value}>
			{children}
		</WikidataReactionsContext.Provider>
	);
}
