import { encodeNpub } from "../lib/nostr";
import LinkedUserAvatar from "./LinkedUserAvatar";

interface ReactionAvatarListProps {
	reactions: { pubkey: string; createdAt?: number }[];
}

export default function ReactionAvatarList({
	reactions,
}: ReactionAvatarListProps) {
	if (!reactions.length) {
		return (
			<span className="text-sm text-base-content/60 font-medium">
				No reactions yet
			</span>
		);
	}

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{reactions.map((reaction) => {
				const createdAtText = reaction.createdAt
					? new Date(reaction.createdAt * 1000).toLocaleString()
					: "Unknown time";
				const displayNpub = encodeNpub(reaction.pubkey) ?? reaction.pubkey;
				return (
					<div
						key={reaction.pubkey}
						className="tooltip tooltip-bottom inline-flex items-center"
						data-tip={createdAtText}
					>
						<LinkedUserAvatar npub={displayNpub} />
					</div>
				);
			})}
		</div>
	);
}
