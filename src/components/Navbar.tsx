import { IconLogin, IconSearch } from "@tabler/icons-react";

export default function Navbar() {
	return (
		<div className="navbar bg-base-100 shadow-sm">
			<div className="container mx-auto flex items-center gap-2">
				<div className="flex-none">
					<a className="btn btn-ghost text-xl">Thingstr</a>
				</div>
				<div className="flex flex-1 items-center gap-2">
					<div className="relative flex-1">
						<input
							type="text"
							placeholder="Search"
							className="input input-bordered w-full pl-10"
						/>
						<IconSearch
							size={20}
							className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60 z-10"
						/>
					</div>
					<div className="dropdown dropdown-end">
						<div
							tabIndex={0}
							role="button"
							className="btn btn-ghost btn-circle"
						>
							<IconLogin size={22} />
						</div>
						<ul
							tabIndex="-1"
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
