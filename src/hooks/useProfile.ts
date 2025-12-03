import { useEffect, useMemo, useState } from "react";
import { ProfileModel } from "applesauce-core/models";
import { useEventStore } from "./useEventStore";
import { useRelayPool } from "./useRelayPool";
import { PROFILE_RELAYS } from "../config/relays";

const LEGACY_PROFILE_CACHE_PREFIX = "thingstr.profile.";

interface UseProfileResult {
	picture: string | null;
	name: string | null;
	isLoading: boolean;
}

type ProfileState = {
	picture: string | null;
	name: string | null;
	pubkey: string | null;
};

export function useProfile(pubkey: string | null | undefined): UseProfileResult {
	const eventStore = useEventStore();
	const relayPool = useRelayPool();

	const [profile, setProfile] = useState<ProfileState>({
		picture: null,
		name: null,
		pubkey: null,
	});

	// clean up legacy localStorage cache if it exists
	useEffect(() => {
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith(LEGACY_PROFILE_CACHE_PREFIX)) {
					localStorage.removeItem(key);
				}
			}
		} catch (error) {
			console.error("Failed to clear legacy profile cache", error);
		}
	}, []);

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
		const sub = model$.subscribe((profileModel) => {
			const nextPicture = profileModel?.picture ?? null;
			const nextName =
				(profileModel as { display_name?: string })?.display_name ??
				(profileModel as { name?: string })?.name ??
				null;
			setProfile({ picture: nextPicture, name: nextName, pubkey });
		});
		return () => sub.unsubscribe();
	}, [eventStore, pubkey]);

	const { picture, name, isLoading } = useMemo(() => {
		const isCurrent = Boolean(pubkey) && profile.pubkey === pubkey;
		return {
			picture: isCurrent ? profile.picture : null,
			name: isCurrent ? profile.name : null,
			isLoading: Boolean(pubkey) && !isCurrent,
		};
	}, [profile, pubkey]);

	return { picture, name, isLoading };
}
