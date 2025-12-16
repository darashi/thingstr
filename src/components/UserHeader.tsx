import LinkedUserAvatar from "./LinkedUserAvatar";
import { useProfile } from "../hooks/useProfile";
import { normalizePubkey } from "../lib/nostr";

interface UserHeaderProps {
	npub: string;
	totalReactions?: number;
}

export default function UserHeader({ npub, totalReactions }: UserHeaderProps) {
	const normalizedPubkey = normalizePubkey(npub);
	const { name, isLoading } = useProfile(normalizedPubkey);
	const displayName = name ?? npub;

	return (
		<div className="flex items-center gap-4">
			<LinkedUserAvatar
				npub={npub}
				sizeClassName="w-12 h-12"
				showRing
				iconSize={24}
			/>
			{isLoading ? (
				<div className="skeleton h-6 w-32" />
			) : (
				<div className="flex items-center gap-2">
					<h1 className="text-xl font-semibold">{displayName}</h1>
					{typeof totalReactions === "number" ? (
						<span className="text-sm text-base-content/70">
							({totalReactions} reactions)
						</span>
					) : null}
				</div>
			)}
		</div>
	);
}
