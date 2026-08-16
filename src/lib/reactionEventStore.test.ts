import type { EventStore } from "applesauce-core";
import { finalizeEvent, getPublicKey } from "nostr-tools/pure";
import { describe, expect, it, vi } from "vitest";
import {
	buildDeletionAuthorsByEventId,
	ingestRelayEvent,
	isEventDeleted,
} from "./reactionEventStore";

const OWNER_SECRET = new Uint8Array(32).fill(1);
const ATTACKER_SECRET = new Uint8Array(32).fill(2);
const OWNER = getPublicKey(OWNER_SECRET);

function deletion(secretKey: Uint8Array, targetId: string) {
	return finalizeEvent(
		{
			created_at: 1,
			tags: [["e", targetId]],
			content: "",
			kind: 5,
		},
		secretKey,
	);
}

describe("reaction deletion events", () => {
	it("only applies a deletion requested by the reaction author", () => {
		const reaction = finalizeEvent(
			{ created_at: 1, tags: [], content: "+", kind: 17 },
			OWNER_SECRET,
		);

		expect(
			isEventDeleted(
				reaction,
				buildDeletionAuthorsByEventId([
					deletion(ATTACKER_SECRET, reaction.id),
				]),
			),
		).toBe(false);
		expect(
			isEventDeleted(
				reaction,
				buildDeletionAuthorsByEventId([deletion(OWNER_SECRET, reaction.id)]),
			),
		).toBe(true);
	});

	it("keeps valid deletion requests out of the EventStore", () => {
		const add = vi.fn();
		const eventStore = { add } as unknown as EventStore;

		ingestRelayEvent(eventStore, deletion(OWNER_SECRET, "reaction"));
		expect(add).not.toHaveBeenCalled();
	});

	it("adds valid reaction events to the EventStore", () => {
		const add = vi.fn();
		const eventStore = { add } as unknown as EventStore;
		const reaction = finalizeEvent(
			{
				created_at: 1,
				tags: [["i", "wd:Q1"]],
				content: "+",
				kind: 17,
			},
			OWNER_SECRET,
		);

		ingestRelayEvent(eventStore, reaction);
		expect(add).toHaveBeenCalledWith(reaction);
	});

	it("rejects deletion requests with invalid signatures", () => {
		const add = vi.fn();
		const eventStore = { add } as unknown as EventStore;
		const signed = deletion(OWNER_SECRET, "reaction");
		const event = JSON.parse(JSON.stringify(signed)) as typeof signed;
		event.pubkey = OWNER;
		event.sig = "0".repeat(128);

		expect(ingestRelayEvent(eventStore, event)).toBeNull();
		expect(add).not.toHaveBeenCalled();
	});
});
