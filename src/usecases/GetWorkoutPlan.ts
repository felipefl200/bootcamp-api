import { NotFoundError, UnauthorizedError } from '../errors/index.js'
import { WeekDay } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  userId: string
  workoutPlanId: string
}

interface OutputDto {
  id: string
  name: string
  workoutDays: Array<{
    id: string
    weekDay: WeekDay
    name: string
    isRest: boolean
    coverImageUrl: string | null
    estimatedDurationInSeconds: number
    exercisesCount: number
  }>
}

export class GetWorkoutPlan {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
      include: {
        workoutDays: {
          include: {
            workoutExercises: true
          }
        }
      }
    })

    if (!workoutPlan) {
      throw new NotFoundError('Workout plan not found')
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError('Unauthorized to access this workout plan')
    }

    const formattedWorkoutDays = workoutPlan.workoutDays.map((day) => {
      const estimatedDurationInSeconds = day.workoutExercises.reduce(
        (total, exercise) =>
          total +
          exercise.rep * exercise.set * 5 +
          exercise.restTime * exercise.set,
        0
      )

      return {
        id: day.id,
        weekDay: day.weekDay,
        name: day.name,
        isRest: day.isRest,
        coverImageUrl: day.coverImageUrl,
        estimatedDurationInSeconds,
        exercisesCount: day.workoutExercises.length
      }
    })

    return {
      id: workoutPlan.id,
      name: workoutPlan.name,
      workoutDays: formattedWorkoutDays
    }
  }
}
