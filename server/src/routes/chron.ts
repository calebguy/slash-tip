import { Hono } from "hono";

const app = new Hono().get("/allowance", async (c) => {
	const allowance = 1;
	const now = new Date();
	console.log(
		`[${now.toISOString()}] adding allowance of ${allowance} for all users`,
	);
	// await addAllowanceForAllUsers(allowance);
	return c.json({ success: true });
});
export default app;
