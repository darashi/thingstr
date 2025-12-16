import { useEffect, useMemo, useState } from "react";
import { IconDotsVertical, IconStar, IconTags } from "@tabler/icons-react";
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
import { useRelayPool } from "../hooks/useRelayPool";
import { useEventStore } from "../hooks/useEventStore";
import { THINGSTR_RELAYS } from "../config/relays";
import { stripWikidataPrefix } from "../lib/wikidata";
import { useWikidataInstanceOf } from "../hooks/useWikidataInstanceOf";

interface UserReactionEntryProps {
	item: WikidataReactionItem;
	summary?: EntitySummary;
	isSummaryLoading: boolean;
	canToggle: boolean;
	classifications: { id: string; label: string | null }[];
	isClassificationLoading: boolean;
	onClassificationClick: (id: string) => void;
	selectedClassification: string | null;
}

function UserReactionEntry({
	item,
	summary,
	isSummaryLoading,
	canToggle,
	classifications,
	isClassificationLoading,
	onClassificationClick,
	selectedClassification,
}: UserReactionEntryProps) {
	const { event, entityId } = item;
	const { isStarred } = useWikidataReactions(entityId, {
		pubkey: event.pubkey,
	});
	const { toggle, isSaving } = useToggleWikidataReaction({
		entityId,
		lastReactionEventId: event.id,
	});
	const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

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
			<div className="card-body py-3 px-4">
				<div className="flex gap-3 items-start">
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
						{isClassificationLoading ? (
							<div className="flex flex-wrap gap-2">
								<div className="skeleton h-5 w-16" />
								<div className="skeleton h-5 w-16" />
							</div>
						) : classifications.length ? (
							<div className="flex flex-wrap items-center gap-2 text-xs text-base-content/70">
								<IconTags size={14} />
								<div className="flex flex-wrap gap-2">
									{classifications.map(({ id, label }) => (
										<button
											key={id}
											type="button"
											className={`px-2 py-1 rounded-md bg-base-200 text-base-content/80 hover:bg-base-300 transition-colors ${
												selectedClassification === id ? "ring-2 ring-primary/60" : ""
											}`}
											onClick={() => onClassificationClick(id)}
										>
											{label ?? id}
										</button>
									))}
								</div>
							</div>
						) : null}
						<span className="text-xs text-base-content/60">
							{new Date(event.created_at * 1000).toLocaleString()}
						</span>
					</div>
					<details
						className={`dropdown dropdown-end${isMenuOpen ? " dropdown-open" : ""}`}
						open={isMenuOpen}
						onToggle={(details) => setIsMenuOpen(details.currentTarget.open)}
					>
						<summary className="btn btn-ghost btn-sm btn-circle mt-1">
							<IconDotsVertical size={18} />
						</summary>
						<ul className="menu menu-sm dropdown-content bg-base-100 rounded-box shadow right-0 mt-1 w-48 z-10">
							<li>
								<button
									type="button"
									onClick={() => {
										setIsJsonModalOpen(true);
										setIsMenuOpen(false);
									}}
								>
									Show event JSON
								</button>
							</li>
						</ul>
					</details>
				</div>
			</div>
			{isJsonModalOpen ? (
				<div className="modal modal-open">
					<div className="modal-box space-y-3 max-w-3xl">
						<h3 className="font-semibold text-lg">Event JSON</h3>
						<pre className="text-xs bg-base-200 rounded-md p-2 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words">
							{JSON.stringify(event, null, 2)}
						</pre>
						<div className="modal-action">
							<button
								type="button"
								className="btn btn-primary"
								onClick={() => setIsJsonModalOpen(false)}
							>
								Close
							</button>
						</div>
					</div>
					<div
						className="modal-backdrop"
						onClick={() => setIsJsonModalOpen(false)}
						aria-hidden="true"
					>
						<button type="button" aria-label="Close" />
					</div>
				</div>
			) : null}
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
	const eventStore = useEventStore();
	const relayPool = useRelayPool();
	const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
	const [showAllClassifications, setShowAllClassifications] = useState(false);
	const uniqueReactions = useMemo(() => {
		const seen = new Set<string>();
		return reactions.filter((item) => {
			if (seen.has(item.event.id)) return false;
			seen.add(item.event.id);
			return true;
		});
	}, [reactions]);
	const entityIds = useMemo(
		() => Array.from(new Set(uniqueReactions.map((item) => item.entityId))),
		[uniqueReactions],
	);
	const { instanceOf, isLoading: isInstanceOfLoading } = useWikidataInstanceOf(entityIds);
	const classificationIdsByEntityId = useMemo(() => {
		const map: Record<string, string[]> = {};
		entityIds.forEach((entityId) => {
			const ids = instanceOf[entityId] ?? [];
			if (ids.length) {
				map[entityId] = ids.map(stripWikidataPrefix).filter(Boolean);
			}
		});
		return map;
	}, [entityIds, instanceOf]);

	const classificationIds = useMemo(() => {
		const ids = new Set<string>();
		Object.values(classificationIdsByEntityId).forEach((list) => {
			list.forEach((id) => ids.add(id));
		});
		return Array.from(ids);
	}, [classificationIdsByEntityId]);

	const filteredReactions = useMemo(() => {
		if (!selectedClassification) return uniqueReactions;
		return uniqueReactions.filter((item) =>
			(classificationIdsByEntityId[item.entityId] ?? []).includes(
				selectedClassification,
			),
		);
	}, [classificationIdsByEntityId, selectedClassification, uniqueReactions]);

	const classificationSummary = useMemo(() => {
		const counts: Record<string, number> = {};
		Object.values(classificationIdsByEntityId).forEach((ids) => {
			ids.forEach((id) => {
				counts[id] = (counts[id] ?? 0) + 1;
			});
		});
		return Object.entries(counts)
			.map(([id, count]) => ({ id, count }))
			.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
	}, [classificationIdsByEntityId]);

	const visibleClassificationSummary = useMemo(() => {
		const limit = 7;
		if (showAllClassifications) return classificationSummary;
		const top = classificationSummary.slice(0, limit);
		if (!selectedClassification) return top;
		const alreadyVisible = top.some((item) => item.id === selectedClassification);
		if (alreadyVisible) return top;
		const selected = classificationSummary.find(
			(item) => item.id === selectedClassification,
		);
		return selected ? [...top, selected] : top;
	}, [classificationSummary, selectedClassification, showAllClassifications]);

	const { summaries, isLoading, error } = useWikidataEntitySummaries(
		[...entityIds, ...classificationIds],
		{
			language,
		},
	);

	const displayNpub = normalizedPubkey ? encodeNpub(normalizedPubkey) : null;
	const titleSubject = name ?? displayNpub ?? npub ?? null;

	useEffect(() => {
		const baseTitle = "thingstr";
		document.title = titleSubject ? `${titleSubject} | ${baseTitle}` : baseTitle;
		return () => {
			document.title = baseTitle;
		};
	}, [titleSubject]);

	useEffect(() => {
		if (!normalizedPubkey) return;
		if (!THINGSTR_RELAYS.length) return;

		const filters = [
			{ kinds: [17], "#k": ["wikidata"], authors: [normalizedPubkey], limit: 500 },
			{ kinds: [5], authors: [normalizedPubkey], limit: 500 },
		];

		const group = relayPool.group(THINGSTR_RELAYS);
		const sub = group.request(filters, { eventStore }).subscribe({
			next: (event) => {
				if (!event || typeof event === "string") return;
				eventStore.add(event as never);
			},
			error: (error) => {
				console.error("Failed to load user reactions", error);
			},
		});

		return () => sub.unsubscribe();
	}, [eventStore, normalizedPubkey, relayPool]);

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

	const content = filteredReactions.length ? (
		<div className="grid gap-3">
			{filteredReactions.map((item) => (
				<UserReactionEntry
					key={item.event.id}
					item={item}
					summary={summaries[item.entityId]}
					isSummaryLoading={isLoading && !summaries[item.entityId]}
					canToggle={isOwnPage}
					classifications={(classificationIdsByEntityId[item.entityId] ?? []).map(
						(id) => ({
							id,
							label: summaries[id]?.label ?? null,
						}),
					)}
					isClassificationLoading={
						(isInstanceOfLoading &&
							(classificationIdsByEntityId[item.entityId] ?? []).length === 0) ||
						(isLoading &&
							(classificationIdsByEntityId[item.entityId] ?? []).some(
								(id) => !summaries[id],
							))
					}
					onClassificationClick={(id) =>
						setSelectedClassification((prev) => (prev === id ? null : id))
					}
					selectedClassification={selectedClassification}
				/>
			))}
		</div>
	) : (
		<p className="text-sm text-base-content/60">
			{selectedClassification
				? "No reactions for this classification"
				: "No reactions yet"}
		</p>
	);

	return (
		<div className="space-y-4">
			<div className="card bg-base-100 shadow-sm rounded-md">
				<div className="card-body py-5">
					<UserHeader npub={displayNpub ?? npub} />
				</div>
			</div>

			{classificationSummary.length ? (
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-base font-semibold">
						<IconTags size={18} /> Classifications
					</div>
					<div className="card bg-base-100 shadow-sm rounded-md">
						<div className="card-body py-4 space-y-3">
							{selectedClassification ? (
								<div className="flex items-center gap-2 text-xs text-base-content/70">
									<span>Filtering by</span>
									<span className="px-2 py-1 rounded-md bg-base-200 text-base-content/80">
										{summaries[selectedClassification]?.label ?? selectedClassification}
									</span>
									<button
										type="button"
										className="btn btn-ghost btn-xs"
										onClick={() => setSelectedClassification(null)}
									>
										Clear
									</button>
								</div>
							) : null}
							<div className="flex flex-wrap gap-2">
								{visibleClassificationSummary.map(({ id, count }) => (
									<button
										key={id}
										className={`px-3 py-2 rounded-md bg-base-200 text-sm text-base-content/80 inline-flex items-center gap-2 cursor-pointer hover:bg-base-300 transition-colors ${
											selectedClassification === id ? "ring-2 ring-primary/60" : ""
										}`}
										onClick={() =>
											setSelectedClassification((prev) =>
												prev === id ? null : id,
											)
										}
									>
										<span className="font-medium">
											{summaries[id]?.label ?? id}
										</span>
										<span className="text-xs px-2 py-0.5 rounded bg-base-300 text-base-content/80">
											{count}
										</span>
									</button>
								))}
							</div>
							{classificationSummary.length > 7 ? (
								<button
									type="button"
									className="btn btn-ghost btn-xs"
									onClick={() => setShowAllClassifications((prev) => !prev)}
								>
									{showAllClassifications ? "Show less" : "Show all"}
								</button>
							) : null}
						</div>
					</div>
				</div>
			) : null}

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
