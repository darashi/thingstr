import { useMemo } from "react";
import { encodeNpub, normalizePubkey } from "../lib/nostr";
import { useFollowers } from "../hooks/useFollowers";
import { useNip07Auth } from "../hooks/useNip07Auth";
import LinkedUserAvatar from "./LinkedUserAvatar";

interface ReactionAvatarListProps {
	reactions: { pubkey: string; createdAt?: number }[];
}

export default function ReactionAvatarList({
	reactions,
}: ReactionAvatarListProps) {
	const followers = useFollowers();
	const { session } = useNip07Auth();
	const viewerPubkey = useMemo(
		() => (session?.pubkey ? normalizePubkey(session.pubkey) : null),
		[session?.pubkey],
	);

	const reactionWithFollowerFlag = useMemo(
		() =>
			reactions.map((reaction, index) => {
				const normalized =
					normalizePubkey(reaction.pubkey) ?? reaction.pubkey ?? "";
				const isViewer = Boolean(viewerPubkey && normalized === viewerPubkey);
				return {
					...reaction,
					isFollower: followers.has(normalized),
					isViewer,
					displayPubkey: normalized,
					_index: index,
				};
			}),
		[followers, reactions, viewerPubkey],
	);

	const sortedReactions = useMemo(
		() =>
			[...reactionWithFollowerFlag].sort((a, b) => {
				const priority = (item: typeof a) =>
					item.isViewer ? 0 : item.isFollower ? 1 : 2;
				const diff = priority(a) - priority(b);
				if (diff !== 0) return diff;
				return a._index - b._index;
			}),
		[reactionWithFollowerFlag],
	);

	if (!reactions.length) {
		return (
			<span className="text-sm text-base-content/60 font-medium">
				No reactions yet
			</span>
		);
	}

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{sortedReactions.map((reaction) => {
				const createdAtText = reaction.createdAt
					? new Date(reaction.createdAt * 1000).toLocaleString()
					: "Unknown time";
				const displayNpub =
					encodeNpub(reaction.displayPubkey) ?? reaction.displayPubkey;
				return (
					<div
						key={`${reaction.displayPubkey}-${reaction.createdAt ?? "unknown"}`}
						className="tooltip tooltip-bottom inline-flex items-center"
						data-tip={createdAtText}
					>
						<LinkedUserAvatar
							npub={displayNpub}
							isFollowing={reaction.isFollower}
						/>
					</div>
				);
			})}
		</div>
	);
}
