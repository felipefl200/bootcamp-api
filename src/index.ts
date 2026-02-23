import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'
import {
  jsonSchemaTransform,
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

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Bootcamp Treinos API',
      description: 'API de treinos',
      version: '1.0.0'
    },
    servers: [
      {
        description: 'Development server',
        url: 'http://localhost:3333'
      }
    ]
  },
  transform: jsonSchemaTransform
})

await app.register(fastifySwaggerUi, {
  routePrefix: '/docs'
})

app.withTypeProvider<ZodTypeProvider>().route({
  method: 'GET',
  url: '/zod',
  schema: {
    description: 'Success response',
    tags: ['zod'],
    response: {
      200: z.object({
        message: z.string()
      })
    }
  },
  handler: () => {
    return { message: 'Hello World from ZOD Provider' }
  }
})

await app.listen({ port: Number(process.env.PORT ?? 3333), host: '0.0.0.0' })
console.log(`Server running on port ${process.env.PORT ?? 3333} 🚀`)
