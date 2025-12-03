import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

const ENDPOINT = "https://www.wikidata.org/w/api.php";

interface WikidataEntity {
	labels?: Record<string, { value: string }>;
	descriptions?: Record<string, { value: string }>;
}

interface WikidataEntityResponse {
	entities: Record<string, WikidataEntity>;
}

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
	const normalizedIds = useMemo(
		() =>
			Array.from(
				new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)),
			).sort(),
		[ids],
	);

	const queryKey = useMemo(
		() => ["wikidata-entity-summaries", normalizedIds, language] as const,
		[normalizedIds, language],
	);

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

			const languagesParam =
				languageCode === "en" ? "en" : `${languageCode}|en`;

			const summaries: Record<string, EntitySummary> = {};
			const chunks: string[][] = [];
			for (let i = 0; i < entityIds.length; i += 50) {
				chunks.push(entityIds.slice(i, i + 50));
			}

			for (const chunk of chunks) {
				const params = new URLSearchParams({
					action: "wbgetentities",
					format: "json",
					ids: chunk.join("|"),
					origin: "*",
					languages: languagesParam,
					languagefallback: "1",
					props: "labels|descriptions",
				});

				const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
					signal,
				});

				if (!response.ok) {
					throw new Error("Failed to load entity summaries");
				}

				const data = (await response.json()) as WikidataEntityResponse;
				for (const [entityId, entity] of Object.entries(data.entities ?? {})) {
					const label = pickLabel(entity.labels ?? {}, languageCode);
					const description = pickLabel(entity.descriptions ?? {}, languageCode);
					summaries[entityId] = {
						label: label ?? null,
						description: description ?? null,
					};
				}
			}

			return summaries;
		},
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

function pickLabel(
	values: Record<string, { value: string }>,
	languageCode: string,
) {
	return (
		values[languageCode]?.value ??
		values.en?.value ??
		Object.values(values)[0]?.value ??
		null
	);
}
