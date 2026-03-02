import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import Fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler
} from 'fastify-type-provider-zod'

import { aiRoutes } from '../routes/ai.js'
import { authRoutes } from '../routes/auth.js'
import { docsRoute } from '../routes/docs.js'
import { homeRoutes } from '../routes/home.js'
import { meRoutes } from '../routes/me.js'
import { statsRoutes } from '../routes/stats.js'
import { statusApiRoute } from '../routes/status-api.js'
import { workoutPlanRoutes } from '../routes/workout-plan.js'

export const buildApp = async () => {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'development'
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

  app.register(fastifyCors, {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  })

  app.register(statusApiRoute)
  app.register(docsRoute)
  app.register(workoutPlanRoutes)
  app.register(homeRoutes)
  app.register(statsRoutes)
  app.register(meRoutes)
  app.register(aiRoutes, { prefix: '/ai' })

  app.register(authRoutes) //Better Auth

  return app
}
