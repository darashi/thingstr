import { useMemo } from "react";
import { IconStar } from "@tabler/icons-react";
import { useBrowserLanguage } from "../hooks/useBrowserLanguage";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useNip07Auth } from "../hooks/useNip07Auth";
import { useProfile } from "../hooks/useProfile";
import { useReactionClassifications } from "../hooks/useReactionClassifications";
import { useUserReactionBackfill } from "../hooks/useUserReactionBackfill";
import { useUserWikidataReactions } from "../hooks/useUserWikidataReactions";
import { useWikidataEntitySummaries } from "../hooks/useWikidataEntitySummaries";
import { encodeNpub, normalizePubkey } from "../lib/nostr";
import UserClassifications from "./UserClassifications";
import UserHeader from "./UserHeader";
import UserReactionEntry from "./UserReactionEntry";

interface UserPageProps {
	npub: string;
}

export default function UserPage({ npub }: UserPageProps) {
	const normalizedPubkey = useMemo(() => normalizePubkey(npub), [npub]);
	const { pubkey: viewerPubkey } = useNip07Auth();
	const isOwnPage =
		Boolean(viewerPubkey) &&
		Boolean(normalizedPubkey) &&
		viewerPubkey === normalizedPubkey;
	const language = useBrowserLanguage();
	const { name } = useProfile(normalizedPubkey);
	const reactions = useUserWikidataReactions(normalizedPubkey);
	const {
		uniqueReactions,
		entityIds,
		classificationIdsByEntityId,
		classificationIds,
		filteredReactions,
		classificationSummary,
		visibleClassificationSummary,
		selectedClassification,
		showAllClassifications,
		isInstanceOfLoading,
		instanceOfError,
		selectClassification,
		clearClassification,
		toggleShowAllClassifications,
	} = useReactionClassifications(reactions);
	const { summaries, isLoading, error } = useWikidataEntitySummaries(
		[...entityIds, ...classificationIds],
		{
			language,
		},
	);

	const displayNpub = normalizedPubkey ? encodeNpub(normalizedPubkey) : null;
	const titleSubject = name ?? displayNpub ?? npub;
	useDocumentTitle(titleSubject);

	useUserReactionBackfill(normalizedPubkey);

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
					onClassificationClick={selectClassification}
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
					<UserHeader
						npub={displayNpub ?? npub}
						totalReactions={uniqueReactions.length}
					/>
				</div>
			</div>

			<UserClassifications
				classificationSummary={classificationSummary}
				visibleClassificationSummary={visibleClassificationSummary}
				summaries={summaries}
				isLoading={isInstanceOfLoading}
				error={instanceOfError}
				selectedClassification={selectedClassification}
				showAllClassifications={showAllClassifications}
				onClassificationClick={selectClassification}
				onClearClassification={clearClassification}
				onToggleShowAll={toggleShowAllClassifications}
			/>

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
