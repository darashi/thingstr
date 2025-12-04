import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import IdBadge from "./IdBadge";
import type { EntityProperty } from "../hooks/useWikidataEntity";

interface EntityPropertiesProps {
	properties: EntityProperty[];
	isLoading: boolean;
	loadingLabelIds?: string[];
}

export default function EntityProperties({
	properties,
	isLoading,
	loadingLabelIds = [],
}: EntityPropertiesProps) {
	const loadingLabelIdSet = new Set(loadingLabelIds);

	const wrapWithTooltip = (
		node: ReactNode,
		description?: string | null,
	) => {
		if (!description) return node;
		return (
			<span className="tooltip" data-tip={description}>
				{node}
			</span>
		);
	};

	const renderValueContent = (
		value: EntityProperty["values"][number],
		{
			compact = false,
			isLoaded = false,
			isLoadingLabel = false,
		}: { compact?: boolean; isLoaded?: boolean; isLoadingLabel?: boolean } = {},
	) => {
		const textSize = compact ? "text-xs" : "text-sm";
		const showSkeleton = !isLoaded && isLoadingLabel;
		if (value.type === "entity" && value.id) {
			const linkClass = value.label
				? "text-primary underline underline-offset-4"
				: "text-base-content/60 underline underline-offset-4 decoration-base-content/50";
			const link = (
				<Link
					className={linkClass}
					to="/things/$id"
					params={{ id: value.id }}
				>
					{value.label ? (
						value.label
					) : isLoaded && !showSkeleton ? (
						<span className="italic text-base-content/60">No label defined</span>
					) : (
						<span className="skeleton inline-block h-4 w-32 align-middle" />
					)}
				</Link>
			);
			return (
				<span className={`inline-flex flex-wrap items-center gap-2 ${textSize}`}>
					{wrapWithTooltip(link, value.description)}
					<IdBadge id={value.id} />
				</span>
			);
		}

		if (value.type === "url" && value.url) {
			return (
				<a
					className={`${textSize} text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid`}
					href={value.url}
					target="_blank"
					rel="noreferrer"
				>
					{value.label}
				</a>
			);
		}

		if (value.type === "url" && !value.url) {
			return (
				<span className={`${textSize} italic text-base-content/60`}>
					No URL defined
				</span>
			);
		}

		return (
			<span
				className={`${textSize} text-base-content/80 break-words whitespace-pre-wrap block`}
			>
				{value.label ??
					(isLoaded && !showSkeleton ? (
						<span className="italic text-base-content/60">No value defined</span>
					) : (
						<span className="skeleton inline-block h-4 w-24 align-middle" />
					))}
			</span>
		);
	};

	if (isLoading) {
		return (
			<div className="-mx-4 md:-mx-6 divide-y divide-base-200">
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className="flex flex-col gap-2 py-3 px-4 md:px-6 md:flex-row md:items-start md:gap-4"
					>
						<div className="md:w-1/3">
							<div className="skeleton h-4 w-32 md:w-36" />
						</div>
						<div className="flex-1 space-y-2">
							<div className="skeleton h-4 w-full max-w-[320px]" />
							<div className="skeleton h-4 w-2/3 max-w-[240px]" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (!properties.length) {
		return <p className="text-sm text-base-content/70">No properties</p>;
	}

	return (
		<div className="-mx-4 md:-mx-6 divide-y divide-base-200">
			{properties.map((property) => (
				<div
					key={property.propertyId}
					className="flex flex-col gap-2 py-3 px-4 md:px-6 md:flex-row md:items-start md:gap-4"
				>
					<div className="md:w-1/3 flex items-center gap-2">
						{property.propertyLabel ? (
							wrapWithTooltip(
								<Link
									className="font-semibold"
									to="/things/$id"
									params={{ id: property.propertyId }}
								>
									{property.propertyLabel}
								</Link>,
								property.propertyDescription,
							)
						) : loadingLabelIdSet.has(property.propertyId) ? (
							<span className="skeleton h-4 w-32 md:w-36" />
						) : (
							<span className="italic text-base-content/60 text-sm">
								No label defined
							</span>
						)}
						<IdBadge id={property.propertyId} />
					</div>
					<div className="flex flex-1 flex-col gap-2 min-w-0">
						{property.values.map((value, index) => {
							const key = `${property.propertyId}-${value.id ?? value.label}-${index}`;
							const isValueLoadingLabel =
								value.type === "entity" && value.id
									? loadingLabelIdSet.has(value.id)
									: false;
							return (
								<div key={key} className="flex flex-col gap-1 min-w-0">
									{renderValueContent(value, {
										isLoaded: !isLoading && !isValueLoadingLabel,
										isLoadingLabel: isValueLoadingLabel,
									})}
									{value.qualifiers && value.qualifiers.length ? (
										<div className="ml-3 border-l border-base-300/70 pl-3 space-y-1 text-xs text-base-content/70 min-w-0">
											{value.qualifiers.map(
												(qualifier, qualifierIndex) => (
													<div
														key={`${qualifier.propertyId}-${qualifierIndex}-${value.id ?? value.label}`}
														className="flex flex-wrap items-center gap-2 min-w-0"
													>
														{qualifier.propertyLabel ? (
															wrapWithTooltip(
																<Link
																	className="font-semibold uppercase tracking-[0.08em]"
																	to="/things/$id"
																	params={{ id: qualifier.propertyId }}
																>
																	{qualifier.propertyLabel}
																</Link>,
																qualifier.propertyDescription,
															)
														) : loadingLabelIdSet.has(qualifier.propertyId) ? (
															<span className="skeleton h-3 w-20 rounded" />
														) : (
															<span className="italic text-base-content/60">
																No label defined
															</span>
														)}
														<IdBadge id={qualifier.propertyId} />
														<span className="text-base-content/50">→</span>
														{renderValueContent(qualifier.value, {
															compact: true,
															isLoaded:
																!isLoading &&
																!(
																	qualifier.value.type === "entity" &&
																	qualifier.value.id &&
																	loadingLabelIdSet.has(qualifier.value.id)
																),
															isLoadingLabel:
																qualifier.value.type === "entity" &&
																qualifier.value.id
																	? loadingLabelIdSet.has(qualifier.value.id)
																	: false,
														})}
													</div>
												),
											)}
										</div>
									) : null}
								</div>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}
