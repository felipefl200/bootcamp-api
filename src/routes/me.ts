import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import {
  makeGetUserTrainDataController,
  makeUpsertUserTrainDataController
} from '../factories/makeUserController.js'
import {
  ErrorSchema,
  UpsertUserTrainDataBodySchema,
  UserTrainDataResponseSchema
} from '../schemas/index.js'

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
      const controller = makeGetUserTrainDataController()
      return controller.handle(request, reply)
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
      const controller = makeUpsertUserTrainDataController()
      return controller.handle(request, reply)
    }
  })
}
