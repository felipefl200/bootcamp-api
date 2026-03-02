import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

import { prisma } from '../lib/db.js'

dayjs.extend(utc)

interface InputDto {
  userId: string
  from: string
  to: string
}

interface OutputDto {
  workoutStreak: number
  consistencyByDay: Record<
    string,
    {
      workoutDayCompleted: boolean
      workoutDayStarted: boolean
    }
  >
  completedWorkoutsCount: number
  conclusionRate: number
  totalTimeInSeconds: number
}

export class GetStats {
  async execute(dto: InputDto): Promise<OutputDto> {
    const fromDate = dayjs.utc(dto.from).startOf('day').toDate()
    const toDate = dayjs.utc(dto.to).endOf('day').toDate()

    const sessionsInRange = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlan: {
            userId: dto.userId
          }
        },
        startedAt: {
          gte: fromDate,
          lte: toDate
        }
      }
    })

    const consistencyByDay: Record<
      string,
      { workoutDayCompleted: boolean; workoutDayStarted: boolean }
    > = {}
    let completedWorkoutsCount = 0
    let totalTimeInSeconds = 0

    for (const session of sessionsInRange) {
      const dateKey = dayjs.utc(session.startedAt).format('YYYY-MM-DD')

      if (!consistencyByDay[dateKey]) {
        consistencyByDay[dateKey] = {
          workoutDayCompleted: false,
          workoutDayStarted: false
        }
      }

      consistencyByDay[dateKey].workoutDayStarted = true

      if (session.completedAt) {
        consistencyByDay[dateKey].workoutDayCompleted = true
        completedWorkoutsCount++

        const duration = dayjs(session.completedAt).diff(
          dayjs(session.startedAt),
          'second'
        )
        totalTimeInSeconds += duration
      }
    }

    const conclusionRate =
      sessionsInRange.length > 0
        ? completedWorkoutsCount / sessionsInRange.length
        : 0

    const recentCompletedSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlan: {
            userId: dto.userId
          }
        },
        completedAt: { not: null }
      },
      orderBy: { startedAt: 'desc' }
    })

    let workoutStreak = 0
    const targetDate = dayjs.utc()
    const uniqueDates = new Set(
      recentCompletedSessions.map((s) =>
        dayjs.utc(s.startedAt).format('YYYY-MM-DD')
      )
    )
    let currentDateToCheck = targetDate

    if (uniqueDates.has(currentDateToCheck.format('YYYY-MM-DD'))) {
      while (uniqueDates.has(currentDateToCheck.format('YYYY-MM-DD'))) {
        workoutStreak++
        currentDateToCheck = currentDateToCheck.subtract(1, 'day')
      }
    } else {
      currentDateToCheck = currentDateToCheck.subtract(1, 'day')
      while (uniqueDates.has(currentDateToCheck.format('YYYY-MM-DD'))) {
        workoutStreak++
        currentDateToCheck = currentDateToCheck.subtract(1, 'day')
      }
    }

    return {
      workoutStreak,
      consistencyByDay,
      completedWorkoutsCount,
      conclusionRate,
      totalTimeInSeconds
    }
  }
}
