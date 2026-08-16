const EMOJI_PATTERN =
	/(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}|\u20e3)/u;
const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, {
	granularity: "grapheme",
});

export function normalizeReactionContent(content: string): string {
	const normalized = content.trim().normalize("NFC");
	return normalized || "+";
}

export function parseEmojiReaction(input: string): string | null {
	const normalized = input.trim().normalize("NFC");
	if (!normalized) return null;

	const graphemes = [...GRAPHEME_SEGMENTER.segment(normalized)];
	if (graphemes.length !== 1 || !EMOJI_PATTERN.test(normalized)) return null;
	return normalized;
}

export function isLikeReaction(content: string): boolean {
	return normalizeReactionContent(content) === "+";
}

export function reactionSymbol(content: string): string {
	const normalized = normalizeReactionContent(content);
	if (normalized === "+") return "★";
	if (normalized === "-") return "👎";
	return parseEmojiReaction(normalized) ?? "❔";
}
