import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface WikidataEntity {
	labels?: Record<string, { value: string }>;
	descriptions?: Record<string, { value: string }>;
	claims?: Record<string, WikidataClaim[]>;
}

interface WikidataClaim {
	mainsnak: WikidataSnak;
	qualifiers?: Record<string, WikidataSnak[]>;
}

interface WikidataSnak {
	snaktype: string;
	datavalue?: {
		type: string;
		value: unknown;
	};
}

interface WikidataEntityResponse {
	entities: Record<string, WikidataEntity>;
}

interface UseWikidataEntityOptions {
	language?: string;
}

export interface EntityPropertyValue {
	type: "entity" | "url" | "text";
	id?: string;
	label: string | null;
	url?: string;
	description?: string | null;
	qualifiers?: EntityQualifier[];
}

export interface EntityProperty {
	propertyId: string;
	propertyLabel: string | null;
	propertyDescription?: string | null;
	values: EntityPropertyValue[];
}

export interface EntityQualifier {
	propertyId: string;
	propertyLabel: string | null;
	propertyDescription?: string | null;
	value: EntityPropertyValue;
}

export interface WikidataEntityResult {
	label: string | null;
	description: string | null;
	properties: EntityProperty[];
	instanceOfIds: string[];
	isLoading: boolean;
	isPropertiesLoading: boolean;
	error: string | null;
	isLabelMissing: boolean;
	isDescriptionMissing: boolean;
	isLabelMapLoading: boolean;
}

type LabelMap = Record<string, string>;
type DescriptionMap = Record<string, string>;
type EntityMeta = { label: string | null; description: string | null };
type EntityMetaCache = Record<string, EntityMeta | undefined>;

const ENDPOINT = "https://www.wikidata.org/w/api.php";
const EMPTY_CLAIMS: Record<string, WikidataClaim[]> = {};
const EMPTY_LABEL_MAP: LabelMap = {};
const EMPTY_DESCRIPTION_MAP: DescriptionMap = {};
const entityMetaCacheByLanguage: Record<string, EntityMetaCache> = {};

function getEntityMetaCache(language: string): EntityMetaCache {
	if (!entityMetaCacheByLanguage[language]) {
		entityMetaCacheByLanguage[language] = {};
	}
	return entityMetaCacheByLanguage[language];
}

export function useWikidataEntity(
	id: string,
	options: UseWikidataEntityOptions = {},
): WikidataEntityResult {
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
				languagefallback: "1",
				props: "labels|descriptions|claims",
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
				claims: entity.claims ?? {},
			};
		},
	});

	const claims = entityQuery.data?.claims ?? EMPTY_CLAIMS;

	const instanceOfIds = useMemo(() => {
		const statements = claims.P31 ?? [];
		const ids = new Set<string>();

		statements.forEach(({ mainsnak }) => {
			const { datavalue } = mainsnak;
			if (
				datavalue?.type === "wikibase-entityid" &&
				isWikibaseEntityValue(datavalue.value)
			) {
				ids.add(datavalue.value.id);
			}
		});

		return Array.from(ids);
	}, [claims]);

	const labelIds = useMemo(() => {
		const ids = new Set<string>(Object.keys(claims));

		const collectIdsFromSnak = (snak: WikidataSnak) => {
			const { datavalue } = snak;
			if (!datavalue) return;
			if (datavalue.type === "wikibase-entityid") {
				const value = datavalue.value;
				if (isWikibaseEntityValue(value)) {
					ids.add(value.id);
				}
			}
			if (datavalue.type === "quantity") {
				const value = datavalue.value;
				if (isQuantityValue(value)) {
					const unitId = extractEntityIdFromUrl(value.unit);
					if (unitId) {
						ids.add(unitId);
					}
				}
			}
		};

		Object.values(claims).forEach((statements) => {
			statements.forEach((statement) => {
				collectIdsFromSnak(statement.mainsnak);

				if (statement.qualifiers) {
					Object.entries(statement.qualifiers).forEach(
						([qualifierPropertyId, qualifierSnaks]) => {
							ids.add(qualifierPropertyId);
							qualifierSnaks.forEach((qualifierSnak) => {
								collectIdsFromSnak(qualifierSnak);
							});
						},
					);
				}
			});
		});

		return Array.from(ids).sort();
	}, [claims]);

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

			const languagesParam =
				languageCode === "en" ? "en" : `${languageCode}|en`;
			const metaCache = getEntityMetaCache(languageCode);

			const unknownIds = ids.filter((id) => metaCache[id] === undefined);

			const map: LabelMap = {};
			const descriptionMap: DescriptionMap = {};
			if (!unknownIds.length) {
				ids.forEach((id) => {
					const cached = metaCache[id];
					if (cached?.label) {
						map[id] = cached.label;
					}
					if (cached?.description) {
						descriptionMap[id] = cached.description;
					}
				});
				return { labelMap: map, descriptionMap };
			}

			const chunks: string[][] = [];
			for (let i = 0; i < unknownIds.length; i += 50) {
				chunks.push(unknownIds.slice(i, i + 50));
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
					throw new Error("Failed to load labels");
				}

				const data = (await response.json()) as WikidataEntityResponse;

				for (const [entityId, entity] of Object.entries(
					data.entities ?? {},
				)) {
					const label = pickLabel(entity.labels ?? {}, languageCode);
					const description = pickLabel(
						entity.descriptions ?? {},
						languageCode,
					);
					metaCache[entityId] = { label: label ?? null, description: description ?? null };
				}

				chunk.forEach((entityId) => {
					if (metaCache[entityId] === undefined) {
						metaCache[entityId] = { label: null, description: null };
					}
				});
			}

			ids.forEach((id) => {
				const cached = metaCache[id];
				if (cached?.label) {
					map[id] = cached.label;
				}
				if (cached?.description) {
					descriptionMap[id] = cached.description;
				}
			});

			return { labelMap: map, descriptionMap };
		},
	});

	const labelMap = labelsQuery.data?.labelMap ?? EMPTY_LABEL_MAP;
	const descriptionMap = labelsQuery.data?.descriptionMap ?? EMPTY_DESCRIPTION_MAP;
	const isLabelMapLoading =
		labelIds.length > 0
			? labelsQuery.isPending || labelsQuery.isFetching
			: false;

	const properties = useMemo(() => {
		return Object.entries(claims)
			.map(([propertyId, statements]) => {
				const values = statements
					.map((statement) => {
						const value = formatClaimValue(
							statement.mainsnak,
							labelMap,
							descriptionMap,
						);
						if (!value) {
							return null;
						}

						const qualifiers = formatQualifiers(
							statement.qualifiers,
							labelMap,
							descriptionMap,
						);

						return qualifiers.length
							? { ...value, qualifiers }
							: value;
					})
					.filter(Boolean) as EntityPropertyValue[];

				return {
					propertyId,
					propertyLabel: labelMap[propertyId] ?? null,
					propertyDescription: descriptionMap[propertyId] ?? null,
					values,
				};
			})
			.filter((property) => property.values.length > 0);
	}, [claims, labelMap, descriptionMap]);

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
		isLabelMapLoading,
		error,
		isLabelMissing,
		isDescriptionMissing,
		instanceOfIds,
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

