export interface WikidataClaim {
	mainsnak: WikidataSnak;
	qualifiers?: Record<string, WikidataSnak[]>;
}

export interface WikidataSnak {
	snaktype: string;
	datavalue?: {
		type: string;
		value: unknown;
	};
}

export interface EntityPropertyValue {
	type: "entity" | "url" | "text";
	id?: string;
	label: string | null;
	url?: string;
	description?: string | null;
	qualifiers?: EntityQualifier[];
}

export interface EntityProperty {
	propertyId: string;
	propertyLabel: string | null;
	propertyDescription?: string | null;
	values: EntityPropertyValue[];
}

export interface EntityQualifier {
	propertyId: string;
	propertyLabel: string | null;
	propertyDescription?: string | null;
	value: EntityPropertyValue;
}

type Claims = Record<string, WikidataClaim[]>;
type EntityTextMap = Readonly<Record<string, string>>;

export function collectClaimEntityIds(claims: Claims): string[] {
	const ids = new Set<string>(Object.keys(claims));

	const collectIdsFromSnak = (snak: WikidataSnak) => {
		const { datavalue } = snak;
		if (!datavalue) return;

		if (
			datavalue.type === "wikibase-entityid" &&
			isWikibaseEntityValue(datavalue.value)
		) {
			ids.add(datavalue.value.id);
		}

		if (datavalue.type === "quantity" && isQuantityValue(datavalue.value)) {
			const unitId = extractEntityIdFromUrl(datavalue.value.unit);
			if (unitId) ids.add(unitId);
		}
	};

	for (const statements of Object.values(claims)) {
		for (const statement of statements) {
			collectIdsFromSnak(statement.mainsnak);

			for (const [propertyId, snaks] of Object.entries(
				statement.qualifiers ?? {},
			)) {
				ids.add(propertyId);
				snaks.forEach(collectIdsFromSnak);
			}
		}
	}

	return Array.from(ids).sort();
}

export function formatEntityProperties(
	claims: Claims,
	labelMap: EntityTextMap,
	descriptionMap: EntityTextMap,
): EntityProperty[] {
	return Object.entries(claims)
		.map(([propertyId, statements]) => {
			const values = statements
				.map((statement): EntityPropertyValue | null => {
					const value = formatClaimValue(
						statement.mainsnak,
						labelMap,
						descriptionMap,
					);
					if (!value) return null;

					const qualifiers = formatQualifiers(
						statement.qualifiers,
						labelMap,
						descriptionMap,
					);

					return qualifiers.length ? { ...value, qualifiers } : value;
				})
				.filter((value): value is EntityPropertyValue => value !== null);

			return {
				propertyId,
				propertyLabel: labelMap[propertyId] ?? null,
				propertyDescription: descriptionMap[propertyId] ?? null,
				values,
			};
		})
		.filter((property) => property.values.length > 0);
}

export function isWikibaseEntityValue(
	value: unknown,
): value is { id: string; "entity-type": string } {
	return Boolean(
		value &&
			typeof value === "object" &&
			"id" in value &&
			typeof (value as { id?: unknown }).id === "string",
	);
}

function isQuantityValue(
	value: unknown,
): value is { amount?: string; unit?: string } {
	return Boolean(
		value &&
			typeof value === "object" &&
			"amount" in value &&
			"unit" in value,
	);
}

function isTimeValue(value: unknown): value is { time: string } {
	return Boolean(value && typeof value === "object" && "time" in value);
}

function isMonolingualTextValue(
	value: unknown,
): value is { text: string; language: string } {
	return Boolean(
		value &&
			typeof value === "object" &&
			"text" in value &&
			"language" in value,
	);
}

function extractEntityIdFromUrl(url?: string | null): string | null {
	if (!url) return null;
	const match = url.match(/entity\/([PQ]\d+)/);
	return match?.[1] ?? null;
}

function formatTimeValue(raw: string): string {
	if (!raw) return "";
	const cleaned = raw.startsWith("+") ? raw.slice(1) : raw;
	return cleaned.replace("T00:00:00Z", "");
}

function formatQualifiers(
	qualifiers: Record<string, WikidataSnak[]> | undefined,
	labelMap: EntityTextMap,
	descriptionMap: EntityTextMap,
): EntityQualifier[] {
	const formatted: EntityQualifier[] = [];
	if (!qualifiers) return formatted;

	for (const [propertyId, snaks] of Object.entries(qualifiers)) {
		const propertyLabel = labelMap[propertyId] ?? null;
		const propertyDescription = descriptionMap[propertyId] ?? null;
		for (const snak of snaks) {
			const value = formatClaimValue(snak, labelMap, descriptionMap);
			if (value) {
				formatted.push({
					propertyId,
					propertyLabel,
					propertyDescription,
					value,
				});
			}
		}
	}

	return formatted;
}

function formatClaimValue(
	snak: WikidataSnak,
	labelMap: EntityTextMap,
	descriptionMap: EntityTextMap,
): EntityPropertyValue | null {
	if (snak.snaktype !== "value" || !snak.datavalue) {
		return {
			type: "text",
			label: snak.snaktype === "somevalue" ? "Some value" : "No value",
		};
	}

	const { datavalue } = snak;
	if (
		datavalue.type === "wikibase-entityid" &&
		isWikibaseEntityValue(datavalue.value)
	) {
		const id = datavalue.value.id;
		return {
			type: "entity",
			id,
			label: labelMap[id] ?? null,
			description: descriptionMap[id] ?? null,
		};
	}

	if (datavalue.type === "url" && typeof datavalue.value === "string") {
		return {
			type: "url",
			url: datavalue.value,
			label: datavalue.value,
		};
	}

	if (datavalue.type === "time" && isTimeValue(datavalue.value)) {
		return {
			type: "text",
			label: formatTimeValue(datavalue.value.time),
		};
	}

	if (datavalue.type === "quantity" && isQuantityValue(datavalue.value)) {
		const amount = datavalue.value.amount?.replace(/^\+/, "") ?? "";
		const unitId = extractEntityIdFromUrl(datavalue.value.unit);
		const unitLabel =
			unitId && labelMap[unitId]
				? labelMap[unitId]
				: unitId ?? (datavalue.value.unit === "1" ? "" : datavalue.value.unit);
		const label = unitLabel ? `${amount} ${unitLabel}`.trim() : amount;
		return {
			type: "text",
			label: label || amount || "—",
		};
	}

	if (
		datavalue.type === "monolingualtext" &&
		isMonolingualTextValue(datavalue.value)
	) {
		const { text, language } = datavalue.value;
		return {
			type: "text",
			label: `${text} (${language})`,
		};
	}

	if (typeof datavalue.value === "string") {
		return { type: "text", label: datavalue.value };
	}

	if (datavalue.value !== undefined) {
		return { type: "text", label: JSON.stringify(datavalue.value) };
	}

	return null;
}
