import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import RelaySubscriptions from "./components/RelaySubscriptions";
import { EventStoreProvider } from "./providers/EventStoreProvider";
import { RelayPoolProvider } from "./providers/RelayPoolProvider";
import { WikidataReactionsProvider } from "./providers/WikidataReactionsProvider";
import { router } from "./router";

const queryClient = new QueryClient();

export default function AppBootstrap() {
	return (
		<RelayPoolProvider>
			<EventStoreProvider>
				<WikidataReactionsProvider>
					<RelaySubscriptions />
					<QueryClientProvider client={queryClient}>
						<div className="bg-base-200 min-h-screen">
							<RouterProvider router={router} />
							{import.meta.env.DEV ? (
								<TanStackRouterDevtools
									router={router}
									initialIsOpen={false}
								/>
							) : null}
						</div>
					</QueryClientProvider>
				</WikidataReactionsProvider>
			</EventStoreProvider>
		</RelayPoolProvider>
	);
}
