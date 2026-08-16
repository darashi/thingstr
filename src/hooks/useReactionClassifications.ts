import { useCallback, useMemo, useState } from "react";
import type { WikidataReactionItem } from "./useWikidataReactionsTimeline";
import { useWikidataInstanceOf } from "./useWikidataInstanceOf";
import { stripWikidataPrefix } from "../lib/wikidata/ids";
import { uniqueReactionItems } from "../lib/reactionItems";

export interface ReactionClassificationSummary {
	id: string;
	count: number;
}

export function useReactionClassifications(
	reactions: WikidataReactionItem[],
) {
	const [selectedClassification, setSelectedClassification] = useState<
		string | null
	>(null);
	const [showAllClassifications, setShowAllClassifications] = useState(false);

	const uniqueReactions = useMemo(
		() => uniqueReactionItems(reactions),
		[reactions],
	);

	const entityIds = useMemo(
		() => Array.from(new Set(uniqueReactions.map((item) => item.entityId))),
		[uniqueReactions],
	);

	const {
		instanceOf,
		isLoading: isInstanceOfLoading,
		error: instanceOfError,
	} = useWikidataInstanceOf(entityIds);

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
		uniqueReactions.forEach(({ entityId }) => {
			const ids = classificationIdsByEntityId[entityId] ?? [];
			ids.forEach((id) => {
				counts[id] = (counts[id] ?? 0) + 1;
			});
		});
		return Object.entries(counts)
			.map(([id, count]) => ({ id, count }))
			.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
	}, [classificationIdsByEntityId, uniqueReactions]);

	const visibleClassificationSummary = useMemo(() => {
		const limit = 7;
		if (showAllClassifications) return classificationSummary;
		const top = classificationSummary.slice(0, limit);
		if (!selectedClassification) return top;
		const alreadyVisible = top.some(
			(item) => item.id === selectedClassification,
		);
		if (alreadyVisible) return top;
		const selected = classificationSummary.find(
			(item) => item.id === selectedClassification,
		);
		return selected ? [...top, selected] : top;
	}, [classificationSummary, selectedClassification, showAllClassifications]);

	const selectClassification = useCallback((id: string) => {
		setSelectedClassification((previous) => (previous === id ? null : id));
	}, []);
	const clearClassification = useCallback(() => {
		setSelectedClassification(null);
	}, []);
	const toggleShowAllClassifications = useCallback(() => {
		setShowAllClassifications((previous) => !previous);
	}, []);

	return {
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
	};
}
