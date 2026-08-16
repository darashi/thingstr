import type { NostrEvent } from "nostr-tools";
import {
	buildDeletionAuthorsByEventId,
	isEventDeleted,
} from "../lib/reactionEventStore";
import { normalizeReactionContent } from "../lib/reactions";
import { parseWikidataExternalId } from "../lib/wikidata/ids";
import type {
	WikidataReaction,
	WikidataReactionsValue,
} from "./wikidataReactionsContext";

function reactionFromEvent(event: NostrEvent): WikidataReaction | null {
	const entityId = event.tags
		.filter(
			(tag): tag is [string, string, ...string[]] =>
				tag[0] === "i" && typeof tag[1] === "string",
		)
		.map(([, value]) => parseWikidataExternalId(value))
		.find((value): value is string => value !== null);
	if (!entityId) return null;
	return {
		event,
		entityId,
		pubkey: event.pubkey,
		content: normalizeReactionContent(event.content),
	};
}

export function buildWikidataReactionsValue(
	reactions: NostrEvent[],
	deletions: NostrEvent[],
): WikidataReactionsValue {
	const deletionAuthorsByEventId = buildDeletionAuthorsByEventId(deletions);
	const timeline = reactions
		.filter((event) => !isEventDeleted(event, deletionAuthorsByEventId))
		.map(reactionFromEvent)
		.filter((reaction): reaction is WikidataReaction => reaction !== null)
		.sort(
			(left, right) =>
				right.event.created_at - left.event.created_at ||
				left.event.id.localeCompare(right.event.id),
		);
	const byEntityId = new Map<string, WikidataReaction[]>();
	for (const reaction of timeline) {
		const entityReactions = byEntityId.get(reaction.entityId) ?? [];
		entityReactions.push(reaction);
		byEntityId.set(reaction.entityId, entityReactions);
	}
	return { timeline, byEntityId };
}
