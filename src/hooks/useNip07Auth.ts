import { useCallback, useEffect, useState } from "react";

declare global {
	interface Window {
		nostr?: {
			getPublicKey?: () => Promise<string>;
			signEvent?: (event: unknown) => Promise<unknown>;
		};
	}
}

const AUTH_STORAGE_KEY = "thingstr.auth";

interface Nip07Session {
	pubkey: string;
	picture?: string | null;
}

const readStoredSession = (): Nip07Session | null => {
	try {
		const stored = localStorage.getItem(AUTH_STORAGE_KEY);
		if (!stored) return null;
		const parsed = JSON.parse(stored) as Nip07Session;
		return parsed.pubkey ? parsed : null;
	} catch (error) {
		console.error("Failed to load auth state", error);
		localStorage.removeItem(AUTH_STORAGE_KEY);
		return null;
	}
};

type SessionUpdater =
	| Nip07Session
	| null
	| ((prev: Nip07Session | null) => Nip07Session | null);

let currentSession: Nip07Session | null = readStoredSession();
const subscribers = new Set<(value: Nip07Session | null) => void>();

const notifySubscribers = () => {
	subscribers.forEach((subscriber) => subscriber(currentSession));
};

const setSharedSession = (updater: SessionUpdater) => {
	const nextSession =
		typeof updater === "function" ? updater(currentSession) : updater;
	currentSession = nextSession;
	if (nextSession) {
		localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
	} else {
		localStorage.removeItem(AUTH_STORAGE_KEY);
	}
	notifySubscribers();
};

const subscribe = (listener: (value: Nip07Session | null) => void) => {
	subscribers.add(listener);
	return () => {
		subscribers.delete(listener);
	};
};

export function useNip07Auth() {
	const [session, setSession] = useState<Nip07Session | null>(currentSession);
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	useEffect(() => subscribe(setSession), []);

	const updateSession = useCallback((updater: SessionUpdater) => {
		setSharedSession(updater);
	}, []);

	const login = useCallback(async () => {
		if (isLoggingIn) return;
		if (!window.nostr?.getPublicKey) {
			window.alert("NIP-07 extension not found.");
			return;
		}
		try {
			setIsLoggingIn(true);
			const pubkey = await window.nostr.getPublicKey();
			const nextSession: Nip07Session = { pubkey };
			updateSession(nextSession);
		} catch (error) {
			console.error("Failed to login with NIP-07", error);
			window.alert("Failed to login with NIP-07.");
		} finally {
			setIsLoggingIn(false);
		}
	}, [isLoggingIn, updateSession]);

	const logout = useCallback(() => {
		updateSession(null);
	}, [updateSession]);

	const setProfilePicture = useCallback(
		(picture: string | null | undefined) => {
			updateSession((prev) => {
				if (!prev) return prev;
				const nextPicture = picture ?? null;
				if (prev.picture === nextPicture) return prev;
				return { ...prev, picture: nextPicture };
			});
		},
		[updateSession],
	);

	return {
		session,
		isLoggingIn,
		login,
		logout,
		setProfilePicture,
	};
}
