import { fromNodeHeaders } from 'better-auth/node'
import { FastifyReply, FastifyRequest } from 'fastify'

import { auth } from '../lib/auth.js'
import { GetHomeData } from '../usecases/GetHomeData.js'
import { GetStats } from '../usecases/GetStats.js'

export class GetHomeDataController {
  constructor(private getHomeDataUseCase: GetHomeData) {}

  async handle(
    request: FastifyRequest<{ Params: { date: string } }>,
    reply: FastifyReply
  ) {
    try {
      const authSession = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers)
      })

      if (!authSession || !authSession.user) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      }

      const result = await this.getHomeDataUseCase.execute({
        userId: authSession.user.id,
        date: request.params.date
      })

      return reply.status(200).send(result)
    } catch (error) {
      request.server.log.error(error)
      return reply
        .status(500)
        .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
    }
  }
}

export class GetStatsController {
  constructor(private getStatsUseCase: GetStats) {}

  async handle(
    request: FastifyRequest<{ Querystring: { from: string; to: string } }>,
    reply: FastifyReply
  ) {
    try {
      const authSession = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers)
      })

      if (!authSession || !authSession.user) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      }

      const result = await this.getStatsUseCase.execute({
        userId: authSession.user.id,
        from: request.query.from,
        to: request.query.to
      })

      return reply.status(200).send(result)
    } catch (error) {
      request.server.log.error(error)
      return reply
        .status(500)
        .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
    }
  }
}
