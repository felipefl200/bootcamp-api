import { fromNodeHeaders } from 'better-auth/node'
import { FastifyReply, FastifyRequest } from 'fastify'

import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError} from '../errors/index.js'
import { auth } from '../lib/auth.js'
import { CreateWorkoutPlan } from '../usecases/CreateWorkoutPlan.js'
import { GetWorkoutDay } from '../usecases/GetWorkoutDay.js'
import { GetWorkoutPlan } from '../usecases/GetWorkoutPlan.js'
import { ListWorkoutPlans } from '../usecases/ListWorkoutPlans.js'

export class ListWorkoutPlansController {
  constructor(private listWorkoutPlansUseCase: ListWorkoutPlans) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authSession = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers)
      })

      if (!authSession || !authSession.user) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      }

      const result = await this.listWorkoutPlansUseCase.execute({
        userId: authSession.user.id
      })

      return reply.status(200).send(result)
    } catch (error) {
      request.server.log.error(error)
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      })
    }
  }
}

export class CreateWorkoutPlanController {
  constructor(private createWorkoutPlanUseCase: CreateWorkoutPlan) {}

  async handle(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const authSession = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers)
      })

      if (!authSession || !authSession.user || !authSession.session) {
        return reply
          .status(401)
          .send({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      }

      const result = await this.createWorkoutPlanUseCase.execute({
        userId: authSession.user.id,
        sessionId: authSession.session.id,
        name: request.body.name,
        workoutDays: request.body.workoutDays
      })

      return reply.status(201).send(result)
    } catch (error) {
      request.server.log.error(error)

      if (error instanceof NotFoundError) {
        return reply
          .status(404)
          .send({ error: error.message, code: 'NOT_FOUND_ERROR' })
      }

      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      })
    }
  }
}

export class GetWorkoutPlanController {
  constructor(private getWorkoutPlanUseCase: GetWorkoutPlan) {}

  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
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

      const result = await this.getWorkoutPlanUseCase.execute({
        userId: authSession.user.id,
        workoutPlanId: request.params.id
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

      return reply.status(500).send({
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      })
    }
  }
}

export class GetWorkoutDayController {
  constructor(private getWorkoutDayUseCase: GetWorkoutDay) {}

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

      const result = await this.getWorkoutDayUseCase.execute({
        userId: authSession.user.id,
        workoutPlanId: request.params.id,
        workoutDayId: request.params.dayId
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

      return reply.status(500).send({
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      })
    }
  }
}
