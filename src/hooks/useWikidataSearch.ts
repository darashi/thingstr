import { useEffect, useState } from "react";

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
	debounceMs?: number;
	language?: string;
	limit?: number;
}

const ENDPOINT = "https://www.wikidata.org/w/api.php";

export function useWikidataSearch(
	query: string,
	options: UseWikidataSearchOptions = {},
) {
	const { debounceMs = 250, language = "en", limit = 8 } = options;
	const [results, setResults] = useState<WikidataSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [debouncedQuery, setDebouncedQuery] = useState(query);

	useEffect(() => {
		const timer = window.setTimeout(
			() => setDebouncedQuery(query.trim()),
			debounceMs,
		);
		return () => window.clearTimeout(timer);
	}, [query, debounceMs]);

	useEffect(() => {
		if (!debouncedQuery) {
			setResults([]);
			setError(null);
			return;
		}

		const controller = new AbortController();

		const runSearch = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({
					action: "wbsearchentities",
					format: "json",
					origin: "*",
					language,
					uselang: language,
					search: debouncedQuery,
					limit: String(limit),
				});

				const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error("Failed to search Wikidata");
				}

				const data = (await response.json()) as WikidataSearchResponse;
				setResults(data.search ?? []);
			} catch (err) {
				if (controller.signal.aborted) {
					return;
				}

				setResults([]);
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setIsLoading(false);
			}
		};

		runSearch();

		return () => controller.abort();
	}, [debouncedQuery, language, limit]);

	return { results, isLoading, error };
}
