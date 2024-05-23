import { Hono } from "hono";
import { getLeaderBoard } from "../slash-tip";

const app = new Hono()
	.get("/wow", (c) => {
		return c.json({ hello: "there" });
	})
	.get("/leaderboard", async (c) => {
		const leaderboard = await getLeaderBoard();
		return c.json(
			leaderboard.map(({ balance, allowance, nickname, id, account }) => ({
				balance: balance.toString(),
				allowance: allowance.toString(),
				nickname,
				id,
				account,
			})),
		);
	});

export default app;
