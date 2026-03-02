import fastifyApiReference from '@scalar/fastify-api-reference'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export const docsRoute = async (app: FastifyInstance) => {
  await app.register(fastifyApiReference, {
    routePrefix: '/docs',
    configuration: {
      sources: [
        {
          title: 'Bootcamp Treinos API',
          slug: 'bootcamp-treinos-api',
          url: '/swagger.json'
        },
        {
          title: 'Better Auth API',
          slug: 'better-auth-api',
          url: '/api/auth/open-api/generate-schema'
        }
      ]
    }
  })

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/swagger.json',
    schema: {
      hide: true
    },
    handler: () => {
      return app.swagger()
    }
  })
}
