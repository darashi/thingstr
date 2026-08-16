import { finalizeEvent, getPublicKey, type EventTemplate } from "nostr-tools/pure";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signEventWithNip07 } from "./nip07";

const OWNER_SECRET = new Uint8Array(32).fill(1);
const OTHER_SECRET = new Uint8Array(32).fill(2);
const OWNER = getPublicKey(OWNER_SECRET);
const OTHER = getPublicKey(OTHER_SECRET);
const TEMPLATE: EventTemplate = {
	kind: 17,
	created_at: 1,
	content: "+",
	tags: [
		["k", "wikidata"],
		["i", "wd:Q42"],
	],
};

afterEach(() => vi.unstubAllGlobals());

describe("signEventWithNip07", () => {
	it("accepts a valid event signed by the logged-in account", async () => {
		vi.stubGlobal("window", {
			nostr: {
				getPublicKey: async () => OWNER,
				signEvent: async (template: EventTemplate) =>
					finalizeEvent(template, OWNER_SECRET),
			},
		});

		const event = await signEventWithNip07(TEMPLATE, OWNER);
		expect(event.pubkey).toBe(OWNER);
		expect(event.content).toBe("+");
	});

	it("rejects a signer using a different account", async () => {
		const signEvent = vi.fn(async (template: EventTemplate) =>
			finalizeEvent(template, OTHER_SECRET),
		);
		vi.stubGlobal("window", {
			nostr: {
				getPublicKey: async () => OTHER,
				signEvent,
			},
		});

		await expect(signEventWithNip07(TEMPLATE, OWNER)).rejects.toThrow(
			"does not match",
		);
		expect(signEvent).not.toHaveBeenCalled();
	});

	it("rejects a signer that changes the event template", async () => {
		vi.stubGlobal("window", {
			nostr: {
				getPublicKey: async () => OWNER,
				signEvent: async (template: EventTemplate) =>
					finalizeEvent({ ...template, content: "-" }, OWNER_SECRET),
			},
		});

		await expect(signEventWithNip07(TEMPLATE, OWNER)).rejects.toThrow(
			"changed the event template",
		);
	});
});
