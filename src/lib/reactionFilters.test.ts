import { describe, expect, it } from "vitest";
import {
	buildEntityReactionFilter,
	buildReactionDeletionFilter,
	buildThingstrReactionFilters,
} from "./reactionFilters";

describe("reaction filters", () => {
	it("builds an entity-scoped Wikidata reaction filter", () => {
		expect(buildEntityReactionFilter("Q1")).toEqual({
			kinds: [17],
			"#k": ["wikidata"],
			"#i": ["wd:Q1"],
			limit: 500,
		});
	});

	it("deduplicates deletion targets", () => {
		expect(
			buildReactionDeletionFilter(["event-1", "event-1", "event-2"]),
		).toEqual({
			kinds: [5],
			"#e": ["event-1", "event-2"],
		});
	});

	it("bounds initial reaction and deletion history", () => {
		expect(buildThingstrReactionFilters()).toEqual([
			{ kinds: [17], "#k": ["wikidata"], limit: 500 },
			{ kinds: [5], limit: 500 },
		]);
	});
});
