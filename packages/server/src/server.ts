import { Db } from "db";
import { Hono } from "hono";
import { cors } from "hono/cors";
// Import actions to register them at startup
import "./actions";
import { env } from "./env";
import oauthRoutes from "./routes/oauth";
import commandRoutes from "./routes/slack";
import uiRoutes from "./routes/ui";

const app = new Hono();
export const db = new Db(env.DATABASE_URL, env.DATABASE_URL.includes("neon"));

// Enable CORS for all origins
app.use("*", cors());

app.get("/", (c) => c.text("slack.tips"));

// Health check at root level for Render
app.get("/health", (c) => c.json({ status: "ok" }));

const api = app
	.basePath("/slash")
	.route("/oauth", oauthRoutes)
	.route("/ui", uiRoutes)
	.route("/slack", commandRoutes);

export type ApiType = typeof api;
export default {
	port: Number.parseInt(env.PORT),
	fetch: app.fetch,
};
