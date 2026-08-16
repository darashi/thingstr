import { describe, expect, it } from "vitest";
import { parseWikidataExternalId } from "./ids";

describe("parseWikidataExternalId", () => {
	it("accepts Wikidata entity and property external IDs", () => {
		expect(parseWikidataExternalId("wd:Q42")).toBe("Q42");
		expect(parseWikidataExternalId("wdt:P31")).toBe("P31");
		expect(parseWikidataExternalId(" wd:q42 ")).toBe("Q42");
	});

	it("rejects unrelated external identifiers", () => {
		expect(parseWikidataExternalId("https://example.com")).toBeNull();
		expect(parseWikidataExternalId("wd:item")).toBeNull();
		expect(parseWikidataExternalId("Q42")).toBeNull();
	});
});
