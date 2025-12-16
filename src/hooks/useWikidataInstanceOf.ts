import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

const ENDPOINT = "https://www.wikidata.org/w/api.php";

interface WikidataSnak {
	snaktype: string;
	datavalue?: {
		type: string;
		value: unknown;
	};
}

interface WikidataEntity {
	claims?: Record<string, { mainsnak: WikidataSnak }[]>;
}

interface WikidataEntityResponse {
	entities: Record<string, WikidataEntity>;
}

const CLASSIFICATION_PROPERTIES = ["P31", "P279"] as const;

export interface WikidataInstanceOfResult {
	instanceOf: Record<string, string[]>;
	isLoading: boolean;
	error: string | null;
}

export function useWikidataInstanceOf(ids: string[]): WikidataInstanceOfResult {
	const normalizedIds = useMemo(
		() =>
			Array.from(
				new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)),
			).sort(),
		[ids],
	);

	const queryKey = useMemo(
		() => ["wikidata-instanceof", normalizedIds] as const,
		[normalizedIds],
	);

	const query = useQuery<
		Record<string, string[]>,
		Error,
		Record<string, string[]>,
		typeof queryKey
	>({
		queryKey,
		enabled: Boolean(normalizedIds.length),
		queryFn: async ({ queryKey: key, signal }) => {
			const [, entityIds] = key;
			if (!entityIds.length) return {};

			const chunks: string[][] = [];
			for (let i = 0; i < entityIds.length; i += 50) {
				chunks.push(entityIds.slice(i, i + 50));
			}

			const map: Record<string, string[]> = {};

			for (const chunk of chunks) {
				const params = new URLSearchParams({
					action: "wbgetentities",
					format: "json",
					ids: chunk.join("|"),
					origin: "*",
					props: "claims",
				});

				const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
					signal,
				});

				if (!response.ok) {
					throw new Error("Failed to load entity claims");
				}

				const data = (await response.json()) as WikidataEntityResponse;
				for (const entityId of chunk) {
					const entity = data.entities?.[entityId];
					const ids = new Set<string>();
					CLASSIFICATION_PROPERTIES.forEach((property) => {
						const claims = entity?.claims?.[property] ?? [];
						claims.forEach((claim) => {
							const value = claim.mainsnak.datavalue;
							if (value?.type !== "wikibase-entityid") return;
							if (!isWikibaseEntityValue(value.value)) return;
							ids.add(value.value.id);
						});
					});
					map[entityId] = Array.from(ids);
				}
			}

			return map;
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
		instanceOf: query.data ?? {},
		isLoading,
		error,
	};
}

function isWikibaseEntityValue(
	value: unknown,
): value is { id: string; "entity-type": string } {
	return Boolean(
		value &&
			typeof value === "object" &&
			"id" in value &&
			typeof (value as { id?: unknown }).id === "string",
	);
}
