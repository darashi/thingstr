import { useEffect, useMemo } from "react";
import { IconStar } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import IdBadge from "./IdBadge";
import UserHeader from "./UserHeader";
import StarToggle from "./StarToggle";
import { useBrowserLanguage } from "../hooks/useBrowserLanguage";
import { useUserWikidataReactions } from "../hooks/useUserWikidataReactions";
import {
	type EntitySummary,
	useWikidataEntitySummaries,
} from "../hooks/useWikidataEntitySummaries";
import { useWikidataReactions } from "../hooks/useWikidataReactions";
import { useToggleWikidataReaction } from "../hooks/useToggleWikidataReaction";
import { encodeNpub, normalizePubkey } from "../lib/nostr";
import type { WikidataReactionItem } from "../hooks/useWikidataReactionsTimeline";
import { useNip07Auth } from "../hooks/useNip07Auth";
import { useProfile } from "../hooks/useProfile";

interface UserReactionEntryProps {
	item: WikidataReactionItem;
	summary?: EntitySummary;
	isSummaryLoading: boolean;
	canToggle: boolean;
}

function UserReactionEntry({
	item,
	summary,
	isSummaryLoading,
	canToggle,
}: UserReactionEntryProps) {
	const { event, entityId } = item;
	const { isStarred, lastReactionEventId } = useWikidataReactions(entityId, {
		pubkey: event.pubkey,
	});
	const { toggle, isSaving } = useToggleWikidataReaction({
		entityId,
		lastReactionEventId,
	});

	const handleToggle = () => {
		if (!canToggle) return;
		void toggle(isStarred);
	};

	const labelClassName = summary?.label
		? "text-base-content"
		: "italic text-base-content/60";
	const labelText = summary?.label ?? "No label defined";
	const descriptionText = summary?.description;

	return (
		<div className="card bg-base-100 shadow-sm rounded-md">
			<div className="card-body py-3 px-4 flex flex-row gap-3 items-start">
				<StarToggle
					isStarred={isStarred}
					isSaving={isSaving}
					onToggle={handleToggle}
					size={22}
					confirmUnstarMessage="Remove your star from this thing?"
					isReadOnly={!canToggle}
				/>
				<div className="flex flex-1 flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						{isSummaryLoading ? (
							<div className="skeleton h-4 w-24" />
						) : (
							<Link
								to="/things/$id"
								params={{ id: entityId }}
								className={`text-sm font-semibold transition-colors hover:text-primary ${labelClassName}`}
							>
								{labelText}
							</Link>
						)}
						<IdBadge id={entityId} />
					</div>
					{isSummaryLoading ? (
						<div className="skeleton h-3 w-36" />
					) : descriptionText ? (
						<p className="text-xs text-base-content/70">{descriptionText}</p>
					) : (
						<p className="text-xs italic text-base-content/60">
							No description defined
						</p>
					)}
					<span className="text-xs text-base-content/60">
						{new Date(event.created_at * 1000).toLocaleString()}
					</span>
				</div>
			</div>
		</div>
	);
}

interface UserPageProps {
	npub: string;
}

export default function UserPage({ npub }: UserPageProps) {
	const normalizedPubkey = useMemo(() => normalizePubkey(npub), [npub]);
	const { session } = useNip07Auth();
	const viewerPubkey = session?.pubkey ? normalizePubkey(session.pubkey) : null;
	const isOwnPage =
		Boolean(viewerPubkey) && Boolean(normalizedPubkey) && viewerPubkey === normalizedPubkey;
	const language = useBrowserLanguage();
	const { name } = useProfile(normalizedPubkey);
	const reactions = useUserWikidataReactions(normalizedPubkey);
	const entityIds = useMemo(
		() => Array.from(new Set(reactions.map((item) => item.entityId))),
		[reactions],
	);
	const { summaries, isLoading, error } = useWikidataEntitySummaries(entityIds, {
		language,
	});

	const displayNpub = normalizedPubkey ? encodeNpub(normalizedPubkey) : null;
	const titleSubject = name ?? displayNpub ?? npub ?? null;

	useEffect(() => {
		const baseTitle = "thingstr";
		document.title = titleSubject ? `${titleSubject} | ${baseTitle}` : baseTitle;
		return () => {
			document.title = baseTitle;
		};
	}, [titleSubject]);

	if (!normalizedPubkey) {
		return (
			<div className="card bg-base-100 shadow-sm rounded-md">
				<div className="card-body py-6 space-y-2">
					<h1 className="text-xl font-semibold">Invalid user id</h1>
					<p className="text-sm text-base-content/70">
						Could not decode the supplied npub or pubkey.
					</p>
				</div>
			</div>
		);
	}

	const content = reactions.length ? (
		<div className="grid gap-3">
			{reactions.map((item) => (
				<UserReactionEntry
					key={item.event.id}
					item={item}
					summary={summaries[item.entityId]}
					isSummaryLoading={isLoading && !summaries[item.entityId]}
					canToggle={isOwnPage}
				/>
			))}
		</div>
	) : (
		<p className="text-sm text-base-content/60">No reactions yet</p>
	);

	return (
		<div className="space-y-4">
			<div className="card bg-base-100 shadow-sm rounded-md">
				<div className="card-body py-5">
					<UserHeader npub={displayNpub ?? npub} />
				</div>
			</div>

			<div className="space-y-3">
				<div className="flex items-center gap-2 text-base font-semibold">
					<IconStar size={18} /> Latest reactions
				</div>
				{error ? <div className="text-sm text-error">{error}</div> : null}
				{content}
			</div>
		</div>
	);
}
