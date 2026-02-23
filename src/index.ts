import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
})

fastify.get('/', () => {
  return { message: 'Hello World' }
})

fastify.listen({ port: Number(process.env.PORT ?? 3333) }, () => {
  console.log(`Server running on port ${process.env.PORT ?? 3333} 🚀`)
})
