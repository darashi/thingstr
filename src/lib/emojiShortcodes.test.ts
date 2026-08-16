import { describe, expect, it } from "vitest";
import {
	buildEmojiShortcodeCatalog,
	searchEmojiShortcodes,
} from "./emojiShortcodes";

const catalog = buildEmojiShortcodeCatalog({
	"1F525": ["fire", "flame"],
	"1F44D": ["+1", "thumbsup", "thumbs_up"],
	"2764-FE0F": "heart",
});

describe("buildEmojiShortcodeCatalog", () => {
	it("converts hexcodes and aliases into searchable entries", () => {
		expect(catalog).toContainEqual({ emoji: "🔥", shortcode: "fire" });
		expect(catalog).toContainEqual({ emoji: "👍", shortcode: "thumbs_up" });
	});
});

describe("searchEmojiShortcodes", () => {
	it("accepts a shortcode surrounded by colons", () => {
		expect(searchEmojiShortcodes(catalog, ":fire:", 1)).toEqual([
			{ emoji: "🔥", shortcode: "fire" },
		]);
	});

	it("searches shortcode words and removes duplicate emoji", () => {
		expect(searchEmojiShortcodes(catalog, "thumb", 10)).toEqual([
			{ emoji: "👍", shortcode: "thumbsup" },
		]);
	});

	it("returns no results for an empty query", () => {
		expect(searchEmojiShortcodes(catalog, "::", 10)).toEqual([]);
	});
});
