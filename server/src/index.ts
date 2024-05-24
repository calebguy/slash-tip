import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import chronRoutes from "./routes/chron";
import commandRoutes from "./routes/commands";
import uiRoutes from "./routes/ui";

const app = new Hono();

const api = app
	.basePath("/slash")
	.route("/ui", uiRoutes)
	.route("/commands", commandRoutes)
	.route("/cron", chronRoutes);

app.use("*", serveStatic({ root: "./ui/dist" }));
app.get("*", serveStatic({ path: "./ui/dist/index.html" }));

export type ApiType = typeof api;
export default app;
