import {
	IconMoodPlus,
	IconSearch,
	IconStar,
	IconStarFilled,
	IconX,
} from "@tabler/icons-react";
import {
	useId,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from "react";
import {
	loadEmojiShortcodeCatalog,
	searchEmojiShortcodes,
	type EmojiShortcode,
} from "../lib/emojiShortcodes";
import {
	readRecentEmojiReactions,
	rememberEmojiReaction,
} from "../lib/recentEmojiReactions";
import {
	isLikeReaction,
	parseEmojiReaction,
	reactionSymbol,
} from "../lib/reactions";

interface EmojiReactionPickerProps {
	isLoggedIn: boolean;
	isSaving: boolean;
	ownEmojiReactionContents: string[];
	hasReaction: (content: string) => boolean;
	onToggle: (content: string) => Promise<void>;
}

interface ReactionTileProps {
	symbol: string;
	label: string;
	isActive: boolean;
	isSaving: boolean;
	showActiveState?: boolean;
	onClick: (() => void) | null;
}

interface FavoriteReactionButtonProps {
	isFavorite: boolean;
	isDisabled: boolean;
	label: string;
	className: string;
	onClick: () => void;
}

function FavoriteReactionButton({
	isFavorite,
	isDisabled,
	label,
	className,
	onClick,
}: FavoriteReactionButtonProps) {
	return (
		<button
			type="button"
			className={`btn btn-ghost ${className} ${isFavorite ? "text-primary" : "text-base-content/40"}`}
			onClick={onClick}
			disabled={isDisabled}
			aria-label={label}
			aria-pressed={isFavorite}
			title={label}
		>
			{isFavorite ? (
				<IconStarFilled size={24} />
			) : (
				<IconStar size={24} />
			)}
		</button>
	);
}

function ReactionTile({
	symbol,
	label,
	isActive,
	isSaving,
	showActiveState = true,
	onClick,
}: ReactionTileProps) {
	const isInteractive = onClick !== null;
	const isActiveVisible = isActive && showActiveState;

	return (
		<span className="indicator">
			{isActiveVisible ? (
				<span
					className="indicator-item indicator-end indicator-top status status-primary status-xs"
					aria-hidden="true"
				/>
			) : null}
			<button
				type="button"
				className={`btn btn-ghost btn-square btn-md text-xl ${isActiveVisible ? `bg-primary/10 ring-1 ring-primary/30 ${isInteractive ? "" : "cursor-default"}` : ""}`}
				onClick={onClick ?? undefined}
				disabled={isSaving}
				aria-label={label}
				aria-disabled={!isInteractive || undefined}
				aria-pressed={isActive}
				tabIndex={isInteractive ? undefined : -1}
				title={label}
			>
				{symbol}
			</button>
		</span>
	);
}

export default function EmojiReactionPicker({
	isLoggedIn,
	isSaving,
	ownEmojiReactionContents,
	hasReaction,
	onToggle,
}: EmojiReactionPickerProps) {
	const reactId = useId().replaceAll(":", "");
	const popoverId = `emoji-reaction-${reactId}`;
	const anchorName = `--${popoverId}`;
	const popoverRef = useRef<HTMLSpanElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [recentEmoji, setRecentEmoji] = useState<string[]>([]);
	const [catalog, setCatalog] = useState<EmojiShortcode[] | null>(null);
	const [isCatalogLoading, setIsCatalogLoading] = useState(false);
	const [catalogError, setCatalogError] = useState(false);
	const emoji = useMemo(() => parseEmojiReaction(input), [input]);
	const searchResults = useMemo(
		() => (catalog && !emoji ? searchEmojiShortcodes(catalog, input) : []),
		[catalog, emoji, input],
	);
	const hasFavorite = hasReaction("+");
	const triggerStyle: CSSProperties = { anchorName };
	const popoverStyle: CSSProperties = { positionAnchor: anchorName };

	const prepareToOpen = () => {
		if (popoverRef.current?.matches(":popover-open")) return;
		setInput("");
		setError(null);
		setRecentEmoji(readRecentEmojiReactions());
		if (catalog || isCatalogLoading) return;

		setCatalogError(false);
		setIsCatalogLoading(true);
		void loadEmojiShortcodeCatalog()
			.then(setCatalog)
			.catch((loadError: unknown) => {
				console.error("Failed to load emoji shortcodes", loadError);
				setCatalogError(true);
			})
			.finally(() => setIsCatalogLoading(false));
	};
	const close = () => {
		if (popoverRef.current?.matches(":popover-open")) {
			popoverRef.current.hidePopover();
		}
	};
	const toggleAndClose = async (content: string) => {
		const wasReacted = hasReaction(content);
		try {
			await onToggle(content);
			if (!isLikeReaction(content) && !wasReacted) {
				setRecentEmoji(rememberEmojiReaction(content));
			}
			close();
		} catch {
			// The caller reports signing and publishing errors.
		}
	};
	const addAndClose = async (content: string) => {
		if (hasReaction(content)) return;
		await toggleAndClose(content);
	};
	const removeAndClose = async (content: string) => {
		if (!hasReaction(content)) return;
		await toggleAndClose(content);
	};
	const submit = async () => {
		const selectedEmoji = emoji ?? searchResults[0]?.emoji;
		if (!selectedEmoji) {
			setError(input.trim() ? "No matching emoji." : "Enter one emoji.");
			return;
		}
		if (hasReaction(selectedEmoji)) {
			setError(
				"Reaction already added. Remove it from your reactions below.",
			);
			return;
		}
		await addAndClose(selectedEmoji);
	};

	const triggerLabel = isLoggedIn
		? "Add reaction"
		: "Log in with Nostr to react";
	const favoriteLabel = !isLoggedIn
		? "Log in with Nostr to favorite"
		: hasFavorite
			? "Remove favorite"
			: "Add favorite";

	return (
		<>
			<span className="inline-flex">
				<FavoriteReactionButton
					isFavorite={hasFavorite}
					isDisabled={!isLoggedIn || isSaving}
					label={favoriteLabel}
					className="btn-circle btn-md"
					onClick={() => void toggleAndClose("+")}
				/>
				<button
					type="button"
					className="btn btn-ghost btn-circle btn-md text-base-content/40"
					style={triggerStyle}
					popoverTarget={isLoggedIn ? popoverId : undefined}
					onClick={prepareToOpen}
					disabled={!isLoggedIn || isSaving}
					aria-label={triggerLabel}
					aria-controls={isLoggedIn ? popoverId : undefined}
					aria-haspopup="dialog"
					title={triggerLabel}
				>
					<IconMoodPlus size={24} />
				</button>
			</span>

			<span
				ref={popoverRef}
				id={popoverId}
				popover="auto"
				className="dropdown dropdown-end z-50 max-h-[min(32rem,calc(100vh-1rem))] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-box border border-base-300 bg-base-100 p-3 text-sm text-base-content shadow-xl"
				style={popoverStyle}
				role="dialog"
				aria-label="Add reaction"
				onToggle={(event) => {
					if (event.newState === "open") inputRef.current?.focus();
				}}
			>
				<span className="flex items-start gap-1">
					<span
						className="flex min-w-0 flex-1 flex-wrap gap-1"
						aria-label="Quick reactions"
					>
						<FavoriteReactionButton
							isFavorite={hasFavorite}
							isDisabled={isSaving}
							label={hasFavorite ? "Remove favorite" : "Add favorite"}
							className="btn-square btn-md"
							onClick={() => void toggleAndClose("+")}
						/>
						{recentEmoji.map((content) => {
							const isActive = hasReaction(content);
							return (
								<ReactionTile
									key={content}
									symbol={content}
									label={
										isActive
											? `Remove ${content} reaction`
											: `Add ${content} reaction`
									}
									isActive={isActive}
									isSaving={isSaving}
									showActiveState={false}
									onClick={() => void toggleAndClose(content)}
								/>
							);
						})}
					</span>
					<span className="flex shrink-0 items-center gap-1">
						{isSaving ? (
							<span className="loading loading-spinner loading-xs" />
						) : null}
						<button
							type="button"
							className="btn btn-ghost btn-circle btn-md"
							onClick={close}
							aria-label="Close"
						>
							<IconX size={14} />
						</button>
					</span>
				</span>

				<label className="input input-sm mt-2 flex w-full">
					<IconSearch size={14} className="text-base-content/40" />
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(event) => {
							setInput(event.target.value);
							setError(null);
						}}
						onKeyDown={(event) => {
							if (event.key !== "Enter") return;
							event.preventDefault();
							void submit();
						}}
						placeholder="Search :fire: or paste emoji"
						autoComplete="off"
						aria-label="Search emoji by shortcode or paste one emoji"
						aria-invalid={Boolean(error)}
					/>
				</label>

				{input.trim() ? (
					<span className="mt-2 block">
						{isCatalogLoading && !emoji ? (
							<span className="flex items-center justify-center gap-2 py-3 text-xs text-base-content/60">
								<span className="loading loading-spinner loading-xs" />
								Loading emoji…
							</span>
						) : catalogError && !emoji ? (
							<span className="block py-2 text-center text-xs text-error">
								Unable to load emoji search.
							</span>
						) : emoji ? (
							<span
								className="grid grid-cols-6 gap-1"
								aria-label="Matching emoji"
							>
								<ReactionTile
									symbol={emoji}
									label={
										hasReaction(emoji)
											? `${emoji} reaction already added`
											: `Add ${emoji} reaction`
									}
									isActive={hasReaction(emoji)}
									isSaving={isSaving}
									onClick={
										hasReaction(emoji)
											? null
											: () => void addAndClose(emoji)
									}
								/>
							</span>
						) : searchResults.length > 0 ? (
							<span
								className="grid grid-cols-6 gap-1"
								aria-label="Matching emoji"
							>
								{searchResults.map((result) => {
									const isActive = hasReaction(result.emoji);
									return (
										<ReactionTile
											key={`${result.emoji}:${result.shortcode}`}
											symbol={result.emoji}
											label={
												isActive
													? `:${result.shortcode}: reaction already added`
													: `Add :${result.shortcode}: reaction`
											}
											isActive={isActive}
											isSaving={isSaving}
											onClick={
												isActive
													? null
													: () => void addAndClose(result.emoji)
											}
										/>
									);
								})}
							</span>
						) : catalog ? (
							<span className="block py-2 text-center text-xs text-base-content/60">
								No matching emoji.
							</span>
						) : null}
					</span>
				) : null}

				{error ? (
					<span className="mt-1 block text-xs text-error">{error}</span>
				) : null}

				{ownEmojiReactionContents.length > 0 ? (
					<span
						className="mt-3 flex flex-wrap gap-1 border-t border-base-200 pt-2"
						aria-label="Your reactions"
					>
						{ownEmojiReactionContents.map((content) => {
							const symbol = reactionSymbol(content);
							return (
								<button
									type="button"
									key={content}
									className="btn btn-md gap-1 px-3"
									onClick={() => void removeAndClose(content)}
									disabled={isSaving}
									aria-label={`Remove ${symbol} reaction`}
									title={`Remove ${symbol} reaction`}
								>
									<span className="text-lg">{symbol}</span>
									<IconX size={12} className="text-base-content/50" />
								</button>
							);
						})}
					</span>
				) : null}
			</span>
		</>
	);
}
