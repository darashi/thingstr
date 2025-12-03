import { useEffect, useState } from "react";

interface WikidataEntity {
	labels?: Record<string, { value: string }>;
	descriptions?: Record<string, { value: string }>;
}

interface WikidataEntityResponse {
	entities: Record<string, WikidataEntity>;
}

interface UseWikidataEntityOptions {
	language?: string;
}

const ENDPOINT = "https://www.wikidata.org/w/api.php";

export function useWikidataEntity(
	id: string,
	options: UseWikidataEntityOptions = {},
) {
	const { language = "en" } = options;
	const [label, setLabel] = useState<string | null>(null);
	const [description, setDescription] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) {
			setLabel(null);
			setDescription(null);
			setError("Missing entity id");
			return;
		}

		const controller = new AbortController();

		const fetchEntity = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const languagesParam =
					language === "en" ? "en" : `${language}|en`;

				const params = new URLSearchParams({
					action: "wbgetentities",
					format: "json",
					ids: id,
					origin: "*",
					languages: languagesParam,
					props: "labels|descriptions",
				});

				const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error("Failed to load entity");
				}

				const data = (await response.json()) as WikidataEntityResponse;
				const entity = data.entities?.[id];

				if (!entity) {
					throw new Error("Entity not found");
				}

				const labels = entity.labels ?? {};
				const descriptions = entity.descriptions ?? {};

				const pickValue = (
					values: Record<string, { value: string }> | undefined,
				): string | null => {
					if (!values) return null;
					return (
						values[language]?.value ??
						values.en?.value ??
						Object.values(values)[0]?.value ??
						null
					);
				};

				const nextLabel = pickValue(labels);
				const nextDescription = pickValue(descriptions);

				setLabel(nextLabel);
				setDescription(nextDescription);
			} catch (err) {
				if (controller.signal.aborted) {
					return;
				}

				setLabel(null);
				setDescription(null);
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchEntity();

		return () => controller.abort();
	}, [id, language]);

	return { label, description, isLoading, error };
}
