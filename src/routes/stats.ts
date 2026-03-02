import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { auth } from '../lib/auth.js'
import {
  ErrorSchema,
  GetStatsQuerySchema,
  GetStatsResponseSchema
} from '../schemas/index.js'
import { GetStats } from '../usecases/GetStats.js'

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

        const getStats = new GetStats()

        const result = await getStats.execute({
          userId: authSession.user.id,
          from: request.query.from,
          to: request.query.to
        })

        return reply.status(200).send(result)
      } catch (error) {
        app.log.error(error)

        return reply.status(500).send({
          error:
            error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR'
        })
      }
    }
  })
}
