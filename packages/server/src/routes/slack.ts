import type { Organization } from "db";
import { Hono } from "hono";
import type { Hex } from "viem";
import { getAction } from "../actions";
import {
	getUserAddress,
	getUserExists,
	registerViaSyndicate,
	type OrgActionConfig,
} from "../chain";
import { SITE_URL } from "../constants";
import { mustBeRegistered } from "../middleware/mustBeRegistered";
import { slackAuth } from "../middleware/slackAuth";
import { withOrg } from "../middleware/withOrg";
import { db } from "../server";
import { stripTrailingZeros } from "../utils";
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

// Helper to get contract addresses from org config
function getOrgContracts(org: Organization): OrgActionConfig | null {
	if (!org.actionConfig) return null;
	return org.actionConfig as OrgActionConfig;
}

// https://api.slack.com/interactivity/slash-commands
const app = new Hono<Env>()
	.use(withOrg)
	.post(Commands.Register, async (c) => {
		const org = c.get("org");
		const { user_id, user_name, text } =
			await c.req.parseBody<SlackSlashCommandPayload>();
		console.log(`register command received from ${user_id} with text ${text}`);

		// Check if org is configured
		const config = getOrgContracts(org);
		if (!config?.userRegistryAddress || config.deploymentStatus !== "deployed") {
			return c.json({
				response_type: "ephemeral",
				text: "This workspace is not yet configured. Please ask an admin to complete setup in the App Home.",
			});
		}

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

		const registeredAddress = await getUserAddress(
			config.userRegistryAddress as Hex,
			user_id,
		).catch(() => null);

		if (registeredAddress && registeredAddress !== "0x0000000000000000000000000000000000000000") {
			return c.json({
				response_type: "ephemeral",
				text: `You are already registered with address: ${registeredAddress}, if you would like to change it please reach out to an admin`,
			});
		}

		console.log(
			`registering ${user_id} with address ${address} and nickname ${user_name} for org ${org.slug}`,
		);

		// Fire-and-forget onchain registration to avoid Slack response timeout
		registerViaSyndicate({
			userRegistryAddress: config.userRegistryAddress,
			id: user_id,
			nickname: user_name,
			address,
		}).then((hash) => {
			console.log(`registered ${user_id} onchain with hash ${hash}`);
		}).catch((err) => {
			console.error(`failed to register ${user_id} onchain:`, err);
		});

		// Save user to database with org_id and set initial allowance
		await db.upsertUser({
			id: user_id,
			nickname: user_name,
			address,
			orgId: org.id,
			allowance: org.dailyAllowance, // Set initial allowance from org config
		});

		console.log(
			`registered ${user_id} with address ${address} and nickname ${user_name}`,
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
						)}>. <${SITE_URL}/${org.slug}|slack.tips/${org.slug}>`,
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

		// Check if org is configured
		if (!org.actionType) {
			return c.json({
				response_type: "ephemeral",
				text: "Tipping is not configured for this workspace yet. Please ask an admin to set it up in the App Home.",
			});
		}

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
		const org = c.get("org");
		const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();

		const config = getOrgContracts(org);
		if (!config?.userRegistryAddress || !config?.slashTipAddress) {
			return c.json({
				response_type: "ephemeral",
				text: "This workspace is not yet configured.",
			});
		}

		if (!(await getUserExists(config.userRegistryAddress as Hex, user_id))) {
			return c.json({
				response_type: "ephemeral",
				text: `<@${user_id}> you must register first with '/register <your-eth-address>'`,
			});
		}
		const address = await getUserAddress(config.userRegistryAddress as Hex, user_id);
		// Get allowance from database (off-chain)
		const allowance = await db.getUserAllowance(user_id);
		return c.json({
			response_type: "ephemeral",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `Your registered address is <https://basescan.org/address/${address}|${address}>.\n You have ${stripTrailingZeros(allowance)} tips left to give.`,
					},
				},
			],
		});
	})
	.post(Commands.Balance, async (c) => {
		const org = c.get("org");

		// Get leaderboard with tips received per user
		const leaderboard = await db.getLeaderboard(org.id);

		if (leaderboard.length === 0) {
			return c.json({
				response_type: "in_channel",
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `No users registered yet. Use /register to get started!\n<${SITE_URL}/${org.slug}|slack.tips/${org.slug}>`,
						},
					},
				],
			});
		}

		const leaderboardText = leaderboard
			.map((user) => `${user.tipsReceived || 0}/${user.nickname}`)
			.join("\n");

		return c.json({
			response_type: "in_channel",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: leaderboardText,
					},
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<${SITE_URL}/${org.slug}|slack.tips/${org.slug}>`,
					},
				},
			],
		});
	})
	.post(Commands.Activity, async (c) => {
		const org = c.get("org");
		console.log(`Fetching activity for org ${org.slug}`);
		const activity = await db.getTipsByOrg(org.id, 6);
		const blocks = activity.map(({ fromUser, toUser, amount, message }) => ({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `${fromUser?.nickname} -> ${toUser?.nickname}: ${amount.toString()}${message ? ` - "${message}"` : ""}`,
			},
		}));
		return c.json({
			response_type: "in_channel",
			blocks,
		});
	});

app.use(slackAuth);

export default app;
