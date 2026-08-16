import { useParams } from "@tanstack/react-router";
import EntityProperties from "../components/EntityProperties";
import IdBadge from "../components/IdBadge";
import ReactionsCard from "../components/ReactionsCard";
import { useBrowserLanguage } from "../hooks/useBrowserLanguage";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useWikidataEntity } from "../hooks/useWikidataEntity";

export default function ThingPage() {
	const { id } = useParams({ from: "/things/$id" });
	const language = useBrowserLanguage();
	const {
		label,
		description,
		properties,
		isLoading,
		isPropertiesLoading,
		loadingLabelIds,
		error,
		isLabelMissing,
		isDescriptionMissing,
	} = useWikidataEntity(id, {
		language,
	});

	useDocumentTitle(label ?? (!isLoading ? id : null));

	const showTitleSkeleton = isLoading;
	const labelText = label ?? "No label defined";
	const labelClassName = isLabelMissing ? "italic text-base-content/60" : "";
	const titleContent = showTitleSkeleton ? (
		<div className="skeleton h-6 w-32" />
	) : (
		<h1 className={`text-xl font-semibold ${labelClassName}`.trim()}>
			{labelText}
		</h1>
	);
	return (
		<div className="space-y-4">
			<div className="card bg-base-100 shadow-sm rounded-md">
				<div className="card-body py-4">
					<div className="flex items-center gap-2">
						{titleContent}
						<IdBadge id={id} />
					</div>
					{error ? (
						<p className="text-sm text-error">{error}</p>
					) : description && !isDescriptionMissing ? (
						<p className="text-sm text-base-content/80">{description}</p>
					) : isLoading ? (
						<div className="skeleton h-4 w-48" />
					) : (
						<p className="text-sm italic text-base-content/60">
							No description defined
						</p>
					)}
				</div>
			</div>

			<ReactionsCard entityId={id} />

			{error ? null : (
				<div className="card bg-base-100 shadow-sm rounded-md">
					<div className="card-body py-4">
						<EntityProperties
							properties={properties}
							isLoading={isPropertiesLoading}
							loadingLabelIds={loadingLabelIds}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
