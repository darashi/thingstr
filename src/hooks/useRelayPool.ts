import { useContext } from "react";
import { RelayPoolContext } from "../providers/relayPoolContext";

export function useRelayPool() {
	const pool = useContext(RelayPoolContext);
	if (!pool) {
		throw new Error("RelayPoolProvider is missing in the component tree.");
	}
	return pool;
}
