import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { makeGetHomeDataController } from '../factories/makeDashboardController.js'
import {
  ErrorSchema,
  HomeParamsSchema,
  HomeResponseSchema
} from '../schemas/index.js'

export async function homeRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/home/:date',
    schema: {
      tags: ['Home'],
      summary: 'Get home dashboard data',
      params: HomeParamsSchema,
      response: {
        200: HomeResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        500: ErrorSchema
      }
    },
    handler: async (request, reply) => {
      const controller = makeGetHomeDataController()
      return controller.handle(request as any, reply)
    }
  })
}
