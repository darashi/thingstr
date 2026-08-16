import { Outlet } from "@tanstack/react-router";
import Navbar from "./components/Navbar";

function App() {
	return (
		<>
			<Navbar />
			<main className="container mx-auto py-6 px-3">
				<Outlet />
			</main>
		</>
	);
}

export default App;
