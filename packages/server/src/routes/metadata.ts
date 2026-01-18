import { Hono } from "hono";
import { db } from "../server";

const app = new Hono()
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
