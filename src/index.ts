import { env } from './env.js'
import { buildApp } from './lib/fastify-app.js'

const app = await buildApp()

await app.listen({ port: env.PORT, host: '0.0.0.0' })
app.log.info(`Server running on port ${env.PORT}`)

const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, shutting down gracefully...`)
    await app.close()
    process.exit(0)
  })
})
