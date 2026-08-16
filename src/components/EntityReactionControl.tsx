import { useMemo } from "react";
import { useToggleWikidataReaction } from "../hooks/useToggleWikidataReaction";
import { isLikeReaction } from "../lib/reactions";
import EmojiReactionPicker from "./EmojiReactionPicker";

interface EntityReactionControlProps {
	entityId: string;
}

export default function EntityReactionControl({
	entityId,
}: EntityReactionControlProps) {
	const {
		isLoggedIn,
		isSaving,
		hasReaction,
		ownReactionContents,
		toggle,
	} = useToggleWikidataReaction(entityId);
	const ownEmojiReactionContents = useMemo(
		() => ownReactionContents.filter((content) => !isLikeReaction(content)),
		[ownReactionContents],
	);
	const handleToggle = async (content: string) => {
		try {
			await toggle(content);
		} catch (error) {
			console.error("Failed to save Wikidata reaction", error);
			window.alert(
				"Failed to save the reaction. Check your Nostr signer and relay connection.",
			);
			throw error;
		}
	};

	return (
		<EmojiReactionPicker
			isLoggedIn={isLoggedIn}
			isSaving={isSaving}
			ownEmojiReactionContents={ownEmojiReactionContents}
			hasReaction={hasReaction}
			onToggle={handleToggle}
		/>
	);
}
