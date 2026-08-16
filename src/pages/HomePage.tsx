import { IconBrandGithub } from "@tabler/icons-react";
import WikidataReactionsList from "../components/WikidataReactionsList";
import { THINGSTR_RELAYS } from "../config/relays";

export default function HomePage() {
	return (
		<div className="space-y-4">
			<div className="hero bg-base-100 border border-base-300 rounded-xl shadow-sm p-6">
				<div className="hero-content flex-col text-center gap-3 p-0">
					<h1 className="text-2xl font-bold leading-tight">
						React to every
						<span className="font-semibold text-primary">thing</span>.
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
						thingstr relay and the data on the relay may be deleted. The relay
						is at <code>{THINGSTR_RELAYS.join(",")}</code> (as for now)
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
	);
}
