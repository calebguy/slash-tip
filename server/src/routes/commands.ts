import { Hono } from "hono";
import {
	getAllowance,
	getBalance,
	getLeaderBoard,
	getUserAddress,
	mint,
	registerUser,
} from "../chain";
import { mustBeRegistered } from "../middleware";
import { Commands, type SlackSlashCommandPayload } from "../types";
import {
	abbreviate,
	extractEthereumAddresses,
	parseTipCommandArgs,
	toStar,
} from "../utils";

// https://api.slack.com/interactivity/slash-commands
const app = new Hono()
	.post(Commands.Register, async (c) => {
		const { user_id, user_name, text } =
			await c.req.parseBody<SlackSlashCommandPayload>();
		const address = extractEthereumAddresses(text);
		if (!address) {
			return c.json({
				response_type: "ephemeral",
				text: "Could not parse address, please prompt like /register 0x123...",
			});
		}

		const registeredAddress = await getUserAddress(user_id).catch(() => null);
		if (registeredAddress) {
			return c.json({
				response_type: "ephemeral",
				text: `You are already registered with address: ${registeredAddress}, if you would like to change it please reach out to caleb`,
			});
		}

		console.log(
			`registring ${user_id} with address ${address} and nickname ${user_name}`,
		);
		await registerUser({ id: user_id, nickname: user_name, address });
		return c.json({
			response_type: "in_channel",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<@${user_id}> registered with <https://basescan.org/address/${address}|${abbreviate(
							address,
						)}>. View the leaderboard <https://slash-tip.onrender.com/|here>`,
					},
				},
			],
		});
	})
	.post(Commands.Tip, async (c) => {
		const { text, user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
		if (!(await getUserAddress(user_id))) {
			return c.json({
				response_type: "ephemeral",
				text: "Register first with '/register <your-eth-address>'",
			});
		}

		const { id, amount: _amount } = parseTipCommandArgs(text);
		console.log(`tipping ${_amount} to ${id}`);

		// @note TODO need to check if id user exists

		if (!id) {
			return c.json({
				response_type: "ephemeral",
				text: "Could not parse tipee",
			});
		}

		if (!(await getUserAddress(id))) {
			return c.json({
				response_type: "ephemeral",
				text: `<@${id}> must register before accepting a tip! Register with '/register <your-eth-address>'`,
			});
		}

		if (!_amount) {
			return c.json({
				response_type: "ephemeral",
				text: "Could not parse amount",
			});
		}

		const amount = Number(_amount);
		const allowance = await getAllowance(user_id);
		if (allowance < BigInt(amount)) {
			return c.json({
				response_type: "ephemeral",
				text: `Insufficient allowance, you only have ${allowance.toString()} more tips left to give today. Every day at 9am CT your allowance will increase by ✺✺✺✺✺.`,
			});
		}

		const hash = await mint({
			from: user_id,
			to: id,
			amount,
		});
		console.log(`minted ${amount} to ${id} from ${user_id} with hash ${hash}`);

		return c.json({
			response_type: "in_channel",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<@${id}> +${toStar(amount)}`,
					},
				},
			],
		});
	})
	.post(Commands.Balance, mustBeRegistered, async (c) => {
		const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
		const balance = await getBalance(user_id);
		return c.json({
			response_type: "in_channel",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<@${user_id}> ${toStar(balance)}`,
					},
				},
			],
		});
	})
	.post(Commands.Allowance, mustBeRegistered, async (c) => {
		const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
		const allowance = await getAllowance(user_id);
		return c.json({
			response_type: "in_channel",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<@${user_id}> ${toStar(allowance)}`,
					},
				},
			],
		});
	})
	.post(Commands.Address, mustBeRegistered, async (c) => {
		const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
		if (!(await getUserAddress(user_id))) {
			return c.json({
				response_type: "ephemeral",
				text: "Register first with '/register <your-eth-address>'",
			});
		}
		const address = await getUserAddress(user_id);
		return c.json({
			response_type: "in_channel",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<@${user_id}> <https://basescan.org/address/${address}|${address}>`,
					},
				},
			],
		});
	})
	.post(Commands.Leaderboard, async (c) => {
		const leaderboard = await getLeaderBoard();
		return c.json({
			response_type: "in_channel",
			blocks: leaderboard.map(({ user, balance }) => ({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `<@${user.id}> ${toStar(balance)}✺`,
				},
			})),
		});
	});

export default app;
