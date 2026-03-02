import dayjs from 'dayjs'

import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError} from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  userId: string
  workoutPlanId: string
  workoutDayId: string
  workoutSessionId: string
  completedAt: string
}

interface OutputDto {
  id: string
  completedAt: string
  startedAt: string
}

export class UpdateWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
      include: {
        workoutDays: {
          where: { id: dto.workoutDayId }
        }
      }
    })

    if (!workoutPlan) {
      throw new NotFoundError('Workout plan not found')
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError(
        'Unauthorized to update session for this workout plan'
      )
    }

    if (workoutPlan.workoutDays.length === 0) {
      throw new BadRequestError(
        'Workout day does not belong to this workout plan'
      )
    }

    const session = await prisma.workoutSession.findUnique({
      where: { id: dto.workoutSessionId }
    })

    if (!session) {
      throw new NotFoundError('Workout session not found')
    }

    if (session.workoutDayId !== dto.workoutDayId) {
      throw new BadRequestError(
        'Workout session does not belong to this workout day'
      )
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: dto.workoutSessionId },
      data: {
        completedAt: dayjs(dto.completedAt).toDate()
      }
    })

    return {
      id: updatedSession.id,
      startedAt: updatedSession.startedAt.toISOString(),
      completedAt: updatedSession.completedAt
        ? updatedSession.completedAt.toISOString()
        : ''
    }
  }
}
