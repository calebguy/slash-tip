import { Hono } from "hono";
import { db } from "../server";

const app = new Hono()
	// Collection-level metadata (contractURI)
	.get("/:orgSlug/contract", async (c) => {
		const orgSlug = c.req.param("orgSlug");

		const [org] = await db.getOrgBySlug(orgSlug);
		if (!org) {
			return c.json({ error: "Organization not found" }, 404);
		}

		// Get token 0 metadata for collection info (or use org defaults)
		const [metadata] = await db.getTokenMetadata(org.id, 0);

		// Return OpenSea-compatible collection metadata
		return c.json({
			name: metadata?.name || `${org.name} Tips`,
			description: metadata?.description || `Tip tokens for ${org.name}`,
			image: metadata?.image || org.logoUrl || "",
			external_link: `https://slack.tips/${org.slug}`,
		});
	})
	// Token-level metadata (baseURI + tokenId)
	.get("/:orgSlug/:tokenId", async (c) => {
		const orgSlug = c.req.param("orgSlug");
		const tokenIdParam = c.req.param("tokenId");
		const tokenId = Number.parseInt(tokenIdParam, 10);

		if (Number.isNaN(tokenId)) {
			return c.json({ error: "Invalid token ID" }, 400);
		}

		const [org] = await db.getOrgBySlug(orgSlug);
		if (!org) {
			return c.json({ error: "Organization not found" }, 404);
		}

		const [metadata] = await db.getTokenMetadata(org.id, tokenId);

		if (!metadata) {
			// Return default metadata if none exists
			return c.json({
				name: `${org.name} Tip`,
				description: `A tip token for ${org.name}`,
				image: org.logoUrl || "",
				decimals: 0,
				properties: {},
			});
		}

		// Return ERC-1155 compliant metadata
		return c.json({
			name: metadata.name,
			description: metadata.description || "",
			image: metadata.image || "",
			decimals: metadata.decimals || 0,
			properties: metadata.properties || {},
		});
	});

export default app;
