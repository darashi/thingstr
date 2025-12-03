import type { ReactNode } from "react";
import { RelayPoolContext, relayPool } from "./relayPoolContext";

export function RelayPoolProvider({ children }: { children: ReactNode }) {
	return (
		<RelayPoolContext.Provider value={relayPool}>
			{children}
		</RelayPoolContext.Provider>
	);
}
