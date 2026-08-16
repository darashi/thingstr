import { parseEmojiReaction } from "./reactions";

type ShortcodesDataset = Record<string, string | string[]>;

export type EmojiShortcode = {
	emoji: string;
	shortcode: string;
};

let catalogPromise: Promise<EmojiShortcode[]> | null = null;

function emojiFromHexcode(hexcode: string): string | null {
	const codePoints = hexcode.split("-").map((part) => Number.parseInt(part, 16));
	if (codePoints.some((codePoint) => !Number.isFinite(codePoint))) return null;

	try {
		return String.fromCodePoint(...codePoints);
	} catch {
		return null;
	}
}

export function buildEmojiShortcodeCatalog(
	dataset: ShortcodesDataset,
): EmojiShortcode[] {
	return Object.entries(dataset).flatMap(([hexcode, shortcodeValue]) => {
		const emoji = emojiFromHexcode(hexcode);
		if (!emoji || !parseEmojiReaction(emoji)) return [];
		const shortcodes = Array.isArray(shortcodeValue)
			? shortcodeValue
			: [shortcodeValue];
		return shortcodes.map((shortcode) => ({ emoji, shortcode }));
	});
}

function normalizeShortcodeQuery(query: string): string {
	return query
		.trim()
		.toLocaleLowerCase()
		.replace(/^:+|:+$/g, "")
		.replace(/[\s-]+/g, "_");
}

function matchScore(shortcode: string, query: string): number | null {
	if (shortcode === query) return 0;
	if (shortcode.startsWith(query)) return 1;
	if (shortcode.split("_").some((part) => part.startsWith(query))) return 2;
	if (shortcode.includes(query)) return 3;
	return null;
}

export function searchEmojiShortcodes(
	catalog: EmojiShortcode[],
	query: string,
	limit = 12,
): EmojiShortcode[] {
	const normalizedQuery = normalizeShortcodeQuery(query);
	if (!normalizedQuery || limit <= 0) return [];

	const matches = catalog
		.map((entry) => ({
			entry,
			score: matchScore(entry.shortcode, normalizedQuery),
		}))
		.filter(
			(match): match is { entry: EmojiShortcode; score: number } =>
				match.score !== null,
		)
		.sort(
			(left, right) =>
				left.score - right.score ||
				left.entry.shortcode.length - right.entry.shortcode.length ||
				left.entry.shortcode.localeCompare(right.entry.shortcode),
		);

	const seenEmoji = new Set<string>();
	const results: EmojiShortcode[] = [];
	for (const { entry } of matches) {
		if (seenEmoji.has(entry.emoji)) continue;
		seenEmoji.add(entry.emoji);
		results.push(entry);
		if (results.length === limit) break;
	}
	return results;
}

export function loadEmojiShortcodeCatalog(): Promise<EmojiShortcode[]> {
	if (!catalogPromise) {
		catalogPromise = import("emojibase-data/en/shortcodes/emojibase.json")
			.then((module) => buildEmojiShortcodeCatalog(module.default))
			.catch((error: unknown) => {
				catalogPromise = null;
				throw error;
			});
	}
	return catalogPromise;
}
