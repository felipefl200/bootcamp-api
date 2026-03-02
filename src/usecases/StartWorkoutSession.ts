import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  WorkoutPlanNotActiveError
} from '../errors/index.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  userId: string
  workoutPlanId: string
  workoutDayId: string
}

interface OutputDto {
  userWorkoutSessionId: string
}

export class StartWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId }
    })

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

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId }
    })

    if (!workoutDay) {
      throw new NotFoundError('Workout day not found')
    }

    if (workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new BadRequestError(
        'Workout day does not belong to this workout plan'
      )
    }

    // Checking if there is already an active session
    const activeSession = await prisma.workoutSession.findFirst({
      where: {
        workoutDayId: dto.workoutDayId,
        completedAt: null
      }
    })

    if (activeSession) {
      throw new ConflictError('A session is already active for this day')
    }

    const workoutSession = await prisma.workoutSession.create({
      data: {
        startedAt: new Date(),
        workoutDayId: dto.workoutDayId
      }
    })

    return {
      userWorkoutSessionId: workoutSession.id
    }
  }
}
