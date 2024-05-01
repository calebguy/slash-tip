import { Hono } from "hono"
import { Commands, type SlackSlashCommandPayload } from "./types"
import { parseTipCommandArgs } from "./utils"

const app = new Hono()

console.log("running...")

app.get("/", (c) => {
	return c.text("Hello Hono!")
})

app.post("/tip", async (c) => {
	const { command, text } = await c.req.parseBody<SlackSlashCommandPayload>()
	console.log("got command", command, text)
	if (command !== Commands.Tip) {
		return c.json({
			response_type: "ephemeral",
			text: `You can only ${Commands.Tip} sorry ⚛️`,
		})
	}

	const { name, amount } = parseTipCommandArgs(text)
	const tippies = Array.from({ length: Number(amount) }, () => "✺").join("")
	// https://api.slack.com/interactivity/slash-commands
	return c.json({
		response_type: "in_channel",
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `${name} +${tippies}`,
				},
			},
		],
	})
})

export default app
