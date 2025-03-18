import { Db } from "db";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import commandRoutes from "./routes/slack";
import uiRoutes from "./routes/ui";

const app = new Hono();

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

export const db = new Db(
	process.env.DATABASE_URL,
	process.env.DATABASE_URL.includes("neon"),
);

const api = app
	.basePath("/slash")
	.route("/ui", uiRoutes)
	.route("/slack", commandRoutes);

app.use("*", serveStatic({ root: "../ui/dist" }));
app.use("*", serveStatic({ path: "../ui/dist/index.html" }));
app.notFound((c) => c.html(Bun.file("../ui/dist/index.html").text()));

export type ApiType = typeof api;
export default app;
