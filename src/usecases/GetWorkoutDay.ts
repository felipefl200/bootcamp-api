import dayjs from 'dayjs'

import { NotFoundError, UnauthorizedError } from '../errors/index.js'
import { WeekDay } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

interface InputDto {
  userId: string
  workoutPlanId: string
  workoutDayId: string
}

interface OutputDto {
  id: string
  name: string
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
    startedAt?: string
    completedAt?: string
  }>
}

export class GetWorkoutDay {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
      include: {
        workoutDays: {
          where: { id: dto.workoutDayId },
          include: {
            workoutExercises: true,
            workoutSessions: true
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

    const workoutDay = workoutPlan.workoutDays[0]

    if (!workoutDay) {
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
        startedAt?: string
        completedAt?: string
      } = {
        id: session.id,
        workoutDayId: session.workoutDayId
      }

      if (session.startedAt) {
        formattedSession.startedAt = dayjs(session.startedAt).format(
          'YYYY-MM-DD'
        )
      }

      if (session.completedAt) {
        formattedSession.completedAt = dayjs(session.completedAt).format(
          'YYYY-MM-DD'
        )
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
