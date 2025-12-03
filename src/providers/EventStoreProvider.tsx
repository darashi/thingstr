import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { EventStore } from "applesauce-core";

const eventStore = new EventStore();

const EventStoreContext = createContext<EventStore | null>(null);

export function EventStoreProvider({ children }: { children: ReactNode }) {
	return (
		<EventStoreContext.Provider value={eventStore}>
			{children}
		</EventStoreContext.Provider>
	);
}

export function useEventStore() {
	const store = useContext(EventStoreContext);
	if (!store) {
		throw new Error("EventStoreProvider is missing in the component tree.");
	}
	return store;
}
