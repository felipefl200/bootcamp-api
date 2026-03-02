import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { NotFoundError } from '../errors/index.js'
import { auth } from '../lib/auth.js'
import {
  CreateWorkoutPlanParamsSchema,
  ErrorSchema,
  WorkoutPlanSchema
} from '../schemas/index.js'
import { CreateWorkoutPlan } from '../usecases/CreateWorkoutPlan.js'

export async function workoutPlanRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workout-plans',
    schema: {
      tags: ['Workout Plan'],
      summary: 'Create a new workout plan',
      body: CreateWorkoutPlanParamsSchema,
      response: {
        201: WorkoutPlanSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema
      }
    },
    handler: async (request, reply) => {
      try {
        const authSession = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers)
        })

        if (!authSession || !authSession.user || !authSession.session) {
          return reply.status(401).send({
            error: 'Unauthorized',
            code: 'UNAUTHORIZED'
          })
        }

        const createWorkoutPlan = new CreateWorkoutPlan()

        const result = await createWorkoutPlan.execute({
          userId: authSession.user.id,
          sessionId: authSession.session.id,
          name: request.body.name,
          workoutDays: request.body.workoutDays
        })

        return reply.status(201).send(result)
      } catch (error) {
        app.log.error(error)

        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: 'NOT_FOUND_ERROR'
          })
        }

        return reply.status(500).send({
          error: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR'
        })
      }
    }
  })
}
