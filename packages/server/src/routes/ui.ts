import { tipWithUsersToJsonSafe } from "db";
import { Hono } from "hono";
import { getLeaderBoard } from "../chain";
import { db } from "../server";

const app = new Hono()
	.get("/leaderboard", async (c) => {
		const leaderboard = await getLeaderBoard();
		return c.json(
			leaderboard.map(
				({ balance, user: { allowance, nickname, id, account } }) => ({
					balance: balance.toString(),
					allowance: allowance.toString(),
					nickname,
					id,
					account,
				}),
			),
		);
	})
	.get("/activity", async (c) => {
		const tips = await db.getTips();
		return c.json(tips.map(tipWithUsersToJsonSafe));
	});

export default app;
