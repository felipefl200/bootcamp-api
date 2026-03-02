import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { auth } from '../lib/auth.js'
import {
  ErrorSchema,
  UpsertUserTrainDataBodySchema,
  UserTrainDataResponseSchema
} from '../schemas/index.js'
import { GetUserTrainData } from '../usecases/GetUserTrainData.js'
import { UpsertUserTrainData } from '../usecases/UpsertUserTrainData.js'

export async function meRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/me',
    schema: {
      tags: ['Me'],
      summary: 'Get the authenticated user train data',
      response: {
        200: UserTrainDataResponseSchema.nullable(),
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

        const getUserTrainData = new GetUserTrainData()
        const result = await getUserTrainData.execute({
          userId: authSession.user.id
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/me',
    schema: {
      tags: ['Me'],
      summary: 'Upsert the authenticated user train data',
      body: UpsertUserTrainDataBodySchema,
      response: {
        200: UserTrainDataResponseSchema,
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

        const upsertTrainData = new UpsertUserTrainData()
        const result = await upsertTrainData.execute({
          userId: authSession.user.id,
          weightInGrams: request.body.weightInGrams,
          heightInCentimeters: request.body.heightInCentimeters,
          age: request.body.age,
          bodyFatPercentage: request.body.bodyFatPercentage
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
