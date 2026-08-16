import { describe, expect, it } from "vitest";
import {
	addRecentEmojiReaction,
	parseRecentEmojiReactions,
} from "./recentEmojiReactions";

describe("parseRecentEmojiReactions", () => {
	it("keeps unique valid emoji", () => {
		expect(
			parseRecentEmojiReactions(JSON.stringify(["🔥", "hello", "🔥", "🥹"])),
		).toEqual(["🔥", "🥹"]);
	});

	it("ignores malformed storage", () => {
		expect(parseRecentEmojiReactions("{")).toEqual([]);
	});
});

describe("addRecentEmojiReaction", () => {
	it("moves a reused emoji to the front", () => {
		expect(addRecentEmojiReaction(["🔥", "🥹", "👍"], "🥹")).toEqual([
			"🥹",
			"🔥",
			"👍",
		]);
	});

	it("keeps at most eight emoji", () => {
		const recent = ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂"];
		expect(addRecentEmojiReaction(recent, "🙂")).toEqual([
			"🙂",
			...recent.slice(0, 7),
		]);
	});
});
