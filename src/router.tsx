import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import App from "./App";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ThingPage from "./pages/ThingPage";

const rootRoute = createRootRoute({
	component: App,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: HomePage,
});

const thingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "things/$id",
	component: ThingPage,
});

const profileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "p/$npub",
	component: ProfilePage,
});

const routeTree = rootRoute.addChildren([indexRoute, thingRoute, profileRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
