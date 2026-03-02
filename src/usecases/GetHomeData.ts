import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

import { WeekDay } from '../generated/prisma/enums.js'
import { prisma } from '../lib/db.js'

dayjs.extend(utc)

interface InputDto {
  userId: string
  date: string
}

interface OutputDto {
  activeWorkoutPlanId: string | null
  todayWorkoutDay: {
    workoutPlanId: string
    id: string
    name: string
    isRest: boolean
    weekDay: WeekDay
    estimatedDurationInSeconds: number
    coverImageUrl: string | null
    exercisesCount: number
  } | null
  workoutStreak: number
  consistencyByDay: Record<
    string,
    {
      workoutDayCompleted: boolean
      workoutDayStarted: boolean
    }
  >
}

export class GetHomeData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const targetDate = dayjs.utc(dto.date)
    const weekStart = targetDate.startOf('week')
    const weekEnd = targetDate.endOf('week')

    // Map day value to WeekDay enum
    const weekDayMap = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY'
    ] as const
    const targetWeekDay = weekDayMap[targetDate.day()]

    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true
      },
      include: {
        workoutDays: {
          include: {
            workoutExercises: true
          }
        }
      }
    })

    if (!activeWorkoutPlan) {
      return {
        activeWorkoutPlanId: null,
        todayWorkoutDay: null,
        workoutStreak: 0,
        consistencyByDay: this.generateEmptyConsistency(weekStart)
      }
    }

    const todayWorkoutDay = activeWorkoutPlan.workoutDays.find(
      (day) => day.weekDay === targetWeekDay
    )

    let formattedTodayWorkoutDay = null

    if (todayWorkoutDay) {
      const estimatedDurationInSeconds =
        todayWorkoutDay.workoutExercises.reduce(
          (total, exercise) =>
            total +
            exercise.rep * exercise.set * 5 +
            exercise.restTime * exercise.set, // Example rough calculation if not stored
          0
        )

      formattedTodayWorkoutDay = {
        workoutPlanId: activeWorkoutPlan.id,
        id: todayWorkoutDay.id,
        name: todayWorkoutDay.name,
        isRest: todayWorkoutDay.isRest,
        weekDay: todayWorkoutDay.weekDay,
        estimatedDurationInSeconds: estimatedDurationInSeconds,
        coverImageUrl: todayWorkoutDay.coverImageUrl,
        exercisesCount: todayWorkoutDay.workoutExercises.length
      }
    }

    const sessionsThisWeek = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlan: {
            userId: dto.userId
          }
        },
        startedAt: {
          gte: weekStart.toDate(),
          lte: weekEnd.toDate()
        }
      }
    })

    const consistencyByDay = this.generateConsistencyMap(
      weekStart,
      sessionsThisWeek
    )

    // Calculate Streak
    // For this simplified logic we count continuous days with complete sessions going backwards from today
    let workoutStreak = 0
    // Load historical sessions if needed, but for now we iterate week consistency

    // A proper streak logic goes beyond the week bounds, so we query recent completed sessions
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
      activeWorkoutPlanId: activeWorkoutPlan.id,
      todayWorkoutDay: formattedTodayWorkoutDay,
      workoutStreak,
      consistencyByDay
    }
  }

  private generateEmptyConsistency(weekStart: dayjs.Dayjs) {
    const consistency: Record<
      string,
      { workoutDayCompleted: boolean; workoutDayStarted: boolean }
    > = {}
    for (let i = 0; i <= 6; i++) {
      const dateKey = weekStart.add(i, 'day').format('YYYY-MM-DD')
      consistency[dateKey] = {
        workoutDayCompleted: false,
        workoutDayStarted: false
      }
    }
    return consistency
  }

  private generateConsistencyMap(
    weekStart: dayjs.Dayjs,
    sessions: Array<{
      id: string
      workoutDayId: string
      startedAt: Date
      completedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }>
  ) {
    const consistency = this.generateEmptyConsistency(weekStart)

    for (const session of sessions) {
      const dateKey = dayjs.utc(session.startedAt).format('YYYY-MM-DD')
      if (consistency[dateKey]) {
        consistency[dateKey].workoutDayStarted = true
        if (session.completedAt) {
          consistency[dateKey].workoutDayCompleted = true
        }
      }
    }

    return consistency
  }
}
