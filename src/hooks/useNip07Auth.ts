import { useCallback, useEffect, useState } from "react";

declare global {
	interface Window {
		nostr?: {
			getPublicKey?: () => Promise<string>;
		};
	}
}

const AUTH_STORAGE_KEY = "thingstr.auth";

interface Nip07Session {
	pubkey: string;
}

export function useNip07Auth() {
	const [session, setSession] = useState<Nip07Session | null>(null);
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	const login = useCallback(async () => {
		if (isLoggingIn) return;
		if (!window.nostr?.getPublicKey) {
			window.alert("NIP-07 extension not found.");
			return;
		}
		try {
			setIsLoggingIn(true);
			const pubkey = await window.nostr.getPublicKey();
			const nextSession = { pubkey };
			setSession(nextSession);
			localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
		} catch (error) {
			console.error("Failed to login with NIP-07", error);
			window.alert("Failed to login with NIP-07.");
		} finally {
			setIsLoggingIn(false);
		}
	}, [isLoggingIn]);

	const logout = useCallback(() => {
		setSession(null);
		localStorage.removeItem(AUTH_STORAGE_KEY);
	}, []);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(AUTH_STORAGE_KEY);
			if (!stored) return;
			const parsed = JSON.parse(stored) as { pubkey?: string };
			if (parsed.pubkey) {
				setSession({ pubkey: parsed.pubkey });
			}
		} catch (error) {
			console.error("Failed to load auth state", error);
			localStorage.removeItem(AUTH_STORAGE_KEY);
		}
	}, []);

	return {
		session,
		isLoggingIn,
		login,
		logout,
	};
}
