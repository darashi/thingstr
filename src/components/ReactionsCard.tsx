import { useMemo } from "react";
import { useEntityReactionBackfill } from "../hooks/useEntityReactionBackfill";
import { useWikidataReactionsTimeline } from "../hooks/useWikidataReactionsTimeline";
import { uniqueReactionItems } from "../lib/reactionItems";
import EntityReactionControl from "./EntityReactionControl";
import ReactionAvatarList from "./ReactionAvatarList";

interface ReactionsCardProps {
	entityId: string;
}

export default function ReactionsCard({ entityId }: ReactionsCardProps) {
	const reactions = useWikidataReactionsTimeline();
	useEntityReactionBackfill(entityId);

	const reactionAvatars = useMemo(
		() =>
			uniqueReactionItems(
				reactions.filter((item) => item.entityId === entityId),
			).map((item) => ({
				id: item.event.id,
				pubkey: item.pubkey,
				content: item.content,
				createdAt: item.event.created_at,
			})),
		[entityId, reactions],
	);

	return (
		<div className="card bg-base-100 shadow-sm rounded-md">
			<div className="card-body py-4">
				<div className="flex items-center gap-3 flex-wrap">
					<EntityReactionControl entityId={entityId} />
					<div className="min-h-[32px] flex items-center gap-2">
						<ReactionAvatarList reactions={reactionAvatars} />
					</div>
				</div>
			</div>
		</div>
	);
}
