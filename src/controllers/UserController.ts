import { fromNodeHeaders } from 'better-auth/node'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { UnauthorizedError } from '../errors/index.js'
import { auth } from '../lib/auth.js'
import { UpsertUserTrainDataBodySchema } from '../schemas/index.js'
import { GetUserTrainData } from '../usecases/GetUserTrainData.js'
import { UpsertUserTrainData } from '../usecases/UpsertUserTrainData.js'

type UpsertUserTrainDataBody = z.infer<typeof UpsertUserTrainDataBodySchema>

export class GetUserTrainDataController {
  constructor(private getUserTrainDataUseCase: GetUserTrainData) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user) {
      throw new UnauthorizedError()
    }

    const result = await this.getUserTrainDataUseCase.execute({
      userId: authSession.user.id
    })

    return reply.status(200).send(result)
  }
}

export class UpsertUserTrainDataController {
  constructor(private upsertUserTrainDataUseCase: UpsertUserTrainData) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user) {
      throw new UnauthorizedError()
    }

    const body = request.body as UpsertUserTrainDataBody

    const result = await this.upsertUserTrainDataUseCase.execute({
      userId: authSession.user.id,
      weightInGrams: body.weightInGrams,
      heightInCentimeters: body.heightInCentimeters,
      age: body.age,
      bodyFatPercentage: body.bodyFatPercentage
    })

    return reply.status(200).send(result)
  }
}
