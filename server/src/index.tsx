import { Hono } from "hono"
import { Index } from "./components/Index"
import { mint } from "./syndicate"
import { Commands, type SlackSlashCommandPayload } from "./types"
import { parseTipCommandArgs } from "./utils"
import { getAllowance, getBalance } from "./viem"

const app = new Hono()

const maxAmount = 100

app.get("/", (c) => {
	return c.html(<Index />)
})

// https://api.slack.com/interactivity/slash-commands
app.post(Commands.Balance, async (c) => {
	const { command, user_id, ...rest } =
	await c.req.parseBody<SlackSlashCommandPayload>()
	const balance = await getBalance(user_id)
	return c.json({
		response_type: "in_channel",
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: balance.toString(),
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
	if (Number.isNaN(amount) || amount < 1 || amount > maxAmount) {
		return c.json({
			response_type: "ephemeral",
			text: `Amount must between 1 and ${maxAmount}`,
		})
	}

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

	const tips = Array.from({ length: Number(amount) }, () => "✺").join("")
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
