import { useMemo } from "react";
import {
	type WikidataReactionItem,
	useWikidataReactionsTimeline,
} from "./useWikidataReactionsTimeline";

export function useUserWikidataReactions(
	pubkey: string | null | undefined,
): WikidataReactionItem[] {
	const reactions = useWikidataReactionsTimeline();

	return useMemo(() => {
		if (!pubkey) return [];
		return reactions.filter((item) => item.pubkey === pubkey);
	}, [pubkey, reactions]);
}
