import { finalizeEvent } from "nostr-tools/pure";
import { describe, expect, it } from "vitest";
import { buildWikidataReactionsValue } from "./buildWikidataReactionsValue";

const OWNER_SECRET = new Uint8Array(32).fill(1);
const ATTACKER_SECRET = new Uint8Array(32).fill(2);

function reaction(tags: string[][] = [["i", "wd:Q42"]]) {
	return finalizeEvent(
		{
			kind: 17,
			created_at: 1,
			content: "🔥",
			tags: [["k", "wikidata"], ...tags],
		},
		OWNER_SECRET,
	);
}

function deletion(targetId: string, secret = OWNER_SECRET) {
	return finalizeEvent(
		{
			kind: 5,
			created_at: 2,
			content: "",
			tags: [["e", targetId]],
		},
		secret,
	);
}

describe("buildWikidataReactionsValue", () => {
	it("hides only reactions deleted by their author in either arrival order", () => {
		const event = reaction();
		const ownerDeletion = deletion(event.id);
		const attackerDeletion = deletion(event.id, ATTACKER_SECRET);

		expect(
			buildWikidataReactionsValue([event], [attackerDeletion]).timeline,
		).toHaveLength(1);
		expect(
			buildWikidataReactionsValue([event], [ownerDeletion]).timeline,
		).toHaveLength(0);
		expect(
			buildWikidataReactionsValue([], [ownerDeletion]).timeline,
		).toHaveLength(0);
		expect(
			buildWikidataReactionsValue([event], [ownerDeletion]).timeline,
		).toHaveLength(0);
	});

	it("selects a valid Wikidata i tag and ignores unrelated identifiers", () => {
		const mixed = reaction([
			["i", "https://example.com"],
			["i", "wd:Q42"],
		]);
		const invalid = reaction([["i", "https://example.com"]]);

		expect(buildWikidataReactionsValue([mixed], []).timeline[0]?.entityId).toBe(
			"Q42",
		);
		expect(buildWikidataReactionsValue([invalid], []).timeline).toEqual([]);
	});
});
