import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import { useBrowserLanguage } from "./hooks/useBrowserLanguage";
import { useWikidataEntity } from "./hooks/useWikidataEntity";
import IdBadge from "./components/IdBadge";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
	component: App,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: () => null,
});

const thingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "things/$id",
	component: function ThingPage() {
		const { id } = thingRoute.useParams();
		const language = useBrowserLanguage();
		const { label, description, isLoading, error } = useWikidataEntity(id, {
			language,
		});
		const showTitleSkeleton = isLoading || !label;
		const titleContent = showTitleSkeleton ? (
			<div className="skeleton h-6 w-32" />
		) : (
			<h1 className="text-xl font-semibold">{label}</h1>
		);
		return (
			<div className="card bg-base-100 shadow-sm rounded-md">
				<div className="card-body">
					<div className="flex items-center gap-2">
						{titleContent}
						<IdBadge id={id} />
					</div>
					{error ? (
						<p className="text-sm text-error">{error}</p>
					) : description ? (
						<p className="text-sm text-base-content/80">{description}</p>
					) : isLoading ? (
						<div className="skeleton h-4 w-48" />
					) : label ? (
						<p className="text-sm text-base-content/60">No description</p>
					) : (
						<div className="skeleton h-4 w-48" />
					)}
				</div>
			</div>
		);
	},
});

const routeTree = rootRoute.addChildren([indexRoute, thingRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<div className="bg-base-200 min-h-screen">
				<RouterProvider router={router} />
				{import.meta.env.DEV ? (
					<TanStackRouterDevtools router={router} initialIsOpen={false} />
				) : null}
			</div>
		</QueryClientProvider>
	</StrictMode>,
);
