import { Hono } from "hono";
import type { Hex } from "viem";
import {
	getAllowance,
	getBalance,
	getLeaderBoard,
	getUserAddress,
	getUserExists,
	mint,
	registerUser,
} from "../chain";
import { SITE_URL } from "../constants";
import { mustBeRegistered } from "../middleware";
import { selfLovePoem, stealingPoem } from "../openai";
import { Commands, type SlackSlashCommandPayload } from "../types";
import {
	abbreviate,
	extractFirstWord,
	isEthAddress,
	parseTipCommandArgs,
	toStar,
} from "../utils";
import { getAddressFromENS } from "../viem";

// https://api.slack.com/interactivity/slash-commands
const app = new Hono()
	.post(Commands.Register, async (c) => {
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
						)}>. View the leaderboard <${SITE_URL}|here>`,
					},
				},
			],
		});
	})
	.post(Commands.Tip, mustBeRegistered, async (c) => {
		const { text, user_id } = await c.req.parseBody<SlackSlashCommandPayload>();

		const { id, amount: _amount } = parseTipCommandArgs(text);

		if (!id) {
			return c.json({
				response_type: "ephemeral",
				text: "Could not parse tipee",
			});
		}

		if (!(await getUserExists(id))) {
			return c.json({
				response_type: "in_channel",
				text: `<@${id}> someone just tried to tip you! Register with '/register <your-ens.ens | your-eth-address>' to accept tips`,
			});
		}

		if (!_amount) {
			return c.json({
				response_type: "ephemeral",
				text: "Could not parse amount",
			});
		}

		const amount = Number(_amount);
		if (amount < 0) {
			const text = await stealingPoem();
			return c.json({
				response_type: "ephemeral",
				text,
			});
		}

		if (amount === 0) {
			return c.json({
				response_type: "ephemeral",
				text: "You can't tip 0 srry!",
			});
		}

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

		const blocks = [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `<@${id}> +${toStar(amount)}`,
				},
			},
		];

		if (user_id === id) {
			const selfHelp = await selfLovePoem();
			console.log(`user ${user_id} tipped themselves, with poem ${selfHelp}`);
			if (selfHelp) {
				blocks.push({
					type: "section",
					text: {
						type: "mrkdwn",
						text: selfHelp,
					},
				});
			}
		}

		return c.json({
			response_type: "in_channel",
			blocks,
		});
	})
	.post(Commands.Balance, mustBeRegistered, async (c) => {
		const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
		if (!(await getUserExists(user_id))) {
			return c.json({
				response_type: "ephemeral",
				text: `<@${user_id}> you must register first with '/register <your-eth-address>'`,
			});
		}
		const balance = await getBalance(user_id);
		return c.json({
			response_type: "ephemeral",
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
		if (!(await getUserExists(user_id))) {
			return c.json({
				response_type: "ephemeral",
				text: `<@${user_id}> you must register first with '/register <your-eth-address>'`,
			});
		}
		const allowance = await getAllowance(user_id);
		return c.json({
			response_type: "ephemeral",
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<@${user_id}> ${
							allowance === BigInt(0) ? "0" : toStar(allowance)
						}`,
					},
				},
			],
		});
	})
	.post(Commands.Address, mustBeRegistered, async (c) => {
		const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>();
		if (!(await getUserExists(user_id))) {
			return c.json({
				response_type: "ephemeral",
				text: `<@${user_id}> you must register first with '/register <your-eth-address>'`,
			});
		}
		const address = await getUserAddress(user_id);
		return c.json({
			response_type: "ephemeral",
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
					text: `<@${user.id}> ${
						balance > BigInt(0) ? `${toStar(balance)}✺` : "0 🥲"
					}`,
				},
			})),
		});
	});

export default app;
