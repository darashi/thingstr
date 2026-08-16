import { useState } from "react";
import { IconDotsVertical, IconTags } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { EntitySummary } from "../hooks/useWikidataEntitySummaries";
import { useToggleWikidataReaction } from "../hooks/useToggleWikidataReaction";
import { useWikidataReactions } from "../hooks/useWikidataReactions";
import type { WikidataReactionItem } from "../hooks/useWikidataReactionsTimeline";
import IdBadge from "./IdBadge";
import StarToggle from "./StarToggle";

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

export default function UserReactionEntry({
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
												selectedClassification === id
													? "ring-2 ring-primary/60"
													: ""
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
