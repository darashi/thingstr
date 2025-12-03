import { IconLogin } from "@tabler/icons-react";
import SearchBar from "./SearchBar";

export default function Navbar() {
	return (
		<div className="navbar bg-base-100 shadow-sm">
			<div className="container mx-auto flex items-center gap-2">
				<div className="flex-none">
					<a href="/" className="btn btn-ghost text-xl">
						thingstr
					</a>
				</div>
				<div className="flex flex-1 items-center gap-2">
					<SearchBar className="flex-1" />
					<div className="dropdown dropdown-end">
						<div
							tabIndex={0}
							role="button"
							className="btn btn-ghost btn-circle"
						>
							<IconLogin size={22} className="text-primary" />
						</div>
						<ul
							tabIndex={-1}
							className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
						>
							<li>
								<a className="justify-between">
									Profile
									<span className="badge">New</span>
								</a>
							</li>
							<li>
								<a>Settings</a>
							</li>
							<li>
								<a>Logout</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
