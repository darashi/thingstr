import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { IconBrandGithub } from "@tabler/icons-react";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import { useBrowserLanguage } from "./hooks/useBrowserLanguage";
import { useWikidataEntity } from "./hooks/useWikidataEntity";
import IdBadge from "./components/IdBadge";
import EntityProperties from "./components/EntityProperties";
import ReactionsCard from "./components/ReactionsCard";
import WikidataReactionsList from "./components/WikidataReactionsList";
import UserPage from "./components/UserPage";
import { EventStoreProvider } from "./providers/EventStoreProvider";
import { RelayPoolProvider } from "./providers/RelayPoolProvider";
import { useThingstrReactionsSubscription } from "./hooks/useThingstrReactionsSubscription";
import { useFollowersSubscription } from "./hooks/useFollowersSubscription";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
	component: App,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: () => (
		<div className="space-y-4">
			<div className="hero bg-base-100 border border-base-300 rounded-xl shadow-sm p-6">
				<div className="hero-content flex-col text-center gap-3 p-0">
					<h1 className="text-2xl font-bold leading-tight">
						React to every<span className="font-semibold text-primary">thing</span>.
					</h1>
					<p className="text-base-content/70">
						Create{" "}
						<a
							href="https://github.com/nostr-protocol/nips"
							className="link"
							target="_blank"
							rel="noreferrer"
						>
							Nostr
						</a>{" "}
						events that react to things on{" "}
						<a
							href="https://www.wikidata.org/"
							className="link"
							target="_blank"
							rel="noreferrer"
						>
							Wikidata
						</a>
						. As thingstr is beta, all reactions are sent to the dedicated
						thingstr relay and the data on the relay may be deleted.
					</p>
					<p className="text-base-content/60">
						Original idea:{" "}
						<a
							href="https://yakihonne.com/article/naddr1qvzqqqr4gupzqpuqfduxc63mgq9hkgxehly52q6l8tfp8kne0vx9p928vlpht32rqq255efedpr9snp3v4p564tgd4ury4n8fc6yx8asnpt"
							className="link"
							target="_blank"
							rel="noreferrer"
						>
							the article
						</a>
						.
					</p>
					<p className="text-base-content/60">
						<a
							href="https://github.com/darashi/thingstr"
							className="link inline-flex items-center"
							target="_blank"
							rel="noreferrer"
							aria-label="thingstr source code on GitHub"
						>
							<IconBrandGithub aria-hidden size={22} />
							darashi/thingstr
						</a>
					</p>{" "}
				</div>
			</div>
			<WikidataReactionsList />
		</div>
	),
});

const thingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "things/$id",
	component: function ThingPage() {
		const { id } = thingRoute.useParams();
		const language = useBrowserLanguage();
		const {
			label,
			description,
			properties,
			isLoading,
			isPropertiesLoading,
			loadingLabelIds,
			error,
			isLabelMissing,
			isDescriptionMissing,
			instanceOfIds,
		} = useWikidataEntity(id, {
			language,
		});

		useEffect(() => {
			const baseTitle = "thingstr";
			const nextTitle = label
				? `${label} | ${baseTitle}`
				: !isLoading
					? `${id} | ${baseTitle}`
					: baseTitle;
			document.title = nextTitle;
			return () => {
				document.title = baseTitle;
			};
		}, [id, isLoading, label]);

		const showTitleSkeleton = isLoading;
		const labelText = label ?? "No label defined";
		const labelClassName = isLabelMissing ? "italic text-base-content/60" : "";
		const titleContent = showTitleSkeleton ? (
			<div className="skeleton h-6 w-32" />
		) : (
			<h1 className={`text-xl font-semibold ${labelClassName}`.trim()}>
				{labelText}
			</h1>
		);
		return (
			<div className="space-y-4">
				<div className="card bg-base-100 shadow-sm rounded-md">
					<div className="card-body py-4">
						<div className="flex items-center gap-2">
							{titleContent}
							<IdBadge id={id} />
						</div>
						{error ? (
							<p className="text-sm text-error">{error}</p>
						) : description && !isDescriptionMissing ? (
							<p className="text-sm text-base-content/80">{description}</p>
						) : isLoading ? (
							<div className="skeleton h-4 w-48" />
						) : (
							<p className="text-sm italic text-base-content/60">
								No description defined
							</p>
						)}
					</div>
				</div>

				<ReactionsCard entityId={id} instanceOfIds={instanceOfIds} />

				{error ? null : (
					<div className="card bg-base-100 shadow-sm rounded-md">
						<div className="card-body py-4">
							<EntityProperties
								properties={properties}
								isLoading={isPropertiesLoading}
								loadingLabelIds={loadingLabelIds}
							/>
						</div>
					</div>
				)}
			</div>
		);
	},
});

const profileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "p/$npub",
	component: function ProfilePage() {
		const { npub } = profileRoute.useParams();
		return <UserPage npub={npub} />;
	},
});

const routeTree = rootRoute.addChildren([indexRoute, thingRoute, profileRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function ThingstrRelayBootstrap() {
	useThingstrReactionsSubscription();
	return null;
}

function FollowersBootstrap() {
	useFollowersSubscription();
	return null;
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RelayPoolProvider>
			<EventStoreProvider>
				<ThingstrRelayBootstrap />
				<FollowersBootstrap />
				<QueryClientProvider client={queryClient}>
					<div className="bg-base-200 min-h-screen">
						<RouterProvider router={router} />
						{import.meta.env.DEV ? (
							<TanStackRouterDevtools router={router} initialIsOpen={false} />
						) : null}
					</div>
				</QueryClientProvider>
			</EventStoreProvider>
		</RelayPoolProvider>
	</StrictMode>,
);
