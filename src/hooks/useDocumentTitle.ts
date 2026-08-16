import { useEffect } from "react";

const BASE_TITLE = "thingstr";

export function useDocumentTitle(subject: string | null): void {
	useEffect(() => {
		document.title = subject ? `${subject} | ${BASE_TITLE}` : BASE_TITLE;
		return () => {
			document.title = BASE_TITLE;
		};
	}, [subject]);
}
