import { Hono } from 'hono'

const app = new Hono()

console.log("running...")

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/tip', (c) => {
  console.log('got body', c.body)
  return c.json({ message: 'tipped' })
})

export default app
