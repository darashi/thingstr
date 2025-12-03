import { useMemo } from "react";
import { useWikidataReactions } from "../hooks/useWikidataReactions";
import { useToggleWikidataReaction } from "../hooks/useToggleWikidataReaction";
import LinkedUserAvatar from "./LinkedUserAvatar";
import { encodeNpub, normalizePubkey } from "../lib/nostr";
import StarToggle from "./StarToggle";
import { useNip07Auth } from "../hooks/useNip07Auth";
import { useWikidataReactionsTimeline } from "../hooks/useWikidataReactionsTimeline";

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

	const reactionPubkeys = useMemo(() => {
		const seen = new Set<string>();
		const own: string[] = [];
		const others: string[] = [];
		reactions.forEach((item) => {
			if (item.entityId !== entityId) return;
			const normalized = normalizePubkey(item.pubkey) ?? item.pubkey;
			if (!normalized || seen.has(normalized)) return;
			seen.add(normalized);
			if (viewerPubkey && normalized === viewerPubkey) {
				own.push(normalized);
			} else {
				others.push(normalized);
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
						{reactionPubkeys.length ? (
							<div className="flex items-center gap-2 flex-wrap">
								{reactionPubkeys.map((userPubkey) => (
									<LinkedUserAvatar
										key={userPubkey}
										npub={encodeNpub(userPubkey) ?? userPubkey}
									/>
								))}
							</div>
						) : (
							<span className="text-sm text-base-content/60 font-medium">
								No reactions yet
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
