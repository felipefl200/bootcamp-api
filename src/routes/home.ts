import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { auth } from '../lib/auth.js'
import {
  ErrorSchema,
  HomeParamsSchema,
  HomeResponseSchema
} from '../schemas/index.js'
import { GetHomeData } from '../usecases/GetHomeData.js'

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

        const getHomeData = new GetHomeData()
        const result = await getHomeData.execute({
          userId: authSession.user.id,
          date: request.params.date
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
