import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import { z } from 'zod'

const app = Fastify({
  logger: process.env.NODE_ENV === 'development' ? true : false
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.withTypeProvider<ZodTypeProvider>().route({
  method: 'GET',
  url: '/zod',
  schema: {
    response: {
      description: 'Success response',
      tags: ['zod'],
      200: z.object({
        message: z.string()
      })
    }
  },
  handler: () => {
    return { message: 'Hello World from ZOD Provider' }
  }
})

app.listen({ port: Number(process.env.PORT ?? 3333) }, () => {
  console.log(`Server running on port ${process.env.PORT ?? 3333} 🚀`)
})
