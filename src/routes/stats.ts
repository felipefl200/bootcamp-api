import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { makeGetStatsController } from '../factories/makeDashboardController.js'
import {
  ErrorSchema,
  GetStatsQuerySchema,
  GetStatsResponseSchema
} from '../schemas/index.js'

export async function statsRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/stats',
    schema: {
      tags: ['Stats'],
      summary: 'Get workout statistics within a date range',
      querystring: GetStatsQuerySchema,
      response: {
        200: GetStatsResponseSchema,
        401: ErrorSchema,
        500: ErrorSchema
      }
    },
    handler: async (request, reply) => {
      const controller = makeGetStatsController()
      return controller.handle(request as any, reply)
    }
  })
}
