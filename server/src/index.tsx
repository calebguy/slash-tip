import { Hono } from "hono"
import { Index } from "./components/Index"
import { Commands, type SlackSlashCommandPayload } from "./types"
import { parseTipCommandArgs } from "./utils"

const app = new Hono()

const maxAmount = 100

app.get("/", (c) => {
	return c.html(<Index />)
})

// https://api.slack.com/interactivity/slash-commands
app.post(Commands.Balance, async (c) => {
	const { command } = await c.req.parseBody<SlackSlashCommandPayload>()
	if (command !== Commands.Balance) {
		return c.json({
			response_type: "ephemeral",
			text: `Invalid command: ${command} -- should be: ${Commands.Balance}`,
		})
	}

	return c.json({
		response_type: "ephemeral",
		text: "Your balance is 0",
	})
})

app.post(Commands.Tip, async (c) => {
	const { command, text } = await c.req.parseBody<SlackSlashCommandPayload>()
	if (command !== Commands.Tip) {
		return c.json({
			response_type: "ephemeral",
			text: `Invalid command: ${command} -- should be: ${Commands.Tip}`,
		})
	}

	const { id, amount: _amount } = parseTipCommandArgs(text)
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
