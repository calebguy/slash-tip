import { Db } from "db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";
import commandRoutes from "./routes/slack";
import uiRoutes from "./routes/ui";

const app = new Hono();
export const db = new Db(env.DATABASE_URL, env.DATABASE_URL.includes("neon"));

// Enable CORS for all origins
app.use("*", cors());

const api = app
	.basePath("/slash")
	.route("/ui", uiRoutes)
	.route("/slack", commandRoutes);

export type ApiType = typeof api;
export default {
	port: 3001,
	fetch: app.fetch,
};
