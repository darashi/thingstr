import { useContext } from "react";
import { EventStoreContext } from "../providers/eventStoreContext";

export function useEventStore() {
	const store = useContext(EventStoreContext);
	if (!store) {
		throw new Error("EventStoreProvider is missing in the component tree.");
	}
	return store;
}
