import { parseEmojiReaction } from "./reactions";

const STORAGE_KEY = "thingstr.recentEmojiReactions";
const MAX_RECENT_REACTIONS = 8;

export function parseRecentEmojiReactions(raw: string | null): string[] {
	if (!raw) return [];

	try {
		const value: unknown = JSON.parse(raw);
		if (!Array.isArray(value)) return [];

		const recent: string[] = [];
		for (const item of value) {
			if (typeof item !== "string") continue;
			const emoji = parseEmojiReaction(item);
			if (!emoji || recent.includes(emoji)) continue;
			recent.push(emoji);
			if (recent.length === MAX_RECENT_REACTIONS) break;
		}
		return recent;
	} catch {
		return [];
	}
}

export function addRecentEmojiReaction(
	recent: string[],
	content: string,
): string[] {
	const emoji = parseEmojiReaction(content);
	if (!emoji) return recent;
	return [emoji, ...recent.filter((item) => item !== emoji)].slice(
		0,
		MAX_RECENT_REACTIONS,
	);
}

export function readRecentEmojiReactions(): string[] {
	try {
		return parseRecentEmojiReactions(window.localStorage.getItem(STORAGE_KEY));
	} catch (error) {
		console.error("Failed to load recent emoji reactions", error);
		return [];
	}
}

export function rememberEmojiReaction(content: string): string[] {
	const recent = addRecentEmojiReaction(readRecentEmojiReactions(), content);
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
	} catch (error) {
		console.error("Failed to save recent emoji reactions", error);
	}
	return recent;
}
