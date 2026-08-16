import { describe, expect, it } from "vitest";
import { uniqueReactionItems, type ReactionItem } from "./reactionItems";

function reaction(
	id: string,
	pubkey: string,
	content: string,
	createdAt: number,
): ReactionItem {
	return {
		entityId: "Q1",
		pubkey,
		content,
		event: { id, created_at: createdAt, content },
	};
}

describe("uniqueReactionItems", () => {
	it("keeps different reactions from the same user", () => {
		const reactions = uniqueReactionItems([
			reaction("star", "alice", "+", 1),
			reaction("fire", "alice", "🔥", 2),
		]);

		expect(reactions.map(({ content }) => content)).toEqual(["🔥", "+"]);
	});

	it("keeps only the newest duplicate reaction from a user", () => {
		const reactions = uniqueReactionItems([
			reaction("old", "alice", "🔥", 1),
			reaction("new", "alice", "🔥", 2),
		]);

		expect(reactions).toHaveLength(1);
		expect(reactions[0]?.event.id).toBe("new");
	});

	it("treats empty, whitespace, and plus as the same reaction", () => {
		const reactions = uniqueReactionItems([
			reaction("empty", "alice", "", 1),
			reaction("whitespace", "alice", " ", 2),
			reaction("plus", "alice", "+", 3),
		]);

		expect(reactions).toHaveLength(1);
		expect(reactions[0]?.event.id).toBe("plus");
	});

	it("keeps the same reaction on different entities", () => {
		const first = reaction("first", "alice", "🔥", 1);
		const second = { ...reaction("second", "alice", "🔥", 2), entityId: "Q2" };
		expect(uniqueReactionItems([first, second])).toHaveLength(2);
	});
});
