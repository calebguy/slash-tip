import { Hono } from "hono"
import { Index } from "./components/Index"
import { mint } from "./syndicate"
import { Commands, type SlackSlashCommandPayload } from "./types"
import { parseTipCommandArgs } from "./utils"
import { getAllowance, getBalance, getUserAddress } from "./viem"

const app = new Hono()

app.get("/", (c) => {
	return c.html(<Index />)
})

// https://api.slack.com/interactivity/slash-commands
app.post(Commands.Balance, async (c) => {
	const { user_id } =
	await c.req.parseBody<SlackSlashCommandPayload>()
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

app.post(Commands.Address, async (c) => {
	const { user_id, } = await c.req.parseBody<SlackSlashCommandPayload>()
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

	const { transactionId } = await mint({
		from: user_id,
		to: id,
		amount,
	})
	console.log(`minted ${amount} to ${id} from ${user_id} with transactionId ${transactionId}`)

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
