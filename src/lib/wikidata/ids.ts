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
