import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { NotFoundError } from '../errors/index.js'
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  WorkoutPlanNotActiveError
} from '../errors/index.js'
import { auth } from '../lib/auth.js'
import {
  CreateWorkoutPlanParamsSchema,
  ErrorSchema,
  StartWorkoutSessionParamsSchema,
  StartWorkoutSessionResponseSchema,
  WorkoutPlanSchema
} from '../schemas/index.js'
import { CreateWorkoutPlan } from '../usecases/CreateWorkoutPlan.js'
import { StartWorkoutSession } from '../usecases/StartWorkoutSession.js'

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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/workout-plans/:id/days/:dayId/sessions',
    schema: {
      tags: ['Workout Plan'],
      summary: 'Start a workout session for a specific day',
      params: StartWorkoutSessionParamsSchema,
      response: {
        201: StartWorkoutSessionResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema
      }
    },
    handler: async (request, reply) => {
      try {
        const authSession = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers)
        })

        if (!authSession || !authSession.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            code: 'UNAUTHORIZED'
          })
        }

        const startWorkoutSession = new StartWorkoutSession()

        const result = await startWorkoutSession.execute({
          userId: authSession.user.id,
          workoutPlanId: request.params.id,
          workoutDayId: request.params.dayId
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

        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            error: error.message,
            code: 'UNAUTHORIZED_ERROR'
          })
        }

        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            error: error.message,
            code: 'BAD_REQUEST_ERROR'
          })
        }

        if (error instanceof ConflictError) {
          return reply.status(409).send({
            error: error.message,
            code: 'CONFLICT_ERROR'
          })
        }

        if (error instanceof WorkoutPlanNotActiveError) {
          return reply.status(400).send({
            error: error.message,
            code: 'WORKOUT_PLAN_NOT_ACTIVE_ERROR'
          })
        }

        return reply.status(500).send({
          error:
            error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR'
        })
      }
    }
  })
}
