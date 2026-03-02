import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError
} from '../errors/index.js'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.server.log.error(error)

  if (error instanceof NotFoundError) {
    return reply
      .status(404)
      .send({ error: error.message, code: 'NOT_FOUND_ERROR' })
  }

  if (error instanceof UnauthorizedError) {
    return reply
      .status(401)
      .send({ error: error.message, code: 'UNAUTHORIZED_ERROR' })
  }

  if (error instanceof BadRequestError) {
    return reply
      .status(400)
      .send({ error: error.message, code: 'BAD_REQUEST_ERROR' })
  }

  if (error instanceof ConflictError) {
    return reply
      .status(409)
      .send({ error: error.message, code: 'CONFLICT_ERROR' })
  }

  if (error instanceof WorkoutPlanNotActiveError) {
    return reply
      .status(400)
      .send({ error: error.message, code: 'WORKOUT_PLAN_NOT_ACTIVE_ERROR' })
  }

  return reply.status(500).send({
    error: error instanceof Error ? error.message : 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  })
}
