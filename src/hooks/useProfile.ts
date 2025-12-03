import { useEffect, useMemo } from "react";
import { ProfileModel } from "applesauce-core/models";
import { useEventStore } from "../providers/EventStoreProvider";
import { useRelayPool } from "../providers/RelayPoolProvider";
import { PROFILE_RELAYS } from "../config/relays";

const PROFILE_CACHE_KEY = (pubkey: string) => `thingstr.profile.${pubkey}`;

const getCachedProfile = (pubkey: string) => {
	try {
		const stored = localStorage.getItem(PROFILE_CACHE_KEY(pubkey));
		if (!stored) return null;
		const parsed = JSON.parse(stored) as { picture?: string | null };
		return parsed.picture ?? null;
	} catch (error) {
		console.error("Failed to parse cached profile", error);
		localStorage.removeItem(PROFILE_CACHE_KEY(pubkey));
		return null;
	}
};

export function useProfile(pubkey: string | null | undefined) {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();

	// read cache synchronously for initial render
	const cachedPicture = useMemo(
		() => (pubkey ? getCachedProfile(pubkey) : null),
		[pubkey],
	);

	useEffect(() => {
		if (!pubkey) return;

		const group = relayPool.group(PROFILE_RELAYS);
		const sub = group
			.request({ kinds: [0], authors: [pubkey], limit: 1 })
			.subscribe({
				next: (event) => eventStore.add(event),
				error: (error) => {
					console.error("Failed to load profile", error);
				},
			});

		return () => sub.unsubscribe();
	}, [eventStore, pubkey, relayPool]);

	useEffect(() => {
		if (!pubkey) return;
		const model$ = eventStore.model(ProfileModel, pubkey);
		const sub = model$.subscribe((profile) => {
			if (profile?.picture) {
				localStorage.setItem(
					PROFILE_CACHE_KEY(pubkey),
					JSON.stringify({ picture: profile.picture }),
				);
			}
		});
		return () => sub.unsubscribe();
	}, [eventStore, pubkey]);

	return cachedPicture;
}
