import { useMemo, useState } from "react";
import { useFollowers } from "../hooks/useFollowers";
import { useNip07Auth } from "../hooks/useNip07Auth";
import { encodeNpub, normalizePubkey } from "../lib/nostr";
import { reactionSymbol } from "../lib/reactions";
import LinkedUserAvatar from "./LinkedUserAvatar";

export interface AvatarReaction {
	id: string;
	pubkey: string;
	content: string;
	createdAt?: number;
}

interface ReactionAvatarListProps {
	reactions: AvatarReaction[];
	limit?: number;
}

export default function ReactionAvatarList({
	reactions,
	limit = 8,
}: ReactionAvatarListProps) {
	const followers = useFollowers();
	const { pubkey: viewerPubkey } = useNip07Auth();
	const [isOverflowOpen, setIsOverflowOpen] = useState(false);

	const sortedReactions = useMemo(() => {
		return reactions
			.map((reaction, index) => {
				const normalized =
					normalizePubkey(reaction.pubkey) ?? reaction.pubkey ?? "";
				return {
					...reaction,
					isFollower: followers.has(normalized),
					isViewer: Boolean(viewerPubkey && normalized === viewerPubkey),
					displayPubkey: normalized,
					index,
				};
			})
			.sort((left, right) => {
				const priority = (item: typeof left) =>
					item.isViewer ? 0 : item.isFollower ? 1 : 2;
				return priority(left) - priority(right) || left.index - right.index;
			});
	}, [followers, reactions, viewerPubkey]);

	if (!reactions.length) {
		return (
			<span className="text-sm text-base-content/60 font-medium">
				No reactions yet
			</span>
		);
	}
	const visibleReactions = sortedReactions.slice(0, limit);
	const overflowCount = sortedReactions.length - visibleReactions.length;

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{visibleReactions.map((reaction) => {
				const createdAtText = reaction.createdAt
					? new Date(reaction.createdAt * 1000).toLocaleString()
					: "Unknown time";
				const displayNpub =
					encodeNpub(reaction.displayPubkey) ?? reaction.displayPubkey;
				const symbol = reactionSymbol(reaction.content);
				return (
					<div
						key={reaction.id}
						className="tooltip tooltip-bottom inline-flex items-center"
						data-tip={`${symbol} · ${createdAtText}`}
					>
						<LinkedUserAvatar
							npub={displayNpub}
							isFollowing={reaction.isFollower}
							reactionContent={reaction.content}
						/>
					</div>
				);
			})}
			{overflowCount > 0 ? (
				<details
					className="dropdown dropdown-end"
					onToggle={(event) => setIsOverflowOpen(event.currentTarget.open)}
				>
					<summary
						className="btn btn-ghost btn-circle btn-md text-xs text-base-content/60"
						aria-label={`Show all ${sortedReactions.length} reactions`}
					>
						+{overflowCount}
					</summary>
					{isOverflowOpen ? (
						<ul className="dropdown-content z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
							{sortedReactions.map((reaction) => {
								const displayNpub =
									encodeNpub(reaction.displayPubkey) ?? reaction.displayPubkey;
								const symbol = reactionSymbol(reaction.content);
								const createdAtText = reaction.createdAt
									? new Date(reaction.createdAt * 1000).toLocaleString()
									: "Unknown time";
								return (
									<li
										key={reaction.id}
										className="flex items-center gap-2 rounded-md p-2 text-xs"
									>
										<LinkedUserAvatar
											npub={displayNpub}
											isFollowing={reaction.isFollower}
											reactionContent={reaction.content}
											sizeClassName="w-7 h-7"
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-base-content">
												{displayNpub}
											</span>
											<span className="block text-base-content/60">
												{createdAtText}
											</span>
										</span>
										<span className="text-base" aria-hidden="true">
											{symbol}
										</span>
									</li>
								);
							})}
						</ul>
					) : null}
				</details>
			) : null}
		</div>
	);
}
