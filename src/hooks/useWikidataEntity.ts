import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface WikidataEntity {
	labels?: Record<string, { value: string }>;
	descriptions?: Record<string, { value: string }>;
}

interface WikidataEntityResponse {
	entities: Record<string, WikidataEntity>;
}

interface UseWikidataEntityOptions {
	language?: string;
}

const ENDPOINT = "https://www.wikidata.org/w/api.php";

export function useWikidataEntity(
	id: string,
	options: UseWikidataEntityOptions = {},
) {
	const { language = "en" } = options;
	const trimmedId = useMemo(() => id.trim(), [id]);
	const missingIdMessage = useMemo(
		() => (!trimmedId ? "Missing entity id" : null),
		[trimmedId],
	);

	const entityQuery = useQuery({
		queryKey: ["wikidata-entity", trimmedId, language] as const,
		enabled: Boolean(trimmedId),
		queryFn: async ({ queryKey, signal }) => {
			const [, entityId, languageCode] = queryKey;
			const languagesParam =
				languageCode === "en" ? "en" : `${languageCode}|en`;

			const params = new URLSearchParams({
				action: "wbgetentities",
				format: "json",
				ids: entityId,
				origin: "*",
				languages: languagesParam,
				props: "labels|descriptions",
			});

			const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
				signal,
			});

			if (!response.ok) {
				throw new Error("Failed to load entity");
			}

			const data = (await response.json()) as WikidataEntityResponse;
			const entity = data.entities?.[entityId];

			if (!entity) {
				throw new Error("Entity not found");
			}

			const labels = entity.labels ?? {};
			const descriptions = entity.descriptions ?? {};

			const pickValue = (
				values: Record<string, { value: string }> | undefined,
			): string | null => {
				if (!values) return null;
				return (
					values[languageCode]?.value ??
					values.en?.value ??
					Object.values(values)[0]?.value ??
					null
				);
			};

			return {
				label: pickValue(labels),
				description: pickValue(descriptions),
			};
		},
	});

	const label = entityQuery.data?.label ?? null;
	const description = entityQuery.data?.description ?? null;
	const isLoading = trimmedId
		? entityQuery.isPending || entityQuery.isFetching
		: false;
	const error =
		missingIdMessage ??
		(entityQuery.error instanceof Error
			? entityQuery.error.message
			: entityQuery.error
				? "Unknown error"
				: null);

	return { label, description, isLoading, error };
}
