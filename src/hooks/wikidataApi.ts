const ENDPOINT = "https://www.wikidata.org/w/api.php";
const DEFAULT_CHUNK_SIZE = 50;

interface WikidataEntitiesResponse<T> {
	entities?: Record<string, T>;
}

export function pickLocalizedValue(
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

export function normalizeEntityIds(ids: string[]): string[] {
	return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).sort();
}

export function buildLanguagesParam(languageCode: string) {
	return languageCode === "en" ? "en" : `${languageCode}|en`;
}

export async function fetchWikidataEntities<T>(
	ids: string[],
	languageCode: string,
	props: string,
	errorMessage: string,
	signal?: AbortSignal,
): Promise<Record<string, T>> {
	if (!ids.length) return {};

	const languagesParam = buildLanguagesParam(languageCode);
	const results: Record<string, T> = {};

	for (const chunk of chunkIds(ids)) {
		const params = new URLSearchParams({
			action: "wbgetentities",
			format: "json",
			ids: chunk.join("|"),
			origin: "*",
			languages: languagesParam,
			languagefallback: "1",
			props,
		});

		const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
			signal,
		});

		if (!response.ok) {
			throw new Error(errorMessage);
		}

		const data = (await response.json()) as WikidataEntitiesResponse<T>;
		Object.assign(results, data.entities ?? {});
	}

	return results;
}

export function chunkIds(ids: string[], chunkSize = DEFAULT_CHUNK_SIZE) {
	const chunks: string[][] = [];
	for (let i = 0; i < ids.length; i += chunkSize) {
		chunks.push(ids.slice(i, i + chunkSize));
	}
	return chunks;
}

export const WIKIDATA_ENDPOINT = ENDPOINT;
