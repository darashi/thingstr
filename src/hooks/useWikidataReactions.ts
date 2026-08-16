import { useCallback, useContext, useMemo } from "react";
import { normalizePubkey } from "../lib/nostr";
import { normalizeReactionContent } from "../lib/reactions";
import { WikidataReactionsContext } from "../providers/wikidataReactionsContext";
import type { WikidataReaction } from "../providers/wikidataReactionsContext";
import { useNip07Auth } from "./useNip07Auth";

const EMPTY_REACTIONS: WikidataReaction[] = [];

interface UseWikidataReactionsResult {
	hasReaction: (content: string) => boolean;
	reactionContents: string[];
	getReactionEventIds: (content: string) => string[];
}

type UseWikidataReactionsOptions = {
	pubkey?: string | null;
};

export function useWikidataReactions(
	entityId: string,
	{ pubkey: targetPubkey }: UseWikidataReactionsOptions = {},
): UseWikidataReactionsResult {
	const value = useContext(WikidataReactionsContext);
	if (!value) {
		throw new Error(
			"WikidataReactionsProvider is missing in the component tree.",
		);
	}
	const { pubkey } = useNip07Auth();
	const pubkeyToTrack = normalizePubkey(targetPubkey ?? pubkey ?? "");
	const reactions = value.byEntityId.get(entityId) ?? EMPTY_REACTIONS;

	const eventIdsByContent = useMemo(() => {
		const byContent = new Map<string, string[]>();
		if (!pubkeyToTrack) return byContent;

		for (const reaction of reactions) {
			const reactionPubkey =
				normalizePubkey(reaction.pubkey) ?? reaction.pubkey;
			if (reactionPubkey !== pubkeyToTrack) continue;
			const content = normalizeReactionContent(reaction.content);
			const ids = byContent.get(content) ?? [];
			ids.push(reaction.event.id);
			byContent.set(content, ids);
		}
		return byContent;
	}, [pubkeyToTrack, reactions]);

	const hasReaction = useCallback(
		(content: string) =>
			eventIdsByContent.has(normalizeReactionContent(content)),
		[eventIdsByContent],
	);
	const getReactionEventIds = useCallback(
		(content: string) => [
			...(eventIdsByContent.get(normalizeReactionContent(content)) ?? []),
		],
		[eventIdsByContent],
	);
	const reactionContents = useMemo(
		() => [...eventIdsByContent.keys()],
		[eventIdsByContent],
	);

	return { hasReaction, reactionContents, getReactionEventIds };
}
