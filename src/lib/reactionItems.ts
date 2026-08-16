import { normalizePubkey } from "./nostr";
import { normalizeReactionContent } from "./reactions";

export type ReactionItem = {
	event: {
		id: string;
		created_at: number;
		content: string;
	};
	entityId: string;
	pubkey: string;
	content: string;
};

export function uniqueReactionItems<T extends ReactionItem>(items: T[]): T[] {
	const seen = new Set<string>();
	const newestFirst = [...items].sort(
		(left, right) =>
			right.event.created_at - left.event.created_at ||
			left.event.id.localeCompare(right.event.id),
	);

	return newestFirst.filter((item) => {
		const pubkey = normalizePubkey(item.pubkey) ?? item.pubkey;
		const content = normalizeReactionContent(item.content);
		const key = `${item.entityId}\u0000${pubkey}\u0000${content}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
