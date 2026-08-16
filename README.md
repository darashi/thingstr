# Thingstr

Thingstr is a web application that allows you to react to every thing on the Wikidata
knowledge base. The reactions are stored using the [Nostr](http://github.com/nostr-protocol/nips/) protocol.

Reactions are recorded as `kind:17` events using Thingstr's application-specific
external identifier namespace. The `k` tag contains `wikidata`, and the `i` tag
stores the target as `wd:Q...` or `wdt:P...`.

The event `content` contains the reaction value. Thingstr trims it and normalizes
it to Unicode NFC. `+` (and content that becomes empty) is shown as a favorite,
while a Unicode emoji is shown as that emoji. A user can keep one reaction of each
value on the same entity. If duplicate events exist for the same user, entity, and
value, Thingstr displays the newest one and removes all known duplicates when that
reaction is toggled off. Removal is published as a `kind:5` deletion request.
