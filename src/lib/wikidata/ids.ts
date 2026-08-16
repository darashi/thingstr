export function withWikidataPrefix(id: string): string {
	const trimmed = id.trim();
	if (!trimmed) return "";
	const upper = trimmed.toUpperCase();
	if (upper.startsWith("P")) return `wdt:${trimmed}`;
	return `wd:${trimmed}`;
}

export function stripWikidataPrefix(value: string): string {
	if (!value) return "";
	if (value.startsWith("wdt:")) return value.slice(4);
	if (value.startsWith("wd:")) return value.slice(3);
	return value;
}

const WIKIDATA_EXTERNAL_ID_PATTERN = /^(?:wd:(Q\d+)|wdt:(P\d+))$/i;

export function parseWikidataExternalId(value: string): string | null {
	const match = WIKIDATA_EXTERNAL_ID_PATTERN.exec(value.trim());
	const entityId = match?.[1] ?? match?.[2];
	return entityId ? entityId.toUpperCase() : null;
}
