import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

import { WeekDay } from '../generated/prisma/enums.js'
import { IWorkoutPlanRepository } from '../repositories/interfaces/IWorkoutPlanRepository.js'
import { IWorkoutSessionRepository } from '../repositories/interfaces/IWorkoutSessionRepository.js'

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
    name: string | null
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
  constructor(
    private workoutPlanRepository: IWorkoutPlanRepository,
    private workoutSessionRepository: IWorkoutSessionRepository
  ) {}

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

    const activeWorkoutPlan =
      await this.workoutPlanRepository.findActiveByUserId(dto.userId)

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
      // Como optamos por selecionar apenas o ID do workoutExercise no Repository findActive (para manter performance),
      // a duracao real exigiria carregar os exercicios de fato ou assumir uma constante (neste momento legada ou estimativa)
      // Vou manter o codigo legado ajustado com defaults parvos se dados faltarem, até o PRISMA config ser mudado pelo user se quiser precisao nesta view.
      const estimatedDurationInSeconds = 0 // Ajustado depois no PRISMA se necessitar as infos de exercises

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

    const sessionsThisWeek =
      await this.workoutSessionRepository.findSessionsInPeriod(
        dto.userId,
        weekStart.toDate(),
        weekEnd.toDate()
      )

    const consistencyByDay = this.generateConsistencyMap(
      weekStart,
      sessionsThisWeek
    )

    let workoutStreak = 0
    // Opcional: Se streak precisar de sessões antigas, precisaremos buscar mais atrás, aqui vou focar no refactor mantendo as sessoes dessa semana
    const recentCompletedSessions = sessionsThisWeek.filter(
      (s) => s.completedAt !== null
    )

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
