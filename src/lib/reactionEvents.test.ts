import { describe, expect, it } from "vitest";
import {
	buildReactionDeletionTemplate,
	buildWikidataReactionTemplate,
} from "./reactionEvents";

describe("Wikidata reaction event templates", () => {
	it("builds a NIP-25 external content reaction", () => {
		expect(buildWikidataReactionTemplate("Q42", "+", 123)).toEqual({
			kind: 17,
			created_at: 123,
			content: "+",
			tags: [
				["k", "wikidata"],
				["i", "wd:Q42"],
			],
		});
	});

	it("preserves an emoji reaction in the event content", () => {
		expect(buildWikidataReactionTemplate("Q42", "🔥", 123).content).toBe(
			"🔥",
		);
	});

	it("builds one NIP-09 deletion request for all duplicate reactions", () => {
		expect(
			buildReactionDeletionTemplate(["event-1", "event-1", "event-2"], 456),
		).toEqual({
			kind: 5,
			created_at: 456,
			content: "",
			tags: [
				["e", "event-1"],
				["e", "event-2"],
				["k", "17"],
			],
		});
	});

	it("rejects empty reaction targets", () => {
		expect(() => buildWikidataReactionTemplate("", "+", 1)).toThrow();
		expect(() => buildReactionDeletionTemplate([], 1)).toThrow();
	});
});
