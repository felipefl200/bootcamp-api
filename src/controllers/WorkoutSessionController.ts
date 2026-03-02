import { fromNodeHeaders } from 'better-auth/node'
import { FastifyReply, FastifyRequest } from 'fastify'

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError
} from '../errors/index.js'
import { auth } from '../lib/auth.js'
import { StartWorkoutSession } from '../usecases/StartWorkoutSession.js'
import { UpdateWorkoutSession } from '../usecases/UpdateWorkoutSession.js'

export class StartWorkoutSessionController {
  constructor(private startWorkoutSessionUseCase: StartWorkoutSession) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string; dayId: string } }>,
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

      const result = await this.startWorkoutSessionUseCase.execute({
        userId: authSession.user.id,
        workoutPlanId: request.params.id,
        workoutDayId: request.params.dayId
      })

      return reply.status(201).send(result)
    } catch (error) {
      request.server.log.error(error)

      if (error instanceof NotFoundError)
        return reply
          .status(404)
          .send({ error: error.message, code: 'NOT_FOUND_ERROR' })
      if (error instanceof UnauthorizedError)
        return reply
          .status(401)
          .send({ error: error.message, code: 'UNAUTHORIZED_ERROR' })
      if (error instanceof BadRequestError)
        return reply
          .status(400)
          .send({ error: error.message, code: 'BAD_REQUEST_ERROR' })
      if (error instanceof ConflictError)
        return reply
          .status(409)
          .send({ error: error.message, code: 'CONFLICT_ERROR' })
      if (error instanceof WorkoutPlanNotActiveError)
        return reply
          .status(400)
          .send({ error: error.message, code: 'WORKOUT_PLAN_NOT_ACTIVE_ERROR' })

      return reply
        .status(500)
        .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
    }
  }
}

export class UpdateWorkoutSessionController {
  constructor(private updateWorkoutSessionUseCase: UpdateWorkoutSession) {}

  async handle(
    request: FastifyRequest<{
      Params: { id: string; dayId: string; sessionId: string }
      Body: any
    }>,
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

      const result = await this.updateWorkoutSessionUseCase.execute({
        userId: authSession.user.id,
        workoutPlanId: request.params.id,
        workoutDayId: request.params.dayId,
        workoutSessionId: request.params.sessionId,
        completedAt: request.body.completedAt
      })

      return reply.status(200).send(result)
    } catch (error) {
      request.server.log.error(error)

      if (error instanceof NotFoundError)
        return reply
          .status(404)
          .send({ error: error.message, code: 'NOT_FOUND_ERROR' })
      if (error instanceof UnauthorizedError)
        return reply
          .status(401)
          .send({ error: error.message, code: 'UNAUTHORIZED_ERROR' })
      if (error instanceof BadRequestError)
        return reply
          .status(400)
          .send({ error: error.message, code: 'BAD_REQUEST_ERROR' })

      return reply
        .status(500)
        .send({ error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' })
    }
  }
}
