import { EventFactory } from "applesauce-factory";
import { useCallback, useState } from "react";
import { useNip07Auth } from "./useNip07Auth";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";
import { THINGSTR_RELAYS } from "../config/relays";

type StarEventTemplate = {
	kind: number;
	content: string;
	tags: string[][];
	created_at?: number;
};

interface UseToggleWikidataReactionOptions {
	entityId: string;
	lastReactionEventId: string | null;
	instanceOfIds?: string[];
	onStar?: (eventId: string | null, pubkey: string | null) => void;
	onUnstar?: () => void;
}

export function useToggleWikidataReaction({
	entityId,
	lastReactionEventId,
	instanceOfIds,
	onStar,
	onUnstar,
}: UseToggleWikidataReactionOptions) {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();
	const { session } = useNip07Auth();
	const [isSaving, setIsSaving] = useState(false);

	const createReactionEvent = useCallback(async () => {
		if (!session?.pubkey) {
			return null;
		}

		if (!window.nostr?.getPublicKey || !window.nostr?.signEvent) {
			window.alert("NIP-07 signer not found.");
			return null;
		}

		const factory = new EventFactory();
		factory.setSigner({
			getPublicKey: () => window.nostr!.getPublicKey!(),
			signEvent: (template: StarEventTemplate) => window.nostr!.signEvent!(template),
		} as never);

		const uniqueInstanceOfIds = Array.from(
			new Set(
				(instanceOfIds ?? [])
					.map((id) => id.trim())
					.filter((id) => id.length > 0),
			),
		);

		const classificationTags: string[][] =
			uniqueInstanceOfIds.length > 0
				? [
						["L", "wikidata:P31"],
						...uniqueInstanceOfIds.map((id) => ["l", `wdt:P31 wd:${id}`]),
				  ]
				: [];

		const draft = await factory.build({
			kind: 17,
			content: "+",
			tags: [
				["k", "wikidata"],
				["i", `wd:${entityId}`],
				...classificationTags,
			],
		});

		const signed = await factory.sign(draft);
		eventStore.add(signed);
		try {
			if (THINGSTR_RELAYS.length) {
				await relayPool.publish(THINGSTR_RELAYS, signed);
			}
		} catch (error) {
			console.error("Failed to publish reaction", error);
		}
		onStar?.(signed.id ?? null, signed.pubkey ?? null);
		return signed;
	}, [entityId, eventStore, instanceOfIds, onStar, relayPool, session?.pubkey]);

	const createDeleteEvent = useCallback(async () => {
		if (!session?.pubkey) {
			return null;
		}

		if (!window.nostr?.getPublicKey || !window.nostr?.signEvent) {
			window.alert("NIP-07 signer not found.");
			return null;
		}

		if (!lastReactionEventId) return null;

		const factory = new EventFactory();
		factory.setSigner({
			getPublicKey: () => window.nostr!.getPublicKey!(),
			signEvent: (template: StarEventTemplate) => window.nostr!.signEvent!(template),
		} as never);

		const draft = await factory.build({
			kind: 5,
			content: "",
			tags: [["e", lastReactionEventId]],
		});

		const signed = await factory.sign(draft);
		eventStore.add(signed);
		try {
			if (THINGSTR_RELAYS.length) {
				await relayPool.publish(THINGSTR_RELAYS, signed);
			}
		} catch (error) {
			console.error("Failed to publish deletion", error);
		}
		onUnstar?.();
		return signed;
	}, [eventStore, lastReactionEventId, onUnstar, relayPool, session?.pubkey]);

	const toggle = useCallback(
		async (isStarred: boolean) => {
			if (!session?.pubkey) {
				return;
			}
			if (isSaving) return;
			setIsSaving(true);
			try {
				if (isStarred) {
					await createDeleteEvent();
				} else {
					await createReactionEvent();
				}
			} catch (error) {
				console.error("Failed to toggle reaction", error);
				window.alert("Failed to toggle reaction.");
			} finally {
				setIsSaving(false);
			}
		},
		[createDeleteEvent, createReactionEvent, isSaving, session?.pubkey],
	);

	return { toggle, isSaving };
}
