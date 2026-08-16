const WIKIDATA_ENDPOINT = "https://www.wikidata.org/w/api.php";
const DEFAULT_CHUNK_SIZE = 50;

interface WikidataEntitiesResponse<T> {
	entities?: Record<string, T>;
}

interface FetchWikidataEntitiesOptions {
	props: string;
	errorMessage: string;
	language?: string;
	signal?: AbortSignal;
}

export interface LocalizedValue {
	value: string;
}

export type LocalizedValues = Record<string, LocalizedValue>;

export function normalizeEntityId(id: string): string {
	return id.trim();
}

export function normalizeEntityIds(ids: readonly string[]): string[] {
	return Array.from(new Set(ids.map(normalizeEntityId).filter(Boolean))).sort();
}

export function pickLocalizedValue(
	values: LocalizedValues | undefined,
	languageCode: string,
): string | null {
	if (!values) return null;

	return (
		values[languageCode]?.value ??
		values.en?.value ??
		Object.values(values)[0]?.value ??
		null
	);
}

export async function fetchWikidata<T>(
	action: string,
	params: Record<string, string>,
	errorMessage: string,
	signal?: AbortSignal,
): Promise<T> {
	const searchParams = new URLSearchParams({
		action,
		format: "json",
		origin: "*",
		...params,
	});
	const response = await fetch(
		`${WIKIDATA_ENDPOINT}?${searchParams.toString()}`,
		{ signal },
	);

	if (!response.ok) {
		throw new Error(errorMessage);
	}

	return (await response.json()) as T;
}

export async function fetchWikidataEntities<T>(
	ids: readonly string[],
	options: FetchWikidataEntitiesOptions,
): Promise<Record<string, T>> {
	if (!ids.length) return {};

	const { props, errorMessage, language, signal } = options;
	const results: Record<string, T> = {};

	for (const chunk of chunkIds(ids)) {
		const params: Record<string, string> = { ids: chunk.join("|") };
		if (language !== undefined) {
			params.languages = buildLanguagesParam(language);
			params.languagefallback = "1";
		}
		params.props = props;

		const data = await fetchWikidata<WikidataEntitiesResponse<T>>(
			"wbgetentities",
			params,
			errorMessage,
			signal,
		);
		Object.assign(results, data.entities ?? {});
	}

	return results;
}

function buildLanguagesParam(languageCode: string): string {
	return languageCode === "en" ? "en" : `${languageCode}|en`;
}

function chunkIds(
	ids: readonly string[],
	chunkSize = DEFAULT_CHUNK_SIZE,
): string[][] {
	const chunks: string[][] = [];
	for (let i = 0; i < ids.length; i += chunkSize) {
		chunks.push(ids.slice(i, i + chunkSize));
	}
	return chunks;
}
