import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import {
  makeCreateWorkoutPlanController,
  makeGetWorkoutDayController,
  makeGetWorkoutPlanController
} from '../factories/makeWorkoutPlanController.js'
import {
  makeStartWorkoutSessionController,
  makeUpdateWorkoutSessionController
} from '../factories/makeWorkoutSessionController.js'
import {
  CreateWorkoutPlanParamsSchema,
  ErrorSchema,
  GetWorkoutDayParamsSchema,
  GetWorkoutDayResponseSchema,
  GetWorkoutPlanParamsSchema,
  GetWorkoutPlanResponseSchema,
  StartWorkoutSessionParamsSchema,
  StartWorkoutSessionResponseSchema,
  UpdateWorkoutSessionBodySchema,
  UpdateWorkoutSessionParamsSchema,
  UpdateWorkoutSessionResponseSchema,
  WorkoutPlanSchema
} from '../schemas/index.js'

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
      const controller = makeCreateWorkoutPlanController()
      return controller.handle(request, reply)
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
      const controller = makeStartWorkoutSessionController()
      return controller.handle(request, reply)
    }
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/workout-plans/:id/days/:dayId/sessions/:sessionId',
    schema: {
      tags: ['Workout Plan'],
      summary: 'Update a workout session',
      params: UpdateWorkoutSessionParamsSchema,
      body: UpdateWorkoutSessionBodySchema,
      response: {
        200: UpdateWorkoutSessionResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema
      }
    },
    handler: async (request, reply) => {
      const controller = makeUpdateWorkoutSessionController()
      return controller.handle(request, reply)
    }
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/workout-plans/:id',
    schema: {
      tags: ['Workout Plan'],
      summary: 'Get a workout plan',
      params: GetWorkoutPlanParamsSchema,
      response: {
        200: GetWorkoutPlanResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema
      }
    },
    handler: async (request, reply) => {
      const controller = makeGetWorkoutPlanController()
      return controller.handle(request, reply)
    }
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/workout-plans/:id/days/:dayId',
    schema: {
      tags: ['Workout Plan'],
      summary: 'Get a workout day including exercises and sessions',
      params: GetWorkoutDayParamsSchema,
      response: {
        200: GetWorkoutDayResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema
      }
    },
    handler: async (request, reply) => {
      const controller = makeGetWorkoutDayController()
      return controller.handle(request, reply)
    }
  })
}
