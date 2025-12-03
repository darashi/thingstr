import { IconLogin, IconUser } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import SearchBar from "./SearchBar";
import { useNip07Auth } from "../hooks/useNip07Auth";
import { useProfile } from "../hooks/useProfile";
import { encodeNpub } from "../lib/nostr";

export default function Navbar() {
	const { session, isLoggingIn, login, logout, setProfilePicture } =
		useNip07Auth();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const pubkey = session?.pubkey ?? null;
	const npubLink = pubkey ? encodeNpub(pubkey) ?? pubkey : null;
	const { picture: profilePicture } = useProfile(pubkey);
	const profileImage = session?.picture ?? profilePicture ?? null;

	if (pubkey && profilePicture && session?.picture !== profilePicture) {
		setProfilePicture(profilePicture);
	}

	return (
		<div className="navbar bg-base-100 shadow-sm">
			<div className="container mx-auto flex items-center gap-2">
				<div className="flex-none">
					<Link to="/" className="btn btn-ghost text-xl">
						thingstr
					</Link>
				</div>
				<div className="flex flex-1 items-center gap-2">
					<SearchBar className="flex-1" />
					{pubkey ? (
						<details
							className={`dropdown dropdown-end${isMenuOpen ? " dropdown-open" : ""}`}
							open={isMenuOpen}
							onToggle={(event) => setIsMenuOpen(event.currentTarget.open)}
						>
							<summary className="btn btn-ghost btn-circle ml-2">
								<div className="avatar">
									<div className="w-10 rounded-full bg-primary/20 text-primary-content flex items-center justify-center font-semibold hover:bg-primary/20 overflow-hidden">
										{profileImage ? (
											<img
												src={profileImage}
												alt="Profile"
												className="w-full h-full object-cover"
											/>
										) : (
											<IconUser size={22} />
										)}
									</div>
								</div>
							</summary>
							<ul
								className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-56 p-3 shadow"
							>
								<li className="text-lg leading-relaxed">
									{npubLink ? (
										<Link
											to="/p/$npub"
											params={{ npub: npubLink }}
											onClick={() => setIsMenuOpen(false)}
											className="block py-3 px-2"
										>
											My page
										</Link>
									) : (
										<span className="block py-3 px-2 text-base-content/60">
											My page
										</span>
									)}
								</li>
								<li className="text-lg leading-relaxed">
									<button
										type="button"
										onClick={() => {
											logout();
											setIsMenuOpen(false);
										}}
										className="text-left block w-full py-3 px-2"
									>
										Log out
									</button>
								</li>
							</ul>
						</details>
					) : (
						<div
							className="tooltip tooltip-bottom"
							data-tip="Login with NIP-07"
						>
							<button
								className="btn btn-ghost btn-circle hover:bg-primary/20 border-transparent hover:border-transparent"
								onClick={login}
								disabled={isLoggingIn}
								aria-label="Login with NIP-07"
							>
								<IconLogin size={22} className="text-primary" />
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
