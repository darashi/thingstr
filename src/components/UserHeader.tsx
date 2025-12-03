import LinkedUserAvatar from "./LinkedUserAvatar";
import { useProfile } from "../hooks/useProfile";
import { normalizePubkey } from "../lib/nostr";

interface UserHeaderProps {
	npub: string;
}

export default function UserHeader({ npub }: UserHeaderProps) {
	const normalizedPubkey = normalizePubkey(npub);
	const { name, isLoading } = useProfile(normalizedPubkey);

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
			) : name ? (
				<h1 className="text-xl font-semibold">{name}</h1>
			) : null}
		</div>
	);
}
