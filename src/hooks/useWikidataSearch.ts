import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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

const ENDPOINT = "https://www.wikidata.org/w/api.php";

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

			const params = new URLSearchParams({
				action: "wbsearchentities",
				format: "json",
				origin: "*",
				language: languageCode,
				uselang: languageCode,
				search: searchTerm,
				limit: "50",
			});

			const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
				signal,
			});

			if (!response.ok) {
				throw new Error("Failed to search Wikidata");
			}

			const data = (await response.json()) as WikidataSearchResponse;
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
