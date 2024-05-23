import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import apiRoutes from "./routes/api";
import commandRoutes from "./routes/commands";

const app = new Hono();

const api = app
	.basePath("/slash")
	.route("/ui", apiRoutes)
	.route("/commands", commandRoutes);

app.use("*", serveStatic({ root: "./ui/dist" }));
app.get("*", serveStatic({ path: "./ui/dist/index.html" }));

export type ApiType = typeof api;
export default app;
