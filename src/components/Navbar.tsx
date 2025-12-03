import { IconLogin, IconUser } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import SearchBar from "./SearchBar";
import { useNip07Auth } from "../hooks/useNip07Auth";
import { useProfile } from "../hooks/useProfile";

export default function Navbar() {
	const { session, isLoggingIn, login, logout, setProfilePicture } =
		useNip07Auth();
	const pubkey = session?.pubkey ?? null;
	const cachedPicture = useProfile(pubkey);
	const profileImage = session?.picture ?? cachedPicture ?? null;

	if (pubkey && cachedPicture && session?.picture !== cachedPicture) {
		setProfilePicture(cachedPicture);
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
						<div className="dropdown dropdown-end">
							<div tabIndex={0} role="button">
								<div className="avatar">
									<div className="w-10 rounded-full bg-primary/20 text-primary-content flex items-center justify-center font-semibold border border-transparent hover:bg-primary/20 overflow-hidden">
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
							</div>
							<ul
								tabIndex={0}
								className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-44 p-2 shadow"
							>
								<li>
									<button type="button" onClick={logout}>
										Log out
									</button>
								</li>
							</ul>
						</div>
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
