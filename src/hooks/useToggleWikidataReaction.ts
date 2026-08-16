import { useCallback, useState } from "react";
import { THINGSTR_RELAYS } from "../config/relays";
import { signEventWithNip07 } from "../lib/nip07";
import {
	buildReactionDeletionTemplate,
	buildWikidataReactionTemplate,
} from "../lib/reactionEvents";
import { ingestRelayEvent } from "../lib/reactionEventStore";
import { normalizeReactionContent } from "../lib/reactions";
import { useEventStore } from "./useEventStore";
import { useNip07Auth } from "./useNip07Auth";
import { useRelayPool } from "./useRelayPool";
import { useWikidataReactions } from "./useWikidataReactions";

export function useToggleWikidataReaction(entityId: string) {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();
	const { pubkey } = useNip07Auth();
	const { hasReaction, reactionContents, getReactionEventIds } =
		useWikidataReactions(entityId);
	const [savingContent, setSavingContent] = useState<string | null>(null);
	const isSaving = savingContent !== null;

	const toggle = useCallback(
		async (content = "+") => {
			if (!pubkey) throw new Error("Nostr login is required");
			if (!THINGSTR_RELAYS.length) {
				throw new Error("No reaction relay is configured");
			}
			if (isSaving) return;

			const normalizedContent = normalizeReactionContent(content);
			const reactionEventIds = getReactionEventIds(normalizedContent);
			const isRemoving = reactionEventIds.length > 0;
			const eventTemplate = isRemoving
				? buildReactionDeletionTemplate(reactionEventIds)
				: buildWikidataReactionTemplate(entityId, normalizedContent);

			setSavingContent(normalizedContent);
			try {
				const event = await signEventWithNip07(eventTemplate, pubkey);
				const responses = await relayPool.publish(THINGSTR_RELAYS, event, {
					timeout: 15_000,
				});
				if (!responses.some((response) => response.ok)) {
					const message = responses
						.map((response) => response.message)
						.find(Boolean);
					throw new Error(message ?? "All reaction relays rejected the event");
				}
				ingestRelayEvent(eventStore, event);
			} finally {
				setSavingContent(null);
			}
		},
		[
			entityId,
			eventStore,
			getReactionEventIds,
			isSaving,
			pubkey,
			relayPool,
		],
	);

	return {
		isLoggedIn: Boolean(pubkey),
		isSaving,
		hasReaction,
		ownReactionContents: reactionContents,
		toggle,
	};
}
