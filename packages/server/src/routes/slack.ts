import type { Organization } from "db";
import { Hono } from "hono";
import type { Hex } from "viem";
import { getAction } from "../actions";
import {
	getAllowance,
	getLeaderBoard,
	getUserAddress,
	getUserExists,
	register,
} from "../chain";
import { SITE_URL } from "../constants";
import { mustBeRegistered } from "../middleware/mustBeRegistered";
import { slackAuth } from "../middleware/slackAuth";
import { withOrg } from "../middleware/withOrg";
import { db } from "../server";
import { Commands, type SlackSlashCommandPayload } from "../types";
import {
	abbreviate,
	extractFirstWord,
	isEthAddress,
	parseTipCommandArgs,
} from "../utils";
import { getAddressFromENS } from "../viem";

type Env = {
	Variables: {
		org: Organization;
	};
};

// https://api.slack.com/interactivity/slash-commands
const app = new Hono<Env>()
	.use(withOrg)
	.post(Commands.Register, async (c) => {
		const org = c.get("org");
		const { user_id, user_name, text } =
			await c.req.parseBody<SlackSlashCommandPayload>();
		console.log(`register command received from ${user_id} with text ${text}`);
		let address: Hex;
		const addressOrEns = extractFirstWord(text);
		if (!addressOrEns) {
			return c.json({
				response_type: "ephemeral",
				text: "Could not parse address, please prompt like /register (0x123... | you.ens)",
			});
		}

		if (isEthAddress(addressOrEns)) {
			address = addressOrEns as Hex;
		} else {
			const tmp = await getAddressFromENS(addressOrEns);
			if (!tmp) {
				return c.json({
					response_type: "ephemeral",
					text: `Could not resolve ENS name ${addressOrEns}`,
				});
			}
			address = tmp;
		}
		const registeredAddress = await getUserAddress(user_id).catch(() => null);
		if (registeredAddress) {
			return c.json({
				response_type: "ephemeral",
				text: `You are already registered with address: ${registeredAddress}, if you would like to change it please (tip ✺ first ✺ then) reach out to caleb`,
			});
		}

		console.log(
			`registring ${user_id} with address ${address} and nickname ${user_name} for org ${org.slug}`,
		);

		const hash = await register({
			id: user_id,
			nickname: user_name,
			address,
		});

		// Save user to database with org_id
		await db.upsertUser({
			id: user_id,
			nickname: user_name,
			address,
			orgId: org.id,
		});

		console.log(
			`registered ${user_id} with address ${address} and nickname ${user_name} with hash ${hash}`,
		);
		return c.json({
			response_type: "in_channel",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<@${user_id}> registered with <https://basescan.org/address/${address}|${abbreviate(
							address,
						)}>. <${SITE_URL}/${org.slug}|${org.slug}.slack.tips>`,
					},
				},
			],
		});
	})
	.post(Commands.Tip, mustBeRegistered, async (c) => {
		const org = c.get("org");
		const body = await c.req.parseBody<SlackSlashCommandPayload>();
		const { id, amount: _amount, message } = parseTipCommandArgs(body.text);

		console.log("got from slack", { id, amount: _amount, message });

		// Basic parsing validation
		if (!id) {
			return c.json({
				response_type: "ephemeral",
				text: "Could not parse recipient. Usage: /tip @user amount [message]",
			});
		}

		if (!_amount) {
			return c.json({
				response_type: "ephemeral",
				text: "Could not parse amount. Usage: /tip @user amount [message]",
			});
		}

		const amount = Number(_amount);

		// Get the action for this org
		const action = getAction(org.actionType);

		// Build params for the action
		const params = {
			org,
			fromUserId: body.user_id,
			toUserId: id,
			amount,
			message: message || "",
			raw: body,
		};

		// Validate
		const validation = await action.validate(params);
		if (!validation.valid) {
			return c.json({
				response_type: "ephemeral",
				text: validation.error || "Validation failed",
			});
		}

		// Execute the action
		const result = await action.execute(params);

		return c.json({
			response_type: result.response.type,
			text: result.response.text,
			blocks: result.response.blocks,
		});
	})
	.post(Commands.Info, mustBeRegistered, async (c) => {
		const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
		if (!(await getUserExists(user_id))) {
			return c.json({
				response_type: "ephemeral",
				text: `<@${user_id}> you must register first with '/register <your-eth-address>'`,
			});
		}
		const address = await getUserAddress(user_id);
		const allowance = await getAllowance(user_id);
		return c.json({
			response_type: "ephemeral",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `Your registered address is <https://basescan.org/address/${address}|${address}>.\n You have ${
							allowance === BigInt(0) ? "0" : `${allowance}`
						} tips left to give.`,
					},
				},
			],
		});
	})
	.post(Commands.Balance, async (c) => {
		const org = c.get("org");
		const orgUsers = await db.getUsersByOrg(org.id);
		const orgUserIds = new Set(orgUsers.map((u) => u.id));

		const leaderboard = await getLeaderBoard();
		const filteredLeaderboard = leaderboard.filter(({ user }) =>
			orgUserIds.has(user.id),
		);

		return c.json({
			response_type: "in_channel",
			blocks: filteredLeaderboard
				.map(({ user, balance }) => ({
					type: "section",
					text: {
						type: "mrkdwn",
						text: `${user.nickname}: ${
							balance > BigInt(0) ? `${balance}` : "0 🥲"
						}`,
					},
				}))
				.concat({
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<${SITE_URL}/${org.slug}|${org.slug}.slack.tips>`,
					},
				}),
		});
	})
	.post(Commands.Activity, async (c) => {
		const org = c.get("org");
		const activity = await db.getTipsByOrg(org.id, 6);
		const blocks = activity.map(({ fromUser, toUser, amount }) => ({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `${fromUser?.nickname} ->-> ${toUser?.nickname}: ${amount.toString()}`,
			},
		}));
		return c.json({
			response_type: "in_channel",
			blocks,
		});
	});

app.use(slackAuth);

export default app;
