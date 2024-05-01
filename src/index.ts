import { Hono } from 'hono'

const app = new Hono()

console.log("running...")

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/tip', async (c) => {
  const body = await c.req.json();
  console.log('got body', body)
  return c.json({ message: 'tipped' })
})

export default app
