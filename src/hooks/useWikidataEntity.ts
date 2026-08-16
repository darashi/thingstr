import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	fetchWikidataEntities,
	normalizeEntityId,
	pickLocalizedValue,
	type LocalizedValues,
} from "../lib/wikidata/api";
import {
	collectClaimEntityIds,
	formatEntityProperties,
	type EntityProperty,
	type WikidataClaim,
} from "../lib/wikidata/claims";
import { getCachedEntityMeta, loadEntityMeta } from "../lib/wikidata/entityMeta";

export type {
	EntityProperty,
	EntityPropertyValue,
	EntityQualifier,
} from "../lib/wikidata/claims";

interface WikidataEntity {
	labels?: LocalizedValues;
	descriptions?: LocalizedValues;
	claims?: Record<string, WikidataClaim[]>;
}

interface UseWikidataEntityOptions {
	language?: string;
}

export interface WikidataEntityResult {
	label: string | null;
	description: string | null;
	properties: EntityProperty[];
	isLoading: boolean;
	isPropertiesLoading: boolean;
	error: string | null;
	isLabelMissing: boolean;
	isDescriptionMissing: boolean;
	loadingLabelIds: string[];
}

type LabelMap = Record<string, string>;
type DescriptionMap = Record<string, string>;

const EMPTY_CLAIMS: Record<string, WikidataClaim[]> = {};
const EMPTY_LABEL_MAP: LabelMap = {};
const EMPTY_DESCRIPTION_MAP: DescriptionMap = {};

export function useWikidataEntity(
	id: string,
	options: UseWikidataEntityOptions = {},
): WikidataEntityResult {
	const { language = "en" } = options;
	const trimmedId = useMemo(() => normalizeEntityId(id), [id]);
	const missingIdMessage = useMemo(
		() => (!trimmedId ? "Missing entity id" : null),
		[trimmedId],
	);

	const entityQuery = useQuery({
		queryKey: ["wikidata-entity", trimmedId, language] as const,
		enabled: Boolean(trimmedId),
		queryFn: async ({ queryKey, signal }) => {
			const [, entityId, languageCode] = queryKey;
			const entities = await fetchWikidataEntities<WikidataEntity>(
				[entityId],
				{
					props: "labels|descriptions|claims",
					errorMessage: "Failed to load entity",
					language: languageCode,
					signal,
				},
			);
			const entity = entities[entityId];

			if (!entity) {
				throw new Error("Entity not found");
			}

			const label = pickLocalizedValue(entity.labels, languageCode);
			const description = pickLocalizedValue(
				entity.descriptions,
				languageCode,
			);
			return {
				label,
				description,
				claims: entity.claims ?? {},
			};
		},
	});

	const claims = entityQuery.data?.claims ?? EMPTY_CLAIMS;
	const labelIds = useMemo(() => collectClaimEntityIds(claims), [claims]);
	const labelsQueryKey = useMemo(
		() => ["wikidata-labels", labelIds, language] as const,
		[labelIds, language],
	);

	const labelsQuery = useQuery<
		{ labelMap: LabelMap; descriptionMap: DescriptionMap },
		Error,
		{ labelMap: LabelMap; descriptionMap: DescriptionMap },
		typeof labelsQueryKey
	>({
		queryKey: labelsQueryKey,
		enabled: Boolean(labelIds.length),
		queryFn: async ({ queryKey, signal }) => {
			const [, ids, languageCode] = queryKey;
			if (!ids.length) return { labelMap: {}, descriptionMap: {} };

			await loadEntityMeta(ids, languageCode, "Failed to load labels", signal);

			const labelMap: LabelMap = {};
			const descriptionMap: DescriptionMap = {};
			for (const entityId of ids) {
				const cached = getCachedEntityMeta(languageCode, entityId);
				if (cached?.label) labelMap[entityId] = cached.label;
				if (cached?.description) {
					descriptionMap[entityId] = cached.description;
				}
			}

			return { labelMap, descriptionMap };
		},
	});

	const labelMap = labelsQuery.data?.labelMap ?? EMPTY_LABEL_MAP;
	const descriptionMap =
		labelsQuery.data?.descriptionMap ?? EMPTY_DESCRIPTION_MAP;
	const isLabelMapLoading = labelIds.length
		? labelsQuery.isPending || labelsQuery.isFetching
		: false;
	const loadingLabelIds = isLabelMapLoading
		? labelIds.filter(
				(labelId) => getCachedEntityMeta(language, labelId) === undefined,
			)
		: [];
	const properties = useMemo(
		() => formatEntityProperties(claims, labelMap, descriptionMap),
		[claims, labelMap, descriptionMap],
	);

	const label = entityQuery.data?.label ?? null;
	const description = entityQuery.data?.description ?? null;
	const isLoading = trimmedId
		? entityQuery.isPending || entityQuery.isFetching
		: false;
	const isPropertiesLoading = trimmedId ? isLoading : false;
	const isLabelMissing = !isLoading && label === null;
	const isDescriptionMissing = !isLoading && description === null;
	const error =
		missingIdMessage ??
		(entityQuery.error instanceof Error
			? entityQuery.error.message
			: entityQuery.error
				? "Unknown error"
				: null);

	return {
		label,
		description,
		properties,
		isLoading,
		isPropertiesLoading,
		loadingLabelIds,
		error,
		isLabelMissing,
		isDescriptionMissing,
	};
}
