import { fromNodeHeaders } from 'better-auth/node'
import { FastifyReply, FastifyRequest } from 'fastify'

import { UnauthorizedError } from '../errors/index.js'
import { auth } from '../lib/auth.js'
import { StartWorkoutSession } from '../usecases/StartWorkoutSession.js'
import { UpdateWorkoutSession } from '../usecases/UpdateWorkoutSession.js'

export class StartWorkoutSessionController {
  constructor(private startWorkoutSessionUseCase: StartWorkoutSession) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: string; dayId: string }
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user) {
      throw new UnauthorizedError()
    }

    const result = await this.startWorkoutSessionUseCase.execute({
      userId: authSession.user.id,
      workoutPlanId: params.id,
      workoutDayId: params.dayId
    })

    return reply.status(201).send(result)
  }
}

export class UpdateWorkoutSessionController {
  constructor(private updateWorkoutSessionUseCase: UpdateWorkoutSession) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as {
      id: string
      dayId: string
      sessionId: string
    }
    const body = request.body as { completedAt: string }
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user) {
      throw new UnauthorizedError()
    }

    const result = await this.updateWorkoutSessionUseCase.execute({
      userId: authSession.user.id,
      workoutPlanId: params.id,
      workoutDayId: params.dayId,
      workoutSessionId: params.sessionId,
      completedAt: body.completedAt
    })

    return reply.status(200).send(result)
  }
}
