import { Hono } from "hono"
import { Index } from "./components/Index"
import {
	getAllowance,
	getBalance,
	getUserAddress,
	mint,
	registerUser,
} from "./slash-tip"
import { Commands, type SlackSlashCommandPayload } from "./types"
import { extractEthereumAddresses, parseTipCommandArgs } from "./utils"
import { Hex } from "viem"

const app = new Hono()

app.get("/", (c) => {
	return c.html(<Index />)
})

// https://api.slack.com/interactivity/slash-commands
app.post(Commands.Balance, async (c) => {
	const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>()
	const balance = await getBalance(user_id)
	return c.json({
		response_type: "in_channel",
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `<@${user_id}> ${balance.toString()}✺`,
				},
			},
		],
	})
})

app.post(Commands.Allowance, async (c) => {
	const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>()
	const allowance = await getAllowance(user_id)
	return c.json({
		response_type: "in_channel",
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `<@${user_id}> ${allowance.toString()}✺`,
				},
			},
		],
	})
})

app.post(Commands.Register, async (c) => {
	const { user_id, user_name, text } =
		await c.req.parseBody<SlackSlashCommandPayload>()
	const address = extractEthereumAddresses(text)[0] as Hex
	if (!address) {
		return c.json({
			response_type: "ephemeral",
			text: "Could not parse address, please prompt like /register 0x123...",
		})
	}

	const registeredAddress = await getUserAddress(user_id).catch(() => null)
	if (registeredAddress) {
		return c.json({
			response_type: "ephemeral",
			text: `You are already registered with address: ${registeredAddress}`,
		})
	}

	console.log(
		`registring ${user_id} with address ${address} and nickname ${user_name}`,
	)
	await registerUser({ id: user_id, nickname: user_name, address })
	return c.json({
		response_type: "in_channel",
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `<@${user_id}> registered: ${address}`,
				},
			},
		],
	})
})

app.post(Commands.Address, async (c) => {
	const { user_id } = await c.req.parseBody<SlackSlashCommandPayload>()
	const address = await getUserAddress(user_id)
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
	})
})

app.post(Commands.Tip, async (c) => {
	const { text, user_id } = await c.req.parseBody<SlackSlashCommandPayload>()

	const { id, amount: _amount } = parseTipCommandArgs(text)
	console.log(`tipping ${_amount} to ${id}`)
	if (!id) {
		return c.json({
			response_type: "ephemeral",
			text: "Could not parse tipee",
		})
	}

	if (!_amount) {
		return c.json({
			response_type: "ephemeral",
			text: "Could not parse amount",
		})
	}

	const amount = Number(_amount)
	const allowance = await getAllowance(user_id)
	if (allowance < BigInt(amount)) {
		return c.json({
			response_type: "ephemeral",
			text: `Insufficient allowance, you only have ${allowance.toString()} more tips left to give today`,
		})
	}

	const hash = await mint({
		from: user_id,
		to: id,
		amount,
	})
	console.log(`minted ${amount} to ${id} from ${user_id} with hash ${hash}`)

	const tips = Array.from({ length: amount }, () => "✺").join("")
	return c.json({
		response_type: "in_channel",
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `<@${id}> +${tips}`,
				},
			},
		],
	})
})

export default app
