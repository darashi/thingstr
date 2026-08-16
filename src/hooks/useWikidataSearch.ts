import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchWikidata } from "../lib/wikidata/api";

export interface WikidataSearchResult {
	id: string;
	label: string;
	description?: string;
	concepturi: string;
}

interface WikidataSearchResponse {
	search: WikidataSearchResult[];
}

interface UseWikidataSearchOptions {
	language?: string;
}

export function useWikidataSearch(
	query: string,
	options: UseWikidataSearchOptions = {},
) {
	const { language = "en" } = options;
	const trimmedQuery = useMemo(() => query.trim(), [query]);

	const searchQuery = useQuery({
		queryKey: ["wikidata-search", trimmedQuery, language] as const,
		enabled: Boolean(trimmedQuery),
		queryFn: async ({ queryKey, signal }) => {
			const [, searchTerm, languageCode] = queryKey;
			const data = await fetchWikidata<WikidataSearchResponse>(
				"wbsearchentities",
				{
					language: languageCode,
					uselang: languageCode,
					search: searchTerm,
					limit: "50",
				},
				"Failed to search Wikidata",
				signal,
			);
			return data.search ?? [];
		},
	});

	const results = trimmedQuery ? searchQuery.data ?? [] : [];
	const error = !trimmedQuery
		? null
		: searchQuery.error instanceof Error
			? searchQuery.error.message
			: searchQuery.error
				? "Unknown error"
				: null;
	const isLoading = trimmedQuery
		? searchQuery.isPending || searchQuery.isFetching
		: false;

	return { results, isLoading, error };
}
