import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { makeAIController } from '../factories/makeAIController.js'

export async function aiRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['AI'],
      summary: 'Interact with the AI personal trainer',
      body: z.object({
        messages: z.array(z.record(z.string(), z.unknown()))
      })
    },
    handler: async (request, reply) => {
      const controller = makeAIController()
      return controller.handle(request, reply)
    }
  })
}
