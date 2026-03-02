import dayjs from 'dayjs'

import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from '../errors/index.js'
import { IWorkoutPlanRepository } from '../repositories/interfaces/IWorkoutPlanRepository.js'
import { IWorkoutSessionRepository } from '../repositories/interfaces/IWorkoutSessionRepository.js'

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
  constructor(
    private workoutPlanRepository: IWorkoutPlanRepository,
    private workoutSessionRepository: IWorkoutSessionRepository
  ) {}

  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await this.workoutPlanRepository.findByIdWithDays(
      dto.workoutPlanId
    )

    if (!workoutPlan) {
      throw new NotFoundError('Workout plan not found')
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError(
        'Unauthorized to update session for this workout plan'
      )
    }

    const dayExists = workoutPlan.workoutDays.some(
      (day) => day.id === dto.workoutDayId
    )
    if (!dayExists) {
      throw new BadRequestError(
        'Workout day does not belong to this workout plan'
      )
    }

    const session = await this.workoutSessionRepository.findById(
      dto.workoutSessionId
    )

    if (!session) {
      throw new NotFoundError('Workout session not found')
    }

    if (session.workoutDayId !== dto.workoutDayId) {
      throw new BadRequestError(
        'Workout session does not belong to this workout day'
      )
    }

    const updatedSession = await this.workoutSessionRepository.markAsCompleted(
      dto.workoutSessionId,
      session.startedAt,
      dayjs(dto.completedAt).toDate()
    )

    return {
      id: updatedSession.id,
      startedAt: updatedSession.startedAt.toISOString(),
      completedAt: updatedSession.completedAt
        ? updatedSession.completedAt.toISOString()
        : ''
    }
  }
}
