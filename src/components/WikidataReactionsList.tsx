import { useEffect, useMemo, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { IconStar } from "@tabler/icons-react";
import IdBadge from "./IdBadge";
import { useBrowserLanguage } from "../hooks/useBrowserLanguage";
import { useWikidataEntitySummaries } from "../hooks/useWikidataEntitySummaries";
import { useWikidataReactionsTimeline } from "../hooks/useWikidataReactionsTimeline";
import ReactionAvatarList from "./ReactionAvatarList";
import { normalizePubkey } from "../lib/nostr";
import { useWikidataReactions } from "../hooks/useWikidataReactions";
import type { EntitySummary } from "../hooks/useWikidataEntitySummaries";
import { useToggleWikidataReaction } from "../hooks/useToggleWikidataReaction";
import { useNip07Auth } from "../hooks/useNip07Auth";
import StarToggle from "./StarToggle";
import { THINGSTR_RELAYS } from "../config/relays";
import { useRelayPool } from "../hooks/useRelayPool";
import { useEventStore } from "../hooks/useEventStore";

const MAX_ENTITIES = 200;

export default function WikidataReactionsList() {
	const language = useBrowserLanguage();
	const reactions = useWikidataReactionsTimeline();
	const groupedReactions = useMemo(() => {
		const map = new Map<
			string,
			{
				entityId: string;
				latestAt: number;
				reactions: { pubkey: string; createdAt?: number }[];
				seen: Set<string>;
			}
		>();

		reactions.forEach(({ entityId, event, pubkey }) => {
			const createdAt = event?.created_at ?? 0;
			const normalizedPubkey = normalizePubkey(pubkey) ?? pubkey;
			let entry = map.get(entityId);
			if (!entry) {
				entry = {
					entityId,
					latestAt: createdAt,
					reactions: [],
					seen: new Set<string>(),
				};
				map.set(entityId, entry);
			}
			entry.latestAt = Math.max(entry.latestAt, createdAt);
			if (!entry.seen.has(normalizedPubkey)) {
				entry.seen.add(normalizedPubkey);
				entry.reactions.push({
					pubkey: normalizedPubkey,
					createdAt,
				});
			}
		});

		return Array.from(map.values())
			.map(({ seen: _seen, ...rest }) => rest)
			.sort((a, b) => (b.latestAt ?? 0) - (a.latestAt ?? 0))
			.slice(0, MAX_ENTITIES);
	}, [reactions]);

	const entityIds = useMemo(
		() => groupedReactions.map((item) => item.entityId),
		[groupedReactions],
	);

	const { summaries, isLoading, error } = useWikidataEntitySummaries(
		entityIds,
		{
			language,
		},
	);

	const content = groupedReactions.length ? (
		<div className="grid gap-3">
			{groupedReactions.map(({ entityId, reactions: entityReactions }) => (
				<GroupedReactionCard
					key={entityId}
					entityId={entityId}
					summary={summaries[entityId]}
					isSummaryLoading={isLoading && !summaries[entityId]}
					reactions={entityReactions}
				/>
			))}
		</div>
	) : (
		<p className="text-sm text-base-content/60">No reactions yet</p>
	);

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 text-base font-semibold">
				<IconStar size={18} /> Latest reactions
			</div>
			{error ? <div className="text-sm text-error">{error}</div> : null}
			{content}
		</div>
	);
}

interface GroupedReactionCardProps {
	entityId: string;
	summary?: EntitySummary;
	isSummaryLoading: boolean;
	reactions: { pubkey: string; createdAt?: number }[];
}

function GroupedReactionCard({
	entityId,
	summary,
	isSummaryLoading,
	reactions,
}: GroupedReactionCardProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const backfillSubRef = useRef<{ unsubscribe: () => void } | null>(null);
	const hasBackfilledRef = useRef(false);
	const relayPool = useRelayPool();
	const eventStore = useEventStore();
	const { session } = useNip07Auth();
	const { isStarred, lastReactionEventId } = useWikidataReactions(entityId);
	const { toggle, isSaving } = useToggleWikidataReaction({
		entityId,
		lastReactionEventId,
	});
	const isLoggedIn = Boolean(session?.pubkey);
	const viewerPubkey = useMemo(
		() => (session?.pubkey ? normalizePubkey(session.pubkey) : null),
		[session?.pubkey],
	);
	const reactionsForDisplay = useMemo(() => {
		if (!viewerPubkey) return reactions;
		const own = reactions.filter((item) => item.pubkey === viewerPubkey);
		const others = reactions.filter((item) => item.pubkey !== viewerPubkey);
		return [...own, ...others];
	}, [reactions, viewerPubkey]);

	const handleToggle = () => {
		if (!isLoggedIn) return;
		void toggle(isStarred);
	};

	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;
		if (!THINGSTR_RELAYS.length) return;
		if (hasBackfilledRef.current) return;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				if (hasBackfilledRef.current) return;
				hasBackfilledRef.current = true;
				const filters = [
					{
						kinds: [17],
						"#k": ["wikidata"],
						"#i": [`wd:${entityId}`],
						limit: 500,
					},
				];
				const group = relayPool.group(THINGSTR_RELAYS);
				backfillSubRef.current = group.request(filters, { eventStore }).subscribe(
					{
						next: (event) => {
							if (!event || typeof event === "string") return;
							eventStore.add(event as never);
						},
						error: (error) => {
							console.error(
								`Failed to backfill reactions for entity ${entityId}`,
								error,
							);
						},
					},
				);
				observer.disconnect();
			});
		});

		observer.observe(element);

		return () => {
			observer.disconnect();
			backfillSubRef.current?.unsubscribe();
		};
	}, [entityId, eventStore, relayPool]);

	const labelClassName = summary?.label
		? "text-base-content"
		: "italic text-base-content/60";
	const labelText = summary?.label ?? "No label defined";
	const descriptionText = summary?.description;

	return (
		<div ref={containerRef} className="card bg-base-100 shadow-sm rounded-md">
			<div className="card-body py-3 px-4 flex flex-col gap-2">
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
				<div className="flex items-center gap-3 flex-wrap">
					<StarToggle
						isStarred={isStarred}
						isSaving={isSaving}
						onToggle={handleToggle}
						confirmUnstarMessage="Remove your star from this thing?"
						isDisabled={!isLoggedIn}
					/>
					<ReactionAvatarList reactions={reactionsForDisplay} />
				</div>
			</div>
		</div>
	);
}
