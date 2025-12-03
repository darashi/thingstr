import { useState } from "react";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
interface StarToggleProps {
	isStarred: boolean;
	isSaving?: boolean;
	onToggle: (current: boolean) => void;
	className?: string;
	size?: number;
	confirmUnstarMessage?: string;
	isDisabled?: boolean;
	isReadOnly?: boolean;
}

export default function StarToggle({
	isStarred,
	isSaving = false,
	onToggle,
	className = "",
	size = 24,
	confirmUnstarMessage,
	isDisabled = false,
	isReadOnly = false,
}: StarToggleProps) {
	const baseClassName =
		"inline-flex items-center justify-center w-10 h-10 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60";
	const stateClassName = isStarred
		? "text-primary"
		: "text-base-content/40 hover:text-primary";
	const disabledClassName =
		"cursor-not-allowed text-base-content/30 hover:text-base-content/30";
	const interactionClassName = isDisabled
		? disabledClassName
		: isReadOnly
			? "cursor-default"
			: "cursor-pointer";
	const colorClassName = isDisabled ? disabledClassName : stateClassName;
	const composedClassName = `${baseClassName} ${interactionClassName} ${colorClassName} ${className}`.trim();
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const ariaLabel = isDisabled
		? "Login to star this thing"
		: isReadOnly
			? "Star actions are not available here"
			: "Star this thing";

	const handleClick = () => {
		if (isDisabled || isReadOnly) return;
		if (isStarred && confirmUnstarMessage) {
			setIsConfirmOpen(true);
			return;
		}
		onToggle(isStarred);
	};

	const handleConfirm = () => {
		setIsConfirmOpen(false);
		onToggle(isStarred);
	};

	const handleCancel = () => {
		setIsConfirmOpen(false);
	};

	return (
		<>
			<div
				role="button"
				tabIndex={isDisabled || isReadOnly ? -1 : 0}
				onClick={handleClick}
				className={composedClassName}
				aria-pressed={isStarred}
				aria-label={ariaLabel}
				aria-busy={isSaving}
				aria-disabled={isDisabled || isReadOnly}
				title={isDisabled || isReadOnly ? ariaLabel : undefined}
			>
				{isStarred ? <IconStarFilled size={size} /> : <IconStar size={size} />}
			</div>

			{isConfirmOpen ? (
				<div className="modal modal-open">
					<div className="modal-box space-y-4">
						<h3 className="font-semibold text-lg">Remove star?</h3>
						<p className="text-sm text-base-content/70">{confirmUnstarMessage}</p>
						<div className="modal-action">
							<button
								type="button"
								className="btn btn-ghost"
								onClick={handleCancel}
							>
								Cancel
							</button>
							<button
								type="button"
								className="btn btn-primary"
								onClick={handleConfirm}
								disabled={isSaving}
							>
								Remove
							</button>
						</div>
					</div>
					<div className="modal-backdrop" onClick={handleCancel} aria-hidden="true">
						<button type="button" aria-label="Close" />
					</div>
				</div>
			) : null}
		</>
	);
}
