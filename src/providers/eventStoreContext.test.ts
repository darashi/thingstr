import { finalizeEvent } from "nostr-tools/pure";
import { describe, expect, it } from "vitest";
import { AppEventStore } from "./eventStoreContext";

const OWNER_SECRET = new Uint8Array(32).fill(1);

describe("AppEventStore", () => {
	it("keeps deletion events out of the underlying EventStore", () => {
		const store = new AppEventStore();
		const reaction = finalizeEvent(
			{
				kind: 17,
				created_at: 1,
				tags: [["i", "wd:Q1"]],
				content: "+",
			},
			OWNER_SECRET,
		);
		const deletion = finalizeEvent(
			{
				kind: 5,
				created_at: 2,
				tags: [["e", reaction.id]],
				content: "",
			},
			OWNER_SECRET,
		);

		expect(store.add(reaction)).toBe(reaction);
		expect(store.add(deletion)).toBeNull();
		expect(store.hasEvent(reaction.id)).toBe(true);
	});

	it("rejects events with invalid signatures", () => {
		const store = new AppEventStore();
		const signed = finalizeEvent(
			{ kind: 17, created_at: 1, tags: [], content: "+" },
			OWNER_SECRET,
		);
		const event = JSON.parse(JSON.stringify(signed)) as typeof signed;
		event.sig = "0".repeat(128);
		expect(store.add(event)).toBeNull();
	});

	it("accepts a valid event after an invalid copy with the same ID", () => {
		const store = new AppEventStore();
		const valid = finalizeEvent(
			{ kind: 17, created_at: 1, tags: [], content: "+" },
			OWNER_SECRET,
		);
		const invalid = JSON.parse(JSON.stringify(valid)) as typeof valid;
		invalid.sig = "0".repeat(128);

		expect(store.add(invalid)).toBeNull();
		expect(store.add(valid)).toBe(valid);
		expect(store.hasEvent(valid.id)).toBe(true);
	});
});
