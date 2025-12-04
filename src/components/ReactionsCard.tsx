import { useMemo } from "react";
import { useWikidataReactions } from "../hooks/useWikidataReactions";
import { useToggleWikidataReaction } from "../hooks/useToggleWikidataReaction";
import { normalizePubkey } from "../lib/nostr";
import StarToggle from "./StarToggle";
import { useNip07Auth } from "../hooks/useNip07Auth";
import { useWikidataReactionsTimeline } from "../hooks/useWikidataReactionsTimeline";
import ReactionAvatarList from "./ReactionAvatarList";

interface ReactionsCardProps {
	entityId: string;
	instanceOfIds?: string[];
}

export default function ReactionsCard({
	entityId,
	instanceOfIds,
}: ReactionsCardProps) {
	const { session } = useNip07Auth();
	const { isStarred, lastReactionEventId } = useWikidataReactions(entityId);
	const { toggle, isSaving } = useToggleWikidataReaction({
		entityId,
		lastReactionEventId,
		instanceOfIds,
	});
	const reactions = useWikidataReactionsTimeline();
	const isLoggedIn = Boolean(session?.pubkey);
	const viewerPubkey = useMemo(
		() => (session?.pubkey ? normalizePubkey(session.pubkey) : null),
		[session?.pubkey],
	);

	const reactionAvatars = useMemo(() => {
		const seen = new Set<string>();
		const own: { pubkey: string; createdAt?: number }[] = [];
		const others: { pubkey: string; createdAt?: number }[] = [];
		reactions.forEach((item) => {
			if (item.entityId !== entityId) return;
			const normalized = normalizePubkey(item.pubkey) ?? item.pubkey;
			if (!normalized || seen.has(normalized)) return;
			seen.add(normalized);
			if (viewerPubkey && normalized === viewerPubkey) {
				own.push({ pubkey: normalized, createdAt: item.event?.created_at });
			} else {
				others.push({ pubkey: normalized, createdAt: item.event?.created_at });
			}
		});
		return [...own, ...others];
	}, [entityId, reactions, viewerPubkey]);

	const handleToggle = () => {
		if (!isLoggedIn) return;
		void toggle(isStarred);
	};

	return (
		<div className="card bg-base-100 shadow-sm rounded-md">
			<div className="card-body py-4">
				<div className="flex items-center gap-3">
					<StarToggle
						isStarred={isStarred}
						isSaving={isSaving}
						onToggle={handleToggle}
						confirmUnstarMessage="Remove your star from this thing?"
						isDisabled={!isLoggedIn}
					/>
					<div className="min-h-[32px] flex items-center gap-2">
						<ReactionAvatarList reactions={reactionAvatars} />
					</div>
				</div>
			</div>
		</div>
	);
}
