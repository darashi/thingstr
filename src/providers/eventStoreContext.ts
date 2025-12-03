import { createContext } from "react";
import { EventStore } from "applesauce-core";

export const eventStore = new EventStore();

export const EventStoreContext = createContext<EventStore | null>(null);
