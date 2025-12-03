interface IdBadgeProps {
	id: string;
	asLink?: boolean;
}

export default function IdBadge({ id, asLink = true }: IdBadgeProps) {
	if (asLink) {
		return (
			<a
				className="badge badge-primary badge-outline badge-sm"
				href={`https://www.wikidata.org/wiki/${id}`}
				target="_blank"
				rel="noreferrer"
				aria-label="Wikidata entity link"
			>
				{id}
			</a>
		);
	}

	return (
		<span
			className="badge badge-primary badge-outline badge-sm"
			aria-label="Entity ID"
		>
			{id}
		</span>
	);
}
