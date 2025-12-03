import { useMemo } from "react";

const DEFAULT_LANGUAGE = "en";

const normalizeLanguage = (value?: string) =>
	value?.slice(0, 2).toLowerCase() || DEFAULT_LANGUAGE;

export function useBrowserLanguage() {
	return useMemo(() => {
		if (typeof navigator === "undefined") {
			return DEFAULT_LANGUAGE;
		}
		return normalizeLanguage(navigator.language || navigator.languages?.[0]);
	}, []);
}
