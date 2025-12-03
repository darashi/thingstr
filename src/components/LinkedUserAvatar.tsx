import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { IconUser } from "@tabler/icons-react";
import { useProfile } from "../hooks/useProfile";
import { encodeNpub, normalizePubkey } from "../lib/nostr";
import { useNip07Auth } from "../hooks/useNip07Auth";

type ProfileEvent = {
	kind: number;
	pubkey: string;
	content?: string;
};

type BaseProps = {
	sizeClassName?: string;
	showRing?: boolean;
	iconSize?: number;
};

type LinkedUserAvatarProps =
	| (BaseProps & {
			npub: string;
			profileEvent?: never;
	  })
	| (BaseProps & {
			profileEvent: ProfileEvent;
			npub?: never;
	  });

function extractPicture(event: ProfileEvent | undefined): string | null {
	if (!event || event.kind !== 0) return null;
	try {
		const parsed = JSON.parse(event.content ?? "{}") as { picture?: unknown };
		return typeof parsed.picture === "string" ? parsed.picture : null;
	} catch (error) {
		console.error("Failed to parse profile content", error);
		return null;
	}
}

export default function LinkedUserAvatar(props: LinkedUserAvatarProps) {
	const sizeClassName = props.sizeClassName ?? "w-8 h-8";
	const showRing = props.showRing ?? true;
	const iconSize = props.iconSize ?? 18;
	const { session } = useNip07Auth();

	const isProfileEventProps = "profileEvent" in props;
	const npub = isProfileEventProps ? null : props.npub;
	const profileEvent = isProfileEventProps ? props.profileEvent : null;

	const pubkey = useMemo(() => {
		if (npub) {
			return normalizePubkey(npub);
		}
		if (profileEvent?.pubkey) {
			return normalizePubkey(profileEvent.pubkey) ?? profileEvent.pubkey;
		}
		return null;
	}, [npub, profileEvent]);

	const explicitNpub = useMemo(() => {
		if (npub) return npub;
		if (profileEvent?.pubkey) {
			return encodeNpub(profileEvent.pubkey) ?? profileEvent.pubkey;
		}
		return "";
	}, [npub, profileEvent]);

	const viewerPubkey = useMemo(
		() => (session?.pubkey ? normalizePubkey(session.pubkey) : null),
		[session?.pubkey],
	);
	const isViewer = Boolean(viewerPubkey && pubkey && viewerPubkey === pubkey);
	const cachedPicture = useMemo(
		() => (profileEvent ? extractPicture(profileEvent) : null),
		[profileEvent],
	);
	const { picture: fetchedPicture } = useProfile(pubkey);
	const displayPicture = cachedPicture ?? fetchedPicture ?? null;
	const ringColorClass = isViewer ? "ring-primary" : "ring-base-300";
	const ringClassName = showRing
		? `ring ${ringColorClass} ring-offset-1 ring-offset-base-100`
		: "";

	return (
		<Link
			to="/p/$npub"
			params={{ npub: explicitNpub }}
			className="inline-flex"
		>
			<div className="avatar">
				<div
					className={`${sizeClassName} rounded-full overflow-hidden bg-base-200 ${ringClassName}`}
				>
					{displayPicture ? (
						<img
							src={displayPicture}
							alt="User avatar"
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-primary/20 text-primary-content">
							<IconUser size={iconSize} />
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}
