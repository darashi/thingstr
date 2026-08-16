import type { Filter } from "nostr-tools";
import { withWikidataPrefix } from "./wikidata/ids";

const HISTORY_LIMIT = 500;

export const WIKIDATA_REACTION_FILTER: Filter = {
	kinds: [17],
	"#k": ["wikidata"],
};

export function buildThingstrReactionFilters(): Filter[] {
	return [
		{ ...WIKIDATA_REACTION_FILTER, limit: HISTORY_LIMIT },
		{ kinds: [5], limit: HISTORY_LIMIT },
	];
}

export function buildEntityReactionFilter(entityId: string): Filter {
	return {
		...WIKIDATA_REACTION_FILTER,
		"#i": [withWikidataPrefix(entityId)],
		limit: HISTORY_LIMIT,
	};
}

export function buildReactionDeletionFilter(eventIds: string[]): Filter {
	return {
		kinds: [5],
		"#e": [...new Set(eventIds.filter(Boolean))],
	};
}
