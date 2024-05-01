import { Hono } from 'hono'
import { SlackSlashCommandPayload } from './types'

const app = new Hono()

console.log("running...")

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/tip', async (c) => {
  const body = await c.req.parseBody<SlackSlashCommandPayload>();
  console.log('got command', body.command, body.text)
  return c.json({
    response_type: "in_channel",
    blocks: [{
      type: "section",
      text: {
        type: "mrkdwn",
        text: `### Got command ${body.command} with text ${body.text}`
      }
    }]
  })
})

export default app
