import { useContext } from "react";
import {
	WikidataReactionsContext,
	type WikidataReaction,
} from "../providers/wikidataReactionsContext";

export type WikidataReactionItem = WikidataReaction;

export function useWikidataReactionsTimeline(): WikidataReactionItem[] {
	const value = useContext(WikidataReactionsContext);
	if (!value) {
		throw new Error(
			"WikidataReactionsProvider is missing in the component tree.",
		);
	}
	return value.timeline;
}
