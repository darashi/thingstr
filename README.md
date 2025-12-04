# Thingstr

Thingstr is a web application that allows you to react to every thing on the Wikidata
knowledge base. The reactions are stored using the [Nostr](http://github.com/nostr-protocol/nips/) protocol.

Reactions are recorded as `kind:17` events with the `k` tag containing `wikidata`.
The `i` tag stores the Wikidata entity ID the reaction targets.
