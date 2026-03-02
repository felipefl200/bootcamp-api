import { fromNodeHeaders } from 'better-auth/node'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { UnauthorizedError } from '../errors/index.js'
import { auth } from '../lib/auth.js'
import { CreateWorkoutPlanParamsSchema } from '../schemas/index.js'
import { CreateWorkoutPlan } from '../usecases/CreateWorkoutPlan.js'
import { GetWorkoutDay } from '../usecases/GetWorkoutDay.js'
import { GetWorkoutPlan } from '../usecases/GetWorkoutPlan.js'
import { ListWorkoutPlans } from '../usecases/ListWorkoutPlans.js'

type CreateWorkoutPlanBody = z.infer<typeof CreateWorkoutPlanParamsSchema>

export class ListWorkoutPlansController {
  constructor(private listWorkoutPlansUseCase: ListWorkoutPlans) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user) {
      throw new UnauthorizedError()
    }

    const result = await this.listWorkoutPlansUseCase.execute({
      userId: authSession.user.id
    })

    return reply.status(200).send(result)
  }
}

export class CreateWorkoutPlanController {
  constructor(private createWorkoutPlanUseCase: CreateWorkoutPlan) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateWorkoutPlanBody
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user || !authSession.session) {
      throw new UnauthorizedError()
    }

    const result = await this.createWorkoutPlanUseCase.execute({
      userId: authSession.user.id,
      sessionId: authSession.session.id,
      name: body.name,
      workoutDays: body.workoutDays
    })

    return reply.status(201).send(result)
  }
}

export class GetWorkoutPlanController {
  constructor(private getWorkoutPlanUseCase: GetWorkoutPlan) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: string }
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user) {
      throw new UnauthorizedError()
    }

    const result = await this.getWorkoutPlanUseCase.execute({
      userId: authSession.user.id,
      workoutPlanId: params.id
    })

    return reply.status(200).send(result)
  }
}

export class GetWorkoutDayController {
  constructor(private getWorkoutDayUseCase: GetWorkoutDay) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: string; dayId: string }
    const authSession = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })

    if (!authSession || !authSession.user) {
      throw new UnauthorizedError()
    }

    const result = await this.getWorkoutDayUseCase.execute({
      userId: authSession.user.id,
      workoutPlanId: params.id,
      workoutDayId: params.dayId
    })

    return reply.status(200).send(result)
  }
}
