import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export const statusApiRoute = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/status',
    schema: {
      description: 'Success response',
      tags: ['zod'],
      response: {
        200: z.object({
          message: z.string()
        })
      }
    },
    handler: () => {
      return { message: 'OK' }
    }
  })
}
