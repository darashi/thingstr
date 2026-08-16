import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { normalizeEntityIds } from "../lib/wikidata/api";
import {
	getCachedEntityMeta,
	loadEntityMeta,
} from "../lib/wikidata/entityMeta";

interface UseWikidataEntitySummariesOptions {
	language?: string;
}

export interface EntitySummary {
	label: string | null;
	description: string | null;
}

export interface WikidataEntitySummariesResult {
	summaries: Record<string, EntitySummary>;
	isLoading: boolean;
	error: string | null;
}

export function useWikidataEntitySummaries(
	ids: string[],
	options: UseWikidataEntitySummariesOptions = {},
): WikidataEntitySummariesResult {
	const { language = "en" } = options;
	const normalizedIds = useMemo(() => normalizeEntityIds(ids), [ids]);
	const queryKey = useMemo(
		() => ["wikidata-entity-summaries", normalizedIds, language] as const,
		[normalizedIds, language],
	);
	const placeholderData = useMemo(() => {
		const summaries = getCachedSummaries(normalizedIds, language);
		return Object.keys(summaries).length ? summaries : undefined;
	}, [normalizedIds, language]);

	const query = useQuery<
		Record<string, EntitySummary>,
		Error,
		Record<string, EntitySummary>,
		typeof queryKey
	>({
		queryKey,
		enabled: Boolean(normalizedIds.length),
		queryFn: async ({ queryKey: key, signal }) => {
			const [, entityIds, languageCode] = key;
			if (!entityIds.length) return {};

			await loadEntityMeta(
				entityIds,
				languageCode,
				"Failed to load entity summaries",
				signal,
			);
			return getCachedSummaries(entityIds, languageCode);
		},
		placeholderData,
	});

	const isLoading = normalizedIds.length
		? query.isPending || query.isFetching
		: false;
	const error =
		query.error instanceof Error
			? query.error.message
			: query.error
				? "Unknown error"
				: null;

	return {
		summaries: query.data ?? {},
		isLoading,
		error,
	};
}

function getCachedSummaries(
	entityIds: readonly string[],
	language: string,
): Record<string, EntitySummary> {
	const summaries: Record<string, EntitySummary> = {};
	for (const entityId of entityIds) {
		const cached = getCachedEntityMeta(language, entityId);
		if (cached) {
			summaries[entityId] = {
				label: cached.label,
				description: cached.description,
			};
		}
	}
	return summaries;
}
