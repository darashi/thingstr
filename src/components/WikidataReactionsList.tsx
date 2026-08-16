import { IconMoodPlus } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBrowserLanguage } from "../hooks/useBrowserLanguage";
import { useEntityReactionBackfill } from "../hooks/useEntityReactionBackfill";
import {
	type EntitySummary,
	useWikidataEntitySummaries,
} from "../hooks/useWikidataEntitySummaries";
import { useWikidataReactionsTimeline } from "../hooks/useWikidataReactionsTimeline";
import { uniqueReactionItems } from "../lib/reactionItems";
import EntityReactionControl from "./EntityReactionControl";
import IdBadge from "./IdBadge";
import ReactionAvatarList, { type AvatarReaction } from "./ReactionAvatarList";

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
				reactions: AvatarReaction[];
			}
		>();

		for (const item of uniqueReactionItems(reactions)) {
			const createdAt = item.event.created_at;
			let entry = map.get(item.entityId);
			if (!entry) {
				entry = {
					entityId: item.entityId,
					latestAt: createdAt,
					reactions: [],
				};
				map.set(item.entityId, entry);
			}
			entry.latestAt = Math.max(entry.latestAt, createdAt);
			entry.reactions.push({
				id: item.event.id,
				pubkey: item.pubkey,
				content: item.content,
				createdAt,
			});
		}

		return [...map.values()]
			.sort((left, right) => right.latestAt - left.latestAt)
			.slice(0, MAX_ENTITIES);
	}, [reactions]);

	const entityIds = useMemo(
		() => groupedReactions.map((item) => item.entityId),
		[groupedReactions],
	);
	const { summaries, isLoading, error } = useWikidataEntitySummaries(
		entityIds,
		{ language },
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
				<IconMoodPlus size={18} /> Latest reactions
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
	reactions: AvatarReaction[];
}

function GroupedReactionCard({
	entityId,
	summary,
	isSummaryLoading,
	reactions,
}: GroupedReactionCardProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [shouldBackfill, setShouldBackfill] = useState(false);
	useEntityReactionBackfill(entityId, shouldBackfill);

	useEffect(() => {
		const element = containerRef.current;
		if (!element || shouldBackfill) return;

		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			setShouldBackfill(true);
			observer.disconnect();
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [shouldBackfill]);

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
					<EntityReactionControl entityId={entityId} />
					<ReactionAvatarList reactions={reactions} />
				</div>
			</div>
		</div>
	);
}
