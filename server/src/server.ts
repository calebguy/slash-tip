import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import commandRoutes from "./routes/slack";
import uiRoutes from "./routes/ui";

const app = new Hono();

const api = app
	.basePath("/slash")
	.route("/ui", uiRoutes)
	.route("/slack", commandRoutes);

app.use("*", serveStatic({ root: "./ui/dist" }));
app.get("*", serveStatic({ path: "./ui/dist/index.html" }));

export type ApiType = typeof api;
export default app;
