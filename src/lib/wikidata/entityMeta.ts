import {
	fetchWikidataEntities,
	pickLocalizedValue,
	type LocalizedValues,
} from "./api";

export interface EntityMeta {
	label: string | null;
	description: string | null;
}

interface WikidataEntityMeta {
	labels?: LocalizedValues;
	descriptions?: LocalizedValues;
}

type EntityMetaCache = Record<string, EntityMeta | undefined>;

const entityMetaCacheByLanguage: Record<string, EntityMetaCache> = {};

export function getCachedEntityMeta(
	language: string,
	entityId: string,
): EntityMeta | undefined {
	return getEntityMetaCache(language)[entityId];
}

export async function loadEntityMeta(
	entityIds: readonly string[],
	language: string,
	errorMessage: string,
	signal?: AbortSignal,
): Promise<void> {
	const cache = getEntityMetaCache(language);
	const unknownIds = entityIds.filter((id) => cache[id] === undefined);
	if (!unknownIds.length) return;

	const entities = await fetchWikidataEntities<WikidataEntityMeta>(unknownIds, {
		props: "labels|descriptions",
		errorMessage,
		language,
		signal,
	});

	for (const [entityId, entity] of Object.entries(entities)) {
		cache[entityId] = {
			label: pickLocalizedValue(entity.labels, language),
			description: pickLocalizedValue(entity.descriptions, language),
		};
	}

	for (const entityId of unknownIds) {
		cache[entityId] ??= { label: null, description: null };
	}
}

function getEntityMetaCache(language: string): EntityMetaCache {
	entityMetaCacheByLanguage[language] ??= {};
	return entityMetaCacheByLanguage[language];
}
