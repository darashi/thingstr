import { createContext } from "react";
import { RelayPool } from "applesauce-relay";

export const relayPool = new RelayPool();

export const RelayPoolContext = createContext<RelayPool | null>(null);
