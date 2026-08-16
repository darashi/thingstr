import { useFollowersSubscription } from "../hooks/useFollowersSubscription";
import { useThingstrReactionsSubscription } from "../hooks/useThingstrReactionsSubscription";

export default function RelaySubscriptions() {
	useThingstrReactionsSubscription();
	useFollowersSubscription();
	return null;
}
