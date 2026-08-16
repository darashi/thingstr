import { useParams } from "@tanstack/react-router";
import UserPage from "../components/UserPage";

export default function ProfilePage() {
	const { npub } = useParams({ from: "/p/$npub" });
	return <UserPage npub={npub} />;
}
