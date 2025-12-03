function parseRelays(value: string | undefined) {
	return (value ?? "")
		.split(",")
		.map((relay) => relay.trim())
		.filter(Boolean);
}

export const PROFILE_RELAYS = parseRelays(
	import.meta.env.VITE_PROFILE_RELAYS as string | undefined,
);

export const THINGSTR_RELAYS = parseRelays(
	import.meta.env.VITE_THINGSTR_RELAYS as string | undefined,
);
