import { fromNodeHeaders } from 'better-auth/node'
import { FastifyReply, FastifyRequest } from 'fastify'

import { UnauthorizedError } from '../errors/index.js'
import { auth } from '../lib/auth.js'
import { GetHomeData } from '../usecases/GetHomeData.js'
import { GetStats } from '../usecases/GetStats.js'

export class GetHomeDataController {
  constructor(private getHomeDataUseCase: GetHomeData) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    
      const params = request.params as { date: string }
      const authSession = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers)
      })

      if (!authSession || !authSession.user) { throw new UnauthorizedError(); }

      const result = await this.getHomeDataUseCase.execute({
        userId: authSession.user.id,
        date: params.date
      })

      return reply.status(200).send(result)
  }
}

export class GetStatsController {
  constructor(private getStatsUseCase: GetStats) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    
      const query = request.query as { from: string; to: string }
      const authSession = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers)
      })

      if (!authSession || !authSession.user) { throw new UnauthorizedError(); }

      const result = await this.getStatsUseCase.execute({
        userId: authSession.user.id,
        from: query.from,
        to: query.to
      })

      return reply.status(200).send(result)
  }
}
