import { Db } from "db";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { env } from "./env";
import commandRoutes from "./routes/slack";
import uiRoutes from "./routes/ui";

const app = new Hono();
export const db = new Db(env.DATABASE_URL, env.DATABASE_URL.includes("neon"));

const api = app
	.basePath("/slash")
	.route("/ui", uiRoutes)
	.route("/slack", commandRoutes);

app.use("*", serveStatic({ root: "../ui/dist" }));
app.use("*", serveStatic({ path: "../ui/dist/index.html" }));
app.notFound((c) => c.html(Bun.file("../ui/dist/index.html").text()));

export type ApiType = typeof api;
export default app;
