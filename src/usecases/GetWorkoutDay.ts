import { NotFoundError, UnauthorizedError } from '../errors/index.js'
import { WeekDay } from '../generated/prisma/enums.js'
import { IWorkoutDayRepository } from '../repositories/interfaces/IWorkoutDayRepository.js'
import { IWorkoutPlanRepository } from '../repositories/interfaces/IWorkoutPlanRepository.js'

interface InputDto {
  userId: string
  workoutPlanId: string
  workoutDayId: string
}

interface OutputDto {
  id: string
  name: string | null
  isRest: boolean
  coverImageUrl: string | null
  estimatedDurationInSeconds: number
  exercises: Array<{
    id: string
    name: string
    order: number
    set: number
    rep: number
    restTime: number
    workoutDayId: string
  }>
  weekDay: WeekDay
  sessions: Array<{
    id: string
    workoutDayId: string
    startedAt?: Date
    completedAt?: Date
  }>
}

export class GetWorkoutDay {
  constructor(
    private workoutPlanRepository: IWorkoutPlanRepository,
    private workoutDayRepository: IWorkoutDayRepository
  ) {}

  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await this.workoutPlanRepository.findById(
      dto.workoutPlanId
    )

    if (!workoutPlan) {
      throw new NotFoundError('Workout plan not found')
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError('Unauthorized to access this workout plan')
    }

    const workoutDay =
      await this.workoutDayRepository.findByIdWithExercisesAndSessions(
        dto.workoutDayId
      )

    if (!workoutDay || workoutDay.workoutPlanId !== workoutPlan.id) {
      throw new NotFoundError('Workout day not found')
    }

    const estimatedDurationInSeconds = workoutDay.workoutExercises.reduce(
      (total, exercise) =>
        total +
        exercise.rep * exercise.set * 5 +
        exercise.restTime * exercise.set,
      0
    )

    const formattedExercises = workoutDay.workoutExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      order: exercise.order,
      set: exercise.set,
      rep: exercise.rep,
      restTime: exercise.restTime,
      workoutDayId: exercise.workoutDayId
    }))

    const formattedSessions = workoutDay.workoutSessions.map((session) => {
      const formattedSession: {
        id: string
        workoutDayId: string
        startedAt?: Date
        completedAt?: Date
      } = {
        id: session.id,
        workoutDayId: session.workoutDayId
      }

      if (session.startedAt) {
        formattedSession.startedAt = session.startedAt
      }

      if (session.completedAt) {
        formattedSession.completedAt = session.completedAt
      }

      return formattedSession
    })

    return {
      id: workoutDay.id,
      name: workoutDay.name,
      isRest: workoutDay.isRest,
      coverImageUrl: workoutDay.coverImageUrl,
      estimatedDurationInSeconds,
      exercises: formattedExercises,
      weekDay: workoutDay.weekDay,
      sessions: formattedSessions
    }
  }
}
