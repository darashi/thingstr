import { Outlet } from "@tanstack/react-router";
import "./App.css";
import Navbar from "./components/Navbar";

function App() {
	return (
		<>
			<Navbar />
			<main className="container mx-auto py-6">
				<Outlet />
			</main>
		</>
	);
}

export default App;
