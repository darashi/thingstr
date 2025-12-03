import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { IconStar } from "@tabler/icons-react";
import IdBadge from "./IdBadge";
import LinkedUserAvatar from "./LinkedUserAvatar";
import { useBrowserLanguage } from "../hooks/useBrowserLanguage";
import { useWikidataEntitySummaries } from "../hooks/useWikidataEntitySummaries";
import { useWikidataReactionsTimeline } from "../hooks/useWikidataReactionsTimeline";
import { encodeNpub } from "../lib/nostr";

export default function WikidataReactionsList() {
	const language = useBrowserLanguage();
	const reactions = useWikidataReactionsTimeline();
	const entityIds = useMemo(
		() => Array.from(new Set(reactions.map((item) => item.entityId))),
		[reactions],
	);
	const { summaries, isLoading, error } = useWikidataEntitySummaries(entityIds, {
		language,
	});

	const content = reactions.length ? (
		<div className="grid gap-3">
			{reactions.map(({ event, entityId }) => {
				const summary = summaries[entityId];
				const isSummaryLoading = isLoading && !summary;
				const labelClassName = summary?.label
					? "text-base-content"
					: "italic text-base-content/60";
				const labelText = summary?.label ?? "No label defined";
				const descriptionText = summary?.description;

				return (
					<div
						key={event.id}
						className="card bg-base-100 shadow-sm rounded-md"
					>
						<div className="card-body py-3 px-4 flex flex-row gap-3 items-start">
							<LinkedUserAvatar
								npub={encodeNpub(event.pubkey) ?? event.pubkey}
							/>
							<div className="flex flex-1 flex-col gap-1">
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
									<p className="text-xs text-base-content/70">
										{descriptionText}
									</p>
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
			})}
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
