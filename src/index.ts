import { Hono } from "hono"
import { Commands, type SlackSlashCommandPayload } from "./types"
import { parseTipCommandArgs } from "./utils"

const app = new Hono()

const maxAmount = 100

app.get("/", (c) => {
	return c.text("Hello Hono!")
})

app.post("/slash", async (c) => {
	// https://api.slack.com/interactivity/slash-commands
	const { command, text } = await c.req.parseBody<SlackSlashCommandPayload>()
	if (command !== Commands.Tip) {
		return c.json({
			response_type: "ephemeral",
			text: `You can only ${Commands.Tip}`,
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
