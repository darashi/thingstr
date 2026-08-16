import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	fetchWikidataEntities,
	normalizeEntityIds,
} from "../lib/wikidata/api";
import {
	isWikibaseEntityValue,
	type WikidataClaim,
} from "../lib/wikidata/claims";

interface WikidataEntity {
	claims?: Record<string, WikidataClaim[]>;
}

const CLASSIFICATION_PROPERTIES = ["P31", "P279"] as const;

export interface WikidataInstanceOfResult {
	instanceOf: Record<string, string[]>;
	isLoading: boolean;
	error: string | null;
}

export function useWikidataInstanceOf(ids: string[]): WikidataInstanceOfResult {
	const normalizedIds = useMemo(() => normalizeEntityIds(ids), [ids]);
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

			const entities = await fetchWikidataEntities<WikidataEntity>(entityIds, {
				props: "claims",
				errorMessage: "Failed to load entity claims",
				signal,
			});
			const map: Record<string, string[]> = {};

			for (const entityId of entityIds) {
				const classificationIds = new Set<string>();
				for (const property of CLASSIFICATION_PROPERTIES) {
					const claims = entities[entityId]?.claims?.[property] ?? [];
					for (const claim of claims) {
						const value = claim.mainsnak.datavalue;
						if (
							value?.type === "wikibase-entityid" &&
							isWikibaseEntityValue(value.value)
						) {
							classificationIds.add(value.value.id);
						}
					}
				}
				map[entityId] = Array.from(classificationIds);
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