function isQuantityValue(
	value: unknown,
): value is { amount?: string; unit?: string } {
	return Boolean(
		value &&
			typeof value === "object" &&
			"amount" in value &&
			"unit" in value,
	);
}

function isTimeValue(value: unknown): value is { time: string } {
	return Boolean(value && typeof value === "object" && "time" in value);
}

function isMonolingualTextValue(
	value: unknown,
): value is { text: string; language: string } {
	return Boolean(
		value &&
			typeof value === "object" &&
			"text" in value &&
			"language" in value,
	);
}

function extractEntityIdFromUrl(url?: string | null) {
	if (!url) return null;
	const match = url.match(/entity\/([PQ]\d+)/);
	return match?.[1] ?? null;
}

function formatTimeValue(raw: string) {
	if (!raw) return "";
	const cleaned = raw.startsWith("+") ? raw.slice(1) : raw;
	return cleaned.replace("T00:00:00Z", "");
}

function formatQualifiers(
	qualifiers: Record<string, WikidataSnak[]> | undefined,
	labelMap: LabelMap,
	descriptionMap: DescriptionMap,
) {
	const formatted: EntityQualifier[] = [];
	if (!qualifiers) return formatted;

	for (const [propertyId, snaks] of Object.entries(qualifiers)) {
		const propertyLabel = labelMap[propertyId] ?? null;
		const propertyDescription = descriptionMap[propertyId] ?? null;
		snaks.forEach((snak) => {
			const value = formatClaimValue(snak, labelMap, descriptionMap);
			if (value) {
				formatted.push({
					propertyId,
					propertyLabel,
					propertyDescription,
					value,
				});
			}
		});
	}

	return formatted;
}

function formatClaimValue(
	snak: WikidataSnak,
	labelMap: LabelMap,
	descriptionMap: DescriptionMap,
) {
	if (snak.snaktype !== "value" || !snak.datavalue) {
		return {
			type: "text",
			label: snak.snaktype === "somevalue" ? "Some value" : "No value",
		} satisfies EntityPropertyValue;
	}

	const { datavalue } = snak;
	if (datavalue.type === "wikibase-entityid") {
		const value = datavalue.value;
		if (isWikibaseEntityValue(value)) {
			const id = value.id;
			const description = descriptionMap[id] ?? null;
			return {
				type: "entity",
				id,
				label: labelMap[id] ?? null,
				description,
			} satisfies EntityPropertyValue;
		}
	}

	if (datavalue.type === "url" && typeof datavalue.value === "string") {
		const url = datavalue.value;
		return { type: "url", url, label: url } satisfies EntityPropertyValue;
	}

	if (datavalue.type === "time" && isTimeValue(datavalue.value)) {
		const value = datavalue.value.time;
		return {
			type: "text",
			label: formatTimeValue(value),
		} satisfies EntityPropertyValue;
	}

	if (datavalue.type === "quantity" && isQuantityValue(datavalue.value)) {
		const amount = datavalue.value.amount?.replace(/^\+/, "") ?? "";
		const unitId = extractEntityIdFromUrl(datavalue.value.unit);
		const unitLabel =
			unitId && labelMap[unitId]
				? labelMap[unitId]
				: unitId ?? (datavalue.value.unit === "1" ? "" : datavalue.value.unit);
		const label = unitLabel ? `${amount} ${unitLabel}`.trim() : amount;
		return {
			type: "text",
			label: label || amount || "—",
		} satisfies EntityPropertyValue;
	}

	if (
		datavalue.type === "monolingualtext" &&
		isMonolingualTextValue(datavalue.value)
	) {
		const { text, language } = datavalue.value;
		return {
			type: "text",
			label: `${text} (${language})`,
		} satisfies EntityPropertyValue;
	}

	if (typeof datavalue.value === "string") {
		return {
			type: "text",
			label: datavalue.value,
		} satisfies EntityPropertyValue;
	}

	if (datavalue.value !== undefined) {
		return {
			type: "text",
			label: JSON.stringify(datavalue.value),
		} satisfies EntityPropertyValue;
	}

	return null;
}
