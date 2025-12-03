import { useEffect, useState } from "react";

const DEFAULT_LANGUAGE = "en";

const normalizeLanguage = (value?: string) =>
	value?.slice(0, 2).toLowerCase() || DEFAULT_LANGUAGE;

export function useBrowserLanguage() {
	const [language, setLanguage] = useState<string>(() => {
		if (typeof navigator === "undefined") {
			return DEFAULT_LANGUAGE;
		}
		return normalizeLanguage(navigator.language || navigator.languages?.[0]);
	});

	useEffect(() => {
		if (typeof navigator === "undefined") {
			return;
		}

		const preferred = normalizeLanguage(
			navigator.language || navigator.languages?.[0],
		);
		setLanguage(preferred);
	}, []);

	return language;
}
