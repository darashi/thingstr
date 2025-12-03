export const PROFILE_RELAYS = (
	import.meta.env.VITE_PROFILE_RELAYS as string
)
	.split(",")
	.map((relay) => relay.trim())
	.filter(Boolean);
