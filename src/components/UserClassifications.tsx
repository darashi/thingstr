import { IconTags } from "@tabler/icons-react";
import type { EntitySummary } from "../hooks/useWikidataEntitySummaries";
import type { ReactionClassificationSummary } from "../hooks/useReactionClassifications";

interface UserClassificationsProps {
	classificationSummary: ReactionClassificationSummary[];
	visibleClassificationSummary: ReactionClassificationSummary[];
	summaries: Record<string, EntitySummary>;
	isLoading: boolean;
	error: string | null;
	selectedClassification: string | null;
	showAllClassifications: boolean;
	onClassificationClick: (id: string) => void;
	onClearClassification: () => void;
	onToggleShowAll: () => void;
}

export default function UserClassifications({
	classificationSummary,
	visibleClassificationSummary,
	summaries,
	isLoading,
	error,
	selectedClassification,
	showAllClassifications,
	onClassificationClick,
	onClearClassification,
	onToggleShowAll,
}: UserClassificationsProps) {
	if (!isLoading && classificationSummary.length === 0) return null;

	return (
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
								onClick={onClearClassification}
							>
								Clear
							</button>
						</div>
					) : null}
					{error ? <div className="text-sm text-error">{error}</div> : null}
					{isLoading ? (
						<div className="flex flex-wrap gap-2">
							<div className="skeleton h-8 w-24" />
							<div className="skeleton h-8 w-24" />
							<div className="skeleton h-8 w-20" />
						</div>
					) : classificationSummary.length ? (
						<>
							<div className="flex flex-wrap gap-2">
								{visibleClassificationSummary.map(({ id, count }) => (
									<button
										key={id}
										className={`px-3 py-2 rounded-md bg-base-200 text-sm text-base-content/80 inline-flex items-center gap-2 cursor-pointer hover:bg-base-300 transition-colors ${
											selectedClassification === id
												? "ring-2 ring-primary/60"
												: ""
										}`}
										onClick={() => onClassificationClick(id)}
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
									onClick={onToggleShowAll}
								>
									{showAllClassifications ? "Show less" : "Show all"}
								</button>
							) : null}
						</>
					) : (
						<p className="text-sm text-base-content/60">
							No classifications yet
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
