import { buildApp } from './lib/fastify-app.js'

const app = await buildApp()

await app.listen({ port: Number(process.env.PORT ?? 3333), host: '0.0.0.0' })
app.log.info(`Server running on port ${process.env.PORT ?? 3333}`)
