import { useDeferredValue, useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { useBrowserLanguage } from "../hooks/useBrowserLanguage";
import { useWikidataSearch } from "../hooks/useWikidataSearch";
import IdBadge from "./IdBadge";

interface SearchBarProps {
	className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
	const language = useBrowserLanguage();
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const hasQuery = useMemo(() => query.trim().length > 0, [query]);
	const { results, isLoading, error } = useWikidataSearch(deferredQuery, {
		language,
	});

	return (
		<div className={`relative ${className ?? ""}`}>
			<input
				type="text"
				placeholder="Search"
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				className="input input-bordered w-full pl-10"
			/>
			<IconSearch
				size={20}
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60 z-10"
			/>
			{hasQuery ? (
				<div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md bg-base-100 shadow-lg">
					{isLoading ? (
						<div className="px-4 py-3 text-sm text-base-content/70">
							Searching...
						</div>
					) : results.length ? (
						<ul className="max-h-[60vh] overflow-y-auto">
							{results.map((item) => (
								<li key={item.id}>
									<a
										className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-base-200"
										href={`/things/${item.id}`}
									>
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold">
												{item.label}
											</span>
											<IdBadge id={item.id} asLink={false} />
										</div>
										{item.description ? (
											<span className="text-xs text-base-content/70">
												{item.description}
											</span>
										) : null}
									</a>
								</li>
							))}
						</ul>
					) : (
						<div className="px-4 py-3 text-sm text-base-content/70">
							No matches found
						</div>
					)}
					{error ? (
						<div className="border-t border-base-300 px-4 py-3 text-xs text-error">
							{error}
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
