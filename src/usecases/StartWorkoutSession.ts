import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError
} from '../errors/index.js'
import { IWorkoutDayRepository } from '../repositories/interfaces/IWorkoutDayRepository.js'
import { IWorkoutPlanRepository } from '../repositories/interfaces/IWorkoutPlanRepository.js'
import { IWorkoutSessionRepository } from '../repositories/interfaces/IWorkoutSessionRepository.js'

interface InputDto {
  userId: string
  workoutPlanId: string
  workoutDayId: string
}

interface OutputDto {
  userWorkoutSessionId: string
}

export class StartWorkoutSession {
  constructor(
    private workoutPlanRepository: IWorkoutPlanRepository,
    private workoutDayRepository: IWorkoutDayRepository,
    private workoutSessionRepository: IWorkoutSessionRepository
  ) {}

  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await this.workoutPlanRepository.findById(
      dto.workoutPlanId
    )

    if (!workoutPlan) {
      throw new NotFoundError('Workout plan not found')
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError(
        'Unauthorized to start session for this workout plan'
      )
    }

    if (!workoutPlan.isActive) {
      throw new WorkoutPlanNotActiveError('WorkoutPlanNotActiveError')
    }

    const workoutDay = await this.workoutDayRepository.findById(
      dto.workoutDayId
    )

    if (!workoutDay) {
      throw new NotFoundError('Workout day not found')
    }

    if (workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new BadRequestError(
        'Workout day does not belong to this workout plan'
      )
    }

    const activeSession =
      await this.workoutSessionRepository.findActiveSessionForDay(
        dto.workoutDayId
      )

    if (activeSession) {
      throw new ConflictError('A session is already active for this day')
    }

    const workoutSession = await this.workoutSessionRepository.create(
      dto.workoutDayId
    )

    return {
      userWorkoutSessionId: workoutSession.id
    }
  }
}
