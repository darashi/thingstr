import { useEffect, useMemo } from "react";
import { useWikidataReactions } from "../hooks/useWikidataReactions";
import { useToggleWikidataReaction } from "../hooks/useToggleWikidataReaction";
import { normalizePubkey } from "../lib/nostr";
import StarToggle from "./StarToggle";
import { useNip07Auth } from "../hooks/useNip07Auth";
import { useWikidataReactionsTimeline } from "../hooks/useWikidataReactionsTimeline";
import ReactionAvatarList from "./ReactionAvatarList";
import { useEventStore } from "../hooks/useEventStore";
import { useRelayPool } from "../hooks/useRelayPool";
import { THINGSTR_RELAYS } from "../config/relays";
import { withWikidataPrefix } from "../lib/wikidata/ids";

interface ReactionsCardProps {
	entityId: string;
}

export default function ReactionsCard({ entityId }: ReactionsCardProps) {
	const { pubkey: viewerPubkey } = useNip07Auth();
	const { isStarred, lastReactionEventId } = useWikidataReactions(entityId);
	const { toggle, isSaving } = useToggleWikidataReaction({
		entityId,
		lastReactionEventId,
	});
	const reactions = useWikidataReactionsTimeline();
	const eventStore = useEventStore();
	const relayPool = useRelayPool();
	const isLoggedIn = Boolean(viewerPubkey);
	const prefixedEntityId = useMemo(
		() => withWikidataPrefix(entityId),
		[entityId],
	);

	useEffect(() => {
		if (!THINGSTR_RELAYS.length) return;

		const filters = [
			{
				kinds: [17],
				"#k": ["wikidata"],
				"#i": [prefixedEntityId],
				limit: 500,
			},
			{ kinds: [5], limit: 500 },
		];

		const group = relayPool.group(THINGSTR_RELAYS);
		const sub = group
			.request(filters, { eventStore })
			.subscribe({
				error: (error) => {
					console.error("Failed to request reactions for entity", error);
				},
			});

		return () => sub.unsubscribe();
	}, [entityId, eventStore, prefixedEntityId, relayPool]);

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
