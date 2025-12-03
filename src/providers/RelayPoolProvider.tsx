import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { RelayPool } from "applesauce-relay";

const relayPool = new RelayPool();

const RelayPoolContext = createContext<RelayPool | null>(null);

export function RelayPoolProvider({ children }: { children: ReactNode }) {
	return (
		<RelayPoolContext.Provider value={relayPool}>
			{children}
		</RelayPoolContext.Provider>
	);
}

export function useRelayPool() {
	const pool = useContext(RelayPoolContext);
	if (!pool) {
		throw new Error("RelayPoolProvider is missing in the component tree.");
	}
	return pool;
}
