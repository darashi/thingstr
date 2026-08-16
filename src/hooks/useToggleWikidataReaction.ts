import { EventFactory } from "applesauce-factory";
import { useCallback, useState } from "react";
import { useNip07Auth } from "./useNip07Auth";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";
import { THINGSTR_RELAYS } from "../config/relays";
import { withWikidataPrefix } from "../lib/wikidata/ids";

type Nip07EventTemplate = {
	kind: number;
	content: string;
	tags: string[][];
	created_at?: number;
};

interface UseToggleWikidataReactionOptions {
	entityId: string;
	lastReactionEventId: string | null;
}

export function useToggleWikidataReaction({
	entityId,
	lastReactionEventId,
}: UseToggleWikidataReactionOptions) {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();
	const { pubkey } = useNip07Auth();
	const [isSaving, setIsSaving] = useState(false);

	const createAndPublishEvent = useCallback(
		async (template: Nip07EventTemplate, publishErrorMessage: string) => {
			if (!window.nostr?.getPublicKey || !window.nostr?.signEvent) {
				window.alert("NIP-07 signer not found.");
				return null;
			}

			const factory = new EventFactory();
			factory.setSigner({
				getPublicKey: () => window.nostr!.getPublicKey!(),
				signEvent: (eventTemplate: Nip07EventTemplate) =>
					window.nostr!.signEvent!(eventTemplate),
			} as never);

			const draft = await factory.build(template);
			const signed = await factory.sign(draft);
			eventStore.add(signed);
			try {
				if (THINGSTR_RELAYS.length) {
					await relayPool.publish(THINGSTR_RELAYS, signed);
				}
			} catch (error) {
				console.error(publishErrorMessage, error);
			}
			return signed;
		},
		[eventStore, relayPool],
	);

	const toggle = useCallback(
		async (isStarred: boolean) => {
			if (!pubkey) return;
			if (isSaving) return;

			let eventTemplate: Nip07EventTemplate;
			let publishErrorMessage: string;
			if (isStarred) {
				if (!lastReactionEventId) return;
				eventTemplate = {
					kind: 5,
					content: "",
					tags: [["e", lastReactionEventId]],
				};
				publishErrorMessage = "Failed to publish deletion";
			} else {
				eventTemplate = {
					kind: 17,
					content: "+",
					tags: [
						["k", "wikidata"],
						["i", withWikidataPrefix(entityId)],
					],
				};
				publishErrorMessage = "Failed to publish reaction";
			}

			setIsSaving(true);
			try {
				await createAndPublishEvent(eventTemplate, publishErrorMessage);
			} catch (error) {
				console.error("Failed to toggle reaction", error);
				window.alert("Failed to toggle reaction.");
			} finally {
				setIsSaving(false);
			}
		},
		[
			createAndPublishEvent,
			entityId,
			isSaving,
			lastReactionEventId,
			pubkey,
		],
	);

	return { toggle, isSaving };
}
