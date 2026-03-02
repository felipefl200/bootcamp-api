import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifyApiReference from '@scalar/fastify-api-reference'
import Fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from './lib/auth.js'
import { workoutPlanRoutes } from './routes/workout-plan.js'

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

await app.register(fastifyApiReference, {
  routePrefix: '/docs',
  configuration: {
    sources: [
      {
        title: 'Bootcamp Treinos API',
        slug: 'bootcamp-treinos-api',
        url: '/swagger.json'
      },
      {
        title: 'Better Auth API',
        slug: 'better-auth-api',
        url: '/api/auth/open-api/generate-schema'
      }
    ]
  }
})

app.withTypeProvider<ZodTypeProvider>().route({
  method: 'GET',
  url: '/swagger.json',
  schema: {
    hide: true
  },
  handler: () => {
    return app.swagger()
  }
})

app.register(fastifyCors, {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
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

app.register(workoutPlanRoutes)

app.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`)

      // Convert Fastify headers to standard Headers object
      const headers = new Headers()
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString())
      })
      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {})
      })
      // Process authentication request
      const response = await auth.handler(req)
      // Forward response to client
      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      reply.send(response.body ? await response.text() : null)
    } catch (error) {
      app.log.error(error as Error, 'Authentication Error')
      reply.status(500).send({
        error: 'Internal authentication error',
        code: 'AUTH_FAILURE'
      })
    }
  }
})

await app.listen({ port: Number(process.env.PORT ?? 3333), host: '0.0.0.0' })
console.log(`Server running on port ${process.env.PORT ?? 3333} 🚀`)
